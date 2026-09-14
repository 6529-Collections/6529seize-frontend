import type { CollectCollection, CollectIntent } from "./collect.types";
import { COLLECT_PLANNER_FAMILIES } from "./collect-families";

export function collectIntentForCollection(
  intent: CollectIntent,
  collection: CollectCollection
): CollectIntent {
  if (intent === "lowest" || intent === "tdh") return intent;
  if (collection === "pebbles") return "pebbles_set";
  if (collection === "gradients" || intent === "pebbles_set") return "full_set";
  return intent;
}

/** Resolve legacy goal links once, so the selector, query and analysis agree. */
export function collectLocation(query: string) {
  const params = new URLSearchParams(query);
  const requestedIntent = params.get("intent");
  const supportedIntents: readonly CollectIntent[] = [
    "lowest",
    "season",
    "full_set",
    "artist",
    "pebbles_set",
    "tdh",
  ];
  let intent =
    supportedIntents.find((value) => value === requestedIntent) ?? "full_set";
  let collection: CollectCollection =
    COLLECT_PLANNER_FAMILIES.find(
      (value) => value.toString() === params.get("collection")
    ) ?? "memes";
  if (!params.has("collection") && intent === "pebbles_set")
    collection = "pebbles";
  const explicit = params.get("definition");
  if (
    intent === "full_set" &&
    (explicit === "memes" || explicit === "gradients")
  ) {
    collection = explicit;
  }
  const compatibleIntent = collectIntentForCollection(intent, collection);
  let definitionId = "";
  if (compatibleIntent === "full_set") {
    definitionId = collection;
  } else if (compatibleIntent === intent) {
    definitionId = explicit ?? "";
  }
  if (params.has("collection") && params.get("collection") !== collection)
    params.set("collection", collection);
  if (
    compatibleIntent !== intent ||
    (params.has("intent") && requestedIntent !== intent)
  )
    params.set("intent", compatibleIntent);
  if (compatibleIntent !== intent) params.delete("definition");
  intent = compatibleIntent;
  return { collection, intent, definitionId, query: params.toString() };
}
