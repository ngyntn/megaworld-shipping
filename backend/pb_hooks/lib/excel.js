function run(action, input) {
  // No shell interpolation or temporary files; only fixed script/action arguments.
  const command = $os.cmd($os.getenv("PB_PYTHON") || "python", __hooks + "/../scripts/xlsx.py", action);
  const reader = $filesystem.fileFromBytes(toBytes(JSON.stringify(input)), "input.json").reader.open();
  command.stdin = reader;
  try { return command.output(); } finally { reader.close(); }
}
function read(body) {
  require(__hooks + "/lib/validation.js").keys(body, ["file_name", "file_base64"]);
  if (typeof body.file_name !== "string" || body.file_name.length > 255 || !/\.xlsx$/i.test(body.file_name) || /[\\/]/.test(body.file_name)) throw new BadRequestError("Provide an XLSX file name.");
  if (typeof body.file_base64 !== "string" || body.file_base64.length > 2800000) throw new BadRequestError("Workbook is too large.");
  const result = JSON.parse(toString(run("read", { file_base64: body.file_base64 })));
  if (result.error) throw new BadRequestError(result.error);
  return result.rows;
}
function download(event, name, rows) {
  const bytes = run("write", { rows });
  event.response.header().set("Cache-Control", "no-store");
  event.response.header().set("Content-Disposition", 'attachment; filename="' + name + '"');
  return event.blob(200, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes);
}
function schedules(event, owner, query) {
  const rows = require(__hooks + "/lib/schedules.js").list(event.app, owner, query, true, true);
  const cells = [["Carrier", "POL", "POD", "Vessel", "Voyage", "ETD", "ETA", "Transit days", "Service", "Transit port", "Notes"]];
  for (const row of rows) cells.push([row.carrier.name, row.route.pol.name, row.route.pod.name, row.vessel_name, row.voyage, row.etd, row.eta, row.transit_days, row.service_type, row.transshipment_port, row.public_note]);
  return download(event, "schedules.xlsx", cells);
}
module.exports = { read, download, schedules };
