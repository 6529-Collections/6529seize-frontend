import { openDeviceSetup } from "@/components/device-signing/deviceSetup";
import {
  getStructuredApiErrorCode,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import type { PersonalChange } from "./personal-record-changes";
import {
  PERSONAL_RECORDS_MESSAGES,
  PersonalRecordsError,
} from "./personal-records-errors";
import { isPersonalRecordsEnabled } from "./personal-records-flag";
import type { PersonalRecordsMode } from "./personal-records-mode";

/** One personal-settings write, in both forms. */
interface PersonalSettingWrite<T, S = undefined> {
  /** Today's request, unchanged. */
  readonly legacy: () => Promise<T>;
  /**
   * State the records need that today's request changes (the follow a
   * block removes, an alias's name before a rename). Read before today's
   * request in shadow mode, and before the records in primary mode; never
   * in legacy mode.
   */
  readonly snapshot?: (() => Promise<S>) | undefined;
  /**
   * The same change as records. Built in shadow mode after today's request
   * succeeded, and in primary mode instead of it.
   */
  readonly change: (snapshot: S) => Promise<PersonalChange> | PersonalChange;
  /** What the caller gets when only records were written (primary mode). */
  readonly recordsResult: () => T;
  /**
   * Signed-out people, devices without a grant and wallets without a
   * principal use today's request instead of being asked to turn on
   * signing (EULA consent).
   */
  readonly legacyWithoutGrant?: boolean | undefined;
}

/**
 * The API answered a records submit in another mode: 409
 * PERSONAL_RECORDS_OFF (legacy), 409 PERSONAL_RECORDS_SHADOW (shadow takes
 * only companions of today's request), or a response whose mode isn't
 * primary.
 */
const isModeConflict = (error: unknown): boolean =>
  (error instanceof PersonalRecordsError && error.reason === "mode-changed") ||
  (getStructuredApiErrorStatus(error) === 409 &&
    ["PERSONAL_RECORDS_OFF", "PERSONAL_RECORDS_SHADOW"].includes(
      getStructuredApiErrorCode(error) ?? ""
    ));

const paused = () =>
  new PersonalRecordsError(PERSONAL_RECORDS_MESSAGES.paused, {
    reason: "paused",
  });

// The mode, owner lookups and signing load only with the flag on, so pages
// carry none of it while it is off.
async function readMode(fresh: boolean): Promise<PersonalRecordsMode | null> {
  try {
    const { getPersonalRecordsMode } = await import("./personal-records-mode");
    return await getPersonalRecordsMode({ fresh });
  } catch (error) {
    // No mode (an API without signed records, a network error): today's write.
    console.warn(
      "Personal settings: the records mode could not be read",
      error
    );
    return null;
  }
}

async function submit(
  change: () => Promise<PersonalChange>,
  mode: PersonalRecordsMode,
  companion: boolean
) {
  const { submitPersonalChange } = await import("./personal-records-submit");
  return await submitPersonalChange(change, mode, { companion });
}

const takeSnapshot = async <S>(
  write: PersonalSettingWrite<unknown, S>
): Promise<S> => (write.snapshot ? await write.snapshot() : (undefined as S));

async function writeRecords<T, S>(
  write: PersonalSettingWrite<T, S>,
  mode: PersonalRecordsMode
): Promise<T> {
  if (write.legacyWithoutGrant && !mode.owner) {
    return await write.legacy();
  }
  // Built in the owner's queue, so it reads what the changes before it left
  // (two DM changes in a row: the second sees the first).
  const outcome = await submit(
    async () => await write.change(await takeSnapshot(write)),
    mode,
    false
  );
  if (outcome.status === "saved") {
    return write.recordsResult();
  }
  if (outcome.status === "mode-changed") {
    throw new PersonalRecordsError(PERSONAL_RECORDS_MESSAGES.notSaved, {
      reason: "mode-changed",
    });
  }
  const cannotSign =
    outcome.status === "no-grant" ||
    ["no-principal", "proxy"].includes(outcome.reason);
  if (cannotSign && write.legacyWithoutGrant) {
    return await write.legacy();
  }
  if (outcome.status === "no-grant") {
    // The existing "turn on signing on this device" flow.
    openDeviceSetup("posts");
    throw new PersonalRecordsError(PERSONAL_RECORDS_MESSAGES.noGrant, {
      reason: "no-grant",
    });
  }
  throw new PersonalRecordsError(outcome.message, {
    reason: outcome.reason,
    ...(outcome.code === undefined ? {} : { code: outcome.code }),
  });
}

/**
 * A companion follows today's request, which already succeeded: a create
 * (an alias's `new`) is not new any more, and the API's rolled-back check
 * would refuse it as taken. The item updates what today's request made.
 */
function asCompanion(change: PersonalChange): PersonalChange {
  return {
    ...change,
    items: change.items.map((item) => {
      if (item.b === null || !("new" in item.b)) {
        return item;
      }
      const body = { ...item.b };
      delete body["new"];
      return { ...item, b: body };
    }),
  };
}

/** Shadow mode: the records after today's write, best effort, never shown. */
async function shadowRecords<T, S>(
  write: PersonalSettingWrite<T, S>,
  mode: PersonalRecordsMode,
  snapshot: S
): Promise<void> {
  try {
    const outcome = await submit(
      async () => asCompanion(await write.change(snapshot)),
      mode,
      true
    );
    if (outcome.status === "not-saved") {
      console.warn(
        "Personal settings: shadow records were not saved",
        outcome.reason,
        outcome.code
      );
    }
  } catch (error) {
    console.warn("Personal settings: shadow records failed", error);
  }
}

/** Shadow mode's snapshot; a failure only skips the records. */
async function shadowSnapshot<S>(
  write: PersonalSettingWrite<unknown, S>
): Promise<{ readonly value: S } | null> {
  try {
    return { value: await takeSnapshot(write) };
  } catch (error) {
    console.warn("Personal settings: shadow records skipped", error);
    return null;
  }
}

/** Primary mode: the records only. */
async function runPrimary<T, S>(
  write: PersonalSettingWrite<T, S>,
  mode: PersonalRecordsMode,
  mayRetry: boolean
): Promise<T> {
  try {
    return await writeRecords(write, mode);
  } catch (error) {
    // The API left primary: read the mode again and follow it once.
    if (mayRetry && isModeConflict(error)) {
      const next = await readMode(true);
      if (next && next.mode !== "primary") {
        return await run(write, next, false);
      }
    }
    throw error;
  }
}

/** Legacy and shadow modes: today's request first. */
async function runLegacy<T, S>(
  write: PersonalSettingWrite<T, S>,
  mode: PersonalRecordsMode | null,
  mayRetry: boolean
): Promise<T> {
  const shadow = mode?.mode === "shadow" ? mode : null;
  const snapshot = shadow ? await shadowSnapshot(write) : null;
  let result: T;
  try {
    result = await write.legacy();
  } catch (error) {
    // Most settings routes report errors as plain text, so any failure reads
    // the mode again; a switch to primary (409 PERSONAL_RECORDS_REQUIRED)
    // writes the records once.
    const next = mayRetry ? await readMode(true) : null;
    if (next?.mode === "primary") {
      return await run(write, next, false);
    }
    throw error;
  }
  if (shadow && snapshot) {
    void shadowRecords(write, shadow, snapshot.value);
  }
  return result;
}

async function run<T, S>(
  write: PersonalSettingWrite<T, S>,
  mode: PersonalRecordsMode | null,
  mayRetry: boolean
): Promise<T> {
  // While settings move (the switch), every write answers 503: send nothing.
  if (mode?.frozen) {
    throw paused();
  }
  return mode?.mode === "primary"
    ? await runPrimary(write, mode, mayRetry)
    : await runLegacy(write, mode, mayRetry);
}

/**
 * Writes one personal-settings change as the API's mode says (N1 contract,
 * section 5): legacy (or the build flag off) sends today's request only;
 * shadow sends today's request, then the records marked as its companion,
 * best effort; primary sends the records only and throws a
 * PersonalRecordsError with a readable message when they do not save.
 * While the API pauses settings, nothing is sent.
 */
export async function savePersonalSetting<T, S = undefined>(
  write: PersonalSettingWrite<T, S>
): Promise<T> {
  if (!isPersonalRecordsEnabled()) {
    return await write.legacy();
  }
  let mode = await readMode(false);
  if (mode?.frozen) {
    // A cached pause may be over: ask again before refusing.
    mode = await readMode(true);
  }
  return await run(write, mode, true);
}
