import type { ApiDeviceSignature } from "@/generated/models/ApiDeviceSignature";

/** The request body the device key signs: everything but device_signature. */
export function omitDeviceSignature(body: unknown): unknown {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    !("device_signature" in body)
  ) {
    return body;
  }
  const unsigned: Record<string, unknown> = { ...body };
  delete unsigned["device_signature"];
  return unsigned;
}

/** The unsigned body unchanged, or a copy carrying the signature envelope. */
export function withDeviceSignature<T extends object>(
  body: T,
  deviceSignature: ApiDeviceSignature | null
): T {
  return deviceSignature
    ? { ...body, device_signature: deviceSignature }
    : body;
}
