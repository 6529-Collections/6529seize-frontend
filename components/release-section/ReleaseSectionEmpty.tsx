import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

import { ABOUT_INSET_CLASS_NAME } from "@/components/about/AboutLayout";
import { BODY } from "@/components/validator-page/validatorStyles";

/**
 * In place of the downloads when there is no release to offer: none is
 * published yet, or the release list failed to load.
 */
export default function ReleaseSectionEmpty({
  message,
}: {
  readonly message: string;
}) {
  return (
    <div
      className={`${ABOUT_INSET_CLASS_NAME} tw-flex tw-items-start tw-gap-3 tw-p-5`}
    >
      <ExclamationTriangleIcon
        aria-hidden="true"
        className="tw-mt-0.5 tw-size-5 tw-flex-none tw-text-iron-400"
      />
      <p className={`tw-m-0 ${BODY}`}>{message}</p>
    </div>
  );
}
