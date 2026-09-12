import { fireEvent, render, screen, within } from "@testing-library/react";

import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import { getApprovedGalleryEntries } from "@/components/profile-cms/approved-renderer/contract";
import {
  CMS_STUDIO_DESIGNS,
  getCmsStudioPresentation,
} from "@/lib/profile-cms/studio/presentation";
import { instantiateCmsStudioTemplate } from "@/lib/profile-cms/studio/templates";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function fixture(id = "collector-v2", handle = "example6529") {
  return instantiateCmsStudioTemplate(
    id,
    handle,
    new Date("2026-09-12T12:00:00Z")
  );
}

it.each(CMS_STUDIO_DESIGNS)(
  "renders %s through its explicit native design",
  (id) => {
    const document = fixture(id);
    const page = document.payload.pages[0]!;
    const { container } = render(
      <CmsSiteRenderer cmsPackage={document} page={page} locale="en-US" />
    );
    expect(
      container.querySelector("[data-cms-approved-design]")
    ).toHaveAttribute("data-cms-approved-design", id);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("main")).toBeNull();
    expect(
      screen.getAllByRole("link", { name: /@example6529 on 6529/ })
    ).toHaveLength(2);
  }
);

it("leaves legacy publications on the legacy studio renderer", () => {
  const document = fixture("signature");
  const { container } = render(
    <CmsSiteRenderer
      cmsPackage={document}
      page={document.payload.pages[0]!}
      locale="en-US"
    />
  );
  expect(container.querySelector("[data-cms-approved-design]")).toBeNull();
  expect(container.querySelector("[data-cms-studio-layout]")).not.toBeNull();
  document.site.theme.tokens = {
    ...document.site.theme.tokens,
    studio_design: "unknown-design",
  };
  expect(getCmsStudioPresentation(document)?.studio_design).toBeUndefined();
});

it("searches across collections, combines filters, and changes the browsing view", () => {
  const document = fixture();
  const page = document.payload.pages.find(
    (entry) => entry.id === "page-collection"
  )!;
  const { container } = render(
    <CmsSiteRenderer cmsPackage={document} page={page} locale="en-US" />
  );
  expect(screen.getByRole("status")).toHaveTextContent("19 works");
  fireEvent.change(screen.getByLabelText("Search artworks"), {
    target: { value: "Rose" },
  });
  expect(screen.getByRole("status")).toHaveTextContent("1 work");
  expect(screen.getByRole("heading", { name: "Rose" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Psychic" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Search artworks"), {
    target: { value: "nothing matches this" },
  });
  expect(screen.getByText("No matching works.")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(screen.getByRole("status")).toHaveTextContent("19 works");
  fireEvent.click(screen.getByRole("button", { name: "List" }));
  expect(container.querySelector('[data-view="list"]')).not.toBeNull();
  const navigation = screen.getByRole("navigation");
  expect(within(navigation).queryByRole("link", { name: "Rose" })).toBeNull();
});

it("preserves unannotated canonical artwork occurrences and their original order", () => {
  const entries = getApprovedGalleryEntries({
    id: "mixed-gallery",
    block_type: "gallery",
    asset_ids: ["a", "b", "a", "c", "a"],
    items: [
      { asset_id: "a", title: "First annotation" },
      { asset_id: "a", title: "Second annotation" },
      { asset_id: "c", title: "Third work" },
    ],
  });
  expect(entries).toEqual([
    { asset_id: "a", title: "First annotation" },
    { asset_id: "b" },
    { asset_id: "a", title: "Second annotation" },
    { asset_id: "c", title: "Third work" },
    { asset_id: "a" },
  ]);
});

it("selects copy while keeping artwork links navigable in the editor", () => {
  const document = fixture();
  const page = document.payload.pages[0]!;
  const select = jest.fn();
  const navigate = jest.fn();
  render(
    <CmsSiteRenderer
      cmsPackage={document}
      page={page}
      locale="en-US"
      editing={{ onSelectBlock: select, onNavigatePage: navigate }}
    />
  );
  fireEvent.click(screen.getByRole("heading", { level: 1 }));
  const hero = page.blocks.find((block) => block.block_type === "heading")!;
  expect(select).toHaveBeenCalledWith(hero.id);
  select.mockClear();
  const feature = screen
    .getAllByRole("link")
    .find((link) => link.getAttribute("href")?.endsWith("/work-48"))!;
  fireEvent.click(feature);
  expect(navigate).toHaveBeenCalledWith("page-work-48");
  expect(select).not.toHaveBeenCalled();
});

it("prefills an inquiry and preserves the visitor's typed message across preview navigation", () => {
  const document = fixture("artist-v2");
  const work = document.payload.pages.find((entry) =>
    entry.blocks.some(
      (block) =>
        typeof block["subject"] === "string" &&
        block.block_type === "button_link"
    )
  )!;
  const contact = document.payload.pages.find(
    (entry) => entry.id === "page-contact"
  )!;
  const navigate = jest.fn();
  const view = (page: typeof work) => (
    <CmsSiteRenderer
      cmsPackage={document}
      page={page}
      locale="en-US"
      editing={{ onNavigatePage: navigate }}
    />
  );
  const { container, rerender } = render(view(work));
  const inquiry = container.querySelector<HTMLAnchorElement>(
    'a[href*="?subject="]'
  )!;
  expect(inquiry).not.toBeNull();
  const requestedSubject = new URL(inquiry.href).searchParams.get("subject");
  fireEvent.click(inquiry);
  expect(navigate).toHaveBeenCalledWith("page-contact");
  rerender(view(contact));
  expect(screen.getByLabelText("Subject")).toHaveValue(requestedSubject);
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Visitor" },
  });
  fireEvent.change(screen.getByLabelText("Your email"), {
    target: { value: "visitor@example.org" },
  });
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: "Please send the available dimensions." },
  });
  rerender(view(work));
  rerender(view(contact));
  expect(screen.getByLabelText("Message")).toHaveValue(
    "Please send the available dimensions."
  );
  fireEvent.click(screen.getByRole("button", { name: "Prepare email" }));
  const email = screen.getByRole("link", { name: "Open email app" });
  expect(email.getAttribute("href")).toMatch(/^mailto:/);
  expect(decodeURIComponent(email.getAttribute("href")!)).toContain(
    "Please send the available dimensions."
  );
});

it("restores visitor correspondence after page remount without sharing it with another profile", () => {
  const document = fixture("artist-v2", "draftvisitor");
  const contact = document.payload.pages.find(
    (page) => page.id === "page-contact"
  )!;
  const first = render(
    <CmsSiteRenderer cmsPackage={document} page={contact} locale="en-US" />
  );
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: "A private visitor draft that has not been sent." },
  });
  first.unmount();
  const second = render(
    <CmsSiteRenderer cmsPackage={document} page={contact} locale="en-US" />
  );
  expect(screen.getByLabelText("Message")).toHaveValue(
    "A private visitor draft that has not been sent."
  );
  second.unmount();
  const other = fixture("artist-v2", "anotherprofile");
  render(
    <CmsSiteRenderer
      cmsPackage={other}
      page={other.payload.pages.find((page) => page.id === "page-contact")!}
      locale="en-US"
    />
  );
  expect(screen.getByLabelText("Message")).toHaveValue("");
});

it("preserves the verified pixel artwork without interpolation through image optimization", () => {
  const document = fixture();
  const page = document.payload.pages.find(
    (candidate) =>
      candidate.id.startsWith("page-work-") &&
      candidate.blocks.some((block) => block["asset_id"] === "blitmap-1")
  )!;
  const { container } = render(
    <CmsSiteRenderer cmsPackage={document} page={page} locale="en-US" />
  );
  expect(container.querySelector('[data-pixel="true"] img')).toHaveAttribute(
    "src",
    "/profile-cms/templates/approved/blitmap-1.webp"
  );
});
