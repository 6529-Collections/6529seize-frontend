import { render, screen } from "@testing-library/react";
import React from "react";
import { ManifoldClaimStatus, ManifoldPhase } from "../../../hooks/useManifoldClaim";

jest.mock("react-bootstrap", () => {
  const React = require("react");
  return {
    Container: (p: any) => <div {...p} />,
    Row: (p: any) => <div {...p} />,
    Col: (p: any) => <div {...p} />,
    Form: { Select: (p: any) => <select {...p} />, Control: (p: any) => <input {...p} /> },
    Table: (p: any) => <table {...p}>{p.children}</table>,
  };
});

jest.mock("../../../components/dotLoader/DotLoader", () => () => <div data-testid="loader" />);
jest.mock("../../../components/manifoldMinting/ManifoldMintingConnect", () => () => <div data-testid="connect" />);

jest.mock("wagmi", () => ({
  useReadContract: jest.fn(() => ({ data: 0 })),
  useReadContracts: jest.fn(() => ({ data: undefined })),
  useWaitForTransactionReceipt: jest.fn(() => ({ isPending: false, isSuccess: false, error: null })),
  useWriteContract: jest.fn(() => ({ writeContract: jest.fn(), reset: jest.fn(), data: undefined, isPending: false, error: null })),
}));

jest.mock("../../../components/auth/SeizeConnectContext", () => ({ useSeizeConnectContext: () => ({ address: "0x1" }) }));

const ManifoldMintingWidget = require("../../../components/manifoldMinting/ManifoldMintingWidget").default;

const baseProps = {
  contract: "0x1",
  proxy: "0x2",
  abi: [],
  claim: {
    status: ManifoldClaimStatus.ENDED,
    isFinalized: false,
    phase: ManifoldPhase.ALLOWLIST,
    instanceId: 1,
    startDate: 0,
    cost: 1,
  } as any,
  merkleTreeId: 1,
  setFee: jest.fn(),
  setMintForAddress: jest.fn(),
};

describe("ManifoldMintingWidget", () => {

  it("shows ENDED when claim ended", () => {
    render(<ManifoldMintingWidget {...baseProps} />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("ENDED");
  });

  it("shows SOLD OUT when finalized", () => {
    const props = { ...baseProps, claim: { ...baseProps.claim, status: ManifoldClaimStatus.ACTIVE, isFinalized: true } };
    render(<ManifoldMintingWidget {...props} />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("SOLD OUT");
  });
});
