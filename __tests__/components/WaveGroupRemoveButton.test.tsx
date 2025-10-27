import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveGroupRemoveButton from "@/components/waves/specs/groups/group/edit/WaveGroupRemoveButton";
import { WaveGroupType } from "@/components/waves/specs/groups/group/WaveGroup.types";
import React from "react";

jest.mock("@/components/waves/specs/groups/group/edit/WaveGroupRemove", () =>
  function MockRemove(props: any) {
    return (
      <div data-testid="modal" onClick={() => props.onWaveUpdate({})}>
        remove
      </div>
    );
  }
);

describe("WaveGroupRemoveButton", () => {
  it("opens modal and triggers edit", async () => {
    const user = userEvent.setup();
    const onWaveUpdate = jest.fn().mockResolvedValue(undefined);
    render(
      <WaveGroupRemoveButton wave={{} as any} type={WaveGroupType.VIEW} onWaveUpdate={onWaveUpdate} />
    );
    await user.click(screen.getByTitle("Remove"));
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    await user.click(screen.getByTestId("modal"));
    expect(onWaveUpdate).toHaveBeenCalled();
  });
});
