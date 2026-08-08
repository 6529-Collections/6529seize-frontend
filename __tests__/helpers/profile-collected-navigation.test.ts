import { CollectedCollectionType } from "@/entities/IProfile";
import {
  buildCollectedCardHref,
  buildProfileCollectedReturnPath,
  getCollectedCardAnchorId,
  getProfileCollectedReturnContext,
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

  it("adds the originating card anchor to NextGen token links", () => {
    const returnTo = "/Shelby/collected?collection=nextgen&page=3";
    const params = new URLSearchParams({
      [PROFILE_COLLECTED_RETURN_PARAM]: `${returnTo}#collected-card-nextgen-10000000643`,
    });

    expect(
      buildCollectedCardHref({
        tokenPath: "/nextgen/token/10000000643",
        collection: CollectedCollectionType.NEXTGEN,
        tokenId: 10000000643,
        returnTo,
      })
    ).toBe(`/nextgen/token/10000000643?${params.toString()}`);
  });

  it("leaves non-NextGen links unchanged", () => {
    expect(
      buildCollectedCardHref({
        tokenPath: "/the-memes/1",
        collection: CollectedCollectionType.MEMES,
        tokenId: 1,
        returnTo: "/Shelby/collected",
      })
    ).toBe("/the-memes/1");
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

  it("removes transient return context from shared NextGen token routes", () => {
    const params = new URLSearchParams({
      locale: "de-DE",
      [PROFILE_COLLECTED_RETURN_PARAM]:
        "/Shelby/collected#collected-card-nextgen-10000000643",
    });

    expect(
      stripCollectedReturnFromTokenRoute(
        `/nextgen/token/10000000643/rarity?${params.toString()}`
      )
    ).toBe("/nextgen/token/10000000643/rarity?locale=de-DE");
  });

  it("does not change return parameters on unrelated routes", () => {
    expect(
      stripCollectedReturnFromTokenRoute(
        "/network/wave-score?returnTo=%2Fwaves%2Fexample"
      )
    ).toBe("/network/wave-score?returnTo=%2Fwaves%2Fexample");
  });
});
