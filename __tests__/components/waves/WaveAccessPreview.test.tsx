import { render, screen } from "@testing-library/react";
import WaveAccessPreview from "@/components/waves/WaveAccessPreview";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

describe("WaveAccessPreview", () => {
  it.each([
    {
      waveType: ApiWaveType.Chat,
      groups: { canChat: null, canDrop: null },
      expected: "People with wave access can chat.",
    },
    {
      waveType: ApiWaveType.Rank,
      groups: { canChat: null, canDrop: null },
      expected:
        "People with wave access can chat and submit. Voting access is separate.",
    },
    {
      waveType: ApiWaveType.Rank,
      groups: { canChat: "chat-club", canDrop: null },
      expected:
        "Chat is limited to its selected group. Submission group access is public. Voting access is separate.",
    },
  ])(
    "explains the public access configuration: $expected",
    ({ waveType, groups, expected }) => {
      render(
        <WaveAccessPreview waveType={waveType} groups={groups} chatEnabled />
      );
      expect(screen.getByRole("status")).toHaveTextContent(expected);
    }
  );

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

  it.each([
    {
      canDrop: null,
      expected:
        "Chat is disabled. Submission group access is public. Voting access is separate.",
    },
    {
      canDrop: "club",
      expected:
        "Chat is disabled. Only the submission group can submit. Voting access is separate.",
    },
  ])(
    "explains submission access with chat disabled: $expected",
    ({ canDrop, expected }) => {
      render(
        <WaveAccessPreview
          waveType={ApiWaveType.Rank}
          groups={{ canChat: null, canDrop }}
          chatEnabled={false}
        />
      );
      expect(screen.getByRole("status")).toHaveTextContent(expected);
    }
  );

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
