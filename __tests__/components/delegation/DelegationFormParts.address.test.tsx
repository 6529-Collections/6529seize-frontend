import { render } from "@testing-library/react";
import React from "react";
import { DelegationAddressDisabledInput } from "@/components/delegation/DelegationFormParts";

jest.mock("wagmi", () => ({
  useEnsName: () => ({ data: "alice.eth" }),
  useEnsAddress: () => ({ data: "0x123" }),
}));

jest.mock("react-bootstrap", () => ({
  Form: {
    Control: (p: React.ComponentProps<"input">) => <input {...p} />,
    Label: (p: React.ComponentProps<"label">) => <label {...p} />,
    Group: (p: React.ComponentProps<"div">) => <div {...p} />,
    Select: (p: React.ComponentProps<"select">) => <select {...p} />,
    Row: (p: React.ComponentProps<"div">) => <div {...p} />,
    Col: (p: React.ComponentProps<"div">) => <div {...p} />,
  },
  Container: (p: React.ComponentProps<"div">) => <div {...p} />,
}));

describe("Delegation address inputs", () => {
  it("DelegationAddressDisabledInput shows ens and address", () => {
    const { container } = render(
      <DelegationAddressDisabledInput address="0xabc" ens="alice.eth" />
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("alice.eth - 0xabc");
    expect(input.disabled).toBe(true);
  });

  it("DelegationAddressDisabledInput never stringifies a missing address", () => {
    const { container } = render(
      <DelegationAddressDisabledInput address={undefined} ens={null} />
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("Connect wallet to continue");
    expect(input.value).not.toContain("undefined");
  });
});
