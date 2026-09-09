import { CollectedCollectionType } from "@/entities/IProfile";
import {
  buildCollectedCardHref,
  buildProfileCollectedReturnPath,
  getCollectedCardAnchorId,
  getProfileCollectedReturnContext,
  getProfileCollectedTokenReturnContext,
  PROFILE_COLLECTED_RETURN_PARAM,
  stripCollectedReturnFromTokenRoute,
} from "@/helpers/profile-collected-navigation";

describe("profile collected navigation", () => {
  it("builds a collected return path with only supported state", () => {
    expect(
      buildProfileCollectedReturnPath({
        pathname: "/Shelby/collected",
        searchParams:
          "collection=nextgen&page=3&sort-direction=asc&locale=de-DE&secret=value",
      })
    ).toBe(
      "/Shelby/collected?collection=nextgen&locale=de-DE&page=3&sort-direction=asc"
    );
  });

  it.each([
    [CollectedCollectionType.MEMES, "/the-memes/1", 1, "memes"],
    [CollectedCollectionType.GRADIENTS, "/6529-gradient/2", 2, "gradients"],
    [CollectedCollectionType.NEXTGEN, "/nextgen/token/3", 3, "nextgen"],
    [CollectedCollectionType.MEMELAB, "/meme-lab/4", 4, "memelab"],
  ])(
    "adds the originating card anchor to %s token links",
    (collection, tokenPath, tokenId, anchorCollection) => {
      const returnTo = "/Shelby/collected?page=3";
      const params = new URLSearchParams({
        [PROFILE_COLLECTED_RETURN_PARAM]: `${returnTo}#collected-card-${anchorCollection}-${tokenId}`,
      });

      expect(
        buildCollectedCardHref({
          tokenPath,
          collection,
          tokenId,
          returnTo,
        })
      ).toBe(`${tokenPath}?${params.toString()}`);
    }
  );

  it("leaves informational Network paths unchanged", () => {
    const returnTo = "/Shelby/collected?collection=network&page=3";

    expect(
      buildCollectedCardHref({
        tokenPath: "/network/1",
        collection: CollectedCollectionType.NETWORK,
        tokenId: 1,
        returnTo,
      })
    ).toBe("/network/1");
  });

  it("parses a valid profile return target and strips unknown state", () => {
    expect(
      getProfileCollectedReturnContext(
        "/Shelby/collected?collection=nextgen&unknown=value#collected-card-nextgen-10000000643"
      )
    ).toEqual({
      href: "/Shelby/collected?collection=nextgen#collected-card-nextgen-10000000643",
      profile: "Shelby",
    });
  });

  it("exposes profile return context only on collected token routes", () => {
    const returnTo =
      "/Shelby/collected?collection=memelab#collected-card-memelab-4";

    expect(
      getProfileCollectedTokenReturnContext({
        pathname: "/meme-lab/4",
        returnTo,
      })
    ).toEqual({ href: returnTo, profile: "Shelby" });
    expect(
      getProfileCollectedTokenReturnContext({
        pathname: "/about",
        returnTo,
      })
    ).toBeNull();
  });

  it.each([
    "https://example.com/Shelby/collected",
    "//example.com/Shelby/collected",
    "/nextgen/collection/pebbles/art",
    "/Shelby/../Other/collected",
    "/%2F/collected",
    "/Shelby/collected%00",
  ])("rejects an invalid return target: %s", (value) => {
    expect(getProfileCollectedReturnContext(value)).toBeNull();
  });

  it("builds stable collected card anchors", () => {
    expect(
      getCollectedCardAnchorId({
        collection: CollectedCollectionType.NEXTGEN,
        tokenId: 10000000643,
      })
    ).toBe("collected-card-nextgen-10000000643");
  });

  it("accepts anchors only for known collected collection types", () => {
    expect(
      getProfileCollectedReturnContext(
        "/Shelby/collected#collected-card-nextgen-10000000643"
      )
    ).toEqual({
      href: "/Shelby/collected#collected-card-nextgen-10000000643",
      profile: "Shelby",
    });
    expect(
      getProfileCollectedReturnContext(
        "/Shelby/collected#collected-card-unknown-10000000643"
      )
    ).toEqual({
      href: "/Shelby/collected",
      profile: "Shelby",
    });
  });

  it.each([
    "/the-memes/1",
    "/6529-gradient/2",
    "/nextgen/token/3/rarity",
    "/meme-lab/4",
  ])("removes transient return context from shared token route %s", (path) => {
    const params = new URLSearchParams({
      locale: "de-DE",
      [PROFILE_COLLECTED_RETURN_PARAM]:
        "/Shelby/collected#collected-card-nextgen-3",
    });

    expect(
      stripCollectedReturnFromTokenRoute(`${path}?${params.toString()}`)
    ).toBe(`${path}?locale=de-DE`);
  });

  it("does not change return parameters on unrelated routes", () => {
    expect(
      stripCollectedReturnFromTokenRoute(
        "/network/wave-score?returnTo=%2Fwaves%2Fexample"
      )
    ).toBe("/network/wave-score?returnTo=%2Fwaves%2Fexample");
  });
});
