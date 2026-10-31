import { type MockStreamEngine, revert } from "@/lib/stream/mock/engine";
import { mockHash } from "@/lib/stream/mock/ids";
import {
  openPreparedAuction,
  prepareEditionAuction,
} from "@/lib/stream/mock/sales/editionAuction";
import { startEnglishAuction } from "@/lib/stream/mock/sales/englishAuction";
import { addLinkedEdition, addStreamWork } from "@/lib/stream/mock/tokens";
import type {
  Address,
  CurationItem,
  Hex32,
  StatementRole,
  StatementView,
  WorkKey,
} from "@/lib/stream/types";

/** `StatementLog.append`: a statement about a token, with its summary for display. */
export function appendStatement(
  engine: MockStreamEngine,
  statement: {
    readonly role: StatementRole;
    readonly kind: string;
    readonly subject: { readonly token: Address; readonly id: number };
    readonly summary: string;
    readonly supersedes?: Hex32 | null;
  }
): StatementView {
  const index = engine.state.statements.length;
  const uriId = mockHash(`statement-uri:${index}`).slice(2, 45);
  const view: StatementView = {
    entryHash: mockHash(`statement:${index}:${statement.kind}`),
    role: statement.role,
    kind: statement.kind,
    subject: statement.subject,
    contentHash: mockHash(`statement-content:${index}`),
    uri: `ar://${uriId}`,
    summary: statement.summary,
    supersedes: statement.supersedes ?? null,
    at: engine.now(),
  };
  engine.state.statements.push(view);
  return view;
}

function findItem(
  engine: MockStreamEngine,
  itemHash: Hex32
): { readonly item: CurationItem; readonly packageIndex: number } {
  for (const [packageIndex, entry] of engine.state.packages.entries()) {
    const item = entry.items.find(
      (candidate) => candidate.itemHash === itemHash
    );
    if (item) {
      if (entry.status !== "REGISTERED") {
        revert("PackageRevoked", { packageRoot: entry.packageRoot });
      }
      return { item, packageIndex };
    }
  }
  return revert("UnknownItem", { itemHash });
}

/**
 * `EnglishAuction.start` for an approved item: mints it into custody and starts
 * the 24-hour auction. For an edition master the keeper batches the edition
 * auction's `open` in the same step (PLAN section 1.2).
 */
export function startFromItem(
  engine: MockStreamEngine,
  itemHash: Hex32,
  at: number = engine.now()
): WorkKey {
  const { item, packageIndex } = findItem(engine, itemHash);
  if (item.consumed) {
    revert("ItemConsumed", { itemHash });
  }
  if (!item.startable) {
    revert(item.moveSigned ? "PartiesNotAccepted" : "MoveNotSigned", {
      itemHash,
    });
  }
  const pending = engine.state.pendingItems.get(itemHash);
  if (!pending) {
    revert("UnknownItem", { itemHash });
  }
  const work = addStreamWork(engine, pending.spec, at);
  startEnglishAuction(engine, work.key, at);
  if (work.kind === "EDITION_MASTER") {
    const edition = addLinkedEdition(engine, work, {
      token: engine.contracts.editions,
      variant: "stream-edition",
      created: false,
    });
    const auction = prepareEditionAuction(engine, edition.key, {
      master: work.key,
      cap: pending.cap,
    });
    openPreparedAuction(engine, auction, at);
  }
  const entry = engine.state.packages[packageIndex];
  if (entry) {
    engine.state.packages[packageIndex] = {
      ...entry,
      items: entry.items.map((candidate) =>
        candidate.itemHash === itemHash
          ? { ...candidate, consumed: true, startable: false }
          : candidate
      ),
    };
  }
  return work.key;
}

/** `Editions.createEdition`: anyone, once the master's auction has settled. */
export function createEditionFor(
  engine: MockStreamEngine,
  master: WorkKey
): WorkKey {
  const token = engine.token(master);
  if (token.kind !== "EDITION_MASTER" || token.linked.edition === null) {
    revert("NotEditionMaster", { workId: token.tokenId });
  }
  if (!token.primarySaleSettled) {
    revert("EditionUnavailable", { editionId: token.tokenId });
  }
  const edition = engine.token(token.linked.edition);
  if (edition.created) {
    revert("EditionExists", { editionId: token.tokenId });
  }
  edition.created = true;
  engine.record(edition.key, {
    kind: "edition-created",
    actor: null,
    source: "IEditions.EditionCreated",
  });
  return edition.key;
}
