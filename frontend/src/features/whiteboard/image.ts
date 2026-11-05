/** Longest side of a stored image. Keeps each picture to roughly tens–hundreds of KB. */
const MAX_SIDE = 960;
const QUALITY = 0.85;

/**
 * The image in a paste event, or null. Text wins: copying spreadsheet cells puts both text and a
 * picture on the clipboard, and the text is what the user wants.
 */
export function pastedImage(data: DataTransfer | null): File | null {
  if (!data || data.getData("text/plain").trim()) return null;
  return Array.from(data.files).find((file) => file.type.startsWith("image/")) ?? null;
}

/** Downscales to MAX_SIDE and re-encodes as JPEG (transparency becomes white). */
export async function shrinkImage(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", QUALITY);
}
