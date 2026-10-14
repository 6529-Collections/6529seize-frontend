"use client";

import {
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityStatementsAddButton from "../add/UserPageIdentityStatementsAddButton";
import { createPossessionStr } from "@/helpers/Helpers";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";

export default function UserPageIdentityAddStatementsHeader({
  profile,
  headerAction,
}: {
  readonly profile: ApiIdentity;
  readonly headerAction?: ReactNode;
}) {
  const locale = useBrowserLocale();
  const tooltipId = useId();
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const account = useSeizeConnectContext();
  const { activeProfileProxy } = useContext(AuthContext);
  const normalizedAddress = account.address?.toLowerCase();
  const isMyProfile =
    !!normalizedAddress &&
    (profile.wallets ?? []).some(
      (wallet) => wallet.wallet.toLowerCase() === normalizedAddress
    );
  const canEdit = isMyProfile && !activeProfileProxy && !!profile.handle;
  const possessionName = createPossessionStr(profile.handle ?? null);

  useEffect(() => {
    if (!isGuidanceOpen) return;

    const dismissOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        !helpButtonRef.current?.contains(target) &&
        !document.getElementById(tooltipId)?.contains(target)
      ) {
        setIsGuidanceOpen(false);
      }
    };

    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [isGuidanceOpen, tooltipId]);

  return (
    <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3">
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1">
        <h3 className="tw-m-0 tw-min-w-0 tw-break-words tw-text-lg tw-font-semibold tw-text-iron-100">
          {t(locale, "user.profile.identity.statements.heading", {
            name: possessionName,
          })}
        </h3>
        <button
          ref={helpButtonRef}
          type="button"
          aria-label={t(locale, "user.profile.identity.statements.help")}
          aria-expanded={isGuidanceOpen}
          data-tooltip-id={tooltipId}
          className="tw-inline-flex tw-h-8 tw-w-8 tw-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-white/5 hover:tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          <svg
            className="tw-h-[18px] tw-w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {headerAction ??
        (canEdit && (
          <UserPageIdentityStatementsAddButton profile={profile} size="xs" />
        ))}
      <BodyPortalTooltip
        id={tooltipId}
        place="top"
        offset={8}
        opacity={1}
        style={{ ...TOOLTIP_STYLES, pointerEvents: "auto" }}
        isOpen={isGuidanceOpen}
        setIsOpen={setIsGuidanceOpen}
        clickable
        delayHide={150}
        openEvents={{ mouseenter: true, focus: true, click: true }}
        closeEvents={{ mouseleave: true, blur: true }}
        globalCloseEvents={{
          escape: true,
          scroll: true,
        }}
        className="!tw-w-80 !tw-max-w-[calc(100vw-2rem)] tw-whitespace-normal tw-text-left tw-text-xs tw-leading-5"
      >
        <ul className="tw-m-0 tw-list-disc tw-space-y-1 tw-py-1 tw-pl-4 tw-font-normal tw-text-iron-300">
          <li>{t(locale, "user.profile.identity.statements.optional")}</li>
          <li>
            {t(locale, "user.profile.identity.statements.permanentlyPublic")}
          </li>
          <li>
            {t(
              locale,
              "user.profile.identity.statements.socialAccountsDisclaimer"
            )}
          </li>
          <li>
            {t(locale, "user.profile.identity.statements.communityRates")}
          </li>
        </ul>
      </BodyPortalTooltip>
    </div>
  );
}
