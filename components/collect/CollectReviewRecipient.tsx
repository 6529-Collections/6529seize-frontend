"use client";

import CopyIcon from "@/components/utils/icons/CopyIcon";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useDropClipboardCopyFeedback } from "@/hooks/drops/useDropClipboardCopyFeedback";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { getAddress, isAddress, zeroAddress } from "viem";
import CollectRecipientPicker from "./CollectRecipientPicker";
import CollectReviewWallet from "./CollectReviewWallet";
import { isCollectProfileWallet } from "./collect-recipient.helpers";

interface CollectReviewRecipientProps {
  readonly address: string;
  readonly name?: string | undefined;
  readonly profile: ApiIdentity | null;
  readonly payingWallet: string;
  readonly recipientInProfile: boolean;
  readonly disabled: boolean;
  readonly onEditingChange: (open: boolean) => void;
  readonly onApply: (
    address: string,
    acknowledgeExternalRecipient: boolean
  ) => Promise<boolean>;
}

function SelectedRecipientAddress({
  address,
  id,
}: {
  readonly address: string;
  readonly id: string;
}) {
  const locale = useBrowserLocale();
  const { status, statusMessage, copyToClipboard } =
    useDropClipboardCopyFeedback();
  return (
    <div>
      <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-2">
        <code
          id={`${id}-address`}
          dir="ltr"
          className="tw-min-w-0 tw-flex-1 tw-select-text tw-py-2 tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-300 [overflow-wrap:anywhere]"
        >
          {address.slice(0, 22)}
          <wbr />
          {address.slice(22)}
        </code>
        <button
          type="button"
          aria-label={t(locale, "walletAddress.copy.walletAriaLabel")}
          aria-describedby={`${id}-label ${id}-address`}
          onClick={() => copyToClipboard(() => address)}
          className="tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/5"
        >
          {status === "copied" ? (
            <CheckIcon aria-hidden="true" className="tw-size-5" />
          ) : (
            <CopyIcon />
          )}
        </button>
      </div>
      <output
        aria-live="polite"
        className={
          status === "failed"
            ? "tw-block tw-text-xs tw-text-iron-300"
            : "tw-sr-only"
        }
      >
        {statusMessage}
      </output>
    </div>
  );
}

export default function CollectReviewRecipient({
  address,
  name,
  profile,
  payingWallet,
  recipientInProfile,
  disabled,
  onEditingChange,
  onApply,
}: CollectReviewRecipientProps) {
  const locale = useBrowserLocale();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const restoreFocus = useRef(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(address);
  const [acknowledged, setAcknowledged] = useState(false);
  const [applying, setApplying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const displayAddress = isAddress(address, { strict: false })
    ? getAddress(address)
    : address;
  const displayName = name?.trim();
  const showName =
    Boolean(displayName) && !isAddress(displayName ?? "", { strict: false });
  const valid = isAddress(draft) && draft.toLowerCase() !== zeroAddress;
  const selectedAddress = valid ? getAddress(draft) : null;
  const external = valid && !isCollectProfileWallet(profile, draft);
  const locked = disabled || applying;
  useLayoutEffect(() => {
    if (!open && restoreFocus.current) {
      restoreFocus.current = false;
      if (!locked) trigger.current?.focus({ preventScroll: true });
    }
  }, [open, locked]);

  const close = () => {
    restoreFocus.current = true;
    setOpen(false);
    setDraft(address);
    setAcknowledged(false);
    setFailed(false);
    onEditingChange(false);
  };
  const apply = async () => {
    if (
      locked ||
      inFlight.current ||
      !selectedAddress ||
      (external && !acknowledged)
    )
      return;
    inFlight.current = true;
    setApplying(true);
    setFailed(false);
    try {
      const applied = await onApply(selectedAddress, external && acknowledged);
      if (mounted.current && applied) close();
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      inFlight.current = false;
      if (mounted.current) setApplying(false);
    }
  };

  if (!open && disabled) {
    return (
      <CollectReviewWallet
        address={address}
        name={name}
        label={t(locale, "collect.review.deliverTo")}
        detail={
          recipientInProfile
            ? undefined
            : t(locale, "collect.review.otherRecipient")
        }
      />
    );
  }

  return (
    <div className="tw-min-w-0">
      <button
        ref={trigger}
        type="button"
        disabled={locked}
        aria-expanded={open}
        aria-controls={`${id}-editor`}
        onClick={() => {
          if (open) close();
          else {
            setDraft(address);
            setAcknowledged(false);
            setFailed(false);
            setOpen(true);
            onEditingChange(true);
          }
        }}
        className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-3 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-0 tw-py-2 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-default disabled:tw-opacity-60"
      >
        <span
          id={`${id}-label`}
          className="tw-shrink-0 tw-text-[13px] tw-text-iron-400"
        >
          {t(locale, "collect.review.deliverTo")}
        </span>
        <bdi className="tw-min-w-0 tw-flex-1 tw-text-right tw-text-sm tw-font-normal tw-text-iron-100 [overflow-wrap:anywhere]">
          {showName
            ? displayName
            : `${displayAddress.slice(0, 6)}…${displayAddress.slice(-4)}`}
        </bdi>
        <ChevronDownIcon
          aria-hidden="true"
          className={`tw-size-3 tw-shrink-0 tw-text-iron-400 ${open ? "tw-rotate-180" : ""}`}
        />
      </button>
      {!open && !recipientInProfile && (
        <p className="tw-m-0 tw-break-words tw-text-right tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.review.otherRecipient")}
        </p>
      )}
      {open && (
        <div
          id={`${id}-editor`}
          className="tw-mb-3 tw-min-w-0 tw-space-y-4 tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-3"
        >
          <fieldset
            disabled={locked}
            className="tw-m-0 tw-min-w-0 tw-space-y-4 tw-border-0 tw-p-0"
          >
            <legend className="tw-sr-only">
              {t(locale, "collect.recipient.chooseWallet")}
            </legend>
            <CollectRecipientPicker
              compact
              profile={profile}
              payingWallet={payingWallet}
              value={draft}
              invalid={Boolean(draft) && !valid}
              errorId={`${id}-invalid`}
              onChange={(nextAddress) => {
                if (locked || inFlight.current) return;
                setDraft(nextAddress);
                setAcknowledged(false);
                setFailed(false);
              }}
            />
            {Boolean(draft) && !valid && (
              <p
                id={`${id}-invalid`}
                role="alert"
                className="tw-m-0 tw-text-xs tw-leading-5 tw-text-error"
              >
                {t(locale, "collect.trade.invalid.recipient")}
              </p>
            )}
            {selectedAddress && (
              <SelectedRecipientAddress
                key={selectedAddress}
                address={selectedAddress}
                id={id}
              />
            )}
            {external && (
              <label className="tw-flex tw-min-h-11 tw-items-start tw-gap-3 tw-text-xs tw-leading-5 tw-text-iron-300">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  className="tw-mt-1 tw-size-4 tw-shrink-0 tw-accent-primary-500"
                />
                <span>{t(locale, "collect.trade.acknowledgeExternal")}</span>
              </label>
            )}
          </fieldset>
          {failed && (
            <p
              role="alert"
              className="tw-m-0 tw-text-xs tw-leading-5 tw-text-error"
            >
              {t(locale, "collect.recipient.updateFailed")}
            </p>
          )}
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2">
            <button
              type="button"
              disabled={locked}
              onClick={close}
              className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-text-[13px] tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
            >
              {t(locale, "collect.recipient.cancel")}
            </button>
            <button
              type="button"
              disabled={locked || !valid || (external && !acknowledged)}
              aria-busy={applying}
              onClick={apply}
              className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-white/[0.04] tw-px-3 tw-text-[13px] tw-font-medium tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 desktop-hover:hover:tw-bg-white/[0.08]"
            >
              {t(
                locale,
                applying
                  ? "collect.recipient.applying"
                  : "collect.recipient.apply"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
