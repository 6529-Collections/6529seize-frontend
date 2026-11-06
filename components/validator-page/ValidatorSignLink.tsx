import Link from "next/link";
import { t } from "@/i18n/messages";
import { SECONDARY_BUTTON } from "./validatorStyles";

export default function ValidatorSignLink() {
  return (
    <section
      aria-labelledby="wallet-other-device"
      className="tw-mt-8 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/60 tw-p-5 sm:tw-p-6"
    >
      <h2
        id="wallet-other-device"
        className="tw-mb-2 tw-text-lg tw-font-semibold tw-text-iron-50"
      >
        {t("en-US", "validator.sign.linkTitle")}
      </h2>
      <p className="tw-mb-4 tw-text-sm tw-leading-7 tw-text-iron-300">
        {t("en-US", "validator.sign.linkBody")}
      </p>
      <Link href="/validator/sign" className={SECONDARY_BUTTON}>
        {t("en-US", "validator.sign.link")}
      </Link>
    </section>
  );
}
