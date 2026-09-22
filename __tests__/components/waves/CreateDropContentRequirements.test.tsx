import { render, screen } from "@testing-library/react";
import CreateDropContentRequirements from "@/components/waves/CreateDropContentRequirements";
import { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";

describe("CreateDropContentRequirements", () => {
  it("summarizes every missing requirement as plain status text", () => {
    render(
      <CreateDropContentRequirements
        missingMedia={[
          ApiWaveParticipationRequirement.Image,
          ApiWaveParticipationRequirement.Video,
        ]}
        missingMetadata={["Medium"]}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Required: add an image, add a video, and complete metadata (Medium)."
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("disappears when every requirement is complete", () => {
    const { rerender } = render(
      <CreateDropContentRequirements
        missingMedia={[ApiWaveParticipationRequirement.Audio]}
        missingMetadata={["Year"]}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Required: add audio and complete metadata (Year)."
    );

    rerender(
      <CreateDropContentRequirements missingMedia={[]} missingMetadata={[]} />
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
