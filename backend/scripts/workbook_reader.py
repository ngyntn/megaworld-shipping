"""Bounded XLSX reader using only the Python standard library; never executes formulas."""
import base64
from datetime import datetime, timedelta
import io
import posixpath
import re
from xml.etree import ElementTree as ET
import zipfile


def read_workbook(encoded):
    raw = base64.b64decode(encoded, validate=True)
    if len(raw) > 2 * 1024 * 1024:
        raise ValueError("Workbook must not exceed 2 MiB.")
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        entries = archive.infolist()
        if len(entries) > 200 or sum(entry.file_size for entry in entries) > 16 * 1024 * 1024:
            raise ValueError("Workbook decompressed size is too large.")
        if len({entry.filename for entry in entries}) != len(entries):
            raise ValueError("Duplicate archive entries are not supported.")
        if any(entry.flag_bits & 1 for entry in entries) or any("vbaProject" in entry.filename for entry in entries):
            raise ValueError("Encrypted or macro workbooks are not supported.")

        def xml(name):
            data = archive.read(name)
            if b"<!DOCTYPE" in data.replace(b"\x00", b"").upper():
                raise ValueError("XML document types are not supported.")
            return ET.fromstring(data)

        workbook = xml("xl/workbook.xml")
        sheets = workbook.findall("{*}sheets/{*}sheet")
        if len(sheets) != 1:
            raise ValueError("Use a workbook with exactly one worksheet.")
        sheet_id = next((value for key, value in sheets[0].attrib.items() if key.endswith("}id")), None)
        relations = xml("xl/_rels/workbook.xml.rels")
        rel = next((item for item in relations if item.get("Id") == sheet_id), None)
        if rel is None or rel.get("TargetMode") == "External":
            raise ValueError("Invalid worksheet relationship.")
        target = rel.get("Target", "")
        path = posixpath.normpath(target.lstrip("/") if target.startswith("/") else "xl/" + target)
        if not path.startswith("xl/"):
            raise ValueError("Invalid worksheet path.")
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(node.itertext()) for node in xml("xl/sharedStrings.xml")]
        date_styles = set()
        if "xl/styles.xml" in archive.namelist():
            styles = xml("xl/styles.xml")
            formats = {item.get("numFmtId"): item.get("formatCode", "") for item in styles.findall("{*}numFmts/{*}numFmt")}
            for index, style in enumerate(styles.findall("{*}cellXfs/{*}xf")):
                fmt_id = int(style.get("numFmtId", "0"))
                code = re.sub(r'"[^"]*"|\[[^\]]*\]|\\.', "", formats.get(str(fmt_id), "")).lower()
                if fmt_id in {14, 15, 16, 17, 22} or ("y" in code and "d" in code):
                    date_styles.add(index)
        date1904 = workbook.find("{*}workbookPr")
        date1904 = date1904 is not None and date1904.get("date1904") in {"true", "1"}
        result = []
        for row in xml(path).findall("{*}sheetData/{*}row"):
            values = {}
            for cell in row:
                if cell.find("{*}f") is not None:
                    raise ValueError("Replace formulas with values before importing.")
                reference = cell.get("r", "")
                match = re.fullmatch(r"([A-Z]+)([1-9][0-9]*)", reference)
                if not match:
                    raise ValueError("Invalid cell reference.")
                column = 0
                for letter in match[1]:
                    column = column * 26 + ord(letter) - 64
                node = cell.find("{*}v")
                value = node.text if node is not None and node.text else ""
                kind = cell.get("t", "n")
                if kind == "s":
                    value = strings[int(value)]
                elif kind == "inlineStr":
                    value = "".join(item.text or "" for item in cell.findall("{*}is//{*}t"))
                elif kind in {"e", "b"}:
                    raise ValueError("Error and boolean cells are not supported.")
                elif value and int(cell.get("s", "0")) in date_styles and kind == "n":
                    serial = float(value)
                    if serial != int(serial):
                        raise ValueError("Date cells must not contain a time.")
                    value = ((datetime(1904, 1, 1) if date1904 else datetime(1899, 12, 30)) + timedelta(days=serial)).date().isoformat()
                if value:
                    if column > 30 or len(value) > 8000:
                        raise ValueError("Too many columns or cell text is too long.")
                    values[column - 1] = value.strip()
            if values:
                result.append({"row": int(row.get("r", "0")), "values": [values.get(i, "") for i in range(max(values) + 1)]})
                if len(result) > 501:
                    raise ValueError("Workbook may contain at most 500 data rows.")
        if len(result) < 2:
            raise ValueError("Workbook must contain a header and data rows.")
        return result
