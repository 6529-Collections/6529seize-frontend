import { matchesDomainOrSubdomain } from "@/lib/url/domains";

describe("matchesDomainOrSubdomain", () => {
  it("returns true when host matches domain exactly", () => {
    expect(matchesDomainOrSubdomain("etherscan.io", "etherscan.io")).toBe(true);
  });

  it("returns true for subdomains", () => {
    expect(matchesDomainOrSubdomain("www.etherscan.io", "etherscan.io")).toBe(true);
  });

  it("normalizes casing and trailing dots", () => {
    expect(matchesDomainOrSubdomain("Goerli.Etherscan.io.", "ETHERSCAN.IO")).toBe(true);
  });

  it("returns false for hosts that only contain the domain as a suffix substring", () => {
    expect(matchesDomainOrSubdomain("maliciousetherscan.io", "etherscan.io")).toBe(false);
  });

  it("returns false when host or domain are missing", () => {
    expect(matchesDomainOrSubdomain("", "etherscan.io")).toBe(false);
    expect(matchesDomainOrSubdomain("etherscan.io", "")).toBe(false);
  });
});
