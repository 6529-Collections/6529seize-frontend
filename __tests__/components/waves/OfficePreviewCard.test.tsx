import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import OfficePreviewCard, {
  type OfficePreviewData,
} from "../../../components/waves/OfficePreviewCard";

const renderCard = (data: OfficePreviewData) => {
  return render(
    <OfficePreviewCard
      href="https://wave.example/post"
      data={data}
    />
  );
};

describe("OfficePreviewCard", () => {
  it("renders open and preview actions", async () => {
    const data: OfficePreviewData = {
      type: "office.word",
      title: "Status Update",
      canonicalUrl: "https://tenant.sharepoint.com/:w:/r/update.docx",
      thumbnail: null,
      links: {
        open: "https://tenant.sharepoint.com/:w:/r/update.docx",
        preview:
          "https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Ftenant.sharepoint.com%2F%3Aw%3A%2Fr%2Fupdate.docx",
        officeViewer: null,
        exportPdf: null,
      },
      availability: "public",
    };

    renderCard(data);

    const openLink = screen.getByRole("link", { name: /open microsoft word/i });
    expect(openLink).toHaveAttribute("href", data.links.open);
    expect(openLink).toHaveAttribute("target", "_blank");

    const previewButton = screen.getByRole("button", { name: /view live/i });
    await userEvent.click(previewButton);

    const iframe = await screen.findByTestId("office-live-preview");
    expect(iframe.querySelector("iframe")).toHaveAttribute("src", data.links.preview as string);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("office-live-preview")).toBeNull();
  });

  it("shows availability notice when preview is unavailable", () => {
    const data: OfficePreviewData = {
      type: "office.powerpoint",
      title: "Launch Deck",
      canonicalUrl: "https://tenant.sharepoint.com/:p:/r/deck.pptx",
      thumbnail: null,
      links: {
        open: "https://tenant.sharepoint.com/:p:/r/deck.pptx",
        preview: null,
        officeViewer: null,
        exportPdf: null,
      },
      availability: "unavailable",
    };

    renderCard(data);

    expect(
      screen.getByText(/Live preview is not available for this link/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /view live/i })
    ).not.toBeInTheDocument();
  });
});
