import {
  COLLECT_PLANNER_FAMILIES,
  isCollectEdition,
} from "@/components/collect/collect-families";
import {
  collectAssetHref,
  collectAssetIdentity,
} from "@/components/collect/collect.adapters";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { MEMELAB_CONTRACT } from "@/constants/constants";

it("binds the known Meme Lab contract to its exact route and edition behavior", () => {
  const asset: ApiCollectAsset = {
    asset_key: `1:${MEMELAB_CONTRACT.toLowerCase()}:70`,
    chain_id: 1,
    contract: MEMELAB_CONTRACT,
    token_id: "70",
    family: ApiCollectFamily.Memelab,
    name: "Lab artwork",
    image_url: null,
    artist_ids: [],
    season: null,
    traits: [],
    hodl_rate: null,
    tdh_eligible: false,
  };
  expect(collectAssetIdentity(asset.asset_key)).toMatchObject({
    family: ApiCollectFamily.Memelab,
    tokenId: "70",
  });
  expect(collectAssetHref(asset)).toBe("/meme-lab/70");
  expect(isCollectEdition(asset.family)).toBe(true);
  expect(collectAssetIdentity(`10:${MEMELAB_CONTRACT}:70`)).toBeNull();
  expect(
    collectAssetIdentity("1:0x1111111111111111111111111111111111111111:70")
  ).toBeNull();
});

it("keeps planning and TDH limited to the original three families", () => {
  expect([...COLLECT_PLANNER_FAMILIES]).toEqual([
    "memes",
    "gradients",
    "pebbles",
  ]);
  expect(isCollectEdition(ApiCollectFamily.Gradients)).toBe(false);
  expect(isCollectEdition(ApiCollectFamily.Pebbles)).toBe(false);
  expect(isCollectEdition(undefined)).toBe(false);
});
