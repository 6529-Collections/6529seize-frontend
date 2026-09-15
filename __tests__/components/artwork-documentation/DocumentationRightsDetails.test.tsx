import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DocumentationValueEditor from "@/components/artwork-documentation/DocumentationValueEditor";
import type {
  FieldValue,
  ValueEditor,
} from "@/lib/artwork-documentation/registry";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock(
  "@/components/artwork-documentation/DocumentationFieldExample",
  () => ({
    DocumentationExampleExcerpt: () => null,
  })
);

function RightsEditor({
  field,
  detail,
  initialKind,
  options,
}: {
  readonly field: string;
  readonly detail: string;
  readonly initialKind: string;
  readonly options: readonly string[];
}) {
  const [value, setValue] = useState<FieldValue>({ kind: initialKind });
  const editor: ValueEditor = {
    kind: "object",
    required: ["kind"],
    fields: {
      kind: { kind: "choice", options },
      [detail]: { kind: "text", multiline: true },
    },
  };
  return (
    <DocumentationValueEditor
      id="rights-answer"
      label="Rights answer"
      editor={editor}
      examplePath={`rights.${field}`}
      value={value}
      onChange={setValue}
    />
  );
}

it.each(["coauthored", "licensed_components", "other", "unknown"])(
  "reveals required ownership details when %s is selected",
  (kind) => {
    render(
      <RightsEditor
        field="rights_basis"
        detail="detail"
        initialKind="artist_owned"
        options={["artist_owned", kind]}
      />
    );
    expect(screen.getByRole("textbox")).not.toBeVisible();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: kind } });
    const input = screen.getByRole("textbox");
    expect(input).toBeVisible();
    fireEvent.change(input, { target: { value: "My account of the rights." } });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "artist_owned" },
    });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: kind } });
    expect(screen.getByRole("textbox")).toBeVisible();
    expect(screen.getByRole("textbox")).toHaveValue(
      "My account of the rights."
    );
  }
);

it("reveals third-party details immediately and preserves them across category changes", () => {
  render(
    <RightsEditor
      field="third_party_material"
      detail="details"
      initialKind="none"
      options={["none", "present", "unknown"]}
    />
  );
  expect(screen.getByRole("textbox")).not.toBeVisible();
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "present" },
  });
  expect(screen.getByRole("textbox")).toBeVisible();
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "The credited material is used with permission." },
  });
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "none" } });
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "present" },
  });
  expect(screen.getByRole("textbox")).toBeVisible();
  expect(screen.getByRole("textbox")).toHaveValue(
    "The credited material is used with permission."
  );
});
