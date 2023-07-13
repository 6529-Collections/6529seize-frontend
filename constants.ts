import { mainnet } from "wagmi/chains";

export const PROJECT_NAME = "6529SEIZE";
export const CW_PROJECT_ID = "0ba285cc179045bec37f7c9b9e7f9fbf";

export const MEMES_CONTRACT = "0x33FD426905F149f8376e227d0C9D3340AaD17aF1";
export const GRADIENT_CONTRACT = "0x0C58Ef43fF3032005e472cB5709f8908aCb00205";
export const MEMELAB_CONTRACT = "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb";
export const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
export const PUNK_6529 = "0xfd22004806a6846ea67ad883356be810f0428793";
export const SIX529 = "0xB7d6ed1d7038BaB3634eE005FA37b925B11E9b13";
export const SIX529_ER = "0xE359aB04cEC41AC8C62bc5016C10C749c7De5480";
export const SIX529_COLLECTIONS = "0x4B76837F8D8Ad0A28590d06E53dCD44b6B7D4554";
export const SIX529_MUSEUM = "0xc6400A5584db71e41B0E5dFbdC769b54B91256CD";
export const PIRAVLOS_TEST = "0x2ec4a2BCd4f33c7c9AaFaB7Cfa865ec15508bf62";
export const MANIFOLD = "0x3A3548e060Be10c2614d0a4Cb0c03CC9093fD799";

export const CRYPTO_PUNKS_CONTRACT =
  "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
export const BAYC_CONTRACT = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";

export const DELEGATION_CONTRACT: {
  chain_id: number;
  contract: `0x${string}`;
} = {
  chain_id: mainnet.id,
  contract: "0x2202CB9c00487e7e8EF21e6d8E914B32e709f43d",
};
// export const DELEGATION_CONTRACT: {
//   chain_id: number;
//   contract: `0x${string}`;
// } = {
//   chain_id: 11155111,
//   contract: "0x8f86c644f845a077999939c69bc787662377d915",
// };
export const DELEGATION_ALL_ADDRESS =
  "0x8888888888888888888888888888888888888888";

export const API_AUTH_COOKIE = "x-6529-auth";
export const VIEW_MODE_COOKIE = "view-mode";
export const NEVER_DATE = 64060588800;
