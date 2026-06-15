import { render, screen } from "@testing-library/react";
import DropMediaAttachmentCard from "@/components/drops/view/item/content/media/DropMediaAttachmentCard";

jest.mock("@/components/download/Download", () => ({
  __esModule: true,
  default: (props: { href: string; name: string; extension: string }) => (
    <div
      data-testid="download"
      data-href={props.href}
      data-name={props.name}
      data-extension={props.extension}
    />
  ),
}));

describe("DropMediaAttachmentCard", () => {
  it("passes an empty extension without adding a trailing dot", () => {
    render(
      <DropMediaAttachmentCard
        src="https://media.example.test/download"
        mimeType="application/octet-stream"
      />
    );

    expect(screen.getByText("attachment")).toBeInTheDocument();
    expect(screen.getByTestId("download")).toHaveAttribute(
      "data-name",
      "attachment"
    );
    expect(screen.getByTestId("download")).toHaveAttribute(
      "data-extension",
      ""
    );
  });
});
