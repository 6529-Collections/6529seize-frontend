describe("Release Bus shard failure injection fixture", () => {
  it("fails only when deliberate validation injection is enabled", () => {
    expect(process.env.RELEASE_BUS_INJECT_SHARD_FAILURE).not.toBe("1");
  });
});
