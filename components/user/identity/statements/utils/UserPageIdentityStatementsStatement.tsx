"use client";

import SocialStatementIcon from "@/components/user/utils/icons/SocialStatementIcon";
import CopyIcon from "@/components/utils/icons/CopyIcon";
import OutsideLinkIcon from "@/components/utils/icons/OutsideLinkIcon";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { STATEMENT_META } from "@/helpers/Types";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useEffect, useRef, useState } from "react";
import { Tooltip } from "react-tooltip";
import { useCopyToClipboard } from "react-use";
import UserPageIdentityDeleteStatementButton from "./UserPageIdentityDeleteStatementButton";

export default function UserPageIdentityStatementsStatement({
  statement,
  profile,
  canEdit,
}: {
  readonly statement: CicStatement;
  readonly profile: ApiIdentity;
  readonly canEdit: boolean;
}) {
  const locale = useBrowserLocale();
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [_, copyToClipboard] = useCopyToClipboard();

  const handleCopy = () => {
    copyToClipboard(statement.statement_value);
    setCopied(true);
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, 1000);
  };

  useEffect(
    () => () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    },
    []
  );

  const canOpen = STATEMENT_META[statement.statement_type].canOpenStatement;
  const isTouchScreen = useIsTouchDevice();

  return (
    <li className="tw-group tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-py-4 tw-transition-colors tw-duration-200 tw-ease-out last:tw-border-b-0 desktop-hover:hover:tw-bg-white/[0.02] lg:tw-pl-0.5">
      <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-3.5 tw-min-w-0">
          <div className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-flex tw-items-center tw-justify-center">
            <SocialStatementIcon statementType={statement.statement_type} />
          </div>
          <div className="tw-min-w-0">
            <div className="tw-text-xs tw-font-semibold tw-text-iron-500 tw-leading-none">
              {STATEMENT_META[statement.statement_type].title}
            </div>
            <div className="tw-text-xs tw-font-medium tw-text-iron-100 tw-break-all tw-leading-4 tw-mt-1.5">
              {copied ? (
                <span className="tw-text-primary-400">
                  {t(locale, "user.profile.identity.statements.copied")}
                </span>
              ) : (
                statement.statement_value
              )}
            </div>
          </div>
        </div>
        <div className="tw-grid tw-w-full tw-flex-shrink-0 tw-grid-cols-2 tw-items-center tw-gap-2 tw-leading-none lg:tw-ml-3 lg:tw-flex lg:tw-w-auto">
          {canOpen && (
            <>
              <a
                href={statement.statement_value}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(
                  locale,
                  "user.profile.identity.statements.openStatement"
                )}
                className="tw-inline-flex tw-min-h-11 tw-flex-1 tw-cursor-pointer tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 tw-no-underline tw-transition-colors desktop-hover:hover:tw-bg-white/[0.08] desktop-hover:hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 lg:tw-min-h-0 lg:tw-flex-none lg:tw-rounded-none lg:tw-border-none lg:tw-bg-transparent lg:tw-p-0 lg:tw-text-iron-600"
                data-tooltip-id={`open-statement-${statement.id}`}>
                <div className="tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center [&>svg]:tw-h-full [&>svg]:tw-w-full">
                  <OutsideLinkIcon />
                </div>
                <span className="lg:tw-sr-only">
                  {t(
                    locale,
                    "user.profile.identity.statements.openStatement"
                  )}
                </span>
              </a>
              {!isTouchScreen && (
                <Tooltip
                  id={`open-statement-${statement.id}`}
                  place="top"
                  positionStrategy="fixed"
                  offset={8}
                  opacity={1}
                  style={TOOLTIP_STYLES}>
                  <span className="tw-text-xs">
                    {t(
                      locale,
                      "user.profile.identity.statements.openStatement"
                    )}
                  </span>
                </Tooltip>
              )}
            </>
          )}
          <button
            type="button"
            aria-label={t(
              locale,
              "user.profile.identity.statements.copyStatement"
            )}
            className="tw-inline-flex tw-min-h-11 tw-flex-1 tw-cursor-pointer tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 tw-transition-colors desktop-hover:hover:tw-bg-white/[0.08] desktop-hover:hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 lg:tw-min-h-0 lg:tw-flex-none lg:tw-rounded-none lg:tw-border-0 lg:tw-bg-transparent lg:tw-p-0 lg:tw-text-iron-600"
            onClick={handleCopy}
            data-tooltip-id={`copy-statement-${statement.id}`}>
            <div className="tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center [&>svg]:tw-h-full [&>svg]:tw-w-full">
              <CopyIcon />
            </div>
            <span className="lg:tw-sr-only">
              {t(locale, "user.profile.identity.statements.copyStatement")}
            </span>
          </button>
          {!isTouchScreen && (
            <Tooltip
              id={`copy-statement-${statement.id}`}
              place="top"
              positionStrategy="fixed"
              offset={8}
              opacity={1}
              style={TOOLTIP_STYLES}>
              <span className="tw-text-xs">
                {t(locale, "user.profile.identity.statements.copyStatement")}
              </span>
            </Tooltip>
          )}
          {canEdit && (
            <UserPageIdentityDeleteStatementButton
              statement={statement}
              profile={profile}
            />
          )}
        </div>
        <span className="tw-sr-only" aria-live="polite">
          {copied
            ? t(locale, "user.profile.identity.statements.copied")
            : ""}
        </span>
      </div>
    </li>
  );
}
