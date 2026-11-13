import { fireEvent, render, screen } from "@testing-library/react";

import UnsupportedMediaLink from "@/components/drops/view/item/content/media/UnsupportedMediaLink";

const CID = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

/** Clicks twice: the first press asks for confirmation. */
function openTwice() {
  const button = screen.getByRole("button");
  fireEvent.click(button);
  fireEvent.click(button);
}

describe("UnsupportedMediaLink", () => {
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it("opens an https file after confirmation, without opener or referrer", () => {
    render(<UnsupportedMediaLink media_url="https://cdn.example/file.xyz" />);

    fireEvent.click(screen.getByRole("button"));
    expect(openSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Open anyway — may be unsafe")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(openSpy).toHaveBeenCalledWith(
      "https://cdn.example/file.xyz",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("opens an ipfs file through the media resolver", () => {
    render(<UnsupportedMediaLink media_url={`ipfs://${CID}/file.xyz`} />);

    openTwice();
    expect(openSpy).toHaveBeenCalledWith(
      `https://media.6529.io/ipfs/${CID}/file.xyz`,
      "_blank",
      "noopener,noreferrer"
    );
  });

  it.each([
    "http://cdn.example/file.xyz",
    "javascript:alert(1)",
    "data:text/html,hello",
    "ftp://cdn.example/file.xyz",
  ])("shows %s as text with nothing to open", (url) => {
    render(<UnsupportedMediaLink media_url={url} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
  });
});
