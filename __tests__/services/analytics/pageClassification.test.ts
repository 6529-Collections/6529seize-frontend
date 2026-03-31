import { classifyPageView } from "@/services/analytics/pageClassification";

describe("classifyPageView", () => {
  it("classifies the waves index page", () => {
    expect(classifyPageView({ pathname: "/waves" })).toEqual({
      logicalPage: "waves_index",
      pageGroup: "waves",
      routePattern: "/waves",
      trackingKey: "/waves",
    });
  });

  it("classifies wave detail pages", () => {
    expect(
      classifyPageView({
        pathname: "/waves/cbf4ca5f-06b3-4ea6-bf7d-b193a0699eed",
      })
    ).toEqual({
      logicalPage: "wave_page",
      pageGroup: "waves",
      routePattern: "/waves/:waveId",
      trackingKey: "/waves/cbf4ca5f-06b3-4ea6-bf7d-b193a0699eed",
    });
  });

  it("classifies wave drop detail pages from the drop query param", () => {
    expect(
      classifyPageView({
        pathname: "/waves/cbf4ca5f-06b3-4ea6-bf7d-b193a0699eed",
        searchParams: new URLSearchParams("drop=drop-123"),
      })
    ).toEqual({
      logicalPage: "wave_drop_detail",
      pageGroup: "waves",
      routePattern: "/waves/:waveId?drop=:dropId",
      trackingKey: "/waves/cbf4ca5f-06b3-4ea6-bf7d-b193a0699eed?drop=drop-123",
    });
  });

  it("classifies profile root pages", () => {
    expect(classifyPageView({ pathname: "/alice" })).toEqual({
      logicalPage: "profile_identity",
      pageGroup: "profile",
      routePattern: "/:handle",
      trackingKey: "/alice",
    });
  });

  it("classifies known profile tab routes", () => {
    expect(classifyPageView({ pathname: "/alice/collected" })).toEqual({
      logicalPage: "profile_collected",
      pageGroup: "profile",
      routePattern: "/:handle/collected",
      trackingKey: "/alice/collected",
    });
  });

  it("does not misclassify reserved roots as profiles", () => {
    expect(classifyPageView({ pathname: "/the-memes" })).toEqual({
      logicalPage: "the_memes",
      pageGroup: "the_memes",
      routePattern: "/the-memes",
      trackingKey: "/the-memes",
    });
  });

  it("falls back to a generic profile subpage for unknown user subroutes", () => {
    expect(classifyPageView({ pathname: "/alice/followers" })).toEqual({
      logicalPage: "profile_subpage",
      pageGroup: "profile",
      routePattern: "/:handle/:subpage",
      trackingKey: "/alice/followers",
    });
  });
});
