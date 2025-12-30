"use client";

import React, { useState } from "react";
import AirdropAddressFields from "@/components/waves/memes/submission/components/AirdropAddressFields";
import AllowlistBatchManager, { AllowlistBatchRaw } from "@/components/waves/memes/submission/components/AllowlistBatchManager";
import AdditionalMediaUpload from "@/components/waves/memes/submission/components/AdditionalMediaUpload";
import { validateStrictAddress } from "@/components/waves/memes/submission/utils/addressValidation";

export default function TestPhase2Page() {
  const [airdropArtistAddress, setAirdropArtistAddress] = useState("");
  const [airdropArtistCount, setAirdropArtistCount] = useState(0);
  const [airdropChoiceAddress, setAirdropChoiceAddress] = useState("");
  const [airdropChoiceCount, setAirdropChoiceCount] = useState(0);

  const [batches, setBatches] = useState<AllowlistBatchRaw[]>([]);
  
  const [artistProfileMedia, setArtistProfileMedia] = useState<string[]>([]);
  const [artworkCommentaryMedia, setArtworkCommentaryMedia] = useState<string[]>([]);
  const [artworkCommentary, setArtworkCommentary] = useState("");

  const artistError = airdropArtistAddress && !validateStrictAddress(airdropArtistAddress) ? "Invalid Ethereum address (0x... 42 chars)" : null;
  const choiceError = airdropChoiceAddress && !validateStrictAddress(airdropChoiceAddress) ? "Invalid Ethereum address (0x... 42 chars)" : null;

  return (
    <div className="tw-p-8 tw-bg-iron-950 tw-min-h-screen tw-text-iron-100 tw-flex tw-flex-col tw-gap-y-12">
      <h1 className="tw-text-3xl tw-font-bold">Phase 2: UI Components Verification</h1>

      <section className="tw-max-w-4xl tw-w-full tw-mx-auto tw-flex tw-flex-col tw-gap-y-8">
        <AirdropAddressFields
          airdropArtistAddress={airdropArtistAddress}
          airdropArtistCount={airdropArtistCount}
          airdropChoiceAddress={airdropChoiceAddress}
          airdropChoiceCount={airdropChoiceCount}
          onArtistAddressChange={setAirdropArtistAddress}
          onArtistCountChange={setAirdropArtistCount}
          onChoiceAddressChange={setAirdropChoiceAddress}
          onChoiceCountChange={setAirdropChoiceCount}
          artistAddressError={artistError}
          choiceAddressError={choiceError}
        />

        <AllowlistBatchManager
          batches={batches}
          onBatchesChange={setBatches}
          errors={batches.map(b => ({
            contract: b.contract && !validateStrictAddress(b.contract) ? "Invalid contract" : undefined
          }))}
        />

        <AdditionalMediaUpload
          artistProfileMedia={artistProfileMedia}
          artworkCommentaryMedia={artworkCommentaryMedia}
          artworkCommentary={artworkCommentary}
          onArtistProfileMediaChange={setArtistProfileMedia}
          onArtworkCommentaryMediaChange={setArtworkCommentaryMedia}
          onArtworkCommentaryChange={setArtworkCommentary}
        />
      </section>

      <section className="tw-max-w-4xl tw-w-full tw-mx-auto tw-p-6 tw-bg-iron-900 tw-rounded-xl tw-border tw-border-iron-800">
        <h2 className="tw-text-xl tw-font-semibold tw-mb-4">Current State</h2>
        <pre className="tw-text-xs tw-bg-black/50 tw-p-4 tw-rounded tw-overflow-auto">
          {JSON.stringify({
            airdrop: { airdropArtistAddress, airdropArtistCount, airdropChoiceAddress, airdropChoiceCount },
            batches,
            media: { artistProfileMedia, artworkCommentaryMedia, artworkCommentary }
          }, null, 2)}
        </pre>
      </section>
    </div>
  );
}