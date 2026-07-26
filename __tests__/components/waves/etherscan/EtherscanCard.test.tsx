import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import EtherscanCard from "@/components/waves/etherscan/EtherscanCard";
import type {
  EtherscanPreview,
  EtherscanPreviewBase,
} from "@/lib/link-preview/etherscan/types";

const TO = "0x0000000000000000000000000000000000000002";

const BASE: EtherscanPreviewBase = {
  provider: "etherscan",
  requestUrl: "https://etherscan.io/tx/example",
  canonicalUrl: "https://etherscan.io/tx/example",
  network: {
    chainId: 1,
    key: "ethereum",
    label: "Ethereum",
    status: "current",
  },
  routeFamily: "/tx/{hash}",
  contexts: [],
  provenance: [
    {
      source: "rpc",
      asOf: "2026-07-26T00:00:00.000Z",
      confidence: "authoritative",
    },
  ],
  completeness: "complete",
  stale: false,
  cache: { maxAgeSeconds: 60 },
};

describe("EtherscanCard", () => {
  const writeText = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  it("presents a successful transaction with semantic status and key facts", async () => {
    const hash = `0x${"a".repeat(64)}`;
    const preview: EtherscanPreview = {
      ...BASE,
      canonicalUrl: `https://etherscan.io/tx/${hash}`,
      type: "etherscan.transaction",
      transaction: {
        hash,
        status: "success",
        action: "native-transfer",
        from: "0x0000000000000000000000000000000000000001",
        to: TO,
        valueEth: "1.5",
        blockNumber: "23000000",
        confirmations: "18",
        feeEth: "0.00042",
      },
    };

    render(<EtherscanCard preview={preview} />);

    expect(
      screen.getByRole("article", {
        name: "Etherscan Transaction preview on Ethereum",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Successful")).toBeInTheDocument();
    expect(screen.getByText("1.5 ETH sent")).toBeInTheDocument();
    expect(screen.getByText("23,000,000")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copy transaction" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(hash));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("transaction copied")
    );
    expect(
      screen.getByRole("button", { name: "Copy transaction" })
    ).toBeInTheDocument();
    expect(screen.getByText(TO)).toHaveClass("tw-sr-only");
  });

  it("announces clipboard failures without changing the action name", async () => {
    writeText.mockRejectedValueOnce(new Error("clipboard unavailable"));
    const hash = `0x${"b".repeat(64)}`;
    const preview: EtherscanPreview = {
      ...BASE,
      canonicalUrl: `https://etherscan.io/tx/${hash}`,
      type: "etherscan.transaction",
      transaction: {
        hash,
        status: "pending",
        action: "ethereum-transaction",
      },
    };

    render(<EtherscanCard preview={preview} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy transaction" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "transaction could not be copied"
      )
    );
    expect(
      screen.getByRole("button", { name: "Copy transaction" })
    ).toBeInTheDocument();
  });

  it("localizes large block quantities", () => {
    const preview: EtherscanPreview = {
      ...BASE,
      canonicalUrl: "https://etherscan.io/block/23000000",
      routeFamily: "/block/{identifier}",
      type: "etherscan.block",
      block: {
        identifier: "23000000",
        number: "23000000",
        status: "finalized",
        gasUsed: "12345678",
      },
    };

    render(<EtherscanCard preview={preview} />);

    expect(screen.getByText("12,345,678")).toBeInTheDocument();
  });

  it("explains route-only pages without implying live data", () => {
    const preview: EtherscanPreview = {
      ...BASE,
      canonicalUrl: "https://etherscan.io/gastracker",
      routeFamily: "/gastracker",
      provenance: [],
      completeness: "route-only",
      cache: { maxAgeSeconds: 3600 },
      type: "etherscan.analytics",
      page: {
        titleKey: "linkPreview.etherscan.page.gasTracker",
        descriptionKey: "linkPreview.etherscan.description.analytics",
      },
    };

    render(<EtherscanCard preview={preview} />);

    expect(screen.getByText("Ethereum gas tracker")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Etherscan analytics for this network. Values can change over time."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("labels retired networks and partial data explicitly", () => {
    const preview: EtherscanPreview = {
      ...BASE,
      network: {
        chainId: 5,
        key: "goerli",
        label: "Goerli",
        status: "legacy",
      },
      canonicalUrl:
        "https://goerli.etherscan.io/address/0x0000000000000000000000000000000000000001",
      routeFamily: "/address/{address}",
      completeness: "route-only",
      provenance: [],
      type: "etherscan.address",
      address: {
        input: "0x0000000000000000000000000000000000000001",
        subtype: "unknown",
      },
    };

    render(<EtherscanCard preview={preview} />);

    expect(screen.getByText("Live data unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Legacy network — live data is unavailable for this archived explorer."
      )
    ).toBeInTheDocument();
  });
});
