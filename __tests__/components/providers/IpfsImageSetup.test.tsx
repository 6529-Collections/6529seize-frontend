import { render, waitFor } from "@testing-library/react";
import IpfsImageSetup from "@/components/providers/IpfsImageSetup";

const CID = "bafybeigdyrzt5sfp7udm7hu76mjts3sfb44oixwkw55rmpbc6g6wuigv3i";

describe("IpfsImageSetup", () => {
  it("rewrites uppercase decentralized schemes in DOM attributes", async () => {
    document.body.innerHTML = `<img src="IPFS://${CID}/image.png" />`;

    render(<IpfsImageSetup />);

    await waitFor(() => {
      expect(document.querySelector("img")?.getAttribute("src")).toBe(
        `https://media.6529.io/ipfs/${CID}/image.png`
      );
    });
  });
});
