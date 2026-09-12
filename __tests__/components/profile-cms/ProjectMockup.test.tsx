import { fireEvent, render, within } from "@testing-library/react";

import CmsSiteRenderer from "@/components/profile-cms/CmsSiteRenderer";
import {
  cmsPackageSchema,
  type CmsBlockV1,
} from "@/lib/profile-cms/protocol/v1";
import { instantiateCmsStudioTemplate } from "@/lib/profile-cms/studio/templates";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function fixture() {
  return instantiateCmsStudioTemplate(
    "personal-v2",
    "example6529",
    new Date("2026-09-12T12:00:00Z")
  );
}

function fields(block: CmsBlockV1) {
  return block as CmsBlockV1 & Record<string, unknown>;
}

it("renders both approved project illustrations without duplicated fallback prose", () => {
  const document = fixture();
  const page = document.payload.pages[0]!;
  const { container } = render(
    <CmsSiteRenderer cmsPackage={document} page={page} locale="en-US" />
  );
  const planner = within(
    container.querySelector<HTMLElement>('[data-cms-project-mockup="planner"]')!
  );
  expect(planner.getByRole("heading", { name: "fieldwork" })).toBeVisible();
  expect(planner.getByRole("heading", { name: "This week" })).toBeVisible();
  expect(planner.getAllByRole("listitem")).toHaveLength(3);
  expect(planner.getByText("Identity / Review the type study")).toBeVisible();
  expect(planner.getByText("In review")).toBeVisible();

  const catalogue = within(
    container.querySelector<HTMLElement>(
      '[data-cms-project-mockup="catalogue"]'
    )!
  );
  expect(
    catalogue.getByRole("heading", { name: "The Reading Room" })
  ).toBeVisible();
  expect(catalogue.getAllByRole("listitem")).toHaveLength(3);
  expect(
    catalogue.getByRole("heading", { name: "Ways of Seeing" })
  ).toBeVisible();
  expect(
    catalogue.getByText("John Berger · Available to borrow")
  ).toBeVisible();

  for (const block of page.blocks.filter(
    (entry) => fields(entry)["mockup_style"]
  )) {
    expect(container.textContent).not.toContain(fields(block)["content"]);
  }
});

it("renders edited mockup text and linked rows after a complete JSON round trip", () => {
  const document = fixture();
  const page = document.payload.pages[0]!;
  const block = fields(
    page.blocks.find((entry) => fields(entry)["mockup_style"] === "catalogue")!
  );
  Object.assign(block, {
    title: "A different library",
    mockup_heading: "New arrivals",
    mockup_footer: "Next discussion: Tuesday",
    rows: [
      {
        label: "<script>literal book title</script>",
        value: "An edited author · Reserved",
        page_id: page.id,
      },
    ],
  });
  const imported = cmsPackageSchema.parse(JSON.parse(JSON.stringify(document)));
  const navigate = jest.fn();
  const { container } = render(
    <CmsSiteRenderer
      cmsPackage={imported}
      page={imported.payload.pages[0]!}
      locale="en-US"
      editing={{ onNavigatePage: navigate }}
    />
  );
  const catalogueElement = container.querySelector<HTMLElement>(
    '[data-cms-project-mockup="catalogue"]'
  )!;
  const catalogue = within(catalogueElement);
  expect(
    catalogue.getByRole("heading", { name: "A different library" })
  ).toBeVisible();
  expect(
    catalogue.getByRole("heading", { name: "New arrivals" })
  ).toBeVisible();
  expect(
    catalogue.getByRole("heading", {
      name: "<script>literal book title</script>",
    })
  ).toBeVisible();
  expect(catalogueElement.querySelector("script")).toBeNull();
  expect(catalogue.getByText("Next discussion: Tuesday")).toBeVisible();
  expect(catalogue.queryByText("Ways of Seeing")).toBeNull();
  fireEvent.click(
    catalogue.getByRole("link", { name: "An edited author · Reserved" })
  );
  expect(navigate).toHaveBeenCalledWith(page.id);
  expect(
    fields(
      imported.payload.pages[0]!.blocks.find((entry) => entry.id === block.id)!
    )["content"]
  ).toBe(block["content"]);
});

it("leaves an ordinary project callout's narrative visible", () => {
  const document = fixture();
  const page = document.payload.pages[0]!;
  const block = fields(
    page.blocks.find((entry) => fields(entry)["mockup_style"] === "planner")!
  );
  delete block["mockup_style"];
  block["title"] = "A conventional project card";
  block["content"] = "A project narrative that must remain visible.";
  const { container } = render(
    <CmsSiteRenderer cmsPackage={document} page={page} locale="en-US" />
  );
  expect(
    container.querySelector('[data-cms-project-mockup="planner"]')
  ).toBeNull();
  expect(
    within(container).getByText("A project narrative that must remain visible.")
  ).toBeVisible();
});
