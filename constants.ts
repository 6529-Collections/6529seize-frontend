import { mainnet } from "wagmi/chains";

const PROJECT_NAME = "6529SEIZE";
export const CW_PROJECT_ID = "0ba285cc179045bec37f7c9b9e7f9fbf";

/**
 * Validates the BASE_ENDPOINT environment variable
 * Ensures proper URL format, HTTPS in production, and domain allowlist
 */
function validateBaseEndpoint(): string {
  const baseEndpoint = process.env.BASE_ENDPOINT;
  
  if (!baseEndpoint) {
    throw new Error(
      'BASE_ENDPOINT environment variable is required. Please set it in your environment or .env.local file.'
    );
  }
  
  // Validate it's a legitimate URL
  let validatedUrl: URL;
  try {
    validatedUrl = new URL(baseEndpoint);
  } catch (error) {
    throw new Error(
      `BASE_ENDPOINT contains invalid URL format: ${baseEndpoint}. Expected format: https://domain.com`
    );
  }
  
  // Ensure it uses HTTPS in production (allow http for localhost)
  const isLocalhost = baseEndpoint.includes('localhost') || baseEndpoint.includes('127.0.0.1');
  if (validatedUrl.protocol !== 'https:' && !isLocalhost) {
    throw new Error(
      `BASE_ENDPOINT must use HTTPS protocol in production. Got: ${validatedUrl.protocol}//. Only localhost can use HTTP.`
    );
  }
  
  // Validate against expected domains - prevent domain spoofing
  const allowedDomains = [
    '6529.io',
    'www.6529.io', 
    'staging.6529.io',
    'localhost',
    '127.0.0.1'
  ];
  
  const hostname = validatedUrl.hostname;
  const isAllowedDomain = allowedDomains.some(domain => 
    hostname === domain || hostname.endsWith(`.${domain}`)
  );
  
  if (!isAllowedDomain) {
    throw new Error(
      `BASE_ENDPOINT domain not in allowlist. Got: ${hostname}. Allowed domains: ${allowedDomains.join(', ')}`
    );
  }
  
  return baseEndpoint;
}

// Validated base endpoint - crashes immediately if invalid
export const VALIDATED_BASE_ENDPOINT = validateBaseEndpoint();

export const MEMES_CONTRACT = "0x33FD426905F149f8376e227d0C9D3340AaD17aF1";
export const NEXTGEN_CONTRACT = "0x45882f9bc325e14fbb298a1df930c43a874b83ae";
const MANIFOLD_PROXY = "0x26bbea7803dcac346d5f5f135b57cf2c752a02be";
export const MEMES_MANIFOLD_PROXY_CONTRACT =
  "0x26bbea7803dcac346d5f5f135b57cf2c752a02be";
export const GRADIENT_CONTRACT = "0x0C58Ef43fF3032005e472cB5709f8908aCb00205";
export const MEMELAB_CONTRACT = "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb";
export const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
export const NULL_DEAD_ADDRESS = "0x000000000000000000000000000000000000dead";
export const MANIFOLD = "0x3A3548e060Be10c2614d0a4Cb0c03CC9093fD799";
const PUNK_6529 = "0xfd22004806a6846ea67ad883356be810f0428793";
const SIX529 = "0xB7d6ed1d7038BaB3634eE005FA37b925B11E9b13";
const SIX529_ER = "0xE359aB04cEC41AC8C62bc5016C10C749c7De5480";
const SIX529_COLLECTIONS = "0x4B76837F8D8Ad0A28590d06E53dCD44b6B7D4554";
const PIRAVLOS_TEST = "0x2ec4a2BCd4f33c7c9AaFaB7Cfa865ec15508bf62";
export const NULL_MERKLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const DELEGATION_CONTRACT: {
  chain_id: number;
  contract: `0x${string}`;
} = {
  // chain_id: sepolia.id,
  // contract: "0x8f86c644f845a077999939c69bc787662377d915",
  // chain_id: goerli.id,
  // contract: "0xAD024eeD08190285Edb7100c9Caabe79d48e448B",
  chain_id: mainnet.id,
  contract: "0x2202CB9c00487e7e8EF21e6d8E914B32e709f43d",
};

export const DELEGATION_ALL_ADDRESS =
  "0x8888888888888888888888888888888888888888";

export const API_AUTH_COOKIE = "x-6529-auth";

export const CONSENT_ESSENTIAL_COOKIE = "essential-cookies-consent";
export const CONSENT_PERFORMANCE_COOKIE = "performance-cookies-consent";
export const CONSENT_EULA_COOKIE = "eula-consent";
export const PROFILE_PROXY_ACCEPTANCE_COOKIE = "profile-proxy-acceptance";
export const NEVER_DATE = 64060588800;

export const OPENSEA_STORE_FRONT_CONTRACT =
  "0x495f947276749ce646f68ac8c248420045cb7b5e";

const OPENSEA_STORE_FRONT_CONTRACT_DEPLOYER = `0x5b3256965e7c3cf26e11fcaf296dfc8807c01073`;

export const NEXTGEN_MEDIA_BASE_URL = "https://media.generator.6529.io/mainnet";

export const ROYALTIES_PERCENTAGE = 0.069;

export const ETHEREUM_ICON_TEXT = "Ξ";

const MEMES_MINTING_HREF = "https://thememes.6529.io";

export const NEXTGEN_GENERATOR_BASE_URL = "https://generator.6529.io";

export const SUBSCRIPTIONS_CHAIN = mainnet;

export const MANIFOLD_NETWORK = mainnet;

export const SUBSCRIPTIONS_ADDRESS =
  "0xCaAc2b43b1b40eDBFAdDB5aebde9A90a27E1A3be";
export const SUBSCRIPTIONS_ADDRESS_ENS = "seize.6529.eth";

export const SUBSCRIPTIONS_ADMIN_WALLETS = [
  "0x0187C9a182736ba18b44eE8134eE438374cf87DC",
  "0xFe49A85E98941F1A115aCD4bEB98521023a25802",
];

export const MEMES_MINT_PRICE = 0.06529;

export const MOBILE_APP_IOS =
  "https://apps.apple.com/us/app/6529-mobile/id6654923687";
export const MOBILE_APP_ANDROID =
  "https://play.google.com/store/apps/details?id=com.core6529.app";
