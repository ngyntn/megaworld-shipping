// Shared pure validation, usable in both hooks and custom routes.
function keys(input, allowed) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new BadRequestError("Expected an object.");
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) throw new BadRequestError("Unsupported field: " + key);
  }
}

function day(value, name) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestError(name + " must use YYYY-MM-DD.");
  }
  const date = new Date(value + "T00:00:00Z");
  if (!isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || value < "1900-01-01") {
    throw new BadRequestError(name + " is not a valid date.");
  }
  return value;
}

function cents(value, name) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 1000000000) {
    throw new BadRequestError(name + " must be integer USD cents between 0 and 1000000000.");
  }
  return value;
}

function text(value, name, max) {
  if (value === undefined) return "";
  if (typeof value !== "string" || value.length > max) throw new BadRequestError("Invalid " + name + ".");
  return value;
}

function id(value, name) {
  if (typeof value !== "string" || !/^[a-z0-9]{15}$/.test(value)) throw new BadRequestError("Invalid " + name + ".");
  return value;
}

function today() {
  // Vietnam business calendar is UTC+07:00, without daylight saving changes.
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function status(from, to, currentDay) {
  if (currentDay < from) return "upcoming";
  if (currentDay > to) return "expired";
  return "valid";
}

module.exports = { keys, day, cents, text, id, today, status };
