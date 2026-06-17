import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import ProfileCmsBuilder from "@/components/profile-cms-builder/ProfileCmsBuilder";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    readonly href: string;
    readonly children: ReactNode;
    readonly className?: string;
  }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));

describe("ProfileCmsBuilder", () => {
  beforeEach(() => {
    delete process.env["PROFILE_CMS_BUILDER_API_ENABLED"];
    delete process.env["NEXT_PUBLIC_PROFILE_CMS_BUILDER_API_ENABLED"];
  });

  it("edits homepage content and previews with the real CMS renderer", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    await user.clear(screen.getByLabelText("Page title"));
    await user.type(screen.getByLabelText("Page title"), "Builder homepage");
    await user.click(screen.getByRole("button", { name: "Callout" }));
    await user.click(screen.getByRole("button", { name: "Preview" }));

    expect(
      screen.getByRole("heading", { name: "Builder homepage", level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText("Add a short callout.")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "punk6529 navigation" })
    ).toBeInTheDocument();
  });

  it("exports package JSON and imports a modified candidate", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    await user.click(screen.getByRole("button", { name: "JSON" }));
    const jsonEditor = screen.getByLabelText(
      "Package candidate"
    ) as HTMLTextAreaElement;
    const exported = JSON.parse(jsonEditor.value) as {
      site: { title: string };
    };
    exported.site.title = "Imported site";

    fireEvent.change(jsonEditor, {
      target: { value: JSON.stringify(exported) },
    });
    await user.click(screen.getByRole("button", { name: "Import JSON" }));

    expect(screen.getByLabelText("Site title")).toHaveValue("Imported site");
  });

  it("keeps publish honest when backend writes are disabled", async () => {
    const user = userEvent.setup();
    render(<ProfileCmsBuilder handle="punk6529" title="Profile CMS builder" />);

    await user.click(screen.getByRole("button", { name: "Save draft" }));

    const statePanel = screen.getByRole("heading", {
      name: "Draft and publish state",
    }).parentElement;
    expect(statePanel).not.toBeNull();
    expect(
      within(statePanel as HTMLElement).getByText(
        "Builder API writes are not enabled in this frontend environment."
      )
    ).toBeInTheDocument();
    expect(
      within(statePanel as HTMLElement).getByText("profile-cms/packages")
    ).toBeInTheDocument();
  });

  it("keeps production publish disabled until the signed storage flow exists", async () => {
    const user = userEvent.setup();
    render(
      <ProfileCmsBuilder
        handle="punk6529"
        profileId="profile-punk6529"
        title="Profile CMS builder"
      />
    );

    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(
      screen.getByText(
        "Publishing needs the signed decentralized storage flow and is not enabled in this MVP."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("profile-cms/packages/{id}/publish")
    ).toBeInTheDocument();
  });
});
