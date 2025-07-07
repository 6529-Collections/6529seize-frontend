import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import DistributionPage from "@/components/distribution/Distribution";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "123" }),
}));

const fetchAllPages = jest.fn(() => Promise.resolve([]));
const fetchUrl = jest.fn(() => Promise.resolve({ count: 0, data: [] }));

jest.mock("@/services/6529api", () => ({
  fetchAllPages: () => fetchAllPages(),
  fetchUrl: () => fetchUrl(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));
jest.mock("@/components/the-memes/MemePageMintCountdown", () => () => (
  <div data-testid="mint" />
));

describe("DistributionPage", () => {
  it("shows empty message when no data", async () => {
    render(<DistributionPage header="H" contract="0x0" link="" />);
    await waitFor(() => {
      expect(fetchAllPages).toHaveBeenCalled();
      expect(fetchUrl).toHaveBeenCalled();
    });
    expect(
      screen.getByText(/Distribution Plan will be made available soon/i)
    ).toBeInTheDocument();
  });
});
