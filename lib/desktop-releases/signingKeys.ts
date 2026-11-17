import type { FeedSigningKey } from "@/lib/validator-page/feedSigningKeys";

/**
 * The domain string 6529 Desktop's list is signed under. It differs from
 * the validator's, so a list of one product never verifies as the other's.
 */
export const DESKTOP_RELEASE_LIST_DOMAIN = "6529 Desktop releases v1";

/**
 * The keys the /desktop pages trust for 6529 Desktop's release list, as the
 * app does (`updates::TRUSTED_KEYS` in the 6529 Desktop source): the 6529
 * Desktop release key in AWS KMS, alias `alias/6529-desktop-releases`. A
 * successor key is added here beside it before the old one is retired.
 */
export const DESKTOP_RELEASE_LIST_KEYS: readonly FeedSigningKey[] = [
  {
    address: "0xf91Ed41FE48448395Ac484f678a2E52fA922d055",
    publicKey:
      "04ce7d543fd0fc2711b58d2a43984977e08493da4cb3ab6cd73290ae6d3917bebb02182f0c54c07a985ff0e7463fb92e9fd339963e95c94d5ac1f278dfc85a2992",
  },
];
