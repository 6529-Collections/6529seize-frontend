import { fireEvent, render, screen, within } from "@testing-library/react";
import DocumentationSaveStatus from "@/components/artwork-documentation/DocumentationSaveStatus";
import {
  documentationFixture,
  titleOperation,
} from "@/__tests__/fixtures/artwork-documentation";
import {
  DocumentationDraftController,
  type DraftSnapshot,
} from "@/lib/artwork-documentation/draft-controller";
import { documentationErrorMessageKey } from "@/lib/artwork-documentation/errors";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: jest.fn() }),
}));

it("distinguishes an invalid answer from other pending changes and links both to their chapter", () => {
  const context = documentationFixture();
  const controller = new DocumentationDraftController(
    context,
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  const snapshot: DraftSnapshot = {
    ...controller.snapshot(),
    state: "invalid",
    dirty: true,
    edits: [
      { moduleId: "artwork", operation: titleOperation(""), sequence: 1 },
      {
        moduleId: "artwork",
        operation: { ...titleOperation("Milos"), field: "location" },
        sequence: 2,
      },
    ],
  };
  const onNavigateSection = jest.fn();
  const onNavigateField = jest.fn();
  render(
    <DocumentationSaveStatus
      snapshot={snapshot}
      controller={controller}
      onNavigateSection={onNavigateSection}
      onNavigateField={onNavigateField}
    />
  );
  const title = screen.getByRole("button", { name: "Title" });
  const location = screen.getByRole("button", { name: "Location" });
  expect(
    within(title.closest("li")!).getByText(/Complete this part of the answer/)
  ).toBeInTheDocument();
  expect(
    within(location.closest("li")!).queryByText(
      /Complete this part of the answer/
    )
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(/These answers have not been saved yet/)
  ).toBeInTheDocument();
  fireEvent.click(title);
  expect(onNavigateField).toHaveBeenLastCalledWith("artwork", "title");
  fireEvent.click(location);
  expect(onNavigateField).toHaveBeenLastCalledWith("artwork", "location");
  expect(onNavigateSection).not.toHaveBeenCalled();
  controller.dispose();
});

it("does not claim answers are invalid when a non-save action was rejected", () => {
  const controller = new DocumentationDraftController(
    documentationFixture(),
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  render(
    <DocumentationSaveStatus
      snapshot={{
        ...controller.snapshot(),
        state: "invalid",
        errorCode: "CONFIRMATION_COPY_REQUIRED",
      }}
      controller={controller}
    />
  );
  expect(
    screen.getByText(/The last action could not be verified/)
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Check the saved confirmation status/)
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/Some answers need attention/)
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/These changes are still waiting/)
  ).not.toBeInTheDocument();
  controller.dispose();
});

it("allows only known error codes to select recovery copy", () => {
  expect(documentationErrorMessageKey("INVALID_VALUE")).toBe(
    "validation.INVALID_VALUE"
  );
  expect(documentationErrorMessageKey("DETAIL_REQUIRED")).toBe(
    "validation.DETAIL_REQUIRED"
  );
  expect(documentationErrorMessageKey("REQUIRED_ANSWERS_MISSING")).toBe(
    "validation.REQUIRED_ANSWERS_MISSING"
  );
  expect(documentationErrorMessageKey("CONFIRMATION_COPY_REQUIRED")).toBe(
    "validation.CONFIRMATION_COPY_REQUIRED"
  );
  expect(
    documentationErrorMessageKey("untrusted server response")
  ).toBeUndefined();
});
