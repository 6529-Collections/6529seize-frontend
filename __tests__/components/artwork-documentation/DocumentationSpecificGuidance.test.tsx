import { fireEvent, render, screen } from "@testing-library/react";
import DocumentationProgramLicense from "@/components/artwork-documentation/DocumentationProgramLicense";
import DocumentationValidationMessages from "@/components/artwork-documentation/DocumentationValidationMessages";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

it("names the nested answer part and deduplicates repeated validators", () => {
  const issue = {
    code: "invalid_uri",
    path: ["references", 1, "url"],
    kind: "invalid",
  } as const;
  render(
    <DocumentationValidationMessages
      issues={[
        { ...issue, path: [...issue.path] },
        { ...issue, path: [...issue.path] },
      ]}
    />
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByRole("status")).toHaveTextContent(/Entry 2/);
  expect(screen.getByRole("status")).toHaveTextContent(/https/);
});

it("fills the fixed project CC0 details without altering the declaration", () => {
  const context = documentationFixture();
  context.program_id = "6529NM-AP-01";
  context.profile.profile_id = "keys_and_gates_v1";
  context.profile.version = 2;
  const controller = new DocumentationDraftController(
    context,
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  const edit = jest.spyOn(controller, "edit");
  render(
    <DocumentationProgramLicense
      draft={{
        ...controller.snapshot(),
        controller,
        recoveryUnavailable: false,
      }}
    />
  );
  expect(edit).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: /Add the project’s CC0 license details/ })
  );
  expect(edit).toHaveBeenCalledTimes(1);
  expect(edit).toHaveBeenCalledWith(
    "rights",
    expect.objectContaining({
      field: "intended_license",
      answer: expect.objectContaining({
        value: {
          uri: "https://creativecommons.org/publicdomain/zero/1.0/",
          label: "CC0 1.0 Universal",
        },
      }),
    })
  );
  controller.dispose();
});

it.each([
  "other-program",
  "other-profile",
  "new-profile",
  "view-only",
  "archived",
])("does not offer a terms mutation for %s", (scenario) => {
  const context = documentationFixture();
  context.program_id = scenario === "other-program" ? null : "6529NM-AP-01";
  context.profile.profile_id =
    scenario === "other-profile"
      ? "stream_artwork_basic_v1"
      : "keys_and_gates_v1";
  context.profile.version = scenario === "new-profile" ? 3 : 2;
  if (scenario === "view-only") context.mutation_capabilities.edit_modules = [];
  if (scenario === "archived")
    context.lifecycle = "archived" as typeof context.lifecycle;
  const controller = new DocumentationDraftController(
    context,
    { read: jest.fn(), save: jest.fn() },
    jest.fn()
  );
  render(
    <DocumentationProgramLicense
      draft={{
        ...controller.snapshot(),
        controller,
        recoveryUnavailable: false,
      }}
    />
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  controller.dispose();
});
