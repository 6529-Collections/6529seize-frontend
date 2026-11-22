import type { ApiSaveEulaConsentRequest } from "@/generated/models/ApiSaveEulaConsentRequest";
import {
  eulaItem,
  personalChange,
} from "@/lib/personal-records/personal-record-changes";
import { savePersonalSetting } from "@/lib/personal-records/save-personal-setting";
import { commonApiPost } from "@/services/api/common-api";

/**
 * Saves the EULA acceptance of this device. Signed-in people with a grant
 * write a private `eula` item keyed by the device id; anonymous installs
 * and devices without a grant keep today's route.
 */
export const saveEulaConsent = (
  consent: ApiSaveEulaConsentRequest
): Promise<void> =>
  savePersonalSetting({
    legacy: async () => {
      await commonApiPost({
        endpoint: "policies/eula-consent",
        body: consent,
        errorMode: "structured",
      });
    },
    change: () =>
      personalChange({
        items: [
          eulaItem(consent.device_id, {
            version: consent.eula_version,
            platform: consent.platform,
          }),
        ],
      }),
    recordsResult: () => undefined,
    legacyWithoutGrant: true,
  });
