import { render, screen } from "@testing-library/react";
import CreateWaveGroupSearchResults from "@/components/waves/create-wave/groups/CreateWaveGroupSearchResults";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";

const group = (id: string, name: string) =>
  ({ id, name, created_by: { handle: "maker" } }) as unknown as ApiGroupFull;

const LINE =
  "This group's name shows here once 6529.io has read it from the 6529 Network.";

describe("CreateWaveGroupSearchResults for groups made on the 6529 Network", () => {
  it("says which names are 6529.io's placeholders, and only those", () => {
    const chainId = `0x${"ab12".repeat(16)}`;
    render(
      <CreateWaveGroupSearchResults
        isOpen
        disabled={false}
        listboxId="groups"
        isFetching={false}
        suggestions={[
          group(chainId, "Group 0xab12ab12"),
          group("1d8e6c4f-55a3-4f6e-9b7b-2c1d0e9f8a7b", "Group 0x1d8e6c4f"),
        ]}
        selectedGroup={null}
        activeIndex={-1}
        searchCriteria=""
        showNoResults={false}
        helperText=""
        onActiveIndexChange={jest.fn()}
        onOptionSelect={jest.fn()}
      />
    );

    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent(LINE);
    expect(options[1]).not.toHaveTextContent(LINE);
  });
});
