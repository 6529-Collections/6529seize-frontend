import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateDropMetadata from "@/components/waves/CreateDropMetadata";
import { createMetadataHandlers } from "@/components/waves/create-drop-content/content-helpers";
import { convertMetadataToDropMetadata } from "@/components/waves/utils/convertMetadataToDropMetadata";
import type { CreateDropMetadataType } from "@/components/waves/CreateDropContent";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import { IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR } from "@/helpers/waves/identity-submission-metadata";

const EMPTY_METADATA: CreateDropMetadataType[] = [];
const NO_ERRORS: Record<string, string> = {};

function Draft({
  initialMetadata = EMPTY_METADATA,
  errors = NO_ERRORS,
}: {
  readonly initialMetadata?: CreateDropMetadataType[];
  readonly errors?: Record<string, string>;
}) {
  const [metadata, setMetadata] = useState(() => [...initialMetadata]);
  const [open, setOpen] = useState(false);
  const handlers = createMetadataHandlers({
    setMetadata,
    generateMetadataId: () => crypto.randomUUID(),
  });
  return (
    <>
      <button onClick={() => setOpen(true)}>Add metadata</button>
      {open && (
        <CreateDropMetadata
          metadata={metadata}
          missingRequiredMetadataKeys={[]}
          metadataErrorById={errors}
          disabled={false}
          closeMetadata={() => setOpen(false)}
          {...handlers}
        />
      )}
      <output data-testid="payload">
        {JSON.stringify(convertMetadataToDropMetadata(metadata))}
      </output>
    </>
  );
}

test("adds, retains and removes custom metadata across collapse and reopen", async () => {
  const user = userEvent.setup();
  render(<Draft />);
  expect(
    screen.queryByRole("button", { name: /^Metadata/ })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Add metadata" }));
  const closeMetadata = screen.getByRole("button", { name: "Metadata" });
  expect(closeMetadata).toBeInTheDocument();
  expect(closeMetadata).not.toHaveAttribute("aria-expanded");
  expect(screen.queryByText("Optional")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Add field" }));
  expect(screen.getByRole("textbox", { name: "Field name" })).toHaveFocus();
  await user.type(
    screen.getByRole("textbox", { name: "Field name" }),
    "Medium"
  );
  await user.type(screen.getByRole("textbox", { name: "Value" }), "Digital");
  const toggle = screen.getByRole("button", { name: "Metadata 1 field" });
  await user.click(toggle);
  expect(toggle).not.toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.getByTestId("payload")).toHaveTextContent(
    '[{"data_key":"Medium","data_value":"Digital"}]'
  );
  await user.click(screen.getByRole("button", { name: "Add metadata" }));
  expect(screen.getByRole("textbox", { name: "Value" })).toHaveValue("Digital");
  await user.click(screen.getByRole("button", { name: "Remove field 1" }));
  expect(screen.getByRole("button", { name: "Add field" })).toHaveFocus();
  expect(screen.getByTestId("payload")).toHaveTextContent("[]");
});

test("keeps required field names locked and connects reserved-name errors to the input", async () => {
  render(
    <Draft
      initialMetadata={[
        {
          id: "required",
          key: "Title",
          type: ApiWaveMetadataType.String,
          value: null,
          required: true,
        },
        {
          id: "reserved",
          key: "identity",
          type: null,
          value: "test",
          required: false,
        },
      ]}
      errors={{ reserved: IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR }}
    />
  );
  await userEvent.click(screen.getByRole("button", { name: "Add metadata" }));
  expect(
    screen.getByRole("textbox", { name: "Field name Required" })
  ).toHaveAttribute("readonly");
  expect(
    screen.queryByRole("button", { name: "Remove field 1" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("textbox", { name: "Field name", exact: true })
  ).toHaveAccessibleDescription(IDENTITY_SUBMISSION_RESERVED_METADATA_ERROR);
  expect(
    screen.getByRole("textbox", { name: "Field name", exact: true })
  ).toHaveAttribute("aria-invalid", "true");
});

test("focuses the newly added field even when it is not the last row", async () => {
  function PrependingDraft() {
    const [metadata, setMetadata] = useState<CreateDropMetadataType[]>([
      {
        id: "existing",
        key: "Existing",
        type: ApiWaveMetadataType.String,
        value: null,
        required: false,
      },
    ]);

    return (
      <CreateDropMetadata
        metadata={metadata}
        missingRequiredMetadataKeys={[]}
        metadataErrorById={NO_ERRORS}
        disabled={false}
        closeMetadata={() => undefined}
        onChangeKey={() => undefined}
        onChangeValue={() => undefined}
        onAddMetadata={() => {
          const id = "new";
          setMetadata((current) => [
            {
              id,
              key: "",
              type: ApiWaveMetadataType.String,
              value: null,
              required: false,
            },
            ...current,
          ]);
          return id;
        }}
        onRemoveMetadata={() => undefined}
      />
    );
  }

  const { container } = render(<PrependingDraft />);
  await userEvent.click(screen.getByRole("button", { name: "Add field" }));
  expect(
    container.querySelector('input[data-metadata-id="new"]')
  ).toHaveFocus();
});
