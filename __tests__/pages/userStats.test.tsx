import React from "react";
import { render } from "@testing-library/react";
import Page, { getServerSideProps } from "../../pages/[user]/stats";
import { ReactQueryWrapperContext } from "../../components/react-query-wrapper/ReactQueryWrapper";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("../../components/user/stats/UserPageStats", () => ({
  __esModule: true,
  default: ({ profile }: any) => (
    <div data-testid="stats">{profile.handle}</div>
  ),
}));
jest.mock(
  "../../components/user/layout/UserPageLayout",
  () =>
    ({ children }: any) =>
      <div data-testid="layout">{children}</div>
);

jest.mock("../../helpers/server.helpers", () => ({
  getCommonHeaders: jest.fn(() => ({ h: "1" })),
  getUserProfile: jest.fn(() => Promise.resolve({ handle: "alice" })),
  userPageNeedsRedirect: jest.fn(() => false),
}));

jest.mock("../../helpers/Helpers", () => ({
  getMetadataForUserPage: jest.fn(() => "meta"),
}));

const {
  getCommonHeaders,
  getUserProfile,
  userPageNeedsRedirect,
} = require("../../helpers/server.helpers");

describe("stats page", () => {
  it("renders stats component and sets profile", () => {
    const setProfile = jest.fn();
    render(
      <ReactQueryWrapperContext.Provider value={{ setProfile } as any}>
        <Page profile={{ handle: "alice" } as any} />
      </ReactQueryWrapperContext.Provider>
    );
    expect(setProfile).toHaveBeenCalledWith({ handle: "alice" });
    expect(document.querySelector('[data-testid="stats"]')?.textContent).toBe(
      "alice"
    );
  });

  it("returns redirect when helpers request it", async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue({ redirect: "yes" });
    const res = await getServerSideProps(
      { query: { user: "alice" } } as any,
      null as any,
      null as any
    );
    expect(res).toEqual({ redirect: "yes" });
  });

  it("returns props when no redirect", async () => {
    (userPageNeedsRedirect as jest.Mock).mockReturnValue(false);
    const res = await getServerSideProps(
      { query: { user: "alice" } } as any,
      null as any,
      null as any
    );
    expect(res).toEqual({
      props: { profile: { handle: "alice" }, metadata: "meta" },
    });
    expect(getCommonHeaders).toHaveBeenCalled();
    expect(getUserProfile).toHaveBeenCalled();
  });

  it("handles errors by redirecting to 404", async () => {
    (getUserProfile as jest.Mock).mockRejectedValue(new Error("fail"));
    const res = await getServerSideProps(
      { query: { user: "alice" } } as any,
      null as any,
      null as any
    );
    expect(res).toEqual({
      redirect: { permanent: false, destination: "/404" },
      props: {},
    });
  });
});
