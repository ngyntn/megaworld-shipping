import base64
import io
import zipfile
from xml.etree import ElementTree as ET
from workbook_reader import read_workbook
from workbook_writer import write_workbook


def check_workbook():
    base = write_workbook([["header"], ["value"]])

    def edited(replacements):
        result = io.BytesIO()
        with zipfile.ZipFile(io.BytesIO(base)) as source, zipfile.ZipFile(result, "w", zipfile.ZIP_DEFLATED) as target:
            for name in source.namelist():
                target.writestr(name, replacements.pop(name, source.read(name)))
            for name, data in replacements.items():
                target.writestr(name, data)
        return base64.b64encode(result.getvalue())

    ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
    # A different producer's normal Excel representations: shared string, numeric cell, serial date.
    encoded = edited({
        "xl/sharedStrings.xml": f'<sst {ns}><si><t>cost_price_usd</t></si><si><t>valid_from</t></si></sst>',
        "xl/styles.xml": f'<styleSheet {ns}><cellXfs><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>',
        "xl/worksheets/sheet1.xml": f'<worksheet {ns}><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2"><v>1900.5</v></c><c r="B2" s="1"><v>46330</v></c></row></sheetData></worksheet>',
    })
    rows = read_workbook(encoded)
    assert rows[0]["values"] == ["cost_price_usd", "valid_from"]
    assert rows[1]["values"] == ["1900.5", "2026-11-04"]
    try:
        read_workbook(edited({"xl/worksheets/sheet1.xml": f'<worksheet {ns}><sheetData><row r="1"><c r="A1"><f>1+1</f><v>2</v></c></row></sheetData></worksheet>'}))
        raise AssertionError("Formula import was accepted")
    except ValueError as error:
        assert "formulas" in str(error)
    try:
        read_workbook(base64.b64encode(write_workbook([["header"], *[[str(i)] for i in range(501)]])))
        raise AssertionError("Oversized row count was accepted")
    except ValueError as error:
        assert "500 data rows" in str(error)
    with zipfile.ZipFile(io.BytesIO(write_workbook([["=1+1", "Tiếng Việt\x01"]]))) as archive:
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        assert not sheet.findall(".//{*}f")
    print("PASS: Excel shared strings/numbers/serial dates, formula and row limits, literal export text")
