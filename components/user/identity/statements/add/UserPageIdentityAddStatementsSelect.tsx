import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { STATEMENT_ADD_VIEW } from "./UserPageIdentityAddStatements.constants";

const CAVEAT_MESSAGE_KEYS = [
  "user.profile.identity.statements.add.caveatOptional",
  "user.profile.identity.statements.add.caveatPublic",
  "user.profile.identity.statements.add.caveatNoVerification",
  "user.profile.identity.statements.add.caveatCommunityRates",
] as const satisfies readonly MessageKey[];

const TILE_TITLE_CLASS_NAME =
  "tw-mb-0 tw-mt-0 tw-text-sm tw-font-semibold tw-leading-4 tw-tracking-tight tw-text-iron-100 desktop-hover:group-hover:tw-text-white md:tw-text-[15px] md:tw-leading-5 md:tw-tracking-normal";

export default function UserPageIdentityAddStatementsSelect({
  onViewChange,
}: {
  readonly onViewChange: (view: STATEMENT_ADD_VIEW) => void;
}) {
  const locale = useBrowserLocale();
  const tileClassName =
    "tw-group tw-relative tw-flex tw-min-h-24 tw-w-full tw-flex-col tw-items-start tw-justify-between tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.035] tw-p-3 tw-text-left tw-transition-colors tw-duration-200 tw-ease-out desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/[0.07] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 active:tw-bg-white/10 motion-reduce:tw-transition-none md:tw-block md:tw-min-h-0 md:tw-border-iron-700 md:tw-bg-iron-900 md:tw-p-6 md:desktop-hover:hover:tw-bg-iron-800";
  const tileIconClassName =
    "tw-inline-flex tw-size-6 tw-items-center tw-justify-center";

  return (
    <>
      <div className="tw-max-w-xl">
        <p className="tw-mb-0 tw-hidden tw-max-w-sm tw-text-lg tw-font-medium tw-text-iron-100 md:tw-block">
          {t(locale, "user.profile.identity.statements.add.desktopTitle")}
        </p>
        <p className="tw-mb-0 tw-text-pretty tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-400 md:tw-mt-2">
          <span className="md:tw-hidden">
            {t(
              locale,
              "user.profile.identity.statements.add.mobileDescription"
            )}
          </span>
          <span className="tw-hidden md:tw-inline">
            {t(
              locale,
              "user.profile.identity.statements.add.desktopDescription"
            )}
          </span>
        </p>
      </div>

      <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-2 md:tw-mt-8 md:tw-grid-cols-2 md:tw-gap-6 lg:tw-grid-cols-4">
        <button
          type="button"
          onClick={() => onViewChange(STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT)}
          className={tileClassName}
        >
          <div>
            <span className={tileIconClassName}>
              <svg
                className="tw-size-6 tw-flex-shrink-0 tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out desktop-hover:group-hover:tw-scale-105 desktop-hover:group-hover:tw-text-white motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 3.46776C17.4817 4.20411 18.5 5.73314 18.5 7.5C18.5 9.26686 17.4817 10.7959 16 11.5322M18 16.7664C19.5115 17.4503 20.8725 18.565 22 20M2 20C3.94649 17.5226 6.58918 16 9.5 16C12.4108 16 15.0535 17.5226 17 20M14 7.5C14 9.98528 11.9853 12 9.5 12C7.01472 12 5 9.98528 5 7.5C5 5.01472 7.01472 3 9.5 3C11.9853 3 14 5.01472 14 7.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div className="tw-mt-3 tw-min-w-0 md:tw-mt-5 lg:tw-h-20">
            <p className={TILE_TITLE_CLASS_NAME}>
              {t(locale, "user.profile.identity.statements.add.socialTitle")}
            </p>
            <p className="tw-mb-0 tw-mt-2 tw-hidden tw-text-pretty tw-text-[13px] tw-leading-5 tw-text-iron-400 md:tw-block">
              {t(
                locale,
                "user.profile.identity.statements.add.socialDescription"
              )}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onViewChange(STATEMENT_ADD_VIEW.NFT_ACCOUNT)}
          className={tileClassName}
        >
          <div>
            <span className={tileIconClassName}>
              <svg
                className="tw-size-6 tw-flex-shrink-0 tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out desktop-hover:group-hover:tw-scale-105 desktop-hover:group-hover:tw-text-white motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 5L18 7L22 3M22 12V17.2C22 18.8802 22 19.7202 21.673 20.362C21.3854 20.9265 20.9265 21.3854 20.362 21.673C19.7202 22 18.8802 22 17.2 22H6.8C5.11984 22 4.27976 22 3.63803 21.673C3.07354 21.3854 2.6146 20.9265 2.32698 20.362C2 19.7202 2 18.8802 2 17.2V6.8C2 5.11984 2 4.27976 2.32698 3.63803C2.6146 3.07354 3.07354 2.6146 3.63803 2.32698C4.27976 2 5.11984 2 6.8 2H12M2.14551 19.9263C2.61465 18.2386 4.16256 17 5.99977 17H12.9998C13.9291 17 14.3937 17 14.7801 17.0769C16.3669 17.3925 17.6073 18.6329 17.9229 20.2196C17.9998 20.606 17.9998 21.0707 17.9998 22M14 9.5C14 11.7091 12.2091 13.5 10 13.5C7.79086 13.5 6 11.7091 6 9.5C6 7.29086 7.79086 5.5 10 5.5C12.2091 5.5 14 7.29086 14 9.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div className="tw-mt-3 tw-min-w-0 md:tw-mt-5 lg:tw-h-20">
            <p className={TILE_TITLE_CLASS_NAME}>
              {t(locale, "user.profile.identity.statements.add.nftTitle")}
            </p>
            <p className="tw-mb-0 tw-mt-2 tw-hidden tw-text-pretty tw-text-[13px] tw-leading-5 tw-text-iron-400 md:tw-block">
              {t(locale, "user.profile.identity.statements.add.nftDescription")}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onViewChange(STATEMENT_ADD_VIEW.CONTACT)}
          className={tileClassName}
        >
          <div>
            <span className={tileIconClassName}>
              <svg
                className="tw-size-6 tw-flex-shrink-0 tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out desktop-hover:group-hover:tw-scale-105 desktop-hover:group-hover:tw-text-white motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 8.5H12M7 12H15M9.68375 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V20.3355C3 20.8684 3 21.1348 3.10923 21.2716C3.20422 21.3906 3.34827 21.4599 3.50054 21.4597C3.67563 21.4595 3.88367 21.2931 4.29976 20.9602L6.68521 19.0518C7.17252 18.662 7.41617 18.4671 7.68749 18.3285C7.9282 18.2055 8.18443 18.1156 8.44921 18.0613C8.74767 18 9.0597 18 9.68375 18Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div className="tw-mt-3 tw-min-w-0 md:tw-mt-5 lg:tw-h-20">
            <p className={TILE_TITLE_CLASS_NAME}>
              {t(locale, "user.profile.identity.statements.add.contactTitle")}
            </p>
            <p className="tw-mb-0 tw-mt-2 tw-hidden tw-text-pretty tw-text-[13px] tw-leading-5 tw-text-iron-400 md:tw-block">
              {t(
                locale,
                "user.profile.identity.statements.add.contactDescription"
              )}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() =>
            onViewChange(STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST)
          }
          className={tileClassName}
        >
          <div>
            <span className={tileIconClassName}>
              <svg
                className="tw-size-6 tw-flex-shrink-0 tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out desktop-hover:group-hover:tw-scale-105 desktop-hover:group-hover:tw-text-white motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V13M13 17H7M15 13H7M20.1213 3.87868C21.2929 5.05025 21.2929 6.94975 20.1213 8.12132C18.9497 9.29289 17.0503 9.29289 15.8787 8.12132C14.7071 6.94975 14.7071 5.05025 15.8787 3.87868C17.0503 2.70711 18.9497 2.70711 20.1213 3.87868Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <div className="tw-mt-3 tw-min-w-0 md:tw-mt-5 lg:tw-h-20">
            <p className={TILE_TITLE_CLASS_NAME}>
              {t(
                locale,
                "user.profile.identity.statements.add.verificationTitle"
              )}
            </p>
            <p className="tw-mb-0 tw-mt-2 tw-hidden tw-text-pretty tw-text-[13px] tw-leading-5 tw-text-iron-400 md:tw-block">
              {t(
                locale,
                "user.profile.identity.statements.add.verificationDescription"
              )}
            </p>
          </div>
        </button>
      </div>

      <details className="tw-group tw-mt-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 md:tw-hidden">
        <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-px-2 tw-text-xs tw-font-medium tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
          {t(locale, "user.profile.identity.statements.add.aboutStatements")}
          <ChevronDownIcon
            className="tw-size-4 tw-flex-none tw-transition-transform tw-duration-200 group-open:tw-rotate-180 motion-reduce:tw-transition-none"
            aria-hidden="true"
          />
        </summary>
        <ul className="tw-mb-0 tw-list-disc tw-space-y-1 tw-pb-1 tw-pl-5 tw-pr-2 tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-500">
          {CAVEAT_MESSAGE_KEYS.map((key) => (
            <li key={key}>{t(locale, key)}</li>
          ))}
        </ul>
      </details>

      <div className="tw-mt-5 tw-hidden tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700 tw-px-4 tw-pt-5 md:tw-block">
        <ul className="tw-mb-0 tw-list-disc tw-space-y-1 tw-pl-0 tw-text-xs tw-font-normal tw-text-iron-500">
          {CAVEAT_MESSAGE_KEYS.map((key) => (
            <li key={key}>{t(locale, key)}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
