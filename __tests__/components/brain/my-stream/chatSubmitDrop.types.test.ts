import { getChatSubmitDropLabels } from "@/components/brain/my-stream/chatSubmitDrop.types";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";

describe("getChatSubmitDropLabels", () => {
  it("keeps the default drop labels", () => {
    expect(getChatSubmitDropLabels(WaveSubmissionExperience.DEFAULT)).toEqual({
      label: "Submit drop",
      compactLabel: "Drop",
    });
  });

  it("keeps the quorum proposal default label", () => {
    expect(
      getChatSubmitDropLabels(WaveSubmissionExperience.QUORUM_PROPOSAL)
    ).toEqual({
      label: "Create Proposal",
      compactLabel: "Create Proposal",
    });
  });

  it("uses a custom submission label for both display sizes", () => {
    expect(
      getChatSubmitDropLabels(WaveSubmissionExperience.DEFAULT, "Apply")
    ).toEqual({
      label: "Apply",
      compactLabel: "Apply",
    });
  });
});
