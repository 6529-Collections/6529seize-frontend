import { showAppToast } from "@/components/utils/toast/AppToast";
import { getFriendlyToastContent } from "@/helpers/toast.helpers";

export const makeErrorToast = (message: string) => {
  const friendly = getFriendlyToastContent({ message, type: "error" });

  return showAppToast({
    type: "error",
    ...(friendly ?? {
      title: "Couldn't complete this request.",
      description: "Please try again.",
      details: message,
    }),
  });
};
