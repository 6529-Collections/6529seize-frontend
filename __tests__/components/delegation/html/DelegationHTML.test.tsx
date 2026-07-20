import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DelegationHTML from "@/components/delegation/html/DelegationHTML";
import {
  getCachedDelegationArticleHtml,
  loadDelegationArticleHtml,
} from "@/components/delegation/html/delegationContent";

const mockRouterPush = jest.fn();
const mockRouterPrefetch = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    prefetch: mockRouterPrefetch,
  }),
}));

jest.mock("@/components/delegation/html/delegationContent", () => ({
  __esModule: true,
  DELEGATION_TOP_LEVEL_ARTICLE_SLUGS: ["page"],
  delegationArticleSlugs: ["page"],
  getCachedDelegationArticleHtml: jest.fn(() => undefined),
  loadDelegationArticleHtml: jest.fn(),
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

const mockLoadDelegationArticleHtml =
  loadDelegationArticleHtml as jest.MockedFunction<
    typeof loadDelegationArticleHtml
  >;
const mockGetCachedDelegationArticleHtml =
  getCachedDelegationArticleHtml as jest.MockedFunction<
    typeof getCachedDelegationArticleHtml
  >;

beforeEach(() => {
  mockLoadDelegationArticleHtml.mockReset();
  mockGetCachedDelegationArticleHtml.mockReset();
  mockGetCachedDelegationArticleHtml.mockReturnValue(undefined);
  mockRouterPush.mockReset();
  mockRouterPrefetch.mockReset();
});

test("renders fetched html", async () => {
  mockLoadDelegationArticleHtml.mockResolvedValue({
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
    expect(mockLoadDelegationArticleHtml).toHaveBeenCalledWith("page")
  );
  const container = document.querySelector(".htmlContainer") as HTMLElement;
  await waitFor(() => expect(container.innerHTML).toContain("hi"));
  expect(
    screen.getByRole("heading", { name: "Hello World" })
  ).toBeInTheDocument();
});

test("keeps FAQ context and article hierarchy on child pages", async () => {
  mockLoadDelegationArticleHtml.mockResolvedValue({
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

  expect(
    screen.queryByRole("navigation", { name: "Breadcrumb" })
  ).not.toBeInTheDocument();

  const allTopicsLink = screen.getByRole("link", { name: "All FAQ topics" });
  expect(allTopicsLink).toHaveAttribute("href", "/delegation/delegation-faq");
  expect(allTopicsLink).toHaveClass("tw-text-white");
  expect(allTopicsLink.querySelector("svg")).toBeInTheDocument();
  expect(screen.queryByText("Back to Delegation FAQ")).not.toBeInTheDocument();
  expect(screen.getByText("A test article.")).toHaveClass(
    "tw-font-semibold",
    "tw-text-white"
  );

  await waitFor(() =>
    expect(screen.getByText("child content")).toBeInTheDocument()
  );
});

test("keeps the FAQ section title aligned inside the article shell", async () => {
  mockLoadDelegationArticleHtml.mockResolvedValue({
    article: {
      title: "Hello World",
      summary: "A test article.",
      group: "Reference",
      path: "html/page.html",
      sourceUrl: "",
      sourceUri: null,
      sha256: "hash",
    },
    html: "<p>content</p>",
    url: "/delegation-content/test/html/page.html",
  });

  const { rerender } = render(
    <DelegationHTML path="page" title="Delegation FAQ" />
  );
  const indexTitle = screen.getByRole("heading", {
    level: 1,
    name: "Delegation FAQ",
  });
  const titleClasses = indexTitle.getAttribute("class");
  expect(indexTitle.parentElement).toHaveClass("tw-mb-6");
  expect(indexTitle.parentElement?.parentElement).toHaveClass("tw-mx-auto");

  rerender(<DelegationHTML path="child" />);
  const childSectionTitle = screen.getByText("Delegation FAQ", {
    selector: "p",
  });
  expect(childSectionTitle).toHaveAttribute("class", titleClasses);
  expect(childSectionTitle.parentElement).toHaveClass("tw-mb-6");
  expect(childSectionTitle.parentElement?.parentElement).toHaveClass(
    "tw-mx-auto"
  );
});

test("uses client navigation for internal links from fetched html", async () => {
  mockLoadDelegationArticleHtml.mockResolvedValue({
    article: {
      title: "Hello World",
      summary: "A test article.",
      group: "Reference",
      path: "html/page.html",
      sourceUrl: "",
      sourceUri: null,
      sha256: "hash",
    },
    html: `
      <a href="/delegation/delegation-faq/child">Child article</a>
      <a href="https://example.com/article">External article</a>
      <a href="/delegation/delegation-faq/child" target="_blank">Child article in new tab</a>
    `,
    url: "/delegation-content/test/html/page.html",
  });

  render(<DelegationHTML path="page" title="Delegation FAQ" />);
  const internalLink = await screen.findByRole("link", {
    name: "Child article",
  });

  fireEvent.mouseOver(internalLink);
  expect(mockRouterPrefetch).toHaveBeenCalledWith(
    "/delegation/delegation-faq/child"
  );
  expect(mockLoadDelegationArticleHtml).toHaveBeenCalledWith("child");

  fireEvent.mouseOver(screen.getByRole("link", { name: "External article" }));
  fireEvent.mouseOver(
    screen.getByRole("link", { name: "Child article in new tab" })
  );
  expect(mockRouterPrefetch).toHaveBeenCalledTimes(1);

  fireEvent.click(internalLink);
  expect(mockRouterPush).toHaveBeenCalledWith(
    "/delegation/delegation-faq/child"
  );
});

test("renders a prefetched article immediately on route change", async () => {
  const cachedChild = {
    article: {
      title: "Child Article",
      summary: "A test article.",
      group: "Reference",
      path: "html/child.html",
      sourceUrl: "",
      sourceUri: null,
      sha256: "hash",
    },
    html: "<p>cached child content</p>",
    url: "/delegation-content/test/html/child.html",
  };
  mockGetCachedDelegationArticleHtml.mockImplementation((slug) =>
    slug === "child" ? cachedChild : undefined
  );
  mockLoadDelegationArticleHtml.mockResolvedValue({
    ...cachedChild,
    article: {
      ...cachedChild.article,
      title: "Hello World",
      path: "html/page.html",
    },
    html: "<p>index content</p>",
  });

  const { rerender } = render(
    <DelegationHTML path="page" title="Delegation FAQ" />
  );
  await screen.findByText("index content");

  rerender(<DelegationHTML path="child" />);

  expect(screen.getByText("cached child content")).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(mockLoadDelegationArticleHtml).not.toHaveBeenCalledWith("child");
});

test("renders a stable loading placeholder", () => {
  mockLoadDelegationArticleHtml.mockReturnValue(new Promise(() => undefined));

  render(<DelegationHTML path="page" title="Delegation FAQ" />);

  const status = screen.getByRole("status");
  expect(status).toHaveTextContent("Loading article...");
  expect(status).toHaveClass("tw-min-h-48");
});

test("shows 404 page when fetch fails", async () => {
  mockLoadDelegationArticleHtml.mockRejectedValue(new Error("missing"));
  render(<DelegationHTML path="missing" title="Missing" />);
  await waitFor(() =>
    expect(screen.getByText("404 | PAGE NOT FOUND")).toBeInTheDocument()
  );
});
