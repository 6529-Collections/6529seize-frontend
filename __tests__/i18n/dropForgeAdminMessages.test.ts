import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { DROP_FORGE_ADMIN_MESSAGES } from "@/i18n/messages/drop-forge-admins";

it.each(SUPPORTED_LOCALES)(
  "keeps admin copy and accessible names available in %s",
  (locale) => {
    for (const key of Object.keys(DROP_FORGE_ADMIN_MESSAGES) as Array<
      keyof typeof DROP_FORGE_ADMIN_MESSAGES
    >) {
      expect(t(locale, key)).toBe(DROP_FORGE_ADMIN_MESSAGES[key]);
    }
    expect(
      t(locale, "dropForge.admins.revokeLabel", { address: "0x123" })
    ).toBe("Revoke admin 0x123");
    expect(t(locale, "dropForge.admins.confirmAdd")).toBe("Confirm Add Admin");
    expect(t(locale, "dropForge.admins.confirmRevoke")).toBe("Confirm Revoke");
  }
);
