import ButtonLink from "@/components/utils/button/ButtonLink";
import { getWavesBaseRoute } from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, tRich } from "@/i18n/messages";
import Link from "next/link";

const INLINE_LINK_CLASS =
  "tw-rounded-sm tw-text-primary-400 tw-no-underline tw-underline-offset-4 tw-transition-colors desktop-hover:hover:tw-text-primary-300 desktop-hover:hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

export default function MyStreamNoItems() {
  const { isApp } = useDeviceInfo();
  const locale = useBrowserLocale();
  const exploreHref = getWavesBaseRoute(isApp);
  const createHref = isApp ? "/waves/create" : "/waves?create=wave";

  return (
    <div className="tw-m-auto tw-flex tw-w-full tw-max-w-xl tw-shrink-0 tw-flex-col tw-items-center tw-px-4 tw-py-8 tw-text-center sm:tw-px-6 lg:tw-px-0">
      <div className="tw-flex tw-size-16 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900">
        <svg
          className="tw-size-8 tw-text-primary-400"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.34119 10.875H11.409V14.625H7.34119V10.875Z"
            fill="currentColor"
          />
          <path
            d="M22.5001 7.125H48V10.875H22.5001V7.125Z"
            fill="currentColor"
          />
          <path
            d="M22.5001 14.625H37.1251V18.375H22.5001V14.625Z"
            fill="currentColor"
          />
          <path
            d="M7.34119 33.375H11.409V37.125H7.34119V33.375Z"
            fill="currentColor"
          />
          <path
            d="M22.5001 29.625H48V33.375H22.5001V29.625Z"
            fill="currentColor"
          />
          <path
            d="M22.5001 37.125H37.1251V40.875H22.5001V37.125Z"
            fill="currentColor"
          />
          <path
            d="M0 20.625C0 21.4534 0.671573 22.125 1.5 22.125H17.25C18.0784 22.125 18.75 21.4534 18.75 20.625V4.875C18.75 4.04657 18.0784 3.375 17.25 3.375H1.5C0.671573 3.375 0 4.04657 0 4.875V20.625ZM3.75 8.625C3.75 7.79657 4.42157 7.125 5.25 7.125H13.5C14.3284 7.125 15 7.79657 15 8.625V16.875C15 17.7034 14.3284 18.375 13.5 18.375H5.25C4.42157 18.375 3.75 17.7034 3.75 16.875V8.625Z"
            fill="currentColor"
          />
          <path
            d="M0 43.125C0 43.9534 0.671573 44.625 1.5 44.625H17.25C18.0784 44.625 18.75 43.9534 18.75 43.125V27.375C18.75 26.5466 18.0784 25.875 17.25 25.875H1.5C0.671573 25.875 0 26.5466 0 27.375V43.125ZM3.75 31.125C3.75 30.2966 4.42157 29.625 5.25 29.625H13.5C14.3284 29.625 15 30.2966 15 31.125V39.375C15 40.2034 14.3284 40.875 13.5 40.875H5.25C4.42157 40.875 3.75 40.2034 3.75 39.375V31.125Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <h2 className="tw-mb-0 tw-mt-7 tw-max-w-xs tw-text-pretty tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-max-w-none sm:tw-text-2xl">
        {t(locale, "notifications.empty.title")}
      </h2>

      <p className="tw-mb-0 tw-mt-4 tw-max-w-md tw-text-pretty tw-text-sm tw-font-normal tw-leading-6 tw-text-iron-400 sm:tw-text-base">
        {tRich(locale, "notifications.empty.description", {
          actions: (
            <span key="actions" className="tw-block">
              {tRich(locale, "notifications.empty.actions", {
                following: (
                  <Link
                    key="following"
                    href={exploreHref}
                    className={INLINE_LINK_CLASS}
                  >
                    {t(locale, "notifications.empty.following")}
                  </Link>
                ),
                creating: (
                  <Link
                    key="creating"
                    href={createHref}
                    className={INLINE_LINK_CLASS}
                  >
                    {t(locale, "notifications.empty.creating")}
                  </Link>
                ),
              })}
            </span>
          ),
        })}
      </p>

      <div className="tw-mt-8 tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-center tw-gap-3">
        <ButtonLink href={createHref} variant="primary" size="lg">
          <svg
            className="-tw-ml-1.5 tw-h-4 tw-w-4 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{t(locale, "notifications.empty.create")}</span>
        </ButtonLink>

        <ButtonLink
          href={exploreHref}
          variant="secondary"
          size="lg"
          className="tw-group"
        >
          <span>{t(locale, "notifications.empty.explore")}</span>
          <svg
            className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transform tw-transition-transform group-hover:tw-translate-x-1"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
            />
          </svg>
        </ButtonLink>
      </div>
    </div>
  );
}
