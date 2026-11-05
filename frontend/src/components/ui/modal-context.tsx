"use client";
import { createContext, useContext } from "react";

/** Starts the animated close of the nearest ModalSurface. */
export const ModalDismissContext = createContext<() => void>(() => {});
export const useModalDismiss = () => useContext(ModalDismissContext);
