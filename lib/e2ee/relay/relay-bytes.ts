/** 0x-hex of bytes, lowercase. */
export function bytesToHexString(bytes: Uint8Array): `0x${string}` {
  let out = "0x";
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, "0");
  }
  return out as `0x${string}`;
}

/** The binary CRP frame: u32be header length, header JSON, then bytes. */
export function decodeBinaryFrame(data: Uint8Array): {
  readonly header: Record<string, unknown>;
  readonly bytes: Uint8Array;
} {
  if (data.length < 4) throw new Error("Short binary frame");
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const length = view.getUint32(0, false);
  if (4 + length > data.length) throw new Error("Binary header overruns");
  const header = JSON.parse(
    new TextDecoder().decode(data.subarray(4, 4 + length))
  ) as Record<string, unknown>;
  return { header, bytes: data.slice(4 + length) };
}
