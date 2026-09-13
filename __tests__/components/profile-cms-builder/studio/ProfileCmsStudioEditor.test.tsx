import { fireEvent, render, screen } from "@testing-library/react";

import ProfileCmsStudioEditor from "@/components/profile-cms-builder/studio/ProfileCmsStudioEditor";
import { instantiateCmsStudioTemplate } from "@/lib/profile-cms/studio/templates";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

it("finds pages by their visible navigation label and underlying title", () => {
  const document = instantiateCmsStudioTemplate("artist-v2", "example");
  const works = document.payload.pages.find(
    (page) => page.id === "page-works"
  )!;
  works.metadata.title = "Nine drawings";
  works.metadata.navigation_label = "Archive";
  render(
    <ProfileCmsStudioEditor
      document={document}
      locale="en-US"
      initialShowTemplates={false}
      canRequestSnapshot={false}
      canUpload={false}
      scopeKey="test"
      onChange={jest.fn()}
      onTemplateCreated={jest.fn()}
      onPendingChange={jest.fn()}
      onUploadBusyChange={jest.fn()}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Pages" }));
  const search = screen.getByLabelText("Find a page");
  for (const query of ["archive", "ARCHIVE", "drawings"]) {
    fireEvent.change(search, { target: { value: query } });
    expect(screen.getByRole("button", { name: "Archive" })).toBeVisible();
  }
  fireEvent.change(search, { target: { value: "no matching page" } });
  expect(
    screen.queryByRole("button", { name: "Archive" })
  ).not.toBeInTheDocument();
});
