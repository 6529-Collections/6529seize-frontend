import { ApiDropType } from "@/generated/models/ApiDropType";
import {
  DropSize,
  type Drop,
  type ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { isSignedMessagesEnabled } from "@/lib/device-signing/feature";
import { shouldGroupCurrentDrop } from "../WaveDrop.helpers";

/** Header drop id → the posts its header stands for (header first). */
type DropSignatureGroups = ReadonlyMap<string, readonly ExtendedDrop[]>;

const EMPTY_GROUPS: DropSignatureGroups = new Map();

const asFullDrop = (drop: Drop | undefined): ExtendedDrop | null =>
  drop?.type === DropSize.FULL ? drop : null;

// Exactly the rule chat rows use to hide their header (see WaveDrop and
// Drop, which only pass a full previous drop to chat rows).
const groupsWithPrevious = (
  drop: ExtendedDrop,
  previous: ExtendedDrop | null
): boolean =>
  shouldGroupCurrentDrop({
    isDrop: drop.drop_type === ApiDropType.Participatory,
    drop,
    otherDrop: previous,
  });

const isSameRun = (
  current: readonly ExtendedDrop[],
  cached: readonly ExtendedDrop[] | undefined
): cached is readonly ExtendedDrop[] =>
  cached?.length === current.length &&
  cached.every((drop, index) => drop === current[index]);

// Keeps a group's array identity while its posts are unchanged, so memoized
// rows re-render only when their own group gains a post or a post changes.
const groupCache = new WeakMap<ExtendedDrop, readonly ExtendedDrop[]>();

const stableGroup = (run: ExtendedDrop[]): readonly ExtendedDrop[] => {
  const header = run[0]!;
  const cached = groupCache.get(header);
  if (isSameRun(run, cached)) {
    return cached;
  }
  groupCache.set(header, run);
  return run;
};

/**
 * The chat groups of a list in display order (oldest first): each run of
 * posts that render under one header, keyed by the header drop's id. Only
 * runs of two or more posts are listed. Empty while signed messages are off.
 */
export function getDropSignatureGroups(
  drops: readonly Drop[]
): DropSignatureGroups {
  if (!isSignedMessagesEnabled()) {
    return EMPTY_GROUPS;
  }
  const groups = new Map<string, readonly ExtendedDrop[]>();
  let run: ExtendedDrop[] | null = null;
  const closeRun = () => {
    if (run && run.length > 1) {
      groups.set(run[0]!.id, stableGroup(run));
    }
    run = null;
  };
  drops.forEach((item, index) => {
    const drop = asFullDrop(item);
    const previous = asFullDrop(drops[index - 1]);
    if (run && drop && groupsWithPrevious(drop, previous)) {
      run.push(drop);
      return;
    }
    closeRun();
    if (drop?.drop_type === ApiDropType.Chat) {
      run = [drop];
    }
  });
  closeRun();
  return groups;
}
