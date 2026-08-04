import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveDropsMetadata from "@/components/waves/create-wave/drops/metadata/CreateWaveDropsMetadata";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR } from "@/helpers/waves/identity-submission-metadata";

jest.mock(
  "@/components/waves/create-wave/drops/metadata/CreateWaveDropsMetadataRow",
  () =>
    ({ item, index, errorMessage, onItemRemove }: any) => (
      <div data-testid={`row-${index}`}>
        {item.key}-{errorMessage ?? "ok"}
        <button onClick={() => onItemRemove(index)}>rem</button>
      </div>
    )
);

jest.mock(
  "@/components/waves/create-wave/drops/metadata/CreateWaveDropsMetadataAddRowButton",
  () =>
    ({ onAddNewRow }: any) => (
      <button data-testid="add" onClick={onAddNewRow}>
        add
      </button>
    )
);

describe("CreateWaveDropsMetadata", () => {
  it("adds rows and marks non unique", async () => {
    const user = userEvent.setup();
    const change = jest.fn();
    const items = [
      { key: "a", type: ApiWaveMetadataType.String },
      { key: "a", type: ApiWaveMetadataType.String },
    ];
    render(
      <CreateWaveDropsMetadata
        requiredMetadata={items}
        errors={["DROPS_REQUIRED_METADATA_NON_UNIQUE"] as any}
        onRequiredMetadataChange={change}
      />
    );
    expect(screen.getByTestId("row-0").textContent).toContain(
      "Metadata name must be unique"
    );
    await user.click(screen.getByTestId("add"));
    expect(change).toHaveBeenCalledWith([
      ...items,
      { key: "", type: ApiWaveMetadataType.String },
    ]);
    await user.click(screen.getAllByText("rem")[0]);
    expect(change).toHaveBeenCalled();
  });

  it("marks reserved identity metadata keys when validation fails", () => {
    render(
      <CreateWaveDropsMetadata
        requiredMetadata={[
          { key: " Identity ", type: ApiWaveMetadataType.String },
        ]}
        errors={["DROPS_REQUIRED_METADATA_RESERVED_IDENTITY_KEY"] as any}
        onRequiredMetadataChange={() => {}}
      />
    );

    expect(screen.getByTestId("row-0").textContent).toContain(
      IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR
    );
  });

  it("shows placeholder when empty", () => {
    render(
      <CreateWaveDropsMetadata
        requiredMetadata={[]}
        errors={[]}
        onRequiredMetadataChange={() => {}}
      />
    );
    expect(screen.getByText("No required metadata added")).toBeInTheDocument();
  });
});
