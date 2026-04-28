import DropAttachmentDisplay from "@/components/drops/view/item/content/attachments/DropAttachmentDisplay";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) =>
    url.startsWith("ipfs://")
      ? `https://ipfs.example.com/ipfs/${url.slice(7)}`
      : url,
}));

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard"
);
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
const hadCreateObjectURL = "createObjectURL" in URL;
const hadRevokeObjectURL = "revokeObjectURL" in URL;

describe("DropAttachmentDisplay", () => {
  afterEach(() => {
    jest.restoreAllMocks();

    if (originalClipboardDescriptor) {
      Object.defineProperty(
        navigator,
        "clipboard",
        originalClipboardDescriptor
      );
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }

    if (hadCreateObjectURL) {
      URL.createObjectURL = originalCreateObjectURL;
    } else {
      Reflect.deleteProperty(URL, "createObjectURL");
    }

    if (hadRevokeObjectURL) {
      URL.revokeObjectURL = originalRevokeObjectURL;
    } else {
      Reflect.deleteProperty(URL, "revokeObjectURL");
    }
  });

  it("renders labels based on attachment type detection", () => {
    const { rerender } = render(
      <DropAttachmentDisplay
        mimeType="application/pdf"
        attachmentUrl="https://x/a"
      />
    );

    expect(screen.getByText("PDF")).toBeInTheDocument();

    rerender(
      <DropAttachmentDisplay mimeType="" attachmentUrl="https://x/a.csv" />
    );

    expect(screen.getByText("CSV")).toBeInTheDocument();

    rerender(
      <DropAttachmentDisplay
        mimeType="image/webp"
        attachmentUrl="https://x/a.webp"
      />
    );

    expect(screen.getByText("File")).toBeInTheDocument();
  });

  it("shows a PDF attachment before rendering it on demand", async () => {
    const user = userEvent.setup();
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["pdf"], { type: "application/pdf" }),
    } as Response);
    if (URL.createObjectURL === undefined) {
      (URL as { createObjectURL: (blob: Blob) => string }).createObjectURL =
        () => "";
    }
    if (URL.revokeObjectURL === undefined) {
      (URL as { revokeObjectURL: (url: string) => void }).revokeObjectURL =
        () => {};
    }
    const createObjectURLSpy = jest
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test");
    const revokeObjectURLSpy = jest
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(
      <DropAttachmentDisplay
        mimeType="application/pdf"
        attachmentUrl="https://example.com/files/paper.pdf"
      />
    );

    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("paper.pdf")).toBeInTheDocument();
    expect(screen.queryByTitle("paper.pdf")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Render attachment preview" })
    );

    expect(screen.getByTitle("paper.pdf")).toHaveAttribute(
      "src",
      "https://example.com/files/paper.pdf"
    );

    expect(
      screen.getByRole("link", { name: "Open attachment" })
    ).toHaveAttribute("href", "https://example.com/files/paper.pdf");

    await user.click(
      screen.getByRole("button", { name: "Download attachment" })
    );

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test");
  });

  it("uses the provided attachment file name instead of deriving it from the URL", () => {
    render(
      <DropAttachmentDisplay
        mimeType="application/pdf"
        attachmentUrl="https://example.com/ipfs/QmHash/original.pdf"
        fileName="sample.pdf"
      />
    );

    expect(screen.getByText("sample.pdf")).toBeInTheDocument();
    expect(screen.queryByText("original.pdf")).not.toBeInTheDocument();
  });

  it("renders a CSV preview after the user requests it", async () => {
    const user = userEvent.setup();
    jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      body: null,
      text: async () => "name,value\nalpha,1",
    } as Response);

    render(
      <DropAttachmentDisplay
        mimeType="text/csv"
        attachmentUrl="https://example.com/files/data.csv"
      />
    );

    expect(screen.queryByText("alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("value")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Render attachment preview" })
    );

    await waitFor(() => {
      expect(screen.getByText("alpha")).toBeInTheDocument();
    });
    expect(screen.getByText("value")).toBeInTheDocument();
  });

  it("does not show an open-in-new-tab action for CSV attachments", () => {
    render(
      <DropAttachmentDisplay
        mimeType="text/csv"
        attachmentUrl="https://example.com/files/data.csv"
      />
    );

    expect(
      screen.queryByRole("link", { name: "Open attachment" })
    ).not.toBeInTheDocument();
  });

  it("copies CSV attachment links without showing the PDF open action", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <DropAttachmentDisplay
        mimeType="text/csv"
        attachmentUrl="https://example.com/files/data.csv"
      />
    );

    const copyButton = screen.getByRole("button", {
      name: "Copy attachment link",
    });
    await user.click(copyButton);

    expect(writeText).toHaveBeenCalledWith(
      "https://example.com/files/data.csv"
    );
    expect(copyButton).toHaveAttribute("title", "Copied");
    expect(copyButton).toHaveClass("tw-border-primary-400");
    expect(
      screen.queryByRole("link", { name: "Open attachment" })
    ).not.toBeInTheDocument();
  });

  it("resolves ipfs attachment URLs through the configured gateway", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <DropAttachmentDisplay
        mimeType="text/csv"
        attachmentUrl="ipfs://bafybeigateway/sample.csv"
        fileName="sample.csv"
      />
    );

    await user.click(
      screen.getByRole("button", { name: "Copy attachment link" })
    );

    expect(writeText).toHaveBeenCalledWith(
      "https://ipfs.example.com/ipfs/bafybeigateway/sample.csv"
    );
  });
});
