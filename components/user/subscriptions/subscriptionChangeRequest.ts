import type { AppToastInput } from "@/components/utils/toast/AppToast";
import { publicEnv } from "@/config/env";
import { getPreferencesHref } from "@/helpers/preferences-navigation";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { readUsableDeviceGrant } from "@/lib/device-signing/device-key-store";
import { fetchRecordAnchor } from "@/lib/signed-records/record-anchor";
import {
  encodeSignedRecordsHeader,
  SIGNED_RECORDS_HEADER,
} from "@/lib/signed-records/record-event";
import type { ApiSignedRecordsOwners } from "@/generated/models/ApiSignedRecordsOwners";
import { recordDraft, signRecords } from "@/lib/signed-records/sign-records";
import {
  commonApiFetch,
  commonApiPost,
  getStructuredApiErrorCode,
} from "@/services/api/common-api";
import { getWalletAddress } from "@/services/auth/auth.utils";

/**
 * A subscription change as a signed record (kind 9 RECORD in the owner's
 * `ps` stream: the principal the signed-in wallet is bound to, or the wallet
 * while it is bound to none): `subs.mode {automatic}`, `subs.all-editions {all}`,
 * `subs.card {subscribed}` and `subs.count {count}`, the last two keyed
 * `<contract lowercase>:<token>`. The API checks that the record states the
 * same change as the request body.
 */
type SubscriptionChange =
  | { readonly type: "subs.mode"; readonly automatic: boolean }
  | { readonly type: "subs.all-editions"; readonly all: boolean }
  | {
      readonly type: "subs.card";
      readonly contract: string;
      readonly tokenId: number;
      readonly subscribed: boolean;
    }
  | {
      readonly type: "subs.count";
      readonly contract: string;
      readonly tokenId: number;
      readonly count: number;
    };

/** The API's answer to an unsigned change once changes must be signed. */
const SIGNED_RECORD_REQUIRED = "SIGNED_RECORD_REQUIRED";
/** The API's answer to a record older than the change it already holds. */
const STALE_SIGNED_RECORD = "STALE_SIGNED_RECORD";
const OWNER = /^0x(?:[0-9a-f]{64}|[0-9a-f]{40})$/;

/**
 * NEXT_PUBLIC_FEATURE_SIGNED_SUBSCRIPTIONS: sign the four subscription
 * changes before sending them. Off, the requests are today's. Rollback: set
 * it to anything but "true" and redeploy; that works only before the
 * subscriptions switch, after which the API takes signed changes only.
 */
const isSignedSubscriptionsEnabled = (): boolean =>
  publicEnv.NEXT_PUBLIC_FEATURE_SIGNED_SUBSCRIPTIONS === "true";

/**
 * The change went unsigned because signing did not finish (no owner or
 * anchor from the API, a timeout), and the API needs a signature now.
 */
class SubscriptionSigningFailedError extends Error {
  constructor(readonly reason: string) {
    super(`The subscription change could not be signed (${reason})`);
    this.name = "SubscriptionSigningFailedError";
  }
}

/** The change went unsigned (this browser has no grant) and the API needs a signature. */
class SubscriptionSigningRequiredError extends Error {
  constructor() {
    super("Subscription changes are signed now");
    this.name = "SubscriptionSigningRequiredError";
  }
}

function recordOf(change: SubscriptionChange): {
  readonly type: string;
  readonly key: string | null;
  readonly body: object;
} {
  switch (change.type) {
    case "subs.mode":
      return {
        type: change.type,
        key: null,
        body: { automatic: change.automatic },
      };
    case "subs.all-editions":
      return { type: change.type, key: null, body: { all: change.all } };
    case "subs.card":
      return {
        type: change.type,
        key: `${change.contract.toLowerCase()}:${change.tokenId}`,
        body: { subscribed: change.subscribed },
      };
    case "subs.count":
      return {
        type: change.type,
        key: `${change.contract.toLowerCase()}:${change.tokenId}`,
        body: { count: change.count },
      };
  }
}

async function hasUsableGrant(wallet: string): Promise<boolean> {
  try {
    return (await readUsableDeviceGrant(wallet, Date.now())) !== null;
  } catch {
    // The key store could not be read; signing will say what it can do.
    return true;
  }
}

/**
 * The owner a wallet's own records use, and the finalized height the API
 * read it at, from one GET /signed-records/owners: the record is signed at
 * that height, so its owner is the one the API names there.
 */
async function ownerAndAnchorOf(
  wallet: string
): Promise<{ readonly owner: string; readonly anchor: number }> {
  const response = await commonApiFetch<ApiSignedRecordsOwners>({
    endpoint: "signed-records/owners",
    params: { wallets: wallet },
    includeWalletAuth: false,
    cache: "no-store",
    errorMode: "structured",
  });
  const owner = (Array.isArray(response.owners) ? response.owners : []).find(
    (entry) => String(entry.wallet).toLowerCase() === wallet
  )?.owner;
  if (
    typeof owner !== "string" ||
    !OWNER.test(owner) ||
    !Number.isSafeInteger(response.anchor) ||
    response.anchor <= 0
  ) {
    throw new Error("The API named no owner and height for the wallet");
  }
  return { owner, anchor: response.anchor };
}

/** How a change goes: signed, or unsigned and why. */
type Signing =
  | {
      readonly status: "signed";
      readonly owner: string;
      readonly headers: Record<string, string>;
    }
  /** No wallet, or no usable device grant in this browser. */
  | { readonly status: "no-grant" }
  /** The owner, the height or the signature could not be had. */
  | { readonly status: "unavailable" };

async function signChange(
  change: SubscriptionChange,
  at: { readonly owner: string; readonly anchor: number }
): Promise<Signing> {
  const { type, key, body } = recordOf(change);
  const signed = await signRecords(
    [recordDraft("ps", at.owner, type, key, body)],
    { anchor: at.anchor }
  );
  if (signed.status === "no-grant") {
    return signed;
  }
  if (signed.status === "failed") {
    return { status: "unavailable" };
  }
  return {
    status: "signed",
    owner: at.owner,
    headers: {
      [SIGNED_RECORDS_HEADER]: encodeSignedRecordsHeader(signed.events),
    },
  };
}

/**
 * Signs a change, or says why it goes unsigned. Nothing here blocks the
 * change: before the subscriptions switch the API takes it unsigned, so a
 * gateway that is down for a moment never stops a change it would accept.
 */
async function signedRecordHeaders(
  change: SubscriptionChange
): Promise<Signing> {
  const wallet = getWalletAddress()?.toLowerCase();
  if (!wallet || !(await hasUsableGrant(wallet))) {
    return { status: "no-grant" };
  }
  let at: { readonly owner: string; readonly anchor: number };
  try {
    at = await ownerAndAnchorOf(wallet);
  } catch {
    return { status: "unavailable" };
  }
  return signChange(change, at);
}

/**
 * A change another device made since is newer than ours at the height we
 * signed at: sign again at a fresh finalized height, once.
 */
async function signAgainFresh(
  change: SubscriptionChange,
  owner: string
): Promise<Signing> {
  try {
    const { anchor } = await fetchRecordAnchor(Date.now(), { fresh: true });
    return await signChange(change, { owner, anchor });
  } catch {
    return { status: "unavailable" };
  }
}

function sendChange<R>(
  endpoint: string,
  body: unknown,
  signing: Signing
): Promise<R> {
  return commonApiPost<unknown, R>({
    endpoint,
    body,
    ...(signing.status === "signed" ? { headers: signing.headers } : {}),
    errorMode: "structured",
  });
}

/**
 * POSTs one of the four subscription changes. With signed subscriptions
 * off this is today's request. On, the change is signed with this browser's
 * device key first and the record goes in the `x-6529-signed-records`
 * header. When it can't be signed (no usable grant, or the owner, height or
 * signature can't be had) it goes unsigned, which the API takes until the
 * subscriptions switch; after it, the API's 409 becomes the "turn on signed
 * posts" prompt (no grant) or the "try again" prompt. A record the API holds
 * a newer one for is signed again at a fresh height, once. The body goes
 * as given; callers check its shape with `satisfies`.
 */
export async function postSubscriptionChange<R>(params: {
  readonly endpoint: string;
  readonly body: unknown;
  readonly change: SubscriptionChange;
}): Promise<R> {
  const { endpoint, body } = params;
  if (!isSignedSubscriptionsEnabled()) {
    return commonApiPost<unknown, R>({ endpoint, body });
  }
  const signing = await signedRecordHeaders(params.change);
  try {
    return await sendChange<R>(endpoint, body, signing);
  } catch (error) {
    const code = getStructuredApiErrorCode(error);
    if (signing.status !== "signed" && code === SIGNED_RECORD_REQUIRED) {
      throw signing.status === "no-grant"
        ? new SubscriptionSigningRequiredError()
        : new SubscriptionSigningFailedError("unavailable");
    }
    if (signing.status === "signed" && code === STALE_SIGNED_RECORD) {
      const again = await signAgainFresh(params.change, signing.owner);
      if (again.status === "signed") {
        return sendChange<R>(endpoint, body, again);
      }
    }
    throw error;
  }
}

/**
 * The toast for a change that could not be signed or needs signing on, or
 * null for any other error (the caller's own toast).
 */
export function subscriptionSigningToast(
  error: unknown,
  locale: SupportedLocale
): AppToastInput | null {
  if (error instanceof SubscriptionSigningFailedError) {
    return {
      type: "error",
      title: t(locale, "subscriptions.signing.failedTitle"),
      description: t(locale, "subscriptions.signing.failedDescription"),
    };
  }
  if (error instanceof SubscriptionSigningRequiredError) {
    return {
      type: "error",
      title: t(locale, "subscriptions.signing.requiredTitle"),
      description: t(locale, "subscriptions.signing.requiredDescription"),
      action: {
        label: t(locale, "subscriptions.signing.requiredAction"),
        href: getPreferencesHref({ tab: "devices" }),
      },
    };
  }
  return null;
}
