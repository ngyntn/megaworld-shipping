type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Bordered box that represents a control on screen (hidden selects/date inputs use their trigger). */
export function fieldBox(control: Control): HTMLElement {
  return (
    control.closest<HTMLElement>(".op-field, .rate-field, .input-wrap") ??
    control.closest<HTMLElement>(".styled-select")?.querySelector<HTMLElement>(".select-trigger") ??
    control
  );
}

/** Element to focus: the visible trigger for custom selects/date pickers, else the control. */
export function focusTarget(control: Control): HTMLElement {
  const trigger = control.closest(".styled-select")?.querySelector<HTMLElement>(".select-trigger");
  return trigger ?? control;
}

function labelOf(control: Control, box: HTMLElement) {
  const text =
    control.closest(".styled-select")?.querySelector(".select-label")?.textContent ||
    box.querySelector(":scope > span:first-child")?.textContent ||
    control.getAttribute("aria-label") ||
    control.closest("label")?.childNodes[0]?.textContent ||
    "";
  // "Tên tàu" → "tên tàu", but keep acronyms such as POL / ETD as written.
  return text.trim().replace(/^\p{Lu}(?=\p{Ll})/u, (c) => c.toLocaleLowerCase("vi"));
}

const isPicker = (control: Control) =>
  control instanceof HTMLSelectElement || !!control.closest(".styled-select");

/** Vietnamese message for the first failing constraint. */
export function validationMessage(control: Control, box: HTMLElement) {
  const v = control.validity;
  const label = labelOf(control, box);
  const named = (verb: string) => (label ? `Vui lòng ${verb} ${label}.` : `Vui lòng ${verb} thông tin này.`);
  if (v.valueMissing) return isPicker(control) ? named("chọn") : named("nhập");
  if (v.typeMismatch) return control.type === "email" ? "Email chưa đúng định dạng." : "Giá trị chưa đúng định dạng.";
  if (v.patternMismatch) return control.title || "Giá trị chưa đúng định dạng.";
  if (v.tooShort) return `Cần tối thiểu ${(control as HTMLInputElement).minLength} ký tự.`;
  if (v.tooLong) return `Tối đa ${(control as HTMLInputElement).maxLength} ký tự.`;
  if (v.rangeUnderflow) return `Giá trị tối thiểu là ${(control as HTMLInputElement).min}.`;
  if (v.rangeOverflow) return `Giá trị tối đa là ${(control as HTMLInputElement).max}.`;
  if (v.stepMismatch || v.badInput) return "Giá trị chưa hợp lệ.";
  return control.validationMessage;
}
