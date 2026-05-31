import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaveDropCreate } from "@/components/waves/leaderboard/create/WaveDropCreate";
import type { ApiWave } from "@/generated/models/ApiWave";

let creatorProps: any;

jest.mock("@/components/waves/PrivilegedDropCreator", () => ({
  __esModule: true,
  default: (p: any) => {
    creatorProps = p;
    return <div data-testid="creator" onClick={() => p.onAllDropsAdded()} />;
  },
  DropMode: { PARTICIPATION: "PARTICIPATION" },
}));

const wave = { id: "1" } as ApiWave;

describe("WaveDropCreate", () => {
  beforeEach(() => {
    creatorProps = undefined;
  });

  it("renders creator and handles success", async () => {
    const onSuccess = jest.fn();
    const onCancel = jest.fn();
    const user = userEvent.setup();
    render(
      <WaveDropCreate wave={wave} onSuccess={onSuccess} onCancel={onCancel} />
    );

    expect(screen.getByText("Create a New Drop")).toBeInTheDocument();
    expect(screen.getByLabelText("Close create drop")).toBeInTheDocument();
    await user.click(screen.getByTestId("creator"));
    expect(onSuccess).toHaveBeenCalled();
    expect(creatorProps.curationComposerVariant).toBe("default");
    expect(creatorProps.onExitFixedDropMode).toBe(onCancel);
    expect(creatorProps.identityPickerPlacement).toBe("modal");
    expect(creatorProps.fixedDropMode).toBe("PARTICIPATION");
  });

  it("renders lightweight curation leaderboard variant", () => {
    render(
      <WaveDropCreate wave={wave} onSuccess={jest.fn()} isCurationLeaderboard />
    );

    expect(screen.queryByText("Create a New Drop")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Close create drop")
    ).not.toBeInTheDocument();
    expect(creatorProps.curationComposerVariant).toBe("leaderboard");
  });

  it("renders modal content without an inner header card", () => {
    render(<WaveDropCreate wave={wave} onSuccess={jest.fn()} isModalContent />);

    expect(screen.queryByText("Create a New Drop")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Close create drop")
    ).not.toBeInTheDocument();
    expect(creatorProps.fixedDropMode).toBe("PARTICIPATION");
    expect(creatorProps.curationComposerVariant).toBe("default");
    expect(creatorProps.onExitFixedDropMode).toBeUndefined();
    expect(creatorProps.identityPickerPlacement).toBe("modal");
  });

  it("passes explicit identity picker placement to the creator", () => {
    render(
      <WaveDropCreate
        wave={wave}
        onSuccess={jest.fn()}
        identityPickerPlacement="inline"
      />
    );

    expect(creatorProps.identityPickerPlacement).toBe("inline");
  });

  it("passes explicit fixed drop mode to the creator", () => {
    render(
      <WaveDropCreate
        wave={wave}
        onSuccess={jest.fn()}
        fixedDropMode={"CHAT" as any}
      />
    );

    expect(creatorProps.fixedDropMode).toBe("CHAT");
  });
});
