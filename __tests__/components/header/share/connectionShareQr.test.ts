import { getConnectionShareRoute } from "@/components/header/share/connectionShareQr";

const ADDRESS = "0x00000000000000000000000000000000000000AA";

describe("getConnectionShareRoute", () => {
  it("accepts a canonical connection-share deep link", () => {
    expect(
      getConnectionShareRoute({
        content: `mobile6529://share-connection?connection_share_code=one-time-code&address=${ADDRESS}`,
        appScheme: "mobile6529",
        timestamp: 123,
      })
    ).toBe(
      "/accept-connection-sharing?connection_share_code=one-time-code&address=0x00000000000000000000000000000000000000AA&_t=123"
    );
  });

  it("normalizes a configured scheme with a URL suffix", () => {
    expect(
      getConnectionShareRoute({
        content: `mobile6529://share-connection?connection_share_code=code&address=${ADDRESS}`,
        appScheme: "mobile6529://",
        timestamp: 123,
      })
    ).toContain("/accept-connection-sharing?");
  });

  it("accepts and checksums a lowercase address", () => {
    expect(
      getConnectionShareRoute({
        content:
          "mobile6529://share-connection?connection_share_code=code&address=0x00000000000000000000000000000000000000aa",
        appScheme: "mobile6529",
        timestamp: 123,
      })
    ).toBe(
      "/accept-connection-sharing?connection_share_code=code&address=0x00000000000000000000000000000000000000AA&_t=123"
    );
  });

  it.each([
    "https://6529.io/accept-connection-sharing?connection_share_code=code&address=0x00000000000000000000000000000000000000AA",
    "mobile6529://navigate/profile?connection_share_code=code&address=0x00000000000000000000000000000000000000AA",
    "mobile6529://share-connection/path?connection_share_code=code&address=0x00000000000000000000000000000000000000AA",
    "mobile6529://share-connection?connection_share_code=code&address=not-an-address",
    "mobile6529://share-connection?connection_share_code=code",
    "mobile6529://share-connection?address=0x00000000000000000000000000000000000000AA",
    "mobile6529://share-connection?connection_share_code=one&connection_share_code=two&address=0x00000000000000000000000000000000000000AA",
    "mobile6529://share-connection?connection_share_code=code&address=0x00000000000000000000000000000000000000AA&redirect=https%3A%2F%2Fevil.example",
    "mobile6529://share-connection?connection_share_code=code&address=0x00000000000000000000000000000000000000AA#fragment",
  ])("rejects non-canonical content: %s", (content) => {
    expect(
      getConnectionShareRoute({ content, appScheme: "mobile6529" })
    ).toBeNull();
  });
});
