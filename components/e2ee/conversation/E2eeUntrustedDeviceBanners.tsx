"use client";

import { useRef, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEngine,
  E2eeUntrustedDevice,
} from "@/lib/e2ee/types";
import { formatE2eeWallet, getMemberName } from "../e2eeFormat";
import { E2eeBanner } from "../ui/E2eeBanner";

interface E2eeUntrustedDeviceBannersProps {
  readonly conversation: E2eeConversation;
  readonly engine: E2eeEngine;
  readonly selfProfileId: string | null;
}

const messageKey = (device: E2eeUntrustedDevice, self: boolean): MessageKey => {
  if (device.reason === "unverified") {
    return self
      ? "e2ee.banner.untrustedUnverifiedSelf"
      : "e2ee.banner.untrustedUnverified";
  }
  return self
    ? "e2ee.banner.untrustedNewWalletSelf"
    : "e2ee.banner.untrustedNewWallet";
};

/**
 * Members' devices that were not added automatically because a wallet not
 * yet trusted for that person signed them (trust on first use), or because
 * their contract-wallet signature could not be checked here. "Add device"
 * trusts the wallet and adds the device; "Ignore" keeps it out.
 */
export function E2eeUntrustedDeviceBanners({
  conversation,
  engine,
  selfProfileId,
}: E2eeUntrustedDeviceBannersProps) {
  const locale = useBrowserLocale();
  // One decision at a time across all banners; the ref also blocks a second
  // click that lands before React re-renders the disabled buttons.
  const inFlight = useRef(false);
  const [pending, setPending] = useState<{
    deviceKey: string;
    add: boolean;
  } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  if (conversation.untrustedDevices.length === 0) {
    return null;
  }

  const decide = async (device: E2eeUntrustedDevice, add: boolean) => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    setPending({ deviceKey: device.deviceKey, add });
    setFailedKey(null);
    try {
      await (add
        ? engine.trustDevice(device.deviceKey)
        : engine.ignoreDevice(device.deviceKey));
    } catch {
      setFailedKey(device.deviceKey);
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  };

  return (
    <div className="tw-flex tw-flex-shrink-0 tw-flex-col tw-gap-2 tw-px-4 tw-pt-2">
      {conversation.untrustedDevices.map((device) => {
        const wallet = formatE2eeWallet(device.wallet);
        const self = device.profileId === selfProfileId;
        const name = getMemberName(
          locale,
          conversation.members,
          device.profileId,
          selfProfileId
        );
        const busy = pending?.deviceKey === device.deviceKey;
        const adding = busy && pending.add === true;
        const ignoring = busy && pending.add === false;
        return (
          <E2eeBanner
            key={device.deviceKey}
            tone="warning"
            action={
              <>
                <Button
                  variant="secondary"
                  size="xs"
                  loading={adding}
                  disabled={pending !== null}
                  onClick={() => void decide(device, true)}
                  aria-label={t(locale, "e2ee.banner.addDeviceAria", {
                    wallet,
                  })}
                >
                  {t(locale, "e2ee.banner.addDevice")}
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  loading={ignoring}
                  disabled={pending !== null}
                  onClick={() => void decide(device, false)}
                  aria-label={t(locale, "e2ee.banner.ignoreDeviceAria", {
                    wallet,
                  })}
                >
                  {t(locale, "e2ee.banner.ignoreDevice")}
                </Button>
              </>
            }
          >
            <span title={device.wallet}>
              {t(locale, messageKey(device, self), { name, wallet })}
            </span>
            <span className="tw-mt-1 tw-block tw-text-xs tw-opacity-80">
              {t(locale, "e2ee.banner.untrustedHelp")}
            </span>
            {failedKey === device.deviceKey ? (
              <span role="alert" className="tw-mt-1 tw-block tw-text-rose-200">
                {t(locale, "e2ee.banner.deviceActionFailed")}
              </span>
            ) : null}
          </E2eeBanner>
        );
      })}
    </div>
  );
}
