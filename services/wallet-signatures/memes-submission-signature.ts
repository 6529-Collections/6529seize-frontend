import { publicEnv } from "@/config/env";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropHasher } from "@/utils/drop-hasher";
import { sha256 } from "js-sha256";
import { getAddress } from "viem";
import { v4 as uuidv4 } from "uuid";
import { getWalletSignatureAudience } from "./structured-wallet-signatures";

// These English labels and statements are part of the versioned signing
// protocol. Keep them identical to the backend verifier and its test vector.
const MEMES_SUBMISSION_DOMAIN = {
  name: "The Memes",
  version: "1",
  chainId: 1,
} as const;

const MEMES_SUBMISSION_TYPES = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
  ],
  MemeCardSubmission: [
    { name: "Action", type: "string" },
    { name: "Artwork", type: "string" },
    { name: "Destination", type: "string" },
    { name: "Agreement", type: "string" },
    { name: "Notice", type: "string" },
    { name: "ExpiresAt", type: "string" },
    { name: "Verification", type: "SubmissionVerification" },
  ],
  SubmissionVerification: [
    { name: "Wallet", type: "address" },
    { name: "WaveId", type: "string" },
    { name: "Audience", type: "string" },
    { name: "Origin", type: "string" },
    { name: "IssuedAt", type: "string" },
    { name: "Nonce", type: "string" },
    { name: "PayloadHash", type: "bytes32" },
    { name: "TermsHash", type: "bytes32" },
  ],
} as const;

export interface MemesSigningWave {
  readonly id: string;
  readonly name: string;
}

function getSubmissionOrigin(): string {
  const origin =
    typeof window === "undefined" ? undefined : window.location.origin;
  if (origin && /^https?:\/\//i.test(origin)) {
    return new URL(origin).origin;
  }
  // Some native WebViews expose an opaque or custom-scheme origin.
  return new URL(publicEnv.BASE_ENDPOINT).origin;
}

export function buildMemesSubmissionTypedData({
  drop,
  termsOfService,
  wave,
  issuedAt = new Date(),
  nonce = uuidv4(),
  audience = getWalletSignatureAudience(),
  origin = getSubmissionOrigin(),
}: {
  readonly drop: ApiCreateDropRequest;
  readonly termsOfService: string | null;
  readonly wave: MemesSigningWave;
  readonly issuedAt?: Date;
  readonly nonce?: string;
  readonly audience?: string;
  readonly origin?: string;
}) {
  if (
    drop.drop_type !== ApiDropType.Participatory ||
    !drop.signer_address ||
    !drop.title?.trim() ||
    drop.title !== drop.title.trim() ||
    wave.id !== drop.wave_id ||
    !wave.name.trim() ||
    !termsOfService?.trim()
  ) {
    throw new Error(
      "The Memes submission details are incomplete. Please review your artwork and terms."
    );
  }

  return {
    domain: MEMES_SUBMISSION_DOMAIN,
    types: MEMES_SUBMISSION_TYPES,
    primaryType: "MemeCardSubmission" as const,
    message: {
      Action: "Submit a Meme Card to The Memes",
      Artwork: drop.title,
      Destination: wave.name,
      Agreement: "I agree to The Memes submission terms I reviewed.",
      Notice:
        "Submission only. No mint, token approval or asset transfer. No gas fee.",
      ExpiresAt: new Date(issuedAt.getTime() + 5 * 60 * 1000).toISOString(),
      Verification: {
        Wallet: getAddress(drop.signer_address),
        WaveId: wave.id,
        Audience: audience,
        Origin: origin,
        IssuedAt: issuedAt.toISOString(),
        Nonce: nonce,
        PayloadHash:
          `0x${new DropHasher().hash({ drop, termsOfService })}` as const,
        TermsHash: `0x${sha256(termsOfService)}` as const,
      },
    },
  };
}

export type MemesSubmissionTypedData = ReturnType<
  typeof buildMemesSubmissionTypedData
>;
