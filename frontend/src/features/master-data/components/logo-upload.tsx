"use client";
import { ImageUp } from "lucide-react";
import { useLogoPicker } from "../hooks/use-logo-picker";

/** Drop zone for a carrier logo; shows the newly chosen file, otherwise the current logo. */
export function LogoUpload({ code, currentUrl }: { code?: string; currentUrl?: string }) {
  const picker = useLogoPicker();
  const shown = picker.previewUrl || currentUrl;
  return (
    <label
      className={`op-logo-upload${picker.dragging ? " is-dragging" : ""}`}
      onDragOver={picker.onDragOver}
      onDragLeave={picker.onDragLeave}
      onDrop={picker.onDrop}
    >
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob / PocketBase file URL
        <img className="op-logo-preview" src={shown} alt={code ? `Logo ${code}` : "Logo hãng tàu"} />
      ) : (
        <span className="op-logo-placeholder"><ImageUp size={28} /></span>
      )}
      <b>{picker.file ? picker.file.name : currentUrl ? "Kéo thả hoặc chọn file để thay logo" : "Kéo thả hoặc chọn file logo"}</b>
      <small>{picker.file ? "Logo mới sẽ được áp dụng khi bấm Lưu" : "PNG, JPEG, WebP · tối đa 200 KB"}</small>
      {picker.error && <small className="op-logo-error" role="alert">{picker.error}</small>}
      <input
        type="file"
        ref={picker.input}
        onChange={picker.onChange}
        name="logo"
        aria-label="Chọn file logo"
        accept="image/png,image/jpeg,image/webp"
      />
    </label>
  );
}
