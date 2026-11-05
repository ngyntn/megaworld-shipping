"""Minimal OOXML workbook writer. All text is stored as literal inline strings."""
import io
import re
from xml.etree import ElementTree as ET
import zipfile


def write_workbook(rows):
    if len(rows) > 5001:
        raise ValueError("Too many export rows.")
    ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    sheet = ET.Element("worksheet", xmlns=ns)
    data = ET.SubElement(sheet, "sheetData")
    for row_index, values in enumerate(rows, 1):
        row = ET.SubElement(data, "row", r=str(row_index))
        for col_index, value in enumerate(values, 1):
            column, counter = "", col_index
            while counter:
                counter, remainder = divmod(counter - 1, 26)
                column = chr(65 + remainder) + column
            cell = ET.SubElement(row, "c", r=f"{column}{row_index}", t="inlineStr")
            text = ET.SubElement(ET.SubElement(cell, "is"), "t", {"xml:space": "preserve"})
            text.text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", str(value)) if value is not None else ""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", '''<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>''')
        archive.writestr("_rels/.rels", '''<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>''')
        archive.writestr("xl/workbook.xml", f'''<workbook xmlns="{ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>''')
        archive.writestr("xl/_rels/workbook.xml.rels", '''<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>''')
        archive.writestr("xl/worksheets/sheet1.xml", ET.tostring(sheet, encoding="utf-8", xml_declaration=True))
    return buffer.getvalue()
