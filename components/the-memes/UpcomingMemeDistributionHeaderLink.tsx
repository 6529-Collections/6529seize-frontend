import { getDistributionDetailHref } from "@/components/distribution/distributionRouteParams";
import ButtonLink from "@/components/utils/button/ButtonLink";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";

export default function UpcomingMemeDistributionHeaderLink({
  id,
  locale,
}: {
  readonly id: number;
  readonly locale: SupportedLocale;
}) {
  return (
    <ButtonLink
      href={getDistributionDetailHref({
        basePath: "/the-memes",
        id,
        locale,
      })}
      variant="tertiary"
      size="xs"
      className="tw-ml-auto"
    >
      <span className="tw-whitespace-nowrap">
        {t(locale, "distribution.planLink")}
      </span>
      <ArrowUpRightIcon
        aria-hidden="true"
        className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-400"
      />
    </ButtonLink>
  );
}
