import ValidatorSignPage from "@/components/validator-page/ValidatorSignPage";
import {
  getLockedView,
  getValidatorMetadata,
} from "@/lib/validator-page/pageAccess";

export default async function ValidatorSignRoute() {
  const locked = await getLockedView("/validator/sign");
  return locked ?? <ValidatorSignPage />;
}

export const metadata = getValidatorMetadata(
  "Sign a validator authorization | 6529",
  "Sign the authorization exported by your Validator app using the device where you keep your wallet."
);
