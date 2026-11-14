/** Wallet forwarding: validation of a request from the app page. */

import { getAddress, isAddress } from "viem";
import { checkChainId } from "./chainId";
import {
  fail,
  INVALID_PARAMS,
  isFieldType,
  isHexBytes,
  isRecord,
  MAX_MESSAGE_BYTES,
  MAX_TYPED_DATA_CHARS,
  MAX_TYPED_DATA_FIELDS,
  MAX_TYPED_DATA_TYPES,
  type Parsed,
  sameAddress,
  TOO_LARGE,
  type TypedDataField,
  TYPE_NAME,
  WALLET_FORWARDING_METHODS,
  type WalletForwardingMethod,
  type WalletRequest,
  type WalletRequestBase,
  type WalletRequestInput,
  type WalletRequestProblem,
  WRONG_ADDRESS,
  WRONG_CHAIN,
} from "./shared";
import { fitsWalletRequestFragment } from "./size";

function parsePersonalSign(
  params: readonly unknown[],
  base: WalletRequestBase
): Parsed<WalletRequest, WalletRequestProblem> {
  const [message, signer] = params;
  if (
    params.length !== 2 ||
    typeof message !== "string" ||
    !isHexBytes(message)
  ) {
    return fail(INVALID_PARAMS);
  }
  if (message === "0x") return fail(INVALID_PARAMS);
  if ((message.length - 2) / 2 > MAX_MESSAGE_BYTES) return fail(TOO_LARGE);
  if (!sameAddress(signer, base.address)) return fail(WRONG_ADDRESS);
  return {
    ok: true,
    value: { ...base, method: "personal_sign", message },
  };
}

function readTypes(
  value: unknown
): Record<string, readonly TypedDataField[]> | null {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  if (entries.length === 0 || entries.length > MAX_TYPED_DATA_TYPES) {
    return null;
  }
  // No prototype: a type named `__proto__` or `constructor` is just a key.
  const types: Record<string, readonly TypedDataField[]> = Object.create(
    null
  ) as Record<string, readonly TypedDataField[]>;
  for (const [name, fields] of entries) {
    if (!TYPE_NAME.test(name) || !Array.isArray(fields)) return null;
    if (fields.length > MAX_TYPED_DATA_FIELDS) return null;
    const parsedFields: TypedDataField[] = [];
    for (const field of fields) {
      if (
        !isRecord(field) ||
        typeof field["name"] !== "string" ||
        typeof field["type"] !== "string" ||
        !TYPE_NAME.test(field["name"]) ||
        !isFieldType(field["type"])
      ) {
        return null;
      }
      parsedFields.push({ name: field["name"], type: field["type"] });
    }
    types[name] = parsedFields;
  }
  return types;
}

function parseTypedData(
  params: readonly unknown[],
  base: WalletRequestBase
): Parsed<WalletRequest, WalletRequestProblem> {
  const [signer, payload] = params;
  if (params.length !== 2 || typeof payload !== "string") {
    return fail(INVALID_PARAMS);
  }
  if (payload.length > MAX_TYPED_DATA_CHARS) return fail(TOO_LARGE);
  if (!sameAddress(signer, base.address)) return fail(WRONG_ADDRESS);
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return fail(INVALID_PARAMS);
  }
  if (!isRecord(parsed)) return fail(INVALID_PARAMS);
  const { domain, message, primaryType } = parsed;
  const types = readTypes(parsed["types"]);
  if (
    !types ||
    !isRecord(domain) ||
    !isRecord(message) ||
    typeof primaryType !== "string" ||
    primaryType === "EIP712Domain" ||
    !Object.hasOwn(types, primaryType)
  ) {
    return fail(INVALID_PARAMS);
  }
  const chainProblem = checkChainId(domain["chainId"], base.chainId);
  if (chainProblem) return fail(chainProblem);
  return {
    ok: true,
    value: {
      ...base,
      method: "eth_signTypedData_v4",
      typedData: { domain, types, primaryType, message },
    },
  };
}

/**
 * Validate a wallet request from the app page (EIP-1193 `method` and
 * `params`), bound to the signed-in `address` and the app's `chainId`.
 * `allowedChainIds` are the chains the app is configured for. A request
 * whose browser fragment would exceed the page's cap is `too-large`.
 */
export function parseWalletRequest(
  input: WalletRequestInput,
  allowedChainIds: readonly number[]
): Parsed<WalletRequest, WalletRequestProblem> {
  if (!isRecord(input)) return fail(INVALID_PARAMS);
  const { method, params, address, chainId } = input;
  if (
    typeof method !== "string" ||
    !(WALLET_FORWARDING_METHODS as readonly string[]).includes(method)
  ) {
    return fail("unsupported-method");
  }
  if (typeof address !== "string" || !isAddress(address, { strict: false })) {
    return fail(WRONG_ADDRESS);
  }
  if (
    typeof chainId !== "number" ||
    !Number.isSafeInteger(chainId) ||
    !allowedChainIds.includes(chainId)
  ) {
    return fail(WRONG_CHAIN);
  }
  if (!Array.isArray(params)) return fail(INVALID_PARAMS);
  const base: WalletRequestBase = { address: getAddress(address), chainId };
  const parsed =
    (method as WalletForwardingMethod) === "personal_sign"
      ? parsePersonalSign(params, base)
      : parseTypedData(params, base);
  // A request the browser page could never open is refused up front.
  if (parsed.ok && !fitsWalletRequestFragment(input)) return fail(TOO_LARGE);
  return parsed;
}
