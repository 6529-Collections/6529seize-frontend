import type { TypeOptions } from "react-toastify";

const DEFAULT_TOAST_AUTO_CLOSE_MS = 3000;
const ERROR_TOAST_AUTO_CLOSE_MS = 8000;

export const getToastAutoClose = (type: TypeOptions): number =>
  type === "error" ? ERROR_TOAST_AUTO_CLOSE_MS : DEFAULT_TOAST_AUTO_CLOSE_MS;
