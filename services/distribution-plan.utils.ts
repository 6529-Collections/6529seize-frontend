import { getToastAutoClose } from "@/helpers/toast.helpers";
import { Slide, toast } from "react-toastify";

export const makeErrorToast = (message: string) =>
  toast(message, {
    position: "top-right",
    autoClose: getToastAutoClose("error"),
    hideProgressBar: false,
    draggable: false,
    closeOnClick: true,
    transition: Slide,
    theme: "dark",
    type: "error",
  });
