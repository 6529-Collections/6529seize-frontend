import CollectGoalDefinitionPicker from "@/components/collect/CollectGoalDefinitionPicker";
import { fireEvent, render, screen } from "@testing-library/react";

const definitions = [
  { id: "a", label: "José Delbo" },
  { id: "b", label: "XCOPY" },
  { id: "c", label: "Example Artist" },
];
const props = {
  label: "Artist",
  placeholder: "Select an artist",
  locale: "en-US" as const,
  value: "",
  definitions,
  disabled: false,
  invalid: false,
};

it("finds artists by name and accent-insensitive text, committing the exact selected ID", () => {
  const onChange = jest.fn();
  render(<CollectGoalDefinitionPicker {...props} onChange={onChange} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Artist" }), {
    target: { value: "JOSE" },
  });
  expect(
    screen.queryByRole("option", { name: "XCOPY" })
  ).not.toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole("option", { name: "José Delbo" }), {
    button: 0,
  });
  expect(onChange).toHaveBeenCalledWith("a");
});

it("explains an unmatched search without selecting a different artist", () => {
  const onChange = jest.fn();
  render(
    <CollectGoalDefinitionPicker {...props} value="b" onChange={onChange} />
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Artist" }), {
    target: { value: "not in this catalog" },
  });
  expect(screen.getByRole("status")).toHaveTextContent("No matches");
  expect(screen.getByRole("option")).toHaveAttribute("aria-disabled", "true");
  expect(onChange).not.toHaveBeenCalled();
});

it("announces an empty catalog and associates validation with its input", () => {
  render(
    <>
      <p id="error">Choose an artist</p>
      <CollectGoalDefinitionPicker
        {...props}
        definitions={[]}
        invalid
        errorId="error"
        onChange={jest.fn()}
      />
    </>
  );
  const input = screen.getByRole("combobox", { name: "Artist" });
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription(
    "Choose a target before building your plan."
  );
  fireEvent.click(screen.getByRole("button", { name: "Artist" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "No targets are available"
  );
});
