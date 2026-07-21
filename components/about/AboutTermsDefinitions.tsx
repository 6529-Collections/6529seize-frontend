import Link from "next/link";

export default function AboutTermsDefinitions() {
  return (
    <li>
      <b>Abbreviations Make Documents More Readable</b>
      <br />
      <br />
      These are the abbreviations used in this document.
      <br />
      <br />
      &quot;Terms&quot;: Terms of Service
      <br />
      <br />
      &quot;We&quot;: 6529 Collection LLC
      <br />
      <br />
      &quot;6529 NFTs&quot;: The Memes, 6529 Gradient, Meme Lab, GenMemes, 6529
      Intern and other NFTs that may be added from time to time.
      <br />
      <br />
      &quot;You&quot;: An adult, at least 18 years of age, who is not subject to
      sanctions by the US government.
      <br />
      <br />
      &quot;Third Parties&quot;: Everyone else who is not &quot;We&quot; or
      &quot;You&quot;
      <br />
      <br />
      &quot;Our Platform&quot;: the website located at{" "}
      <Link href="https://6529.io" target="_blank" rel="noopener noreferrer">
        6529.io
      </Link>{" "}
      , any websites hosted at sub-domains of{" "}
      <Link href="https://6529.io" target="_blank" rel="noopener noreferrer">
        6529.io
      </Link>{" "}
      , including hosted minting or primary sales pages, any primary mints or
      sales directly from our smart contracts, any mobile or metaverse
      applications we may make, and any content (data, descriptions or
      otherwise) on our website or decentralized file storage platforms like
      IPFS or Arweave.
      <br />
      <br />
      &quot;Not Our Platform&quot;: Everything else that is not included in
      &quot;Our Platform&quot; including your Ethereum wallet, NFT marketplaces,
      and publicly accessible secondary functions on our smart contracts, such
      as token transfers.
    </li>
  );
}
