import { render, screen } from "@testing-library/react";
import { MessageMarkdown } from "@/components/markdown/MessageMarkdown";

it("enforces private links and images even when public renderers are supplied", () => {
  const anchor = jest.fn(() => <iframe title="embed" />);
  const image = jest.fn(() => (
    <img alt="remote" src="https://private.invalid/image" />
  ));
  const { container } = render(
    <MessageMarkdown
      privacy="private"
      text="[Private link](https://private.invalid/link) ![Private image](https://private.invalid/image)"
      components={{ a: anchor, img: image }}
    />
  );
  expect(anchor).not.toHaveBeenCalled();
  expect(image).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Private image" })).toHaveAttribute(
    "href",
    "https://private.invalid/image"
  );
  expect(container.querySelector("img,iframe,video,audio,source")).toBeNull();
});

it.each(["public", "private"] as const)(
  "%s notification previews keep formatting without nested links or resource elements",
  (privacy) => {
    const longText = "formatted ".repeat(30).trim();
    const { container } = render(
      <a href="/destination">
        <MessageMarkdown
          privacy={privacy}
          preview
          text={`**${longText}**\n\n[label](https://example.com) ![Image](https://example.com/image.png)\n\n- [x] Done`}
          components={{
            a: () => <a href="/unexpected">Unexpected</a>,
            img: () => <img alt="Unexpected" src="/unexpected.png" />,
          }}
        />
      </a>
    );
    expect(screen.getByText(longText).tagName).toBe("STRONG");
    expect(screen.getByText("label")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/destination");
    expect(
      container.querySelector("a a,img,iframe,video,audio,input")
    ).toBeNull();
  }
);

it("shares structural formatting between public and private messages", () => {
  const text =
    "# Heading\n\n**Bold** *italic* ~~gone~~\n\n> Quote\n\n- First\n  - Nested\n\n3) Third\n4) Fourth\n\n`code`\n\n| Key |\n| --- |\n| Value |";
  const { container } = render(
    <>
      <section aria-label="Public">
        <MessageMarkdown text={text} privacy="public" />
      </section>
      <section aria-label="Private">
        <MessageMarkdown text={text} privacy="private" />
      </section>
    </>
  );
  const bodies = container.children;
  const snapshot = (element: Element) =>
    [
      ...element.querySelectorAll(
        "h1,p,strong,em,del,blockquote,ul,ol,li,code,table"
      ),
    ].map((node) => ({
      tag: node.tagName,
      text: node.textContent,
      className: node.className,
    }));
  expect(snapshot(bodies[0]!)).toEqual(snapshot(bodies[1]!));
});

it.each(["public", "private"] as const)(
  "announces task state without interactive checkboxes in %s previews",
  (privacy) => {
    const { container } = render(
      <MessageMarkdown
        privacy={privacy}
        preview
        text={"- [x] Complete\n- [ ] Pending"}
      />
    );
    expect(screen.getByRole("img", { name: "Checked task" })).toHaveTextContent(
      "☑"
    );
    expect(
      screen.getByRole("img", { name: "Unchecked task" })
    ).toHaveTextContent("☐");
    expect(container.querySelector("input")).toBeNull();
  }
);
