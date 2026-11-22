import type { ApiSignedRecordEvent } from "@/generated/models/ApiSignedRecordEvent";
import type { ApiSignedRecordResult } from "@/generated/models/ApiSignedRecordResult";
import type { ApiSubmitSignedRecordsRequest } from "@/generated/models/ApiSubmitSignedRecordsRequest";
import type { ApiSubmitSignedRecordsResponse } from "@/generated/models/ApiSubmitSignedRecordsResponse";
import { canonicalJson } from "@/lib/device-signing/canonical-json";
import { readUsableDeviceGrant } from "@/lib/device-signing/device-key-store";
import {
  fetchRecordAnchor,
  type RecordAnchor,
} from "@/lib/signed-records/record-anchor";
import type { SignedRecordEvent } from "@/lib/signed-records/record-event";
import { familyWave } from "@/lib/signed-records/record-families";
import {
  encodeKeysDocument,
  isSealSupported,
  SealedClass,
  type SealedItem,
  sealItems,
  wrapSenderKey,
} from "@/lib/signed-records/sealed-crypto";
import { getOrCreateSenderKey } from "@/lib/signed-records/sender-keys";
import {
  recordDraft,
  type RecordDraft,
  sealedDraft,
  signRecords,
} from "@/lib/signed-records/sign-records";
import { commonApiPost } from "@/services/api/common-api";
import {
  getConnectedWalletAccounts,
  getWalletAddress,
} from "@/services/auth/auth.utils";
import {
  forgetKeysRecord,
  readKeysRecord,
  storeKeysRecord,
} from "./keys-record-cache";
import type { PersonalChange } from "./personal-record-changes";
import {
  PERSONAL_RECORDS_MESSAGES,
  refusalMessage,
} from "./personal-records-errors";
import type { PersonalRecordsMode } from "./personal-records-mode";

/** What became of one action's records. */
type PersonalSubmitOutcome =
  | { readonly status: "saved" }
  /** No usable grant on this device: offer to turn signing on. */
  | { readonly status: "no-grant" }
  /** The API took the records in another mode than primary: nothing changed. */
  | { readonly status: "mode-changed" }
  | {
      readonly status: "not-saved";
      readonly message: string;
      /** The API's reason, or `unavailable`, `unsupported`, `signing`, `proxy` or `no-principal`. */
      readonly reason: string;
      readonly code?: string | undefined;
    };

interface SubmitOptions {
  /** Shadow mode: the records follow today's request for the same change. */
  readonly companion: boolean;
}

/** Why an action is signed and sent again: each happens at most once. */
type Retry =
  /** The resent keys record left the API's window: sign a fresh one. */
  | { readonly kind: "stale-keys" }
  /**
   * The API holds a newer change of this person's (another device or tab):
   * sign again with a fresh anchor and a claimed time after `after`.
   */
  | {
      readonly kind: typeof OUT_OF_ORDER_REASON;
      readonly after: number;
      readonly outcome: PersonalSubmitOutcome;
    };

/** Who signs, into which streams, and how the API should take it. */
interface SubmitContext {
  readonly mode: PersonalRecordsMode;
  readonly owner: string;
  readonly wallet: string;
  readonly options: SubmitOptions;
}

interface AttemptOptions {
  readonly freshKeys: boolean;
  /** The earliest claimed time after an out-of-order refusal; null at first. */
  readonly notBefore: number | null;
}

const MAX_EVENTS_PER_SUBMIT = 16;
/** The API's reason when it holds a newer change of the person's. */
const OUT_OF_ORDER_REASON = "out-of-order";
/**
 * Canonical JSON of one `settings` record's items. Sealed plaintext pads to
 * at most 32 KiB, so larger actions (a reorder of many pins) take several
 * records.
 */
const SETTINGS_JSON_BUDGET = 30 * 1024;
/**
 * The API takes a record only while its anchor is at most `maxAnchorLag`
 * heights behind the finalized head and its claimed time within 10 minutes
 * of the API's clock. A stored keys record is resent while it is well
 * inside both; after that a fresh one is signed.
 */
const KEYS_ANCHOR_MARGIN = 10;
const KEYS_RESEND_MS = 8 * 60 * 1000;
const SETTINGS_LABEL = "settings";
const KEYS_LABEL = "keys";
const READER_TYPE = "reader";
const READER_SENT_PREFIX = "6529-personal-records-reader:";
const PRINCIPAL_ID = /^0x[0-9a-f]{64}$/;

const encoder = new TextEncoder();
const ITEMS_JSON_OVERHEAD = encoder.encode('{"items":[],"v":1}').length;

const notSaved = (
  reason: string,
  message: string,
  code?: string
): PersonalSubmitOutcome => ({ status: "not-saved", reason, message, code });

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.slice(2);
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

/** A session acting as another profile (a proxy), as far as this browser knows. */
function isProxySession(wallet: string): boolean {
  const account = getConnectedWalletAccounts().find(
    (candidate) => candidate.address.toLowerCase() === wallet
  );
  return (
    !!account?.role && !!account.profileId && account.role !== account.profileId
  );
}

// The reader record goes once per (owner, site reader) per browser; a
// repeat is harmless (stale), so storage errors only cost a repeat.
const readerSentKey = (owner: string, reader: string) =>
  `${READER_SENT_PREFIX}${owner}:${reader}`;

// localStorage can be missing (a worker) or throw (blocked storage).
function isReaderSent(owner: string, reader: string): boolean {
  try {
    return (
      globalThis.localStorage.getItem(readerSentKey(owner, reader)) === "1"
    );
  } catch {
    return false;
  }
}

function markReaderSent(owner: string, reader: string): void {
  try {
    globalThis.localStorage.setItem(readerSentKey(owner, reader), "1");
  } catch {
    // Not remembered: the next private change sends it again.
  }
}

/**
 * Splits items, in order, into groups whose canonical `{"items","v"}` JSON
 * stays under the budget. Each group becomes one `settings` record.
 */
function settingsChunks(items: readonly SealedItem[]): SealedItem[][] {
  const chunks: SealedItem[][] = [];
  let chunk: SealedItem[] = [];
  let size = ITEMS_JSON_OVERHEAD;
  for (const item of items) {
    // The item and its separating comma.
    const itemSize = encoder.encode(canonicalJson(item)).length + 1;
    if (chunk.length > 0 && size + itemSize > SETTINGS_JSON_BUDGET) {
      chunks.push(chunk);
      chunk = [];
      size = ITEMS_JSON_OVERHEAD;
    }
    chunk.push(item);
    size += itemSize;
  }
  if (chunk.length > 0) {
    chunks.push(chunk);
  }
  return chunks;
}

/** One record of a submit: a draft to sign, or the stored keys record. */
interface Slot {
  readonly role: "action" | "keys" | "reader";
  readonly draftIndex: number | null;
  readonly event: SignedRecordEvent | null;
}

interface KeysScope {
  readonly deviceKey: string;
  readonly gen: number;
  readonly grantId: string;
  readonly wave: string;
  readonly providerKeys: PersonalRecordsMode["providerKeys"];
}

interface PrivatePart {
  readonly settings: RecordDraft[];
  /** The stored keys record to resend, or the draft of a fresh one. */
  readonly keys:
    | { readonly event: SignedRecordEvent }
    | { readonly draft: RecordDraft };
  readonly reader: RecordDraft | null;
  readonly scope: KeysScope;
}

/** The records to sign and the submits that carry them, in order. */
interface Plan {
  readonly drafts: readonly RecordDraft[];
  readonly batches: readonly (readonly Slot[])[];
  readonly scope: KeysScope | null;
  /** The keys record is the stored one, not signed for this action. */
  readonly keysReused: boolean;
}

const isResendable = (
  stored: SignedRecordEvent,
  anchor: RecordAnchor
): boolean =>
  stored.anchor >= anchor.anchor - anchor.maxAnchorLag + KEYS_ANCHOR_MARGIN &&
  Math.abs(Date.now() - stored.claimed_time) < KEYS_RESEND_MS;

async function keysDraft(
  scope: KeysScope,
  senderKey: Uint8Array
): Promise<RecordDraft> {
  const wraps = await Promise.all(
    scope.providerKeys.map((provider) =>
      wrapSenderKey({
        wave: scope.wave,
        cls: SealedClass.PROVIDER,
        gen: scope.gen,
        from: scope.deviceKey,
        recipient: {
          id: provider.id,
          publicKey: hexToBytes(provider.publicKey),
        },
        senderKey,
      })
    )
  );
  return sealedDraft(
    scope.wave,
    KEYS_LABEL,
    encodeKeysDocument({ v: 1, dev: scope.deviceKey, box: null, wraps })
  );
}

/**
 * The private part of an action: `settings` records sealed under this
 * device's PROVIDER sender key, the device's `keys` record (the stored one
 * while it is still inside the anchor window), and the `reader` record when
 * this browser has not sent it yet.
 */
async function privatePart(
  items: readonly SealedItem[],
  { mode, owner, wallet }: SubmitContext,
  anchor: RecordAnchor,
  freshKeys: boolean
): Promise<PrivatePart | PersonalSubmitOutcome> {
  if (mode.providerKeys.length === 0) {
    return notSaved("unavailable", PERSONAL_RECORDS_MESSAGES.unavailable);
  }
  // pv streams belong to principals; a wallet bound to none has no pv.
  if (!PRINCIPAL_ID.test(owner)) {
    return notSaved("no-principal", PERSONAL_RECORDS_MESSAGES.noPrincipal);
  }
  const usable = await readUsableDeviceGrant(wallet, Date.now());
  if (!usable) {
    return { status: "no-grant" };
  }
  if (!(await isSealSupported())) {
    return notSaved("unsupported", PERSONAL_RECORDS_MESSAGES.unsupported);
  }
  const deviceKey = usable.grant.device_key.toLowerCase();
  const senderKey = await getOrCreateSenderKey(deviceKey, SealedClass.PROVIDER);
  const wave = familyWave("pv", owner);
  const settings = await Promise.all(
    settingsChunks(items).map(async (chunk) =>
      sealedDraft(
        wave,
        SETTINGS_LABEL,
        await sealItems({
          wave,
          cls: SealedClass.PROVIDER,
          gen: senderKey.gen,
          deviceKey,
          senderKey: senderKey.key,
          items: chunk,
        })
      )
    )
  );
  const scope: KeysScope = {
    deviceKey,
    gen: senderKey.gen,
    grantId: usable.grant.id,
    wave,
    providerKeys: mode.providerKeys,
  };
  const stored = freshKeys ? null : readKeysRecord(scope);
  const keys =
    stored && isResendable(stored, anchor)
      ? { event: stored }
      : { draft: await keysDraft(scope, senderKey.key) };
  const reader =
    mode.siteReader && !isReaderSent(owner, mode.siteReader)
      ? recordDraft("pv", owner, READER_TYPE, mode.siteReader, {})
      : null;
  return { settings, keys, reader, scope };
}

/**
 * Packs the action's records into submits of at most 16: the follows and
 * `settings` records in order, the keys record in each submit that carries
 * a private change, the reader record in the first.
 */
function batchesOf(
  actionDrafts: readonly RecordDraft[],
  part: PrivatePart | null
): Plan {
  const drafts = [...actionDrafts];
  const slotOf = (draft: RecordDraft, role: Slot["role"]): Slot => {
    drafts.push(draft);
    return { role, draftIndex: drafts.length - 1, event: null };
  };
  const actions: Slot[] = actionDrafts.map((_, index) => ({
    role: "action",
    draftIndex: index,
    event: null,
  }));
  let keys: Slot | null = null;
  let reader: Slot | null = null;
  if (part) {
    actions.push(...part.settings.map((draft) => slotOf(draft, "action")));
    keys =
      "event" in part.keys
        ? { role: "keys", draftIndex: null, event: part.keys.event }
        : slotOf(part.keys.draft, "keys");
    reader = part.reader ? slotOf(part.reader, "reader") : null;
  }
  const batches: Slot[][] = [];
  for (let next = 0; next < actions.length; ) {
    const extras = [
      ...(keys ? [keys] : []),
      ...(reader && batches.length === 0 ? [reader] : []),
    ];
    const taken = actions.slice(
      next,
      next + MAX_EVENTS_PER_SUBMIT - extras.length
    );
    batches.push([...taken, ...extras]);
    next += taken.length;
  }
  return {
    drafts,
    batches,
    scope: part?.scope ?? null,
    keysReused: part !== null && "event" in part.keys,
  };
}

async function signPlan(
  plan: Plan,
  anchor: number,
  notBefore: number | null
): Promise<SignedRecordEvent[] | PersonalSubmitOutcome> {
  const signed = await signRecords(plan.drafts, {
    anchor,
    ...(notBefore === null ? {} : { notBefore }),
  });
  if (signed.status === "no-grant") {
    return { status: "no-grant" };
  }
  // The items were sealed for the device key read before signing; a grant
  // that changed in between would sign them with another key.
  const deviceKey = plan.scope?.deviceKey;
  if (
    signed.status === "failed" ||
    (deviceKey !== undefined &&
      signed.events.some((event) => event.device_key !== deviceKey))
  ) {
    return notSaved("signing", PERSONAL_RECORDS_MESSAGES.signing);
  }
  return signed.events;
}

const isTaken = (result: ApiSignedRecordResult | undefined): boolean =>
  result?.outcome === "applied" ||
  result?.outcome === "stale" ||
  result?.outcome === "logged";

const toApiEvent = (event: SignedRecordEvent): ApiSignedRecordEvent => ({
  ...event,
  refs: [...event.refs],
});

/** The first record of the action itself (not keys or reader) that did not go through. */
function firstFailure(
  results: readonly ApiSignedRecordResult[],
  batch: readonly Slot[]
): ApiSignedRecordResult | null {
  for (const [index, slot] of batch.entries()) {
    if (slot.role === "action" && !isTaken(results[index])) {
      return (
        results[index] ?? { id: null, outcome: "rejected", reason: "missing" }
      );
    }
  }
  return null;
}

function failureOutcome(failure: ApiSignedRecordResult): PersonalSubmitOutcome {
  // A rejection is a verify failure (its detail is technical); a refusal
  // carries a readable detail or today's rule code.
  return notSaved(
    failure.reason ?? failure.outcome,
    failure.outcome === "refused"
      ? refusalMessage({ detail: failure.detail, code: failure.code })
      : PERSONAL_RECORDS_MESSAGES.notSaved,
    failure.code
  );
}

/** The newer change's claimed time in an OUT_OF_ORDER refusal's detail. */
function newerChangeTime(detail: string | undefined): number {
  const time = /time (\d+)/.exec(detail ?? "")?.[1];
  return time === undefined ? Date.now() : Number(time);
}

// A request that never answers would hold one person's queue in every
// tab: the anchor and each submit give up after these.
const ANCHOR_TIMEOUT_MS = 15_000;
const SUBMIT_TIMEOUT_MS = 30_000;

class RequestTimeout extends Error {
  constructor() {
    super("The request took too long");
    Object.setPrototypeOf(this, RequestTimeout.prototype);
  }
}

/** Runs `run`, aborting it and throwing RequestTimeout after `ms`. */
async function withTimeout<T>(
  ms: number,
  run: (signal: AbortSignal) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new RequestTimeout());
    }, ms);
  });
  try {
    return await Promise.race([run(controller.signal), timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

/** Sends one submit: null when every record of the action went through. */
async function sendBatch(
  events: readonly SignedRecordEvent[],
  batch: readonly Slot[],
  plan: Plan,
  context: SubmitContext
): Promise<PersonalSubmitOutcome | Retry | null> {
  let response: ApiSubmitSignedRecordsResponse;
  try {
    response = await withTimeout(SUBMIT_TIMEOUT_MS, (signal) =>
      commonApiPost<
        ApiSubmitSignedRecordsRequest,
        ApiSubmitSignedRecordsResponse
      >({
        endpoint: "signed-records",
        body: {
          events: events.map(toApiEvent),
          ...(context.options.companion ? { companion: true } : {}),
        },
        errorMode: "structured",
        signal,
      })
    );
  } catch (error) {
    // The API may still take it; a later change is signed later, so it
    // still orders after this one.
    if (error instanceof RequestTimeout) {
      return notSaved("timeout", PERSONAL_RECORDS_MESSAGES.notSaved);
    }
    throw error;
  }
  // Only primary changes settings; an API rolled back to shadow saved nothing.
  if (!context.options.companion && response.mode !== "primary") {
    return { status: "mode-changed" };
  }
  const results = Array.isArray(response.results) ? response.results : [];
  const { siteReader } = context.mode;
  batch.forEach((slot, index) => {
    if (slot.role === "reader" && siteReader && isTaken(results[index])) {
      markReaderSent(context.owner, siteReader);
    }
  });
  const keysIndex = batch.findIndex((slot) => slot.role === "keys");
  if (keysIndex >= 0 && plan.scope && !isTaken(results[keysIndex])) {
    forgetKeysRecord(plan.scope.deviceKey);
    if (plan.keysReused && results[keysIndex]?.reason === "anchor") {
      return { kind: "stale-keys" };
    }
  }
  const failure = firstFailure(results, batch);
  if (failure?.code === "OUT_OF_ORDER") {
    return {
      kind: OUT_OF_ORDER_REASON,
      after: newerChangeTime(failure.detail),
      // Shown only if signing again did not help: the API's own detail
      // asks the client, not the person, to sign again.
      outcome: notSaved(
        OUT_OF_ORDER_REASON,
        PERSONAL_RECORDS_MESSAGES.outOfOrder,
        "OUT_OF_ORDER"
      ),
    };
  }
  return failure ? failureOutcome(failure) : null;
}

async function submitAttempt(
  change: PersonalChange,
  context: SubmitContext,
  attempt: AttemptOptions
): Promise<PersonalSubmitOutcome | Retry> {
  const { owner } = context;
  let anchor: RecordAnchor;
  try {
    // Signed again after a newer change: ask for the latest height.
    anchor = await withTimeout(ANCHOR_TIMEOUT_MS, () =>
      fetchRecordAnchor(Date.now(), {
        fresh: attempt.notBefore !== null,
      })
    );
  } catch {
    return notSaved("unavailable", PERSONAL_RECORDS_MESSAGES.unavailable);
  }
  const follows = change.follows.map((follow) =>
    recordDraft(
      "ps",
      owner,
      "follow",
      follow.key,
      follow.actions === null ? null : { actions: [...follow.actions] }
    )
  );
  let part: PrivatePart | null = null;
  if (change.items.length > 0) {
    const prepared = await privatePart(
      change.items,
      context,
      anchor,
      attempt.freshKeys
    );
    if ("status" in prepared) {
      return prepared;
    }
    part = prepared;
  }
  const plan = batchesOf(follows, part);
  if (plan.batches.length === 0) {
    return { status: "saved" };
  }
  const signed = await signPlan(plan, anchor.anchor, attempt.notBefore);
  if (!Array.isArray(signed)) {
    return signed;
  }
  const eventOf = (slot: Slot): SignedRecordEvent => {
    const event =
      slot.event ??
      (slot.draftIndex === null ? undefined : signed[slot.draftIndex]);
    if (!event) {
      throw new Error("A planned record was not signed");
    }
    return event;
  };
  // A fresh keys record is kept, so later submits resend this same event.
  const keysSlot = plan.batches[0]?.find((slot) => slot.role === "keys");
  if (plan.scope && keysSlot && !plan.keysReused) {
    storeKeysRecord(plan.scope, eventOf(keysSlot));
  }
  for (const batch of plan.batches) {
    const events = batch.map(eventOf);
    const outcome = await sendBatch(events, batch, plan, context);
    if (outcome !== null) {
      return outcome;
    }
  }
  return { status: "saved" };
}

/**
 * Signs one user action as personal records and submits them with
 * POST /signed-records (N1 contract, section 3), in as many submits as it
 * needs, in order. HTTP errors (409 when the mode changed, 503 while
 * settings are paused) propagate to the caller. A change given as a
 * builder is built in the owner's queue, after the changes before it have
 * their answers, so it reads the state they left.
 */
export async function submitPersonalChange(
  change: PersonalChange | (() => Promise<PersonalChange>),
  mode: PersonalRecordsMode,
  options: SubmitOptions
): Promise<PersonalSubmitOutcome> {
  const owner = mode.owner;
  const wallet = getWalletAddress()?.toLowerCase();
  if (!owner) {
    return notSaved("unavailable", PERSONAL_RECORDS_MESSAGES.unavailable);
  }
  if (!wallet) {
    return { status: "no-grant" };
  }
  if (isProxySession(wallet)) {
    return notSaved("proxy", PERSONAL_RECORDS_MESSAGES.proxy);
  }
  // One person's changes are signed and sent one at a time, so the API
  // takes them in the order they were signed (OUT_OF_ORDER otherwise).
  return await inOwnerQueue(owner, async () => {
    const built = typeof change === "function" ? await change() : change;
    let attempt: AttemptOptions = { freshKeys: false, notBefore: null };
    // At most three attempts: each kind of retry happens once.
    for (let round = 0; round < 3; round += 1) {
      const result = await submitAttempt(
        built,
        { mode, owner, wallet, options },
        attempt
      );
      if (!("kind" in result)) {
        return result;
      }
      if (result.kind === "stale-keys" && !attempt.freshKeys) {
        attempt = { ...attempt, freshKeys: true };
      } else if (
        result.kind === OUT_OF_ORDER_REASON &&
        attempt.notBefore === null
      ) {
        attempt = { ...attempt, notBefore: result.after + 1 };
      } else {
        return result.kind === OUT_OF_ORDER_REASON
          ? result.outcome
          : notSaved("anchor", PERSONAL_RECORDS_MESSAGES.notSaved);
      }
    }
    return notSaved("signing", PERSONAL_RECORDS_MESSAGES.notSaved);
  });
}

const ownerQueues = new Map<string, Promise<unknown>>();

/**
 * Runs one owner's submits one after the other: in this tab by a promise
 * chain, and across this browser's tabs by a Web Lock where the browser has
 * them. Another device can still come first; OUT_OF_ORDER covers that.
 */
async function inOwnerQueue<T>(
  owner: string,
  task: () => Promise<T>
): Promise<T> {
  const locked = async (): Promise<T> => {
    const locks =
      typeof navigator === "undefined" ? undefined : navigator.locks;
    return locks?.request
      ? await locks.request(`6529-personal-records:${owner}`, task)
      : await task();
  };
  const previous = ownerQueues.get(owner) ?? Promise.resolve();
  const next = previous.then(locked, locked);
  const settled = next.then(
    () => undefined,
    () => undefined
  );
  ownerQueues.set(owner, settled);
  try {
    return await next;
  } finally {
    if (ownerQueues.get(owner) === settled) {
      ownerQueues.delete(owner);
    }
  }
}
