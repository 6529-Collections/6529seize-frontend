import React from "react";
import { render, screen } from "@testing-library/react";
import AboutHTML from "@/components/about/AboutHTML";
import { fetchAboutSectionFile } from "@/components/about/about.helpers";

jest.mock("@/components/about/about.helpers", () => ({
  fetchAboutSectionFile: jest.fn(() =>
    Promise.resolve("<div><p>HTML Content</p></div>")
  ),
}));

const fetchAboutSectionFileMock = fetchAboutSectionFile as jest.Mock;

const ENS_DOCUMENT = [
  '<p class="text-right">Last Updated: July 13, 2023</p>',
  "Contents:",
  '<ul><li><a href="#register_ens">How to register</a></li></ul>',
  "<br />",
  '<h4 id="register_ens">How to register an ENS domain name</h4>',
  "<ol>",
  "<li>",
  'Navigate to <a href="https://ens.domains" target="_blank" rel="noreferrer">https://ens.domains</a>',
  "and click on the &apos;Go to app&apos; button.",
  '<div class="d-flex justify-content-center pt-4 pb-4">',
  '<img style="max-width: 100%; max-height: 80vh" src="https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/about/images/ens/register_1.png" />',
  "</div>",
  "</li>",
  "<li>",
  "Choose a payment method.",
  "<br />",
  "When you select the Ethereum payment method it&apos;s recommended to enable",
  "the Use of the domain name as a primary name.",
  "<br />",
  "If you select the Credit or debit card method, then you will need to revisit",
  "your profile and set the primary domain name.",
  "</li>",
  "<li>Click the Finish button and open app.safe.global.</li>",
  "<li>",
  "Once the 2nd transaction is executed successfully your name will be",
  "registered.",
  "</li>",
  "</ol>",
].join("\n");

async function renderAbout(path: string, html: string) {
  fetchAboutSectionFileMock.mockResolvedValueOnce(html);
  const { container } = render(<AboutHTML title="Title" path={path} />);
  await screen.findByRole("heading", { name: "Title" });
  return container;
}

describe("AboutHTML", () => {
  it("splits title when containing spaces", async () => {
    render(<AboutHTML title="Test Title" path="test.html" />);
    const heading = await screen.findByRole("heading", {
      name: /Test Title/,
    });
    expect(heading).toHaveTextContent("Test Title");
  });

  it("renders title without split", async () => {
    render(<AboutHTML title="Single" path="test.html" />);
    expect(
      await screen.findByRole("heading", { name: "Single" })
    ).toBeInTheDocument();
  });

  it("renders fetched html", async () => {
    render(<AboutHTML title="Title" path="test.html" />);
    expect(await screen.findByText("HTML Content")).toBeInTheDocument();
  });

  it("renders nothing for the content until the document is fetched and sanitized", () => {
    fetchAboutSectionFileMock.mockReturnValueOnce(new Promise(() => undefined));

    render(<AboutHTML title="Title" path="test.html" />);

    expect(screen.queryByText("HTML Content")).not.toBeInTheDocument();
  });

  it("sanitizes fetched html", async () => {
    fetchAboutSectionFileMock.mockResolvedValueOnce(
      '<div onclick="alert(1)"><p>Safe content</p><script>window.hacked = 1</script>' +
        '<a href="javascript:alert(1)">Unsafe link</a>' +
        '<a href="https://example.com" target="_blank">Safe link</a>' +
        '<img src="x" onerror="alert(2)"><iframe src="https://example.com"></iframe></div>'
    );

    const { container } = render(<AboutHTML title="Title" path="test.html" />);

    const safeContent = await screen.findByText("Safe content");
    expect(safeContent.parentElement).not.toHaveAttribute("onclick");
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("img[onerror]")).toBeNull();
    expect(screen.getByText("Unsafe link")).not.toHaveAttribute("href");
    expect(screen.getByRole("link", { name: "Safe link" })).toHaveAttribute(
      "rel",
      "noopener noreferrer"
    );
  });

  it("shows nothing when the document cannot be fetched", async () => {
    fetchAboutSectionFileMock.mockRejectedValueOnce(new Error("offline"));

    render(<AboutHTML title="Title" path="test.html" />);

    expect(
      await screen.findByRole("heading", { name: "Title" })
    ).toBeInTheDocument();
    expect(screen.queryByText("HTML Content")).not.toBeInTheDocument();
  });

  describe("ENS document", () => {
    it("keeps the ENS document structure, links and images", async () => {
      const container = await renderAbout("ens", ENS_DOCUMENT);

      await screen.findByText(/How to register an ENS domain name/);
      expect(container.querySelector("h4#register_ens")).not.toBeNull();
      expect(
        container.querySelector('a[href="#register_ens"]')
      ).toBeInTheDocument();

      const ensLink = container.querySelector('a[href="https://ens.domains"]');
      expect(ensLink).toHaveAttribute("target", "_blank");
      expect(ensLink).toHaveAttribute("rel", "noopener noreferrer");

      const image = container.querySelector("img");
      expect(image).toHaveAttribute(
        "src",
        "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/about/images/ens/register_1.png"
      );
      expect(image).toHaveAttribute(
        "style",
        "max-width: 100%; max-height: 80vh"
      );
    });

    it("keeps the presentation markup added for the ENS document", async () => {
      const container = await renderAbout("ens", ENS_DOCUMENT);

      await screen.findByText(/How to register an ENS domain name/);

      const notes = container.querySelector("ul[data-ens-payment-notes]");
      expect(notes?.querySelectorAll("li")).toHaveLength(2);
      expect(notes?.textContent).toContain(
        "it's recommended to enable the Use of the domain name as a primary name."
      );

      const success = container.querySelector(
        "span[data-ens-registration-success]"
      );
      expect(success).toHaveTextContent(
        "Once the 2nd transaction is executed successfully your name will be registered."
      );
      expect(success?.getAttribute("class")).toContain("tw-text-emerald-400");
      expect(
        success?.querySelector('span[aria-hidden="true"]')
      ).toHaveTextContent("✓");

      expect(
        container.querySelector("a[href='https://ens.domains']")
      ).toHaveClass("tw-text-primary-300");
      expect(screen.getByText("app.safe.global")).toHaveClass(
        "tw-text-primary-300"
      );
      expect(screen.getByText("Finish")).toHaveClass("tw-text-iron-100");
    });

    it("drops classes and markup that the formatter did not add", async () => {
      const container = await renderAbout(
        "ens",
        '<div class="tw-fixed tw-inset-0 d-flex"><p class="tw-fixed">Text</p>' +
          '<span class="tw-fixed" data-ens-registration-success onclick="alert(1)">Span</span>' +
          '<script>window.hacked = 1</script><a href="javascript:alert(1)">Bad</a></div>'
      );

      await screen.findByText("Text");
      expect(container.querySelector(".tw-fixed")).toBeNull();
      expect(container.querySelector("script")).toBeNull();
      expect(container.querySelector("[onclick]")).toBeNull();
      expect(screen.getByText("Bad")).not.toHaveAttribute("href");
    });
  });
});
