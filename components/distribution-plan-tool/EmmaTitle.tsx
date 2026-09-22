import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function EmmaTitle() {
  const about = t(DEFAULT_LOCALE, "emma.about");
  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <h1 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white">
        {t(DEFAULT_LOCALE, "emma.title")}
      </h1>
      <CustomTooltip content={about} placement="bottom">
        <Link
          href="/emma/help"
          aria-label={about}
          className="tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-iron-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        >
          <QuestionMarkCircleIcon className="tw-size-5" aria-hidden="true" />
        </Link>
      </CustomTooltip>
    </div>
  );
}
