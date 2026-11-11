import { render, screen, waitFor } from "@testing-library/react";
import { E2eeMarkdown } from "@/components/e2ee/conversation/E2eeMarkdown";
import { member } from "./fakeE2eeEngine";
import type { SupportedLocale } from "@/i18n/locales";
import { loadLocaleMessages } from "@/i18n/messages";

let mockLocale: SupportedLocale = "en-US";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => mockLocale,
}));
afterEach(() => {
  mockLocale = "en-US";
});

jest.mock("@/components/e2ee/ui/E2eeProfileLink", () => ({
  E2eeProfileLink: ({ children }: { children: React.ReactNode }) => (
    <a href="/bob">{children}</a>
  ),
}));
jest.mock("@/components/e2ee/conversation/E2eeEmojiProvider", () => ({
  useE2eeEmojis: () => ({
    sources: new Map([["gm", "data:image/png;base64,aGVsbG8="]]),
    native: new Map(),
  }),
}));

const props = {
  messageId: "test-message",
  members: [member("bob-id", "bob")],
  mentions: ["bob-id"],
  selfProfileId: "self",
};

it.each([
  ["en-US", "Image from example.com", "Message table"],
  ["en-GB", "Image from example.com", "Message table"],
  ["fr-FR", "Image de example.com", "Tableau du message"],
  ["es-ES", "Imagen de example.com", "Tabla del mensaje"],
  ["de-DE", "Bild von example.com", "Nachrichtentabelle"],
] as const)(
  "names image links and keyboard-scrollable tables in %s",
  async (locale, imageName, tableName) => {
    mockLocale = locale;
    await loadLocaleMessages(locale);
    render(
      <E2eeMarkdown
        {...props}
        text={
          "![](https://example.com/private-token.png)\n\n| Key |\n| --- |\n| Value |"
        }
      />
    );
    expect(screen.getByRole("link", { name: imageName })).toHaveAttribute(
      "href",
      "https://example.com/private-token.png"
    );
    expect(screen.getByRole("region", { name: tableName })).toHaveAttribute(
      "tabindex",
      "0"
    );
  }
);

it("renders Markdown and GFM with the real parser", () => {
  const { container } = render(
    <E2eeMarkdown
      {...props}
      text={
        "# Heading\n\n**bold** *italic* ~~deleted~~\n\n> quoted\n\n- outer\n  - nested\n\n3) third\n4) fourth\n\n- [x] done\n- [ ] todo\n\n| Key | Value |\n| --- | --- |\n| a | b |\n\n---"
      }
    />
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Heading"
  );
  expect(container.querySelector("strong")).toHaveTextContent("bold");
  expect(container.querySelector("em")).toHaveTextContent("italic");
  expect(container.querySelector("del")).toHaveTextContent("deleted");
  expect(container.querySelector("blockquote")).toHaveTextContent("quoted");
  expect(container.querySelector("ul ul")).toHaveTextContent("nested");
  expect(container.querySelector("ol")).toHaveAttribute("start", "3");
  expect(container.querySelector("ol")).toHaveClass(
    "drop-markdown-ordered-list-paren"
  );
  expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
  expect(screen.getAllByRole("checkbox")[1]).not.toBeChecked();
  expect(screen.getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
    "a",
    "b",
  ]);
  expect(screen.getByRole("separator")).toBeInTheDocument();
});

it("keeps a linked image label inside its authored link and standalone images linked", () => {
  const { container } = render(
    <E2eeMarkdown
      {...props}
      text="[![Photo](https://example.com/photo.png)](https://example.com/post)\n\n![Standalone](https://example.com/standalone.png)"
    />
  );
  expect(screen.getByRole("link", { name: "Photo" })).toHaveAttribute(
    "href",
    "https://example.com/post"
  );
  expect(screen.getByRole("link", { name: "Standalone" })).toHaveAttribute(
    "href",
    "https://example.com/standalone.png"
  );
  expect(screen.getAllByRole("link")).toHaveLength(2);
  expect(container.querySelector("a a,img")).toBeNull();
});

it("keeps member mentions and catalog emoji in prose and leaves code literal", async () => {
  const { container } = render(
    <E2eeMarkdown
      {...props}
      text={
        '**@bob :gm:**\n\n`@bob :gm: https://example.com`\n\n```ts\nconst msg = "@bob :gm:";\n```'
      }
    />
  );
  expect(screen.getAllByRole("link", { name: "@bob" })).toHaveLength(1);
  expect(screen.getAllByRole("img", { name: ":gm:" })).toHaveLength(1);
  const inline = container.querySelector("p code");
  expect(inline).toHaveTextContent("@bob :gm: https://example.com");
  expect(inline?.querySelector("a, img")).toBeNull();
  const code = container.querySelector("pre code");
  await waitFor(() => expect(code).toHaveClass("hljs"));
  expect(code).toHaveTextContent('const msg = "@bob :gm:";');
  expect(code?.querySelector("a, img")).toBeNull();
});

it("renders URLs and images as explicit safe anchors without resource elements", () => {
  const { container } = render(
    <E2eeMarkdown
      {...props}
      text={
        'https://example.com/private\n\n[label](https://example.com/named)\n\n![private image](https://example.com/tracker.png)\n\n[bad](javascript:alert)\n\n<img src="https://example.com/html-tracker.png"><iframe src="https://example.com/embed"></iframe>\n\n![svg](data:image/svg+xml;base64,PHN2Zz4=)'
      }
    />
  );
  for (const label of [
    "https://example.com/private",
    "label",
    "private image",
  ]) {
    const link = screen.getByRole("link", { name: label });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow ugc");
  }
  expect(screen.queryByRole("link", { name: "bad" })).toBeNull();
  expect(screen.queryByRole("link", { name: "svg" })).toBeNull();
  expect(
    container.querySelector("img, iframe, video, audio, source, script, link")
  ).toBeNull();
});

it("keeps mentioned members as labels in a compact preview inside a notification link", () => {
  const { container } = render(
    <a href="/messages/encrypted/group">
      <E2eeMarkdown
        {...props}
        preview
        text="**@bob** [Link](https://example.com) ![Image](https://example.com/image.png)"
      />
    </a>
  );
  expect(container.querySelector("strong")).toHaveTextContent("@bob");
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(container.querySelector("a a,img,iframe,input")).toBeNull();
});

it("preserves blank lines and isolates footnotes even when the same message renders twice", () => {
  const { container } = render(
    <>
      <E2eeMarkdown
        {...props}
        text={"First\n\n\nSecond[^1]\n\n[^1]: Footnote"}
      />
      <E2eeMarkdown {...props} text={"Third[^1]\n\n[^1]: Other footnote"} />
    </>
  );
  expect(
    [...container.querySelectorAll("p")].some((p) => p.textContent === "\u00a0")
  ).toBe(true);
  const references = container.querySelectorAll("a[data-footnote-ref]");
  expect(references).toHaveLength(2);
  const targets = [...references].map((a) => a.getAttribute("href"));
  expect(new Set(targets).size).toBe(2);
  for (const target of targets) {
    expect(
      container.querySelector(`[id="${target?.slice(1)}"]`)
    ).not.toBeNull();
  }
  for (const backlink of container.querySelectorAll(
    "a[data-footnote-backref]"
  )) {
    expect(backlink).not.toHaveAttribute("target");
    expect(
      container.querySelector(
        `[id="${backlink.getAttribute("href")?.slice(1)}"]`
      )
    ).not.toBeNull();
  }
  expect(container.querySelector("a[node],a[ref]")).toBeNull();
});

it("refreshes highlighted code after an edit without duplicating text", async () => {
  const { container, rerender } = render(
    <E2eeMarkdown {...props} text={"```ts\nconst old = 1;\n```"} />
  );
  await waitFor(() =>
    expect(container.querySelector("pre code")).toHaveClass("hljs")
  );
  rerender(<E2eeMarkdown {...props} text={"```ts\nconst updated = 2;\n```"} />);
  await waitFor(() =>
    expect(container.querySelector("pre code")).toHaveTextContent(
      "const updated = 2;"
    )
  );
  expect(container.querySelector("pre code")).not.toHaveTextContent(
    "const old"
  );
});

it("keeps extra blank lines and literal spacing inside fenced code", async () => {
  const code = "const first = 1;\n\n\nconst last = 2;\n";
  const { container } = render(
    <E2eeMarkdown {...props} text={`\`\`\`ts\n${code}\`\`\``} />
  );
  await waitFor(() =>
    expect(container.querySelector("pre code")).toHaveClass("hljs")
  );
  expect(container.querySelector("pre code")?.textContent).toBe(code);
});
