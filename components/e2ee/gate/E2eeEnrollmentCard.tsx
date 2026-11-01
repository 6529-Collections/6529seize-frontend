"use client";

import {
  ArchiveBoxXMarkIcon,
  EyeSlashIcon,
  FingerPrintIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {
  type ReactNode,
  useContext,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import { useAuth } from "@/components/auth/Auth";
import { SeizeConnectContext } from "@/components/auth/seizeConnectContextValue";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeEngine } from "@/lib/e2ee/types";
import {
  E2EE_SIGNATURE_REJECTED,
  getE2eeErrorCode,
  isE2eeSignatureRejection,
} from "../e2eeErrors";
import { isSafariBrowser } from "../e2eePlatform";
import { turnOnWithCombinedSignIn } from "./e2eeCombinedTurnOn";

const POINTS: readonly {
  readonly key: MessageKey;
  readonly Icon: typeof ShieldCheckIcon;
}[] = [
  { key: "e2ee.enroll.point.signature", Icon: FingerPrintIcon },
  { key: "e2ee.enroll.point.noFunds", Icon: ShieldCheckIcon },
  { key: "e2ee.enroll.point.privacy", Icon: EyeSlashIcon },
  { key: "e2ee.enroll.point.noBackup", Icon: ArchiveBoxXMarkIcon },
];

const ENROLL_REJECTED_KEY: MessageKey = "e2ee.enroll.rejected";

const subscribeNever = () => () => undefined;

const getEnrollErrorKey = (error: unknown): MessageKey =>
  isE2eeSignatureRejection(error) ||
  getE2eeErrorCode(error) === E2EE_SIGNATURE_REJECTED
    ? ENROLL_REJECTED_KEY
    : "e2ee.enroll.failed";

interface E2eeEnrollmentCardProps {
  readonly engine: E2eeEngine | null;
  readonly enrolling: boolean;
  readonly engineError: string | null;
  /** Extra context under the points (who signs, where to turn it off). */
  readonly details?: ReactNode | undefined;
}

/**
 * First use: explains, in plain words, the single wallet signature, what
 * 6529 can and cannot see, and that there is no backup in this version.
 */
export function E2eeEnrollmentCard({
  engine,
  enrolling,
  engineError,
  details,
}: E2eeEnrollmentCardProps) {
  const locale = useBrowserLocale();
  const headingId = useId();
  const { requestSignedMessagesGrant } = useAuth();
  // Optional read: the gate renders in tests and shells without a provider.
  const address = useContext(SeizeConnectContext)?.address;
  const [pending, setPending] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const isSafari = useSyncExternalStore(
    subscribeNever,
    isSafariBrowser,
    () => false
  );
  const waiting = pending || enrolling;
  const visibleErrorKey =
    errorKey ??
    (!waiting && engineError === E2EE_SIGNATURE_REJECTED
      ? ENROLL_REJECTED_KEY
      : null);

  const declined = visibleErrorKey === ENROLL_REJECTED_KEY;
  const failureKey = declined ? null : visibleErrorKey;
  let statusKey: MessageKey | null = null;
  if (waiting) {
    statusKey = "e2ee.enroll.waiting";
  } else if (declined) {
    statusKey = ENROLL_REJECTED_KEY;
  }

  const enroll = async () => {
    if (!engine || waiting) {
      return;
    }
    setPending(true);
    setErrorKey(null);
    try {
      // The website grants this device with one combined sign-in; the apps
      // and any case it cannot cover use the separate grant prompt.
      const outcome = await turnOnWithCombinedSignIn({
        engine,
        address,
        requestGrant: requestSignedMessagesGrant,
      });
      if (outcome === "declined") {
        setErrorKey(ENROLL_REJECTED_KEY);
      } else if (outcome === "fallback") {
        await engine.enroll();
      }
    } catch (error) {
      setErrorKey(getEnrollErrorKey(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <section
      aria-labelledby={headingId}
      className="tw-mx-auto tw-flex tw-w-full tw-max-w-xl tw-flex-col tw-gap-4 tw-px-4 tw-py-8"
    >
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
        <h2
          id={headingId}
          className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
        >
          {t(locale, "e2ee.enroll.title")}
        </h2>
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "e2ee.enroll.intro")}
        </p>
        <ul className="tw-m-0 tw-mt-4 tw-flex tw-list-none tw-flex-col tw-gap-3 tw-p-0">
          {POINTS.map(({ key, Icon }) => (
            <li key={key} className="tw-flex tw-items-start tw-gap-3">
              <Icon
                aria-hidden="true"
                className="tw-mt-0.5 tw-size-5 tw-flex-shrink-0 tw-text-iron-400"
              />
              <span className="tw-text-sm tw-leading-6 tw-text-iron-200">
                {t(locale, key)}
              </span>
            </li>
          ))}
        </ul>
        {details}
        {isSafari ? (
          <p className="tw-mb-0 tw-mt-4 tw-rounded-lg tw-bg-amber-500/10 tw-p-3 tw-text-sm tw-leading-6 tw-text-amber-100">
            {t(locale, "e2ee.enroll.safari")}
          </p>
        ) : null}
        <div className="tw-mt-5 tw-flex tw-flex-col tw-gap-3">
          <Button
            variant="action"
            size="lg"
            onClick={() => void enroll()}
            loading={waiting}
            disabled={!engine}
            className="!tw-whitespace-normal tw-text-center"
          >
            {t(locale, "e2ee.enroll.button")}
          </Button>
          {/* One polite region for waiting and for declining (a choice). */}
          <output
            className={`tw-block tw-text-center tw-text-sm tw-text-iron-300 ${
              statusKey ? "" : "tw-sr-only"
            }`}
          >
            {statusKey ? t(locale, statusKey) : null}
          </output>
          {failureKey ? (
            <p
              role="alert"
              className="tw-m-0 tw-text-center tw-text-sm tw-text-rose-300"
            >
              {t(locale, failureKey)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
