import { notFound, permanentRedirect } from "next/navigation";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { getEncryptedDevicesRoute } from "@/helpers/navigation.helpers";

/**
 * Devices and encrypted backup moved to Preferences → Devices & security.
 * Old links and bookmarks land there (308).
 */
export default function EncryptedMessagesDevicesPage() {
  if (!isE2eeEnabled()) {
    notFound();
  }
  permanentRedirect(getEncryptedDevicesRoute());
}
