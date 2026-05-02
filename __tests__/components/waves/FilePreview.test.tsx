import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FilePreview from "@/components/waves/FilePreview";

jest.mock("@/components/distribution-plan-tool/common/CircleLoader", () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
  CircleLoaderSize: { XXLARGE: "XX" },
}));

beforeAll(() => {
  // mock createObjectURL
  Object.defineProperty(global.URL, "createObjectURL", {
    writable: true,
    value: () => "blob:url",
  });
});

describe("FilePreview", () => {
  const file = new File(["a"], "a.png", { type: "image/png" });

  it("shows image and remove button", () => {
    const removeFile = jest.fn();
    render(
      <FilePreview
        files={[{ file, label: "img" }]}
        uploadingFiles={[]}
        removeFile={removeFile}
        disabled={false}
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute("src", "blob:url");
    fireEvent.click(screen.getByLabelText("Remove file"));
    expect(removeFile).toHaveBeenCalledWith(file);
    expect(screen.getByText("img")).toBeInTheDocument();
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
  });

  it("hides remove button when uploading", () => {
    render(
      <FilePreview
        files={[{ file, label: null }]}
        uploadingFiles={[{ file, isUploading: true, progress: 50 }]}
        removeFile={jest.fn()}
        disabled={false}
      />
    );
    expect(screen.queryByLabelText("Remove file")).toBeNull();
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
