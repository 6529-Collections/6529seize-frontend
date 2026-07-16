import { render, screen, waitFor, within } from "@testing-library/react";
import DelegationHTML from "@/components/delegation/html/DelegationHTML";
import { fetchDelegationArticleHtml } from "@/components/delegation/html/delegationContent";

jest.mock("@/components/delegation/html/delegationContent", () => ({
  __esModule: true,
  DELEGATION_TOP_LEVEL_ARTICLE_SLUGS: ["page"],
  delegationArticleSlugs: ["page"],
  fetchDelegationArticleHtml: jest.fn(),
  getDelegationArticle: jest.fn((slug: string | undefined) => {
    if (slug !== "page" && slug !== "child") {
      return undefined;
    }

    return {
      title: slug === "child" ? "Child Article" : "Hello World",
      summary: "A test article.",
      group: "Reference",
      path: `html/${slug}.html`,
      sourceUrl: "",
      sourceUri: null,
      sha256: "hash",
    };
  }),
  getDelegationArticleIndex: jest.fn(() => 0),
  getDelegationArticleSlugAt: jest.fn(() => undefined),
  isDelegationFaqChildArticle: jest.fn(
    (slug: string | undefined) => slug === "child"
  ),
}));

const mockFetchDelegationArticleHtml =
  fetchDelegationArticleHtml as jest.MockedFunction<
    typeof fetchDelegationArticleHtml
  >;

beforeEach(() => {
  mockFetchDelegationArticleHtml.mockReset();
});

test("renders fetched html", async () => {
  mockFetchDelegationArticleHtml.mockResolvedValue({
    article: {
      title: "Hello World",
      summary: "A test article.",
      group: "Reference",
      path: "html/page.html",
      sourceUrl: "",
      sourceUri: null,
      sha256: "hash",
    },
    html: "<p>hi</p>",
    url: "/delegation-content/test/html/page.html",
  });
  render(<DelegationHTML path="page" title="Hello World" />);
  await waitFor(() =>
    expect(mockFetchDelegationArticleHtml).toHaveBeenCalledWith("page")
  );
  const container = document.querySelector(".htmlContainer") as HTMLElement;
  await waitFor(() => expect(container.innerHTML).toContain("hi"));
  expect(
    screen.getByRole("heading", { name: "Hello World" })
  ).toBeInTheDocument();
});

test("keeps FAQ context and article hierarchy on child pages", async () => {
  mockFetchDelegationArticleHtml.mockResolvedValue({
    article: {
      title: "Child Article",
      summary: "A test article.",
      group: "Reference",
      path: "html/child.html",
      sourceUrl: "",
      sourceUri: null,
      sha256: "hash",
    },
    html: "<p>child content</p>",
    url: "/delegation-content/test/html/child.html",
  });

  render(<DelegationHTML path="child" />);

  expect(
    screen.getByText("Delegation FAQ", { selector: "p" })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Delegation FAQ" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 1, name: "Child Article" })
  ).toBeInTheDocument();

  const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
  expect(
    within(breadcrumb).queryByRole("link", { name: "Delegation Center" })
  ).not.toBeInTheDocument();
  expect(
    within(breadcrumb).getByRole("link", { name: "Delegation FAQ" })
  ).toHaveAttribute("href", "/delegation/delegation-faq");
  expect(within(breadcrumb).getByText("Child Article")).toHaveAttribute(
    "aria-current",
    "page"
  );

  const allTopicsLink = screen.getByRole("link", { name: "All FAQ topics" });
  expect(allTopicsLink).toHaveAttribute("href", "/delegation/delegation-faq");
  expect(allTopicsLink.querySelector("svg")).toBeInTheDocument();
  expect(screen.queryByText("Back to Delegation FAQ")).not.toBeInTheDocument();

  await waitFor(() =>
    expect(screen.getByText("child content")).toBeInTheDocument()
  );
});

test("shows 404 page when fetch fails", async () => {
  mockFetchDelegationArticleHtml.mockRejectedValue(new Error("missing"));
  render(<DelegationHTML path="missing" title="Missing" />);
  await waitFor(() =>
    expect(screen.getByText("404 | PAGE NOT FOUND")).toBeInTheDocument()
  );
});
