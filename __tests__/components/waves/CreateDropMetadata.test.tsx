import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateDropMetadata from "@/components/waves/CreateDropMetadata";
import { IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR } from "@/helpers/waves/identity-submission-metadata";

jest.mock("@/components/waves/CreateDropMetadataRow", () => ({
  __esModule: true,
  default: ({ index, isError, errorMessage }: any) => (
    <div data-testid="row">
      row-{index}-{isError ? "error" : "ok"}-{errorMessage ?? "none"}
    </div>
  ),
}));

describe("CreateDropMetadata", () => {
  const base = { id: "meta-1", key: "k", value: "v" } as any;

  it("renders rows and triggers actions", () => {
    const close = jest.fn();
    const onAdd = jest.fn();
    render(
      <CreateDropMetadata
        metadata={[base, { ...base, id: "meta-2" }]}
        missingRequiredMetadataKeys={[]}
        metadataErrorById={{}}
        disabled={false}
        closeMetadata={close}
        onChangeKey={jest.fn()}
        onChangeValue={jest.fn()}
        onAddMetadata={onAdd}
        onRemoveMetadata={jest.fn()}
      />
    );
    expect(screen.getAllByTestId("row")).toHaveLength(2);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(close).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Add new"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("passes reserved metadata key errors to rows", () => {
    render(
      <CreateDropMetadata
        metadata={[base]}
        missingRequiredMetadataKeys={[]}
        metadataErrorById={{
          "meta-1": IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR,
        }}
        disabled={false}
        closeMetadata={jest.fn()}
        onChangeKey={jest.fn()}
        onChangeValue={jest.fn()}
        onAddMetadata={jest.fn()}
        onRemoveMetadata={jest.fn()}
      />
    );

    expect(screen.getByTestId("row").textContent).toContain(
      IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR
    );
  });
});
