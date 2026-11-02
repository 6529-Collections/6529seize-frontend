import { randomUUID } from "node:crypto";

import type { BrowserContext } from "@playwright/test";
import { getBytes, isHexString, toUtf8Bytes, Wallet } from "ethers";

/**
 * A scripted EIP-1193 wallet for Playwright. The page sees an ordinary
 * injected wallet, announced through EIP-6963 and as `window.ethereum`, so
 * the app's real connect modal and sign-in flow drive it. Every request is
 * answered in the test process: the private key never enters the page, the
 * logs or any artifact.
 *
 * Use only with throwaway keys (`ScriptedWalletKey.random()`), and only
 * against environments where the caller is allowed to create accounts.
 */

export const SCRIPTED_WALLET_NAME = "6529 QA Wallet";
export const SCRIPTED_WALLET_RDNS = "io.6529.qa-wallet";
const SCRIPTED_WALLET_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23222'/%3E%3Ctext x='16' y='21' font-size='12' text-anchor='middle' fill='%23fff'%3EQA%3C/text%3E%3C/svg%3E";
const MAINNET_CHAIN_ID_HEX = "0x1";
const REQUEST_BINDING = "__6529ScriptedWalletRequest";

/** EIP-1193 error codes the app and its wallet libraries understand. */
export const PROVIDER_ERROR = {
  unauthorized: 4100,
  unsupportedMethod: 4200,
  unrecognizedChain: 4902,
  invalidParams: -32602,
} as const;

export type ScriptedWalletReply =
  | { readonly ok: true; readonly result: unknown }
  | {
      readonly ok: false;
      readonly error: { readonly code: number; readonly message: string };
    };

export interface ScriptedWalletRequest {
  readonly method: string;
  readonly params?: unknown;
}

/** What was signed. Nothing here is secret: signatures go to the server. */
export type ScriptedSignature =
  | { readonly method: "personal_sign" }
  | {
      readonly method: "eth_signTypedData_v4";
      readonly primaryType: string;
      readonly domainName: string | null;
      readonly message: Readonly<Record<string, unknown>>;
      readonly signature: string;
    };

/**
 * Holds a throwaway signing key. The key stays in a private field; the
 * object serializes and inspects as its address only.
 */
export class ScriptedWalletKey {
  readonly address: string;
  readonly #wallet: Wallet;

  private constructor(wallet: Wallet) {
    this.#wallet = wallet;
    this.address = wallet.address;
  }

  /** A fresh random key for this run only. Never persist or print it. */
  static random(): ScriptedWalletKey {
    const created = Wallet.createRandom();
    return new ScriptedWalletKey(new Wallet(created.privateKey));
  }

  signMessage(message: Uint8Array): Promise<string> {
    return this.#wallet.signMessage(message);
  }

  signTypedData(
    domain: Record<string, unknown>,
    types: Record<string, { name: string; type: string }[]>,
    message: Record<string, unknown>
  ): Promise<string> {
    return this.#wallet.signTypedData(domain, types, message);
  }

  toJSON(): { address: string } {
    return { address: this.address };
  }

  toString(): string {
    return `ScriptedWalletKey(${this.address})`;
  }

  [Symbol.for("nodejs.util.inspect.custom")](): string {
    return this.toString();
  }
}

/** Per-browser state: each context is a separate wallet installation. */
export interface ScriptedWalletState {
  authorized: boolean;
  readonly signatures: ScriptedSignature[];
}

const failure = (code: number, message: string): ScriptedWalletReply => ({
  ok: false,
  error: { code, message },
});

const success = (result: unknown): ScriptedWalletReply => ({
  ok: true,
  result,
});

const sameAddress = (value: unknown, address: string): boolean =>
  typeof value === "string" && value.toLowerCase() === address.toLowerCase();

const isAddressLike = (value: unknown): value is string =>
  typeof value === "string" && /^0x[0-9a-fA-F]{40}$/u.test(value);

function paramsArray(params: unknown): readonly unknown[] {
  return Array.isArray(params) ? params : [];
}

function permissionsFor(address: string) {
  return [
    {
      parentCapability: "eth_accounts",
      caveats: [{ type: "restrictReturnedAccounts", value: [address] }],
    },
  ];
}

/** personal_sign params are [message, address]; some callers swap them. */
function personalSignInput(
  params: readonly unknown[],
  address: string
): { readonly message: Uint8Array } | ScriptedWalletReply {
  let [message, from] = params;
  if (isAddressLike(message) && !isAddressLike(from)) {
    [message, from] = [from, message];
  }
  if (!sameAddress(from, address)) {
    return failure(
      PROVIDER_ERROR.unauthorized,
      "personal_sign requested for an account this wallet does not hold."
    );
  }
  if (typeof message !== "string") {
    return failure(PROVIDER_ERROR.invalidParams, "personal_sign needs data.");
  }
  return {
    message: isHexString(message) ? getBytes(message) : toUtf8Bytes(message),
  };
}

interface TypedDataInput {
  readonly domain: Record<string, unknown>;
  readonly types: Record<string, { name: string; type: string }[]>;
  readonly primaryType: string;
  readonly message: Record<string, unknown>;
}

function parseTypedData(value: unknown): TypedDataInput | null {
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }
  const candidate = parsed as Partial<TypedDataInput>;
  if (
    typeof candidate.primaryType !== "string" ||
    typeof candidate.types !== "object" ||
    candidate.types === null ||
    typeof candidate.message !== "object" ||
    candidate.message === null
  ) {
    return null;
  }
  return {
    domain: candidate.domain ?? {},
    types: candidate.types,
    primaryType: candidate.primaryType,
    message: candidate.message,
  };
}

async function signTypedDataRequest(
  key: ScriptedWalletKey,
  state: ScriptedWalletState,
  params: readonly unknown[]
): Promise<ScriptedWalletReply> {
  const [from, payload] = params;
  if (!sameAddress(from, key.address)) {
    return failure(
      PROVIDER_ERROR.unauthorized,
      "eth_signTypedData_v4 requested for an account this wallet does not hold."
    );
  }
  const typedData = parseTypedData(payload);
  if (!typedData) {
    return failure(
      PROVIDER_ERROR.invalidParams,
      "eth_signTypedData_v4 needs EIP-712 typed data."
    );
  }
  // ethers derives the domain type itself and rejects an explicit one.
  const types = Object.fromEntries(
    Object.entries(typedData.types).filter(([name]) => name !== "EIP712Domain")
  );
  const signature = await key.signTypedData(
    typedData.domain,
    types,
    typedData.message
  );
  const domainName = typedData.domain["name"];
  state.signatures.push({
    method: "eth_signTypedData_v4",
    primaryType: typedData.primaryType,
    domainName: typeof domainName === "string" ? domainName : null,
    message: typedData.message,
    signature,
  });
  return success(signature);
}

/**
 * Answers one EIP-1193 request. Accounts are exposed only after the page
 * asked to connect (like a real wallet's per-site permission), and
 * signatures only for the held account on Ethereum mainnet.
 */
export async function handleScriptedWalletRequest(
  key: ScriptedWalletKey,
  state: ScriptedWalletState,
  request: ScriptedWalletRequest
): Promise<ScriptedWalletReply> {
  const params = paramsArray(request.params);
  switch (request.method) {
    case "eth_chainId":
      return success(MAINNET_CHAIN_ID_HEX);
    case "net_version":
      return success("1");
    case "eth_accounts":
      return success(state.authorized ? [key.address] : []);
    case "eth_requestAccounts":
      state.authorized = true;
      return success([key.address]);
    case "wallet_requestPermissions":
      state.authorized = true;
      return success(permissionsFor(key.address));
    case "wallet_getPermissions":
      return success(state.authorized ? permissionsFor(key.address) : []);
    case "wallet_revokePermissions":
      state.authorized = false;
      return success(null);
    case "wallet_switchEthereumChain": {
      const chainId = (params[0] as { chainId?: unknown } | undefined)?.chainId;
      return typeof chainId === "string" &&
        chainId.toLowerCase() === MAINNET_CHAIN_ID_HEX
        ? success(null)
        : failure(
            PROVIDER_ERROR.unrecognizedChain,
            "The scripted wallet only supports Ethereum mainnet."
          );
    }
    case "personal_sign": {
      if (!state.authorized) {
        return failure(PROVIDER_ERROR.unauthorized, "Not connected.");
      }
      const input = personalSignInput(params, key.address);
      if ("ok" in input) {
        return input;
      }
      const signature = await key.signMessage(input.message);
      state.signatures.push({ method: "personal_sign" });
      return success(signature);
    }
    case "eth_signTypedData_v4":
      if (!state.authorized) {
        return failure(PROVIDER_ERROR.unauthorized, "Not connected.");
      }
      return await signTypedDataRequest(key, state, params);
    default:
      return failure(
        PROVIDER_ERROR.unsupportedMethod,
        `The scripted wallet does not support ${request.method}.`
      );
  }
}

/** A wallet installed into one browser context. */
export interface InstalledScriptedWallet {
  readonly address: string;
  readonly signatures: readonly ScriptedSignature[];
  isAuthorized(): boolean;
  count(method: ScriptedSignature["method"]): number;
  typedDataSignatures(
    primaryType: string
  ): Extract<ScriptedSignature, { method: "eth_signTypedData_v4" }>[];
}

/** Runs in the page before any app script. Kept free of closures. */
function installPageProvider(input: {
  readonly binding: string;
  readonly info: {
    readonly uuid: string;
    readonly name: string;
    readonly icon: string;
    readonly rdns: string;
  };
}) {
  type Listener = (...args: unknown[]) => void;
  const listeners = new Map<string, Set<Listener>>();
  const providerError = (code: number, message: string) =>
    Object.assign(new Error(message), { code });
  const provider = {
    isMetaMask: false,
    isScripted6529Wallet: true,
    async request(args: { method: string; params?: unknown }) {
      const call: unknown = Reflect.get(globalThis, input.binding);
      if (typeof call !== "function") {
        throw providerError(4900, "The scripted wallet is not available.");
      }
      const reply = (await Reflect.apply(call, globalThis, [
        { method: args.method, params: args.params ?? [] },
      ])) as ScriptedWalletReply;
      if (reply.ok) {
        return reply.result;
      }
      throw providerError(reply.error.code, reply.error.message);
    },
    on(event: string, listener: Listener) {
      const set = listeners.get(event) ?? new Set<Listener>();
      set.add(listener);
      listeners.set(event, set);
      return provider;
    },
    removeListener(event: string, listener: Listener) {
      listeners.get(event)?.delete(listener);
      return provider;
    },
    off(event: string, listener: Listener) {
      return provider.removeListener(event, listener);
    },
  };
  const detail = Object.freeze({ info: Object.freeze(input.info), provider });
  const announce = () => {
    globalThis.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", { detail })
    );
  };
  globalThis.addEventListener("eip6963:requestProvider", announce);
  Object.defineProperty(globalThis, "ethereum", {
    configurable: true,
    writable: true,
    value: provider,
  });
  announce();
}

/**
 * Installs `key` as an injected wallet in `context`. Two contexts may share a
 * key (two devices of one person); each keeps its own site permission.
 */
export async function installScriptedWallet(
  context: BrowserContext,
  key: ScriptedWalletKey
): Promise<InstalledScriptedWallet> {
  const state: ScriptedWalletState = { authorized: false, signatures: [] };
  await context.exposeFunction(
    REQUEST_BINDING,
    (request: ScriptedWalletRequest) =>
      handleScriptedWalletRequest(key, state, request)
  );
  await context.addInitScript(installPageProvider, {
    binding: REQUEST_BINDING,
    info: {
      uuid: randomUUID(),
      name: SCRIPTED_WALLET_NAME,
      icon: SCRIPTED_WALLET_ICON,
      rdns: SCRIPTED_WALLET_RDNS,
    },
  });
  return {
    address: key.address,
    signatures: state.signatures,
    isAuthorized: () => state.authorized,
    count: (method) =>
      state.signatures.filter((signature) => signature.method === method)
        .length,
    typedDataSignatures: (primaryType) =>
      state.signatures.filter(
        (
          signature
        ): signature is Extract<
          ScriptedSignature,
          { method: "eth_signTypedData_v4" }
        > =>
          signature.method === "eth_signTypedData_v4" &&
          signature.primaryType === primaryType
      ),
  };
}
