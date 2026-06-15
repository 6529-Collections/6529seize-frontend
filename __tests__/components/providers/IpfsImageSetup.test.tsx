import { render, waitFor } from "@testing-library/react";
import IpfsImageSetup from "@/components/providers/IpfsImageSetup";

const CID = "bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i";
const TX_ID = "OdpVtqurZU9P-uEAJ4BsDIjAduAufQ6_sJxTu6MNYHc";

describe("IpfsImageSetup", () => {
  it("rewrites mixed-case decentralized schemes in DOM attributes", async () => {
    document.body.innerHTML = `
      <img src="IPFS://${CID}/image.png" />
      <a href="IpNs://collection-name/index.html">IPNS</a>
      <video poster="AR://${TX_ID}"></video>
    `;

    render(<IpfsImageSetup />);

    await waitFor(() => {
      expect(document.querySelector("img")?.getAttribute("src")).toBe(
        `https://media.6529.io/ipfs/${CID}/image.png`
      );
      expect(document.querySelector("a")?.getAttribute("href")).toBe(
        "https://media.6529.io/ipns/collection-name/index.html"
      );
      expect(document.querySelector("video")?.getAttribute("poster")).toBe(
        `https://media.6529.io/arweave/${TX_ID}`
      );
    });
  });
});
