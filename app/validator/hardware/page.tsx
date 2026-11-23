import { permanentRedirect } from "next/navigation";

import { VALIDATOR_HARDWARE_HREF } from "@/lib/validator-page/content/pageText";

// The hardware page is retired. The guide's Path B holds the hardware facts,
// so the old address leads there.
export default function ValidatorHardwareRoute(): never {
  permanentRedirect(VALIDATOR_HARDWARE_HREF);
}
