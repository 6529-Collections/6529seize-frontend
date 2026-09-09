"use client";

import SocialStatementIcon from "@/components/user/utils/icons/SocialStatementIcon";
import CopyIcon from "@/components/utils/icons/CopyIcon";
import OutsideLinkIcon from "@/components/utils/icons/OutsideLinkIcon";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { Tooltip } from "react-tooltip";
import { useCopyToClipboard } from "react-use";
import UserPageIdentityDeleteStatementButton from "./UserPageIdentityDeleteStatementButton";
import { getStatementPresentation } from "./statement-presentation";

const COPIED_FEEDBACK_DURATION_MS = 1800;
const COPY_ICON_FEEDBACK_DURATION_MS = 900;

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
  const [isCopyIconActive, setIsCopyIconActive] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyIconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [_, copyToClipboardLegacy] = useCopyToClipboard();

  const copyToClipboard = (value: string) => {
    const clipboard = globalThis.navigator.clipboard as Clipboard | undefined;
    if (!clipboard) {
      copyToClipboardLegacy(value);
      return;
    }

    void clipboard.writeText(value).catch(() => {
      copyToClipboardLegacy(value);
    });
  };

  const handleCopyPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") {
      return;
    }
    setIsCopyIconActive(true);
  };

  const handleCopyPointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") {
      return;
    }
    setIsCopyIconActive(false);
  };

  const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setCopied(true);
    setIsCopyIconActive(true);
    copyToClipboard(statement.statement_value);
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }
    if (copyIconTimerRef.current) {
      clearTimeout(copyIconTimerRef.current);
    }
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, COPIED_FEEDBACK_DURATION_MS);
    copyIconTimerRef.current = setTimeout(() => {
      setIsCopyIconActive(false);
      copyIconTimerRef.current = null;
    }, COPY_ICON_FEEDBACK_DURATION_MS);
  };

  useEffect(
    () => () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
      if (copyIconTimerRef.current) {
        clearTimeout(copyIconTimerRef.current);
      }
    },
    []
  );

  const presentation = getStatementPresentation(
    statement,
    t(locale, "user.profile.identity.statements.externalArtLink")
  );
  const canOpen = presentation.canOpen;
  const isTouchScreen = useIsTouchDevice();
  const statementContent = (
    <>
      <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center">
        <SocialStatementIcon statementType={statement.statement_type} />
      </div>
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-text-xs tw-font-semibold tw-leading-none tw-text-iron-500">
          {presentation.title}
        </div>
        <div className="tw-mt-1.5 tw-truncate tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-100">
          {isTouchScreen && copied ? (
            <span
              aria-hidden="true"
              className="tw-font-semibold tw-text-primary-400"
            >
              {t(locale, "user.profile.identity.statements.copied")}
            </span>
          ) : (
            presentation.displayValue
          )}
        </div>
      </div>
    </>
  );

  return (
    <li className="tw-group tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-transition-colors tw-duration-200 tw-ease-out last:tw-border-b-0 desktop-hover:hover:tw-bg-white/[0.02] lg:tw-pl-0.5">
      <div className="tw-flex tw-min-h-14 tw-items-stretch tw-gap-1 lg:tw-min-h-0">
        {canOpen ? (
          <a
            href={statement.statement_value}
            title={statement.statement_value}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t(
              locale,
              "user.profile.identity.statements.openStatement"
            )} ${presentation.title}`}
            className="tw-flex tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-items-center tw-gap-3.5 tw-py-3 tw-text-inherit tw-no-underline focus-visible:tw-rounded-md focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 lg:tw-py-2"
          >
            {statementContent}
            <div
              aria-hidden="true"
              className="tw-ml-auto tw-flex tw-h-9 tw-w-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-transparent tw-text-iron-500 tw-transition tw-duration-200 tw-ease-out active:tw-scale-95 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-iron-200 motion-reduce:tw-transform-none motion-reduce:tw-transition-none [&>svg]:tw-h-4 [&>svg]:tw-w-4"
              data-tooltip-id={`open-statement-${statement.id}`}
            >
              <OutsideLinkIcon />
            </div>
          </a>
        ) : (
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3.5 tw-py-3 lg:tw-py-2">
            {statementContent}
          </div>
        )}
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2 tw-leading-none">
          <button
            type="button"
            aria-label={`${t(
              locale,
              "user.profile.identity.statements.copyStatement"
            )} ${presentation.title}`}
            className={`tw-inline-flex tw-h-9 tw-w-9 tw-cursor-pointer tw-touch-manipulation tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-p-0 tw-transition tw-duration-200 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 active:tw-scale-95 motion-reduce:tw-transform-none motion-reduce:tw-transition-none ${
              isCopyIconActive
                ? "tw-bg-primary-500/15 tw-text-primary-300 tw-ring-1 tw-ring-inset tw-ring-primary-400/25"
                : "tw-bg-transparent tw-text-iron-500 focus-visible:tw-bg-white/10 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-white lg:tw-text-iron-600"
            }`}
            onClick={handleCopy}
            onPointerDown={handleCopyPointerDown}
            onPointerUp={handleCopyPointerEnd}
            onPointerLeave={handleCopyPointerEnd}
            onPointerCancel={handleCopyPointerEnd}
            data-tooltip-id={`copy-statement-${statement.id}`}
          >
            <div className="tw-flex tw-h-4 tw-w-4 tw-flex-shrink-0 tw-items-center tw-justify-center [&>svg]:tw-h-full [&>svg]:tw-w-full">
              <CopyIcon />
            </div>
            <span className="tw-sr-only">
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
              style={TOOLTIP_STYLES}
            >
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
        {canOpen && !isTouchScreen && (
          <Tooltip
            id={`open-statement-${statement.id}`}
            place="top"
            positionStrategy="fixed"
            offset={8}
            opacity={1}
            style={TOOLTIP_STYLES}
          >
            <span className="tw-text-xs">
              {t(locale, "user.profile.identity.statements.openStatement")}
            </span>
          </Tooltip>
        )}
        <span className="tw-sr-only" aria-live="polite">
          {copied ? t(locale, "user.profile.identity.statements.copied") : ""}
        </span>
      </div>
    </li>
  );
}
