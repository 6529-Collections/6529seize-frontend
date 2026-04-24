import AttachmentMediaDisplay from "@/components/drops/view/item/content/media/AttachmentMediaDisplay";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("AttachmentMediaDisplay", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders labels based on attachment type detection", () => {
    const { rerender } = render(
      <AttachmentMediaDisplay
        media_mime_type="application/pdf"
        media_url="https://x/a"
      />
    );

    expect(screen.getByText("PDF")).toBeInTheDocument();

    rerender(
      <AttachmentMediaDisplay media_mime_type="" media_url="https://x/a.csv" />
    );

    expect(screen.getByText("CSV")).toBeInTheDocument();

    rerender(
      <AttachmentMediaDisplay
        media_mime_type="image/webp"
        media_url="https://x/a.webp"
      />
    );

    expect(screen.getByText("File")).toBeInTheDocument();
  });

  it("shows a PDF attachment before rendering it on demand", async () => {
    const user = userEvent.setup();

    render(
      <AttachmentMediaDisplay
        media_mime_type="application/pdf"
        media_url="https://example.com/files/paper.pdf"
      />
    );

    expect(screen.getByText("paper.pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download/i })).toHaveAttribute(
      "href",
      "https://example.com/files/paper.pdf"
    );
    expect(screen.queryByTitle("paper.pdf")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Render" }));

    expect(screen.getByTitle("paper.pdf")).toHaveAttribute(
      "src",
      "https://example.com/files/paper.pdf"
    );
  });

  it("renders a CSV preview after the user requests it", async () => {
    const user = userEvent.setup();
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      text: async () => "name,value\nalpha,1",
    } as Response);

    render(
      <AttachmentMediaDisplay
        media_mime_type="text/csv"
        media_url="https://example.com/files/data.csv"
      />
    );

    await user.click(screen.getByRole("button", { name: "Render" }));

    await waitFor(() => {
      expect(screen.getByText("alpha")).toBeInTheDocument();
    });
    expect(screen.getByText("value")).toBeInTheDocument();
  });
});
