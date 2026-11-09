import {
  ChatBubbleOvalLeftEllipsisIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  PhotoIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { STATEMENT_ADD_VIEW } from "./UserPageIdentityAddStatements.constants";

const STATEMENT_OPTIONS = [
  {
    view: STATEMENT_ADD_VIEW.SOCIAL_MEDIA_ACCOUNT,
    titleKey: "user.profile.identity.statements.add.socialTitle",
    descriptionKey: "user.profile.identity.statements.add.socialDescription",
    icon: UsersIcon,
  },
  {
    view: STATEMENT_ADD_VIEW.NFT_ACCOUNT,
    titleKey: "user.profile.identity.statements.add.nftTitle",
    descriptionKey: "user.profile.identity.statements.add.nftDescription",
    icon: PhotoIcon,
  },
  {
    view: STATEMENT_ADD_VIEW.CONTACT,
    titleKey: "user.profile.identity.statements.add.contactTitle",
    descriptionKey: "user.profile.identity.statements.add.contactDescription",
    icon: ChatBubbleOvalLeftEllipsisIcon,
  },
  {
    view: STATEMENT_ADD_VIEW.SOCIAL_MEDIA_VERIFICATION_POST,
    titleKey: "user.profile.identity.statements.add.verificationTitle",
    descriptionKey:
      "user.profile.identity.statements.add.verificationDescription",
    icon: CheckCircleIcon,
  },
] as const;

export default function UserPageIdentityAddStatementsSelect({
  onViewChange,
}: {
  readonly onViewChange: (view: STATEMENT_ADD_VIEW) => void;
}) {
  const locale = useBrowserLocale();

  return (
    <>
      <p className="tw-m-0 tw-max-w-[22rem] tw-text-pretty tw-text-sm tw-leading-6 tw-text-iron-400">
        {t(locale, "user.profile.identity.statements.add.desktopDescription")}
      </p>

      <div className="tw-space-y-1 tw-pb-5 tw-pt-5">
        {STATEMENT_OPTIONS.map(
          ({ view, titleKey, descriptionKey, icon: Icon }) => (
            <button
              key={view}
              type="button"
              onClick={() => onViewChange(view)}
              className="tw-group -tw-mx-3 tw-flex tw-w-[calc(100%_+_1.5rem)] tw-cursor-pointer tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-3 tw-text-left tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400 active:tw-bg-white/[0.05] desktop-hover:hover:tw-bg-white/[0.03] motion-reduce:tw-transition-none"
            >
              <span
                aria-hidden="true"
                className="tw-flex tw-size-10 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-white/[0.025] tw-text-iron-400"
              >
                <Icon className="tw-size-5" />
              </span>
              <div className="tw-min-w-0 tw-flex-1">
                <p className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-50">
                  {t(locale, titleKey)}
                </p>
                <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-500">
                  {t(locale, descriptionKey)}
                </p>
              </div>
              <ChevronRightIcon
                aria-hidden="true"
                className="tw-size-4 tw-shrink-0 tw-text-iron-500 tw-transition-colors tw-duration-150 desktop-hover:group-hover:tw-text-iron-300 motion-reduce:tw-transition-none"
              />
            </button>
          )
        )}
      </div>

      <aside
        aria-label={t(
          locale,
          "user.profile.identity.statements.add.aboutStatements"
        )}
        className="-tw-mx-5 tw-flex tw-items-start tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.03] tw-bg-black/35 tw-px-5 tw-py-4 sm:-tw-mx-6 sm:tw-px-6"
      >
        <InformationCircleIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-size-4 tw-shrink-0 tw-text-iron-500"
        />
        <div className="tw-space-y-0.5 tw-text-xs tw-leading-5 tw-text-iron-500">
          <p className="tw-m-0 tw-text-pretty">
            {t(locale, "user.profile.identity.statements.add.privacyNotice")}
          </p>
          <p className="tw-m-0 tw-text-pretty">
            {t(
              locale,
              "user.profile.identity.statements.add.caveatNoVerification"
            )}
          </p>
        </div>
      </aside>
    </>
  );
}
