These workbooks are byte-for-byte copies of the supplied reference files in `/exports`:

- `schedules.xlsx`: `MWS-DAESANG-SCHEDULE-20260324-LONGBEACH (1).xlsx`
- `quotation.xlsx`: `MWS-KT IMEX-QUOTATION-20261027-INDIA (2).xlsx`

Keep these copies inside the frontend so Next.js production deployments include them. When replacing a reference template, update the corresponding copy and the row/cell mapping in `src/features/excel-export/workbook/`, then run the export tests.

The exporter edits the original OOXML package. It preserves image bytes, shapes, rich text, styles, column widths and page margins. Additional data rows move the footer and its drawing anchors together. Quotations use a separate sheet for each container type, show selling prices, and retain the local-charge table and other standard terms from the sample. Recipient details can be edited before downloading.

Validation: `npm test`, `npm run build`, then `python tests/integration/excel-export.py`. The integration test starts an isolated PocketBase database and production Next.js server; it never modifies the running application database.
