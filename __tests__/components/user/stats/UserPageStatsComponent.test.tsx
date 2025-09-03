jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn().mockResolvedValue([]),
}));

describe("UserPageStatsComponent", () => {
  it("component module loads", () => {
    expect(() =>
      require("../../../../components/user/stats/UserPageStats")
    ).not.toThrow();
  });
});
