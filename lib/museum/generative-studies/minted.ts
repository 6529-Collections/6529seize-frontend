import "next/dist/compiled/server-only";
import century from "./minted-indexes/century.json";
import preProcess from "./minted-indexes/pre-process.json";
import phototaxis from "./minted-indexes/phototaxis.json";
import emptyRooms from "./minted-indexes/923-empty-rooms.json";
import cosmos from "./minted-indexes/ex-nihilo-cosmos.json";
import type { MuseumMintedProjectIndex } from "./types";

const MINTED_INDEXES = [
  century,
  preProcess,
  phototaxis,
  emptyRooms,
  cosmos,
] as readonly MuseumMintedProjectIndex[];

export function getMintedProjectIndex(
  projectSlug: string
): MuseumMintedProjectIndex | null {
  return (
    MINTED_INDEXES.find((index) => index.projectSlug === projectSlug) ?? null
  );
}
