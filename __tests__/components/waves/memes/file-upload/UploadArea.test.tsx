import { render, screen } from "@testing-library/react";
import React from "react";
import UploadArea from "@/components/waves/memes/file-upload/components/UploadArea";

jest.mock("framer-motion", () => ({
  motion: { div: (props: any) => <div {...props} /> },
}));

jest.mock(
  "@/components/waves/memes/file-upload/components/FileTypeIndicator",
  () => (props: any) => <div data-testid="format">{props.label}</div>
);

describe("UploadArea", () => {
  it("renders formats and select text", () => {
    const { getAllByTestId } = render(
      <UploadArea
        visualState="idle"
        error={null}
        hasRecoveryOption={false}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByText("Select Art")).toBeInTheDocument();
    expect(getAllByTestId("format")).toHaveLength(3);
    expect(screen.getByText("Max 250 MB")).toBeInTheDocument();
    expect(screen.getByText("GLB").parentElement).toBe(
      screen.getByText("Max 250 MB").parentElement
    );
  });

  it("shows processing overlay", () => {
    render(
      <UploadArea
        visualState="processing"
        error={null}
        hasRecoveryOption={false}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByText("Processing file...")).toBeInTheDocument();
    expect(
      screen.getByText("Large files may take longer.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/100MB/)).not.toBeInTheDocument();
  });

  it("renders error message when provided", () => {
    render(
      <UploadArea
        visualState="idle"
        error="Oops"
        hasRecoveryOption={true}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Oops");
    expect(
      screen.getByRole("button", { name: "Try Again" })
    ).toBeInTheDocument();
    expect(screen.getByText("Max 250 MB")).toBeInTheDocument();
  });

  it("shows a validation error without retry and keeps file selection visible", () => {
    render(
      <UploadArea
        visualState="invalid"
        error="File size exceeds 250 MB limit."
        hasRecoveryOption={false}
        onRetry={jest.fn()}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "File size exceeds 250 MB limit."
    );
    expect(
      screen.queryByRole("button", { name: "Try Again" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Select Art")).toBeInTheDocument();
    expect(screen.getByText("Drag and drop file here")).toBeInTheDocument();
  });
});
