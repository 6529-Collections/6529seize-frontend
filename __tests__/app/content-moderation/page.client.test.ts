import { getAiRecommendationText } from "@/services/content-moderation/content-moderation-formatters";
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
      getAiRecommendationText(createQueueItem("NEEDS_HUMAN_REVIEW"), "en-US")
    ).toBe("AI recommendation: Needs Human Review");
  });

  it.each([
    [0.82, "AI recommendation: Needs Human Review (82%)"],
    [-0.2, "AI recommendation: Needs Human Review (0%)"],
    [1.4, "AI recommendation: Needs Human Review (100%)"],
    [Number.NaN, "AI recommendation: Needs Human Review"],
  ])("formats and clamps confidence %p", (confidence, expected) => {
    expect(
      getAiRecommendationText(
        createQueueItem("NEEDS_HUMAN_REVIEW", confidence),
        "en-US"
      )
    ).toBe(expected);
  });
});
