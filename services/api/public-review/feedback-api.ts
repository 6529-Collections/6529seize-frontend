import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { commonApiPost } from "@/services/api/common-api";
import { getAddress, isAddress } from "viem";
import { PUBLIC_REVIEW_METADATA_KEYS } from "./feedback-codec";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackSubmitter,
} from "./types";

function assertCanonicalChatPayload({
  destination,
  payload,
}: {
  readonly destination: PublicReviewDiscussionDestination;
  readonly payload: ApiCreateDropRequest;
}): void {
  if (payload.wave_id !== destination.waveId) {
    throw new Error("Feedback payload destination does not match this review.");
  }
  if (
    payload.drop_type !== ApiDropType.Chat ||
    payload.reply_to !== undefined
  ) {
    throw new Error("Public review feedback must be a top-level Chat drop.");
  }
  if (payload.signature !== null) {
    throw new Error(
      "Public Chat feedback must not carry a participation signature."
    );
  }
  if (
    typeof payload.is_safe_signature !== "boolean" ||
    !payload.signer_address ||
    !isAddress(payload.signer_address) ||
    getAddress(payload.signer_address) !== payload.signer_address
  ) {
    throw new Error(
      "Public review feedback requires the active checksummed signer context."
    );
  }
  if (
    payload.metadata.length !== PUBLIC_REVIEW_METADATA_KEYS.length ||
    !payload.metadata.every(
      (item, index) => item.data_key === PUBLIC_REVIEW_METADATA_KEYS[index]
    )
  ) {
    throw new Error("Public review feedback metadata is not canonical.");
  }
}

export const submitPublicReviewFeedback: PublicReviewFeedbackSubmitter =
  async ({ destination, payload, signal }) => {
    assertCanonicalChatPayload({ destination, payload });

    const drop = await commonApiPost<ApiCreateDropRequest, ApiDrop>({
      endpoint: "drops",
      body: payload,
      signal,
      errorMode: "structured",
    });

    if (
      !drop.id ||
      !Number.isSafeInteger(drop.serial_no) ||
      drop.serial_no < 1 ||
      drop.wave.id !== destination.waveId ||
      drop.drop_type !== ApiDropType.Chat
    ) {
      throw new Error(
        "The feedback API returned a drop outside the configured destination."
      );
    }

    return drop;
  };
