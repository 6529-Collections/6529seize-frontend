import { render, screen } from "@testing-library/react";
import React from "react";

import EnsPreviewCard from "../../../../components/waves/ens/EnsPreviewCard";
import {
  type EnsAddressPreview,
  type EnsContentPreview,
  type EnsNamePreview,
} from "../../../../components/waves/ens/types";

describe("EnsPreviewCard", () => {
  it("renders ENS name information", () => {
    const preview: EnsNamePreview = {
      type: "ens.name",
      chainId: 1,
      name: "vitalik.eth",
      normalized: "vitalik.eth",
      address: "0x0000000000000000000000000000000000000001",
      resolver: "0x0000000000000000000000000000000000000002",
      avatarUrl: "https://example.com/avatar.png",
      records: {
        url: "https://example.com/",
        description: "Builder",
      },
      contenthash: {
        protocol: "ipfs",
        decoded: "ipfs://bafy",
        gatewayUrl: "https://cf-ipfs.com/ipfs/bafy",
      },
      ownership: {
        registryOwner: "0x0000000000000000000000000000000000000003",
        registrant: "0x0000000000000000000000000000000000000004",
        isWrapped: true,
        expiry: 1_700_000_000,
        gracePeriodEnds: 1_700_007_800,
      },
      links: {
        app: "https://app.ens.domains/name/vitalik.eth",
        etherscan: "https://etherscan.io/address/0x0000000000000000000000000000000000000001",
        open: "https://cf-ipfs.com/ipfs/bafy",
      },
    };

    render(<EnsPreviewCard preview={preview} />);

    expect(screen.getByTestId("ens-name-card")).toBeInTheDocument();
    expect(screen.getByText("vitalik.eth")).toBeInTheDocument();
    expect(screen.getByText("Builder")).toBeInTheDocument();
    expect(screen.getByText("View on Etherscan")).toHaveAttribute(
      "href",
      preview.links.etherscan
    );
    expect(screen.getByText("Open content")).toHaveAttribute("href", preview.links.open);
  });

  it("renders ENS address information", () => {
    const preview: EnsAddressPreview = {
      type: "ens.address",
      chainId: 1,
      address: "0x0000000000000000000000000000000000000001",
      primaryName: "alice.eth",
      forwardMatch: true,
      avatarUrl: null,
      links: {
        app: "https://app.ens.domains/address/0x0000000000000000000000000000000000000001",
        etherscan: "https://etherscan.io/address/0x0000000000000000000000000000000000000001",
      },
    };

    render(<EnsPreviewCard preview={preview} />);

    expect(screen.getByTestId("ens-address-card")).toBeInTheDocument();
    expect(screen.getByText("Forward resolution verified")).toBeInTheDocument();
    expect(screen.getByText("alice.eth")).toBeInTheDocument();
  });

  it("renders ENS content previews", () => {
    const preview: EnsContentPreview = {
      type: "ens.content",
      chainId: 1,
      name: "site.eth",
      contenthash: {
        protocol: "ipns",
        decoded: "ipns://example",
        gatewayUrl: "https://cf-ipfs.com/ipns/example",
      },
      links: {
        open: "https://cf-ipfs.com/ipns/example",
        app: "https://app.ens.domains/name/site.eth",
      },
    };

    render(<EnsPreviewCard preview={preview} />);

    expect(screen.getByTestId("ens-content-card")).toBeInTheDocument();
    expect(screen.getByText("ipns://example")).toBeInTheDocument();
  });
});
