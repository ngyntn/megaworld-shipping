"use client";
import type { ButtonHTMLAttributes } from "react";
import { useModalDismiss } from "./modal-context";

export function ModalClose(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const dismiss = useModalDismiss();
  return (
    <button
      {...props}
      type="button"
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) dismiss();
      }}
    />
  );
}
