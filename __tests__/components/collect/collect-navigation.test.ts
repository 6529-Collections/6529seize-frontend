import {
  collectIntentForCollection,
  collectLocation,
} from "@/components/collect/collect-navigation";

it.each(["memes", "gradients", "pebbles"] as const)(
  "preserves %s through browsing and TDH",
  (family) => {
    expect(collectIntentForCollection("tdh", family)).toBe("tdh");
    expect(
      collectLocation(`collection=${family}&intent=tdh&view=projection`)
    ).toMatchObject({ collection: family, intent: "tdh" });
  }
);
it("canonicalizes contradictory legacy links without discarding the explicitly selected set", () => {
  expect(
    collectLocation("collection=gradients&intent=full_set&definition=memes")
  ).toEqual({
    collection: "memes",
    intent: "full_set",
    definitionId: "memes",
    query: "collection=memes&intent=full_set&definition=memes",
  });
});
it("keeps collection capabilities honest and gives unique collections compatible goals", () => {
  expect(collectLocation("collection=memelab&intent=lowest")).toMatchObject({
    collection: "memes",
    query: "collection=memes&intent=lowest",
  });
  expect(
    collectLocation("collection=gradients&intent=season&definition=1")
  ).toMatchObject({
    collection: "gradients",
    intent: "full_set",
    definitionId: "gradients",
    query: "collection=gradients&intent=full_set",
  });
  expect(collectLocation("intent=pebbles_set")).toMatchObject({
    collection: "pebbles",
    intent: "pebbles_set",
  });
  expect(collectLocation("collection=pebbles&intent=full_set")).toMatchObject({
    collection: "pebbles",
    intent: "pebbles_set",
  });
});
