"use client";

import { useAuth } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { getStableDeviceId } from "@/components/notifications/stable-device-id";
import type { ApiPushNotificationSettings } from "@/generated/models/ApiPushNotificationSettings";
import { commonApiFetch, commonApiPut } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import Toggle from "react-toggle";

interface PushNotificationSettingsProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const SETTINGS_LABELS: Record<keyof ApiPushNotificationSettings, string> = {
  identity_subscribed: "New followers",
  identity_mentioned: "Mentions",
  identity_rep: "REP changes",
  identity_nic: "Identity (NIC)",
  drop_quoted: "Drop quoted",
  drop_replied: "Drop replies",
  drop_voted: "Drop votes",
  drop_reacted: "Drop reactions",
  drop_boosted: "Drop boosts",
  wave_created: "Wave invites",
};

const DEFAULT_SETTINGS: ApiPushNotificationSettings = {
  identity_subscribed: true,
  identity_mentioned: true,
  identity_rep: true,
  identity_nic: true,
  drop_quoted: true,
  drop_replied: true,
  drop_voted: true,
  drop_reacted: true,
  drop_boosted: true,
  wave_created: true,
};

export default function PushNotificationSettings({
  isOpen,
  onClose,
}: PushNotificationSettingsProps) {
  const { setToast } = useAuth();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [originalSettings, setOriginalSettings] =
    useState<ApiPushNotificationSettings | null>(null);
  const [currentSettings, setCurrentSettings] =
    useState<ApiPushNotificationSettings | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateScrollState = () => {
      setCanScrollUp(el.scrollTop > 0);
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    };

    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [currentSettings]);

  // Get device ID and fetch settings when opened
  useEffect(() => {
    if (!isOpen) return;

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const id = await getStableDeviceId();
        setDeviceId(id);

        try {
          const settings = await commonApiFetch<ApiPushNotificationSettings>({
            endpoint: `push-notifications/settings/${id}`,
          });
          setOriginalSettings(settings);
          setCurrentSettings(settings);
        } catch {
          // If not found, use defaults (all true)
          setOriginalSettings(DEFAULT_SETTINGS);
          setCurrentSettings(DEFAULT_SETTINGS);
        }
      } catch (error) {
        console.error("Error loading push notification settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [isOpen]);

  const hasChanges =
    currentSettings &&
    originalSettings &&
    Object.keys(originalSettings).some(
      (key) =>
        originalSettings[key as keyof ApiPushNotificationSettings] !==
        currentSettings[key as keyof ApiPushNotificationSettings]
    );

  const updateSetting = useCallback(
    (key: keyof ApiPushNotificationSettings, value: boolean) => {
      setCurrentSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  const { mutateAsync: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!deviceId || !currentSettings) return;
      return await commonApiPut<
        ApiPushNotificationSettings,
        ApiPushNotificationSettings
      >({
        endpoint: `push-notifications/settings/${deviceId}`,
        body: currentSettings,
      });
    },
    onSuccess: () => {
      setOriginalSettings(currentSettings);
      setToast({
        message: "Notification settings updated",
        type: "success",
      });
      onClose();
    },
  });

  const handleSave = useCallback(async () => {
    await saveSettings();
  }, [saveSettings]);

  const settingKeys = Object.keys(SETTINGS_LABELS) as Array<
    keyof ApiPushNotificationSettings
  >;

  return (
    <MobileWrapperDialog
      title="Push Notifications"
      isOpen={isOpen}
      onClose={onClose}
      fixedHeight
    >
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden">
        {isLoading ? (
          <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center tw-py-12">
            <div className="tw-size-6 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-600 tw-border-t-primary-400" />
          </div>
        ) : !currentSettings ? (
          <div className="tw-flex-1 tw-py-8 tw-text-center">
            <p className="tw-text-sm tw-text-iron-400">
              Unable to load notification settings.
            </p>
          </div>
        ) : (
          <>
            <p className="tw-flex-shrink-0 tw-px-4 tw-pt-4 tw-text-sm tw-text-iron-400 sm:tw-px-6">
              Choose which notifications you want to receive on this device.
            </p>

            <div className="tw-relative tw-flex-1 tw-overflow-hidden">
              {canScrollUp && (
                <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-top-0 tw-z-10 tw-h-20 tw-bg-gradient-to-b tw-from-iron-950 tw-via-iron-950/80 tw-to-transparent" />
              )}
              <div
                ref={scrollRef}
                className="tw-h-full tw-overflow-y-auto tw-px-4 tw-pb-4 tw-pt-4 sm:tw-px-6"
              >
                <div className="tw-divide-y tw-divide-iron-800/50 tw-overflow-hidden tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-900/50">
                  {settingKeys.map((key) => (
                    <div
                      key={key}
                      className="tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-3"
                    >
                      <label
                        htmlFor={`toggle-${key}`}
                        className="tw-text-sm tw-text-iron-300"
                      >
                        {SETTINGS_LABELS[key]}
                      </label>
                      <Toggle
                        id={`toggle-${key}`}
                        checked={currentSettings[key]}
                        icons={false}
                        onChange={(e) => updateSetting(key, e.target.checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {canScrollDown && (
                <div className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-z-10 tw-h-20 tw-bg-gradient-to-t tw-from-iron-950 tw-via-iron-950/80 tw-to-transparent" />
              )}
            </div>

            <div className="tw-flex-shrink-0 tw-border-t tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-4 sm:tw-px-6">
              {hasChanges && (
                <p className="tw-mb-2 tw-text-center tw-text-xs tw-text-amber-400">
                  Tap below to save your changes
                </p>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={`tw-w-full tw-rounded-lg tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-transition-colors ${
                  hasChanges && !isSaving
                    ? "tw-bg-primary-500 tw-text-white hover:tw-bg-primary-600"
                    : "tw-cursor-not-allowed tw-bg-iron-800 tw-text-iron-500"
                }`}
              >
                {isSaving ? (
                  <span className="tw-flex tw-items-center tw-justify-center tw-gap-2">
                    <span className="tw-size-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-400 tw-border-t-white" />
                    Saving...
                  </span>
                ) : hasChanges ? (
                  "Save Changes"
                ) : (
                  "No Changes"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </MobileWrapperDialog>
  );
}
