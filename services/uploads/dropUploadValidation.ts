import type { AppToastInput } from "@/components/utils/toast/AppToast";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import {
  isAttachmentUploadFile,
  validateAttachmentUploadFile,
} from "@/services/uploads/attachmentUploadMimeType";
import {
  getContentType,
  getUnsupportedUploadToast,
  isSupportedUploadFile,
} from "@/services/uploads/mediaUploadMimeType";

const MAX_IMAGE_MIB = 256;

export function filterValidDropUploadFiles(
  files: readonly File[],
  setToast: (toast: AppToastInput) => void,
  locale: SupportedLocale = DEFAULT_LOCALE
): File[] {
  const unsupported = files.filter((file) => !isSupportedUploadFile(file));
  if (unsupported.length) {
    setToast(getUnsupportedUploadToast(unsupported, locale));
  }

  return files.filter((file) => {
    if (!isSupportedUploadFile(file)) return false;
    try {
      if (file.size === 0) throw new Error(t(locale, "drop.upload.empty"));
      if (
        getContentType(file).startsWith("image/") &&
        file.size > MAX_IMAGE_MIB * 1024 * 1024
      ) {
        throw new Error(
          t(locale, "drop.upload.imageTooLarge", {
            limit: formatInteger(locale, MAX_IMAGE_MIB),
          })
        );
      }
      if (isAttachmentUploadFile(file)) {
        validateAttachmentUploadFile(file);
      } else if (file.size > 500 * 1024 * 1024) {
        throw new Error(t(locale, "drop.upload.tooLarge"));
      }
      return true;
    } catch (error) {
      setToast({
        type: "error",
        title: t(locale, "drop.upload.invalidFile", { file: file.name }),
        description: error instanceof Error ? error.message : String(error),
        autoClose: false,
      });
      return false;
    }
  });
}
