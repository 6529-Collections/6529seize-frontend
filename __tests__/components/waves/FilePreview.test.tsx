import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FilePreview from "@/components/waves/FilePreview";
import { getPreparedDropImage } from "@/services/uploads/prepareDropImage";

jest.mock("@/services/uploads/prepareDropImage", () => ({
  getPreparedDropImage: jest.fn(),
}));

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { XXLARGE: "XX" },
}));

let createObjectURLMock: jest.Mock;
let revokeObjectURLMock: jest.Mock;

beforeEach(() => {
  jest.mocked(getPreparedDropImage).mockReset();
  createObjectURLMock = jest.fn(() => "blob:url");
  revokeObjectURLMock = jest.fn();

  Object.defineProperty(global.URL, "createObjectURL", {
    writable: true,
    configurable: true,
    value: createObjectURLMock,
  });
  Object.defineProperty(global.URL, "revokeObjectURL", {
    writable: true,
    configurable: true,
    value: revokeObjectURLMock,
  });
});

describe("FilePreview", () => {
  const file = new File(["a"], "a.png", { type: "image/png" });

  it("mounts the AVIF preview only after its converted image is ready", () => {
    const avif = new File(["avif"], "photo.AVIF");
    const props = {
      files: [{ file: avif, label: null }],
      removeFile: jest.fn(),
      disabled: false,
    };
    const { rerender } = render(
      <FilePreview
        {...props}
        uploadingFiles={[
          { file: avif, isUploading: true, progress: 100, phase: "processing" },
        ]}
      />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(getPreparedDropImage).not.toHaveBeenCalled();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    jest.mocked(getPreparedDropImage).mockReturnValue({
      url: "https://media.example/photo.webp",
      mime_type: "image/webp",
    });
    rerender(<FilePreview {...props} uploadingFiles={[]} />);

    expect(
      screen.getByRole("img", { name: "Preview of photo.AVIF" })
    ).toHaveAttribute("src", "https://media.example/photo.webp");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it("shows image and remove button", async () => {
    const removeFile = jest.fn();
    render(
      <FilePreview
        files={[{ file, label: "img" }]}
        uploadingFiles={[]}
        removeFile={removeFile}
        disabled={false}
      />
    );
    expect(await screen.findByRole("img")).toHaveAttribute("src", "blob:url");
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText("Remove file"));
    expect(removeFile).toHaveBeenCalledWith(file);
    expect(screen.getByText("img")).toBeInTheDocument();
  });

  it("reuses the image blob URL when rerendering the same file", async () => {
    const { rerender } = render(
      <FilePreview
        files={[{ file, label: "img" }]}
        uploadingFiles={[]}
        removeFile={jest.fn()}
        disabled={false}
      />
    );

    expect(await screen.findByRole("img")).toHaveAttribute("src", "blob:url");
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);

    rerender(
      <FilePreview
        files={[{ file, label: "updated" }]}
        uploadingFiles={[]}
        removeFile={jest.fn()}
        disabled={false}
      />
    );

    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("img")).toHaveAttribute("src", "blob:url");
  });

  it("revokes the image blob URL on unmount", async () => {
    const { unmount } = render(
      <FilePreview
        files={[{ file, label: null }]}
        uploadingFiles={[]}
        removeFile={jest.fn()}
        disabled={false}
      />
    );

    expect(await screen.findByRole("img")).toHaveAttribute("src", "blob:url");
    unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:url");
  });

  it("revokes the old image blob URL when replacing the file", async () => {
    const nextFile = new File(["b"], "b.png", { type: "image/png" });
    createObjectURLMock
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second");

    const { rerender } = render(
      <FilePreview
        files={[{ file, label: null }]}
        uploadingFiles={[]}
        removeFile={jest.fn()}
        disabled={false}
      />
    );

    expect(await screen.findByRole("img")).toHaveAttribute("src", "blob:first");

    rerender(
      <FilePreview
        files={[{ file: nextFile, label: null }]}
        uploadingFiles={[]}
        removeFile={jest.fn()}
        disabled={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("img")).toHaveAttribute("src", "blob:second");
    });
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:first");
    expect(createObjectURLMock).toHaveBeenCalledTimes(2);
  });

  it("shows file type labels for non-image uploads", () => {
    render(
      <FilePreview
        files={[
          {
            file: new File(["pdf"], "deck.pdf", { type: "application/pdf" }),
            label: null,
          },
          {
            file: new File(["csv"], "data.csv", { type: "text/csv" }),
            label: null,
          },
        ]}
        uploadingFiles={[]}
        removeFile={jest.fn()}
        disabled={false}
      />
    );

    expect(screen.getByLabelText("PDF file: deck.pdf")).toBeInTheDocument();
    expect(screen.getByLabelText("CSV file: data.csv")).toBeInTheDocument();
    expect(screen.getByTitle("deck.pdf")).toHaveClass("tw-text-center");
    expect(screen.getByTitle("deck.pdf")).not.toHaveAttribute("dir");
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it("hides remove button when uploading", async () => {
    render(
      <FilePreview
        files={[{ file, label: null }]}
        uploadingFiles={[{ file, isUploading: true, progress: 50 }]}
        removeFile={jest.fn()}
        disabled={false}
      />
    );
    expect(await screen.findByRole("img")).toHaveAttribute("src", "blob:url");
    expect(screen.queryByLabelText("Remove file")).toBeNull();
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("shows image processing state after upload progress completes", async () => {
    render(
      <FilePreview
        files={[{ file, label: null }]}
        uploadingFiles={[
          {
            file,
            isUploading: true,
            progress: 100,
            phase: "processing",
          },
        ]}
        removeFile={jest.fn()}
        disabled={false}
      />
    );

    expect(await screen.findByRole("img")).toHaveAttribute("src", "blob:url");
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.getByText("Processing image")).toBeInTheDocument();
    expect(screen.queryByText("100%")).toBeNull();
  });
});
