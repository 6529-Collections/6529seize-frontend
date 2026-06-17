import { render, screen, waitFor } from "@testing-library/react";
import DelegationHTML from "@/components/delegation/html/DelegationHTML";
import { fetchDelegationArticleHtml } from "@/components/delegation/html/delegationContent";

jest.mock("@/components/delegation/html/delegationContent", () => ({
  __esModule: true,
  DELEGATION_TOP_LEVEL_ARTICLE_SLUGS: ["page"],
  delegationArticleSlugs: ["page"],
  fetchDelegationArticleHtml: jest.fn(),
  getDelegationArticle: jest.fn((slug: string | undefined) =>
    slug === "page"
      ? {
          title: "Hello World",
          summary: "A test article.",
          group: "Reference",
          path: "html/page.html",
          sourceUrl: "",
          sourceUri: null,
          sha256: "hash",
        }
      : undefined
  ),
  getDelegationArticleIndex: jest.fn(() => 0),
  getDelegationArticleSlugAt: jest.fn(() => undefined),
  isDelegationFaqChildArticle: jest.fn(() => false),
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

test("shows 404 page when fetch fails", async () => {
  mockFetchDelegationArticleHtml.mockRejectedValue(new Error("missing"));
  render(<DelegationHTML path="missing" title="Missing" />);
  await waitFor(() =>
    expect(screen.getByText("404 | PAGE NOT FOUND")).toBeInTheDocument()
  );
});
