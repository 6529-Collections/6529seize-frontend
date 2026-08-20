import { getAiRecommendationText } from "@/app/content-moderation/page.client";
import type { ApiContentModerationQueueItem } from "@/generated/models/ApiContentModerationQueueItem";

const createQueueItem = (
  aiRecommendation: unknown,
  aiConfidence: number | null = null
): ApiContentModerationQueueItem =>
  ({
    ai_recommendation: aiRecommendation,
    ai_confidence: aiConfidence,
  }) as ApiContentModerationQueueItem;

describe("content moderation AI recommendation formatting", () => {
  it.each([undefined, null, "", "   "])(
    "uses the fallback for a blank recommendation (%p)",
    (aiRecommendation) => {
      expect(
        getAiRecommendationText(
          createQueueItem(aiRecommendation, 0.82),
          "en-US"
        )
      ).toBe("No AI recommendation is available.");
    }
  );

  it("formats a present recommendation", () => {
    expect(
      getAiRecommendationText(
        createQueueItem("NEEDS_HUMAN_REVIEW"),
        "en-US"
      )
    ).toBe("AI recommendation: Needs Human Review");
  });
});
