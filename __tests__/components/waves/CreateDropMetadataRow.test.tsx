import { render, screen, fireEvent } from "@testing-library/react";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import type { CreateDropMetadataType } from "@/components/waves/CreateDropContent";
import CreateDropMetadataRow from "@/components/waves/CreateDropMetadataRow";

const baseMeta = {
  id: "meta-1",
  key: "a",
  value: "1",
  type: ApiWaveMetadataType.String,
  required: false,
} satisfies CreateDropMetadataType;

test("calls handlers for key and value changes", () => {
  const onKey = jest.fn();
  const onValue = jest.fn();
  render(
    <CreateDropMetadataRow
      metadata={baseMeta}
      index={0}
      onChangeKey={onKey}
      onChangeValue={onValue}
      onRemove={jest.fn()}
      isError={false}
      errorMessage={null}
      disabled={false}
    />
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Field name" }), {
    target: { value: "x" },
  });
  expect(onKey).toHaveBeenCalledWith({ index: 0, newKey: "x" });
  fireEvent.change(screen.getByRole("textbox", { name: "Value" }), {
    target: { value: "foo" },
  });
  expect(onValue).toHaveBeenCalledWith({ index: 0, newValue: "foo" });
});

test("handles numeric value parsing", () => {
  const onValue = jest.fn();
  render(
    <CreateDropMetadataRow
      metadata={{ ...baseMeta, type: ApiWaveMetadataType.Number, value: 2 }}
      index={1}
      onChangeKey={jest.fn()}
      onChangeValue={onValue}
      onRemove={jest.fn()}
      isError={false}
      errorMessage={null}
      disabled={false}
    />
  );
  const input = screen.getByRole("textbox", { name: /^Value/ });
  fireEvent.change(input, { target: { value: "3" } });
  expect(onValue).toHaveBeenCalledWith({ index: 1, newValue: 3 });
  fireEvent.change(input, { target: { value: "0" } });
  expect(onValue).toHaveBeenCalledWith({ index: 1, newValue: 0 });
  fireEvent.change(input, { target: { value: "-2.5" } });
  expect(onValue).toHaveBeenCalledWith({ index: 1, newValue: -2.5 });
  fireEvent.change(input, { target: { value: "-" } });
  expect(onValue).toHaveBeenCalledWith({ index: 1, newValue: null });
});

test("renders reserved metadata key errors", () => {
  render(
    <CreateDropMetadataRow
      metadata={baseMeta}
      index={0}
      onChangeKey={jest.fn()}
      onChangeValue={jest.fn()}
      onRemove={jest.fn()}
      isError={true}
      errorMessage="Metadata name is reserved for identity nominations"
      disabled={false}
    />
  );

  expect(
    screen.getByText("Metadata name is reserved for identity nominations")
  ).toBeInTheDocument();
});
