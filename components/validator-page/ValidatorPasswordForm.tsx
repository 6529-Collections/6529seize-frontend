import { LockClosedIcon } from "@heroicons/react/24/outline";

import { ABOUT_CARD_CLASS_NAME } from "@/components/about/AboutLayout";
import { VALIDATOR_UNLOCK_PATH } from "@/lib/validator-page/accessGate";
import ValidatorPageFrame, { ValidatorPageHeader } from "./ValidatorPageFrame";

export type ValidatorGateNotice = "wrong" | "wait" | null;

const NOTICES: Record<Exclude<ValidatorGateNotice, null>, string> = {
  wrong: "That password is not right. Check it and try again.",
  wait: "Too many tries from your network. Wait 15 minutes, then try again.",
};

export function readGateNotice(value: unknown): ValidatorGateNotice {
  return value === "wrong" || value === "wait" ? value : null;
}

export default function ValidatorPasswordForm({
  nextPath,
  notice,
}: {
  readonly nextPath: string;
  readonly notice: ValidatorGateNotice;
}) {
  return (
    <ValidatorPageFrame>
      <div className="tw-mx-auto tw-max-w-md tw-pt-4 sm:tw-pt-12">
        <ValidatorPageHeader eyebrow="Test release" title="6529 Validator">
          <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
            The validator&apos;s test release is open to testers. Enter the
            password 6529 gave you.
          </p>
        </ValidatorPageHeader>
        <form
          method="post"
          action={VALIDATOR_UNLOCK_PATH}
          className={`${ABOUT_CARD_CLASS_NAME} tw-p-5 sm:tw-p-6`}
        >
          <input type="hidden" name="next" value={nextPath} />
          <label
            htmlFor="validator-password"
            className="tw-mb-2 tw-block tw-text-sm tw-font-semibold tw-text-iron-100"
          >
            Password
          </label>
          <input
            id="validator-password"
            name="password"
            type="password"
            required
            maxLength={256}
            autoComplete="current-password"
            aria-describedby={notice ? "validator-password-notice" : undefined}
            aria-invalid={notice === "wrong" ? true : undefined}
            className="tw-block tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-text-base tw-text-iron-50 tw-outline-none focus:tw-border-primary-400 focus:tw-ring-2 focus:tw-ring-primary-400/40"
          />
          {notice && (
            <p
              id="validator-password-notice"
              role="alert"
              className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-error"
            >
              {NOTICES[notice]}
            </p>
          )}
          <button
            type="submit"
            className="tw-mt-5 tw-inline-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-text-base tw-font-semibold tw-text-white tw-transition hover:tw-bg-primary-600 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
          >
            <LockClosedIcon aria-hidden="true" className="tw-size-5" />
            Open
          </button>
        </form>
        <p className="tw-mt-5 tw-text-sm tw-leading-6 tw-text-iron-500">
          After the password, this browser keeps access for 30 days.
        </p>
      </div>
    </ValidatorPageFrame>
  );
}
