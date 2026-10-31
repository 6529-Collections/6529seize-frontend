import {
  DOCUMENT_HTML_PROFILE,
  sanitizeHtml,
  type HtmlSanitizeProfile,
} from "@/lib/security/sanitizeHtml";

function parse(html: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

describe("sanitizeHtml", () => {
  describe("removed markup", () => {
    it.each([
      ["script", "<p>Safe</p><script>window.hacked = 1</script>"],
      ["style", "<p>Safe</p><style>p { display: none }</style>"],
      ["iframe", '<p>Safe</p><iframe src="https://example.com"></iframe>'],
      ["form", '<p>Safe</p><form action="/x"><input name="a" /></form>'],
      ["object", '<p>Safe</p><object data="https://example.com/x"></object>'],
      [
        "svg",
        '<p>Safe</p><svg><a href="https://example.com"><text>x</text></a></svg>',
      ],
      ["math", "<p>Safe</p><math><mi>x</mi></math>"],
      ["template", "<p>Safe</p><template><p>hidden</p></template>"],
    ])("removes %s elements together with their content", (tag, html) => {
      const result = parse(sanitizeHtml(html));

      expect(result.textContent).toBe("Safe");
      expect(result.querySelector(tag)).toBeNull();
    });

    it("removes comments", () => {
      const result = sanitizeHtml("<p>Visible</p><!-- hidden note -->");

      expect(result).toBe("<p>Visible</p>");
    });

    it("keeps text that sits outside of any element", () => {
      expect(sanitizeHtml("Contents:<ul><li>One</li></ul>")).toBe(
        "Contents:<ul><li>One</li></ul>"
      );
    });

    it("removes every element that is not in a custom profile, with its content", () => {
      const profile: HtmlSanitizeProfile = { tags: new Set(["p", "div"]) };

      const result = sanitizeHtml(
        '<div class="x" onclick="alert(1)"><p id="a">Text</p><a href="https://example.com">Link</a><b>Bold</b></div>',
        profile
      );

      expect(result).toBe("<div><p>Text</p></div>");
    });

    it("returns an empty string when DOMParser is unavailable", () => {
      const original = globalThis.DOMParser;
      Object.defineProperty(globalThis, "DOMParser", {
        configurable: true,
        value: undefined,
      });

      try {
        expect(sanitizeHtml("<p>Text</p>")).toBe("");
      } finally {
        Object.defineProperty(globalThis, "DOMParser", {
          configurable: true,
          value: original,
        });
      }
    });
  });

  describe("attributes", () => {
    it("removes event handler attributes", () => {
      const result = parse(
        sanitizeHtml(
          '<p onclick="alert(1)" onmouseover="alert(2)">Text</p><img src="https://example.com/a.png" onerror="alert(3)" />'
        )
      );

      expect(result.querySelector("p")?.getAttributeNames()).toEqual([]);
      expect(result.querySelector("img")?.getAttributeNames()).toEqual(["src"]);
    });

    it("removes attributes that are not allowed for the element", () => {
      const result = parse(
        sanitizeHtml(
          '<div data-testid="x" role="button" tabindex="0" name="n" class="c">Text</div>'
        )
      );

      expect(result.querySelector("div")?.getAttributeNames()).toEqual([]);
    });

    it("keeps the in-page anchors used by the live ENS document", () => {
      const anchorIds = [
        "register_ens",
        "set_primary_name",
        "create_subdomain",
        "set_sub_domain",
        "domain_name_gnosis",
      ];
      const html =
        "<ul>" +
        anchorIds
          .map((id) => `<li><a href="#${id}">Go to ${id}</a></li>`)
          .join("") +
        "</ul>" +
        anchorIds.map((id) => `<h4 id="${id}">${id}</h4>`).join("");

      const result = parse(sanitizeHtml(html));

      expect(
        Array.from(result.querySelectorAll("h4")).map((heading) => heading.id)
      ).toEqual(anchorIds);
      for (const id of anchorIds) {
        expect(result.querySelector(`a[href="#${id}"]`)).not.toBeNull();
        expect(result.querySelector(`#${id}`)).toBe(
          result.querySelector(`h4#${id}`)
        );
      }
    });

    it.each(["location", "name", "length", "top", "body", "cookie", "forms"])(
      "drops the id %s because it shadows a window or document property",
      (id) => {
        const result = parse(sanitizeHtml(`<h4 id="${id}">Heading</h4>`));

        expect(result.querySelector("h4")?.hasAttribute("id")).toBe(false);
        expect(result.querySelector("h4")?.textContent).toBe("Heading");
      }
    );

    it.each(["9bad", "has space", 'quote"id', "a".repeat(101)])(
      "drops the malformed id %s",
      (id) => {
        const result = parse(sanitizeHtml(`<h4 id='${id}'>Heading</h4>`));

        expect(result.querySelector("h4")?.hasAttribute("id")).toBe(false);
      }
    );

    it("keeps class tokens only when the profile lists them", () => {
      const profile: HtmlSanitizeProfile = {
        ...DOCUMENT_HTML_PROFILE,
        attributes: { span: ["class"] },
        classTokens: new Set(["tw-font-semibold"]),
      };

      const withTokens = parse(
        sanitizeHtml(
          '<span class="tw-font-semibold tw-fixed tw-inset-0">A</span><span class="tw-fixed">B</span>',
          profile
        )
      );
      const withoutTokens = parse(
        sanitizeHtml('<span class="tw-font-semibold">A</span>')
      );

      const spans = withTokens.querySelectorAll("span");
      expect(spans[0]?.getAttribute("class")).toBe("tw-font-semibold");
      expect(spans[1]?.hasAttribute("class")).toBe(false);
      expect(withoutTokens.querySelector("span")?.hasAttribute("class")).toBe(
        false
      );
    });

    it("keeps simple size styles and drops everything else", () => {
      const result = parse(
        sanitizeHtml(
          '<img src="https://example.com/a.png" style="max-width: 100%; max-height: 60vh; position: fixed; background: url(https://example.com/x)" />' +
            '<img src="https://example.com/b.png" style="position: fixed; width: expression(alert(1))" />' +
            '<img src="https://example.com/c.png" style="width: 12px !important" />'
        )
      );
      const images = result.querySelectorAll("img");

      expect(images[0]?.getAttribute("style")).toBe(
        "max-width: 100%; max-height: 60vh"
      );
      expect(images[1]?.hasAttribute("style")).toBe(false);
      expect(images[2]?.hasAttribute("style")).toBe(false);
    });

    it("keeps numeric image and table dimensions only", () => {
      const result = parse(
        sanitizeHtml(
          '<img src="https://example.com/a.png" width="120" height="50%" />' +
            '<img src="https://example.com/b.png" width="1e3" height="auto" />' +
            '<table><tr><td colspan="2" rowspan="x">Cell</td></tr></table>'
        )
      );
      const images = result.querySelectorAll("img");
      const cell = result.querySelector("td");

      expect(images[0]?.getAttribute("width")).toBe("120");
      expect(images[0]?.getAttribute("height")).toBe("50%");
      expect(images[1]?.hasAttribute("width")).toBe(false);
      expect(images[1]?.hasAttribute("height")).toBe(false);
      expect(cell?.getAttribute("colspan")).toBe("2");
      expect(cell?.hasAttribute("rowspan")).toBe(false);
    });
  });

  describe("links and images", () => {
    it.each([
      "https://example.com/page",
      "http://example.com/page",
      "mailto:team@example.com",
      "tel:+15555550100",
      "#register_ens",
      "/about/ens",
      "relative/path.html",
    ])("keeps the safe href %s", (href) => {
      const result = parse(sanitizeHtml(`<a href="${href}">Link</a>`));

      expect(result.querySelector("a")?.getAttribute("href")).toBe(href);
    });

    it.each([
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      " javascript:alert(1)",
      "java\tscript:alert(1)",
      "java&#x0A;script:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "blob:https://example.com/id",
    ])("drops the unsafe href %s but keeps the link text", (href) => {
      const result = parse(sanitizeHtml(`<a href="${href}">Link text</a>`));
      const anchor = result.querySelector("a");

      expect(anchor?.hasAttribute("href")).toBe(false);
      expect(anchor?.textContent).toBe("Link text");
    });

    it("adds rel only to links that open a new browsing context", () => {
      const result = parse(
        sanitizeHtml(
          '<a href="https://example.com/a" target="_blank" rel="noreferrer">A</a>' +
            '<a href="https://example.com/b" target="_blank">B</a>' +
            '<a href="https://example.com/c" target="_top" rel="opener">C</a>' +
            '<a href="https://example.com/d" rel="opener">D</a>'
        )
      );
      const anchors = result.querySelectorAll("a");

      expect(anchors[0]?.getAttribute("target")).toBe("_blank");
      expect(anchors[0]?.getAttribute("rel")).toBe("noopener noreferrer");
      expect(anchors[1]?.getAttribute("rel")).toBe("noopener noreferrer");
      expect(anchors[2]?.hasAttribute("target")).toBe(false);
      expect(anchors[2]?.hasAttribute("rel")).toBe(false);
      expect(anchors[3]?.hasAttribute("rel")).toBe(false);
    });

    it("keeps https image sources and drops other schemes", () => {
      const result = parse(
        sanitizeHtml(
          '<img src="https://example.com/a.png" alt="A" />' +
            '<img src="http://example.com/b.png" alt="B" />' +
            '<img src="data:image/svg+xml,<svg onload=alert(1)>" alt="C" />' +
            '<img src="javascript:alert(1)" alt="D" />'
        )
      );
      const sources = Array.from(result.querySelectorAll("img")).map((image) =>
        image.getAttribute("src")
      );

      expect(sources).toEqual(["https://example.com/a.png", null, null, null]);
      expect(result.querySelector("img")?.getAttribute("alt")).toBe("A");
    });
  });

  describe("preserved structure", () => {
    it("keeps headings, lists, tables, links and images", () => {
      const html =
        '<h4 id="intro">How to use</h4><br>' +
        "<ol><li>Prepare<ul><li>Item</li></ul></li></ol>" +
        '<table><caption>Sizes</caption><thead><tr><th scope="col">A</th></tr></thead>' +
        "<tbody><tr><td>1</td></tr></tbody></table>" +
        '<p><a href="https://example.com" target="_blank">Example</a> <strong>bold</strong> <em>em</em></p>' +
        '<div><img src="https://example.com/a.png" alt="Alt text" /></div>';

      const result = parse(sanitizeHtml(html));

      expect(result.querySelector("h4#intro")?.textContent).toBe("How to use");
      expect(result.querySelectorAll("ol > li > ul > li")).toHaveLength(1);
      expect(result.querySelector("table caption")?.textContent).toBe("Sizes");
      expect(result.querySelector("th")?.getAttribute("scope")).toBe("col");
      expect(result.querySelectorAll("tbody td")).toHaveLength(1);
      expect(result.querySelector("p a")?.getAttribute("href")).toBe(
        "https://example.com"
      );
      expect(result.querySelector("p strong")?.textContent).toBe("bold");
      expect(result.querySelector("div img")?.getAttribute("alt")).toBe(
        "Alt text"
      );
    });

    it("keeps the attribute order of the original markup", () => {
      const result = sanitizeHtml(
        '<a href="https://ens.domains" target="_blank" rel="noreferrer">ENS</a>'
      );

      expect(result).toBe(
        '<a href="https://ens.domains" target="_blank" rel="noopener noreferrer">ENS</a>'
      );
    });

    it("is stable when applied to its own output", () => {
      const once = sanitizeHtml(
        '<h4 id="a">T</h4><a href="https://example.com" target="_blank">L</a><img src="https://example.com/a.png" style="max-height: 60vh">'
      );

      expect(sanitizeHtml(once)).toBe(once);
    });
  });
});
