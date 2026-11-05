"use client";
import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 200 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

/** File input state for the carrier logo: local preview of the chosen file plus drag & drop. */
export function useLogoPicker() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!file) return setPreviewUrl("");
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(next: File | undefined) {
    if (!next) return;
    if (!TYPES.includes(next.type) || next.size > MAX_BYTES) {
      setError("Logo phải là PNG, JPEG hoặc WebP, tối đa 200 KB.");
      if (input.current) input.current.value = "";
      setFile(null);
      return;
    }
    setError("");
    setFile(next);
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (!dropped || !input.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(dropped);
    input.current.files = transfer.files;
    pick(dropped);
  }

  return {
    input,
    file,
    previewUrl,
    error,
    dragging,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => pick(event.target.files?.[0]),
    onDrop,
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
  };
}
