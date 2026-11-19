import { notFound, permanentRedirect } from "next/navigation";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import { getEncryptedDevicesRoute } from "@/helpers/navigation.helpers";

/**
 * Devices and encrypted backup moved to Preferences → Devices & security.
 * The config redirect (config/nextConfig.ts) answers first with a 308; this
 * page only covers a request that reaches rendering anyway.
 */
export default function EncryptedMessagesDevicesPage() {
  if (!isE2eeEnabled()) {
    notFound();
  }
  permanentRedirect(getEncryptedDevicesRoute());
}
