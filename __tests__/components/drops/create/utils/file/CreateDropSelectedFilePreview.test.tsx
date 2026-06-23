import React from "react";
import { render, waitFor } from "@testing-library/react";
import CreateDropSelectedFilePreview from "@/components/drops/create/utils/file/CreateDropSelectedFilePreview";

let createObjectURLMock: jest.Mock;
let revokeObjectURLMock: jest.Mock;

beforeEach(() => {
  createObjectURLMock = jest.fn(() => "blob:preview");
  revokeObjectURLMock = jest.fn();

  (global as any).URL.createObjectURL = createObjectURLMock;
  (global as any).URL.revokeObjectURL = revokeObjectURLMock;
});

describe("CreateDropSelectedFilePreview", () => {
  it("renders image preview and reuses its blob URL on rerender", async () => {
    const file = new File(["a"], "img.png", { type: "image/png" });
    const { container, rerender, unmount } = render(
      <CreateDropSelectedFilePreview file={file} />
    );

    await waitFor(() => {
      expect(container.querySelector("img")).toHaveAttribute(
        "src",
        "blob:preview"
      );
    });
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);

    rerender(<CreateDropSelectedFilePreview file={file} />);

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:preview");
  });

  it("renders video preview and reuses its blob URL on rerender", async () => {
    const file = new File(["a"], "vid.mp4", { type: "video/mp4" });
    const { container, rerender, unmount } = render(
      <CreateDropSelectedFilePreview file={file} />
    );

    const video = container.querySelector("video");
    await waitFor(() => {
      expect(video).toHaveAttribute("src", "blob:preview");
    });
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("controls");
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);

    rerender(<CreateDropSelectedFilePreview file={file} />);

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:preview");
  });

  it("renders audio preview and reuses its blob URL on rerender", async () => {
    const file = new File(["a"], "sound.mp3", { type: "audio/mpeg" });
    const { container, rerender, unmount } = render(
      <CreateDropSelectedFilePreview file={file} />
    );

    await waitFor(() => {
      expect(container.querySelector("source")).toHaveAttribute(
        "src",
        "blob:preview"
      );
    });
    expect(container.querySelector("audio")).toBeInTheDocument();
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);

    rerender(<CreateDropSelectedFilePreview file={file} />);

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:preview");
  });

  it("renders nothing for unknown type", () => {
    const file = new File(["a"], "file.bin", {
      type: "application/octet-stream",
    });
    const { container } = render(<CreateDropSelectedFilePreview file={file} />);
    expect(container.querySelector("img,video,audio")).toBeNull();
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });
});
