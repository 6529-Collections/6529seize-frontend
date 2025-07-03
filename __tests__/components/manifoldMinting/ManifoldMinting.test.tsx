import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ManifoldMinting from "@/components/manifoldMinting/ManifoldMinting";
import { Time } from "@/helpers/time";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock("react-bootstrap", () => {
  return {
    Container: (p: any) => <div>{p.children}</div>,
    Row: (p: any) => <div>{p.children}</div>,
    Col: (p: any) => <div>{p.children}</div>,
    Table: (p: any) => <table>{p.children}</table>,
  };
});

jest.mock("@/components/nft-image/NFTImage", () => () => (
  <div data-testid="image" />
));
jest.mock("@/components/nftAttributes/NFTAttributes", () => () => (
  <div data-testid="attrs" />
));
jest.mock("@/components/manifoldMinting/ManifoldMintingWidget", () => () => (
  <div data-testid="widget" />
));
jest.mock("@/components/the-memes/MemePageMintCountdown", () => () => (
  <div data-testid="countdown" />
));

jest.mock("@/hooks/useManifoldClaim", () => ({
  __esModule: true,
  useManifoldClaim: jest.fn(),
  ManifoldClaimStatus: { ACTIVE: "active" },
  buildMemesPhases: () => [
    {
      id: "public",
      name: "Public",
      type: "public",
      start: Time.now(),
      end: Time.now(),
    },
  ],
}));

jest.mock("@/helpers/Helpers", () => ({
  areEqualAddresses: () => true,
  capitalizeEveryWord: (s: string) => s,
  fromGWEI: (n: number) => n,
  getNameForContract: () => "Contract",
  getPathForContract: () => "path",
  numberWithCommas: (n: number) => String(n),
  parseNftDescriptionToHtml: (d: string) => d,
}));

const { useManifoldClaim } = require("@/hooks/useManifoldClaim") as {
  useManifoldClaim: jest.Mock;
};

afterEach(() => jest.clearAllMocks());

test("shows error message when hook reports error", async () => {
  let called = false;
  useManifoldClaim.mockImplementation((c, p, a, t, onError) => {
    if (!called) {
      called = true;
      onError();
    }
    return undefined;
  });
  render(
    <ManifoldMinting
      title="Title"
      contract="0x1"
      proxy="0x2"
      abi={{}}
      token_id={1}
      mint_date={Time.now()}
    />
  );
  await screen.findByText("Error fetching mint information");
});

test("renders nft info after successful fetch", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        id: 1,
        publicData: {
          asset: { name: "NFT", description: "", attributes: [] },
          instanceAllowlist: { merkleTreeId: 1 },
        },
      }),
  });
  useManifoldClaim.mockReturnValue({
    instanceId: 1,
    total: 1,
    totalMax: 1,
    remaining: 0,
    cost: 1,
    startDate: 1,
    endDate: 2,
    status: "active",
    phase: "public",
    isFetching: false,
    isFinalized: false,
  });
  render(
    <ManifoldMinting
      title="Title"
      contract="0x1"
      proxy="0x2"
      abi={{}}
      token_id={1}
      mint_date={Time.now()}
    />
  );
  await screen.findByText("NFT");
});
