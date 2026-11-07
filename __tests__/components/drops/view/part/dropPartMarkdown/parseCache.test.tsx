import { render } from "@testing-library/react";
import Markdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { Plugin } from "unified";
import {
  createMarkdownParseCache,
  MARKDOWN_PARSE_CACHE_MAX_ENTRIES,
} from "@/components/drops/view/part/dropPartMarkdown/parseCache";

/** Records how many top-level nodes each parse produced. */
const createParseRecorder = () => {
  const parsedNodeCounts: number[] = [];
  const recorder: Plugin<[]> = () => (tree) => {
    parsedNodeCounts.push(
      (tree as unknown as { children: unknown[] }).children.length
    );
  };
  return { recorder, parsedNodeCounts };
};

const CONTENT = "Hello **world**\n\n- one\n- [link](https://example.com)";

describe("markdown parse cache", () => {
  const renderWithCache = (
    cache: ReturnType<typeof createMarkdownParseCache>,
    content: string,
    namespace = "full"
  ) => {
    const { recorder, parsedNodeCounts } = createParseRecorder();
    const plugins = cache.plugins(namespace);
    const view = render(
      <Markdown
        remarkPlugins={[plugins.remark, remarkGfm, recorder]}
        rehypePlugins={[rehypeSanitize, plugins.rehype]}
      >
        {content}
      </Markdown>
    );
    return { html: view.container.innerHTML, parsedNodeCounts, view };
  };

  it("renders the same markup from the cache without parsing again", () => {
    const cache = createMarkdownParseCache();

    const first = renderWithCache(cache, CONTENT);
    const second = renderWithCache(cache, CONTENT);

    expect(first.parsedNodeCounts).toEqual([2]);
    // The parser returned an empty tree; the finished tree came from the cache.
    expect(second.parsedNodeCounts).toEqual([0]);
    expect(second.html).toBe(first.html);
    expect(second.html).toContain("<strong>world</strong>");
    expect(second.html).toContain('href="https://example.com"');
    expect(cache.size()).toBe(1);
  });

  it("parses different content and other namespaces separately", () => {
    const cache = createMarkdownParseCache();

    renderWithCache(cache, CONTENT);
    const otherContent = renderWithCache(cache, "Other *text*");
    const otherNamespace = renderWithCache(cache, CONTENT, "collapsed-preview");

    expect(otherContent.parsedNodeCounts).toEqual([1]);
    expect(otherContent.html).toContain("<em>text</em>");
    expect(otherNamespace.parsedNodeCounts).toEqual([2]);
    expect(cache.size()).toBe(3);
  });

  it("returns the same plugins for a namespace", () => {
    const cache = createMarkdownParseCache();

    expect(cache.plugins("full")).toBe(cache.plugins("full"));
    expect(cache.plugins("full")).not.toBe(cache.plugins("collapsed-preview"));
  });

  it("evicts the least recently used entry beyond its size", () => {
    const cache = createMarkdownParseCache(2);

    renderWithCache(cache, "a");
    renderWithCache(cache, "b");
    // Using "a" again makes "b" the least recently used.
    expect(renderWithCache(cache, "a").parsedNodeCounts).toEqual([0]);
    renderWithCache(cache, "c");

    expect(cache.size()).toBe(2);
    expect(renderWithCache(cache, "a").parsedNodeCounts).toEqual([0]);
    expect(renderWithCache(cache, "b").parsedNodeCounts).toEqual([1]);
  });

  it("keeps up to 2,000 entries by default", () => {
    expect(MARKDOWN_PARSE_CACHE_MAX_ENTRIES).toBe(2_000);
  });

  it.each([
    ["a trailing newline", "Line one\n"],
    ["Windows line endings", "Line one\r\nLine two\r\n\r\n- item"],
    ["surrounding whitespace", "  padded *text*  \n\n"],
  ])("hits the cache for content with %s", (_label, content) => {
    // The parser's input and the stored key must be the same string, or the
    // cache would never hit (or hit the wrong entry).
    const cache = createMarkdownParseCache();

    const first = renderWithCache(cache, content);
    const second = renderWithCache(cache, content);

    expect(second.parsedNodeCounts).toEqual([0]);
    expect(second.html).toBe(first.html);
    expect(cache.size()).toBe(1);
  });

  it("renders the same cached content in several instances independently", () => {
    const cache = createMarkdownParseCache();
    const plugins = cache.plugins("full");
    const markdown = (key: string) => (
      <div key={key} data-testid={key}>
        <Markdown
          remarkPlugins={[plugins.remark, remarkGfm]}
          rehypePlugins={[rehypeSanitize, plugins.rehype]}
        >
          {CONTENT}
        </Markdown>
      </div>
    );
    const { getByTestId, rerender } = render(
      <>
        {markdown("one")}
        {markdown("two")}
      </>
    );
    const expected = getByTestId("one").innerHTML;
    expect(getByTestId("two").innerHTML).toBe(expected);

    rerender(<>{markdown("two")}</>);
    rerender(
      <>
        {markdown("two")}
        {markdown("three")}
      </>
    );

    expect(getByTestId("two").innerHTML).toBe(expected);
    expect(getByTestId("three").innerHTML).toBe(expected);
    expect(cache.size()).toBe(1);
  });

  it("re-renders a cached tree with the same markup", () => {
    const cache = createMarkdownParseCache();
    const plugins = cache.plugins("full");
    const markdown = (content: string) => (
      <Markdown
        remarkPlugins={[plugins.remark, remarkGfm]}
        rehypePlugins={[rehypeSanitize, plugins.rehype]}
      >
        {content}
      </Markdown>
    );
    const { container, rerender } = render(markdown(CONTENT));
    const firstHtml = container.innerHTML;

    rerender(markdown(CONTENT));
    rerender(markdown(CONTENT));

    expect(container.innerHTML).toBe(firstHtml);
  });
});
