import { useState } from "react";
import { TextDecoder } from "node:util";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentationLongText from "@/components/artwork-documentation/DocumentationLongText";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

function Harness({
  onChange,
  max = 500000,
}: {
  readonly onChange: (text: string) => void;
  readonly max?: number;
}) {
  const [value, setValue] = useState("Existing account.");
  return (
    <DocumentationLongText
      id="account"
      label="Full account"
      max={max}
      value={value}
      onChange={(next) => {
        onChange(next);
        setValue(next);
      }}
    />
  );
}

describe("complete document writing", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "TextDecoder", {
      configurable: true,
      value: TextDecoder,
    });
  });
  it("keeps every paragraph during reading and returns focus to the same writing", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    const text =
      "# Production account\n\nElia: First paragraph.\n\nLeonie: A complete answer.\n\n<script>never executed</script>";
    fireEvent.change(screen.getByRole("textbox", { name: "Full account" }), {
      target: { value: text },
    });
    expect(onChange).toHaveBeenLastCalledWith(text);
    await user.click(screen.getByRole("button", { name: "Read this text" }));
    expect(
      screen.getByRole("region", { name: "Full account" }).textContent
    ).toBe(text);
    expect(document.querySelector("script")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Write" }));
    expect(screen.getByRole("textbox", { name: "Full account" })).toHaveValue(
      text
    );
    expect(screen.getByRole("textbox", { name: "Full account" })).toHaveFocus();
  });
  it("reviews a complete imported UTF-8 document before explicitly appending it", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    const text =
      "## Complete conversation\n\nQuestion one\n\nAnswer one\n\nQuestion two\n\nRéponse two.";
    const file = new File([text], "conversation.md", { type: "text/markdown" });
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => Buffer.from(text, "utf8"),
    });
    fireEvent.change(screen.getByLabelText("Import text"), {
      target: { files: [file] },
    });
    await screen.findByRole("region", { name: "Review the imported text" });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Full account" })).toHaveValue(
      "Existing account."
    );
    await user.click(
      screen.getByRole("button", { name: "Add after my writing" })
    );
    expect(onChange).toHaveBeenLastCalledWith(`Existing account.\n\n${text}`);
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Review the imported text" })
      ).not.toBeInTheDocument()
    );
  });
  it("retains over-limit writing with a visible associated error instead of truncating", () => {
    render(<Harness onChange={jest.fn()} max={20} />);
    const text = "A complete account that exceeds the example limit.";
    const input = screen.getByRole("textbox", { name: "Full account" });
    fireEvent.change(input, { target: { value: text } });
    expect(input).toHaveValue(text);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(
      "account-document-error"
    );
  });
  it("starts compact for a short answer and grows for complete writing without losing it", () => {
    render(<Harness onChange={jest.fn()} />);
    const input = screen.getByRole("textbox", { name: "Full account" });
    expect(input).toHaveAttribute("rows", "4");
    const text = Array.from(
      { length: 40 },
      (_, index) => `Paragraph ${index}: the complete account.`
    ).join("\n\n");
    fireEvent.change(input, { target: { value: text } });
    expect(input).toHaveValue(text);
    expect(input).toHaveAttribute("rows", "14");
  });
});
