import { ApiModerationAction } from "@/generated/models/ApiModerationAction";
import {
  ApiModerationCheckOutcomeEnum,
  ApiModerationCheckPolicyFamilyEnum,
  ApiModerationCheckReviewStatusEnum,
  ApiModerationCheckSubjectTypeEnum,
} from "@/generated/models/ApiModerationCheck";
import {
  ApiModerationCheckDetailActionEffectEnum,
  type ApiModerationCheckDetail,
} from "@/generated/models/ApiModerationCheckDetail";

export function checkFixture(
  overrides: Partial<ApiModerationCheckDetail> = {}
): ApiModerationCheckDetail {
  return {
    check: {
      id: "check-1",
      subject_type: ApiModerationCheckSubjectTypeEnum.ProfileBio,
      subject_id: "profile-1",
      author_profile_id: "author-1",
      actor_profile_id: "author-1",
      operation: "UPDATE",
      policy_family: ApiModerationCheckPolicyFamilyEnum.PublicFields,
      policy_version: "public-fields-v1",
      scope: {},
      content_fingerprint: "fingerprint",
      outcome: ApiModerationCheckOutcomeEnum.Reject,
      trigger: "PUBLIC_FIELD",
      review_status: ApiModerationCheckReviewStatusEnum.NeedsReview,
      override: null,
      permit_expires_at: null,
      permit_consumed_at: null,
      published_subject_id: null,
      suppressed: false,
      version: 4,
      created_at: 1,
      updated_at: 1,
      evidence_expires_at: null,
      preview: "Synthetic test content",
    },
    evidence: { text: "Synthetic test content" },
    current_revision_matches: true,
    evidence_expired: false,
    evaluations: [],
    audit: [],
    current_state: {
      profile_status: null,
      drop_status: null,
      published: false,
      suppressed: false,
      revision: null,
    },
    allowed_actions: [
      ApiModerationAction.Allow,
      ApiModerationAction.Reevaluate,
    ],
    action_effect:
      ApiModerationCheckDetailActionEffectEnum.ExactResubmissionPermit,
    ...overrides,
  };
}
