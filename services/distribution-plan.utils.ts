import { Slide, toast } from "react-toastify";
export const makeErrorToast = (message: string) =>
  toast(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    draggable: false,
    closeOnClick: true,
    transition: Slide,
    theme: "dark",
    type: "error",
  });
