import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemePageTimeline } from "@/components/the-memes/MemePageTimeline";
import { t } from "@/i18n/messages";
import { fetchAllPages } from "@/services/6529api";

jest.mock("@/services/6529api");
jest.mock("@/components/timeline/Timeline", () => ({
  __esModule: true,
  default: ({ steps, locale }: any) => (
    <div
      data-testid="timeline"
      data-count={steps.length}
      data-locale={locale}
    />
  ),
}));

describe("MemePageTimeline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchAllPages as jest.Mock).mockResolvedValue([]);
  });

  const nft = { id: 42 } as any;

  it("does not render timeline when show is false but still fetches history", async () => {
    render(<MemePageTimeline show={false} nft={nft} />);
    await waitFor(() => expect(fetchAllPages).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("timeline")).toBeNull();
  });

  it("fetches history and renders timeline when show is true", async () => {
    (fetchAllPages as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
    render(<MemePageTimeline show nft={nft} />);
    await waitFor(() => expect(fetchAllPages).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("timeline")).toHaveAttribute("data-count", "2");
  });

  it("labels the timeline region and passes the selected locale", async () => {
    (fetchAllPages as jest.Mock).mockResolvedValue([{ id: 1 }]);
    render(<MemePageTimeline show nft={nft} locale="de-DE" />);

    expect(
      screen.getByRole("region", {
        name: t("de-DE", "theMemes.detail.timeline.region"),
      })
    ).toBeInTheDocument();
    await waitFor(() => expect(fetchAllPages).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("timeline")).toHaveAttribute(
      "data-locale",
      "de-DE"
    );
  });
});
