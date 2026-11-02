"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/Auth";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import {
  EncryptedFirstDmActions,
  unencryptedDmButtonStyle,
} from "@/components/e2ee/legacy/EncryptedFirstDmActions";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import Button from "@/components/utils/button/Button";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses } from "@/helpers/Helpers";
import { navigateToDirectMessage } from "@/helpers/navigation.helpers";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { createDirectMessageWave } from "@/helpers/waves/waves.helpers";
import { getDirectMessageAdmissionErrorMessage } from "@/helpers/waves/direct-message-admission.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatNumber } from "@/i18n/format";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import { useRouter } from "next/navigation";
import DirectMessageRecipients, {
  recipientKey,
  recipientName,
} from "./DirectMessageRecipients";
export default function CreateDirectMessage({
  profile,
  onBack,
  onSuccess,
  presentation = "page",
}: {
  readonly profile: ApiIdentity;
  readonly onBack: () => void;
  readonly onSuccess?: (() => void) | undefined;
  readonly presentation?: "page" | "modal";
}) {
  const [isCreating, setIsCreating] = useState(false);
  const creatingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const locale = useBrowserLocale();
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const { waveViewStyle } = useLayout();
  const { isVisible: isKeyboardVisible } = useNativeKeyboard();
  const isNativePage = isApp && presentation === "page";

  const { setToast } = useAuth();

  const [selectedIdentities, setSelectedIdentities] = useState<
    CommunityMemberMinimal[]
  >([]);

  useEffect(() => {
    if (presentation === "modal") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || formRef.current?.closest('[role="dialog"]'))
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      )
        return;
      event.preventDefault();
      onBack();
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [onBack, presentation]);

  const onIdentitySelect = (identity: CommunityMemberMinimal) => {
    if (
      areEqualAddresses(
        identity.primary_wallet ?? identity.wallet,
        profile?.primary_wallet
      )
    ) {
      setToast({
        message: t(locale, "quickDm.createSelfIncluded"),
        type: "info",
      });
      return;
    }
    setSelectedIdentities((current) =>
      current.some((person) => recipientKey(person) === recipientKey(identity))
        ? current.filter(
            (person) => recipientKey(person) !== recipientKey(identity)
          )
        : [...current, identity]
    );
  };

  const onRemove = (id: string) => {
    if (areEqualAddresses(id, profile?.primary_wallet)) {
      setToast({
        message: t(locale, "quickDm.createSelfRemove"),
        type: "error",
      });
      return;
    }

    setSelectedIdentities((current) =>
      current.filter(
        (i) => !areEqualAddresses(i.primary_wallet ?? i.wallet, id)
      )
    );
  };

  const onCreateDirectMessage = async () => {
    if (creatingRef.current || selectedIdentities.length === 0) return;
    creatingRef.current = true;
    setIsCreating(true);
    try {
      const wave = await createDirectMessageWave({
        addresses: selectedIdentities
          .map((i) => i.primary_wallet ?? i.wallet)
          .filter((i) => i !== null),
      });
      onSuccess?.();
      navigateToDirectMessage({ waveId: wave.id, router, isApp });
    } catch (error) {
      console.error(error);
      const errorMessage =
        getDirectMessageAdmissionErrorMessage(locale, error) ??
        getToastErrorDetails(error);
      setToast({
        type: "error",
        title: t(locale, "quickDm.createError"),
        description:
          errorMessage ?? t(locale, "profilePreferences.dm.createRetry"),
      });
      setIsCreating(false);
      creatingRef.current = false;
    }
  };

  const encryptedFirst = isE2eeEnabled();
  let buttonLabel = t(locale, "quickDm.createMessage");
  if (isCreating) {
    buttonLabel = t(locale, "quickDm.creating");
  } else if (selectedIdentities.length === 1 && selectedIdentities[0]) {
    buttonLabel = t(locale, "quickDm.createMessagePerson", {
      name: recipientName(selectedIdentities[0]),
    });
  } else if (selectedIdentities.length > 1) {
    buttonLabel = t(locale, "quickDm.createMessagePeople", {
      count: formatNumber(locale, selectedIdentities.length),
    });
  }
  if (encryptedFirst && !isCreating) {
    buttonLabel = t(locale, "e2ee.legacy.create.unencrypted");
  }

  return (
    <form
      ref={formRef}
      aria-label={t(locale, "quickDm.createModalTitle")}
      onSubmit={(event) => {
        event.preventDefault();
        void onCreateDirectMessage();
      }}
      style={isNativePage ? waveViewStyle : undefined}
      className={`tailwind-scope tw-flex tw-min-h-0 tw-w-full tw-min-w-0 tw-flex-col tw-bg-black tw-text-iron-50 ${isNativePage ? "tw-flex-none" : "tw-flex-1"} ${presentation === "page" && !isApp ? "tw-h-[70dvh]" : ""}`}
    >
      {presentation === "page" && !isApp && (
        <header className="tw-grid tw-h-14 tw-flex-shrink-0 tw-grid-cols-[2.75rem_1fr_2.75rem] tw-items-center tw-px-2">
          <button
            type="button"
            onClick={onBack}
            aria-label={t(locale, "quickDm.backAriaLabel")}
            className="tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <ChevronLeftIcon aria-hidden="true" className="tw-size-5" />
          </button>
          <h1 className="tw-m-0 tw-text-center tw-text-base tw-font-semibold">
            {t(locale, "quickDm.createModalTitle")}
          </h1>
        </header>
      )}
      <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-px-4 tw-pb-4 tw-pt-1 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
        <DirectMessageRecipients
          onToggle={onIdentitySelect}
          selected={selectedIdentities}
          onRemove={onRemove}
          disabled={isCreating}
        />
      </div>
      <div
        className={`tw-flex-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-900 tw-px-4 tw-pt-3 ${isNativePage && !isKeyboardVisible ? "tw-pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]" : "tw-pb-3"}`}
      >
        <EncryptedFirstDmActions
          selected={selectedIdentities}
          onEncrypted={onSuccess}
          unencryptedButton={
            <Button
              type="submit"
              {...unencryptedDmButtonStyle(encryptedFirst)}
              fullWidth
              loading={isCreating}
              disabled={selectedIdentities.length === 0}
            >
              <span className="tw-min-w-0 tw-whitespace-normal tw-break-all">
                {buttonLabel}
              </span>
            </Button>
          }
        />
      </div>
    </form>
  );
}
