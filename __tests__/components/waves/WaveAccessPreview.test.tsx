import { render, screen } from "@testing-library/react";
import WaveAccessPreview from "@/components/waves/WaveAccessPreview";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

describe("WaveAccessPreview", () => {
  it("updates the consequence when chat and submission groups diverge", () => {
    const { rerender } = render(
      <WaveAccessPreview
        waveType={ApiWaveType.Approve}
        groups={{ canChat: null, canDrop: "club" }}
        chatEnabled
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "People with wave access can chat, but only the submission group can submit. Voting access is separate."
    );
    rerender(
      <WaveAccessPreview
        waveType={ApiWaveType.Approve}
        groups={{ canChat: "club", canDrop: "club" }}
        chatEnabled
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Chat and submissions use the same selected group."
    );
    rerender(
      <WaveAccessPreview
        waveType={ApiWaveType.Approve}
        groups={{ canChat: "other-club", canDrop: "club" }}
        chatEnabled
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Permission for one does not grant the other."
    );
  });

  it("distinguishes disabled chat from restricted chat", () => {
    render(
      <WaveAccessPreview
        waveType={ApiWaveType.Rank}
        groups={{ canChat: null, canDrop: "club" }}
        chatEnabled={false}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Chat is disabled. Submission and voting access stay as selected."
    );
  });

  it("describes only chat access for a Chat wave", () => {
    render(
      <WaveAccessPreview
        waveType={ApiWaveType.Chat}
        groups={{ canChat: "club", canDrop: null }}
        chatEnabled
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Chat is limited to its selected group."
    );
    expect(screen.getByRole("status")).not.toHaveTextContent(
      /submission|voting/i
    );
  });
});
