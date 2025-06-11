import React from "react";
import { render } from "@testing-library/react";
import Page from "../../../pages/tools/subscriptions-report";
import { AuthContext } from "../../../components/auth/Auth";

jest.mock("../../../helpers/meme_calendar.helpers", () => ({
  getMintingDates: jest.fn(() => []),
  isMintingToday: jest.fn(() => false),
  numberOfCardsForSeasonEnd: jest.fn(() => ({ count: 2, szn: 1 })),
}));

jest.mock("../../../services/api/common-api", () => ({
  commonApiFetch: jest.fn(() => Promise.resolve([])),
}));

jest.mock("../../../helpers/server.helpers", () => ({
  getCommonHeaders: jest.fn(() => ({ h: "1" })),
}));

const { getCommonHeaders } = require("../../../helpers/server.helpers");
const { commonApiFetch } = require("../../../services/api/common-api");
const {
  numberOfCardsForSeasonEnd,
} = require("../../../helpers/meme_calendar.helpers");

describe("Subscriptions report page", () => {
  it("sets title and renders component", () => {
    const setTitle = jest.fn();
    const props = { pageProps: { szn: 1, upcoming: [], redeemed: [] } } as any;
    const { container } = render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <Page {...props} />
      </AuthContext.Provider>
    );
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(setTitle).toHaveBeenCalledWith({
      title: "Subscriptions Report | Tools",
    });
    expect(numberOfCardsForSeasonEnd).toHaveBeenCalled();
    expect(getCommonHeaders).toHaveBeenCalled();
    expect(commonApiFetch).toHaveBeenCalledTimes(2);
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "subscriptions/upcoming-memes-counts?card_count=2",
    });
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "subscriptions/redeemed-memes-counts?page=1",
    });
  });

  it("exposes metadata", () => {
    expect(Page.metadata).toEqual({
      title: "Subscriptions Report",
      description: "Tools",
    });
  });
});
