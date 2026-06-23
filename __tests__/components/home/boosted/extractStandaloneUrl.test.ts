import { removePreviewUrlFromContent } from "@/components/home/boosted/extractStandaloneUrl";

describe("removePreviewUrlFromContent", () => {
  it("keeps markdown image URLs intact when the preview URL matches", () => {
    const imageUrl =
      "https://img.transient.xyz/?n=-1&output=webp&url=https%3A%2F%2Fipfs.transientusercontent.xyz%2Fipfs%2FQmVsjJs2AfMZkdudRx1bUypA1pr5cDBcp8Y8qshdw74Civ%2Fnft.jpg&w=3072&we=";
    const content = `![Seize](${imageUrl})`;

    expect(removePreviewUrlFromContent(content, imageUrl)).toBe(content);
  });
});
