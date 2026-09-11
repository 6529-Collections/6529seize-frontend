import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { DelegationSubmitGroups } from "@/components/delegation/DelegationFormParts";

import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

jest.mock("wagmi", () => ({
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
}));

const mockWriteContract = jest.fn();
const mockUseWriteContract = useWriteContract as jest.Mock;
const mockUseWaitForTransactionReceipt =
  useWaitForTransactionReceipt as jest.Mock;

describe("DelegationSubmitGroups", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWriteContract.mockReturnValue({
      writeContract: mockWriteContract,
      data: undefined,
      error: undefined,
    });
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: undefined,
    });
  });

  it("displays errors when validation fails", () => {
    Object.defineProperty(global, "scrollBy", {
      value: jest.fn(),
      writable: true,
    });
    const validate = jest.fn().mockReturnValue(["err"]);
    render(
      <DelegationSubmitGroups
        title="T"
        writeParams={{}}
        showCancel={false}
        gasError={undefined}
        validate={validate}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(mockWriteContract).not.toHaveBeenCalled();
    expect(screen.getByText("err")).toBeInTheDocument();
  });

  it("clears validation errors before a valid resubmission", () => {
    Object.defineProperty(globalThis, "scrollBy", {
      value: jest.fn(),
      writable: true,
    });
    const validate = jest
      .fn()
      .mockReturnValueOnce(["Missing or invalid New Address"])
      .mockReturnValue([]);

    render(
      <DelegationSubmitGroups
        title="Updating Delegation"
        writeParams={{ functionName: "updateDelegationAddress" }}
        showCancel={false}
        gasError={undefined}
        validate={validate}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );

    const submitButton = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(submitButton);
    expect(
      screen.getByText("Missing or invalid New Address")
    ).toBeInTheDocument();

    fireEvent.click(submitButton);

    expect(
      screen.queryByText("Missing or invalid New Address")
    ).not.toBeInTheDocument();
    expect(mockWriteContract).toHaveBeenCalledWith({
      functionName: "updateDelegationAddress",
    });
  });

  it("calls writeContract on valid submit", () => {
    const onSetToast = jest.fn();
    render(
      <DelegationSubmitGroups
        title="T"
        writeParams={{ foo: "bar", functionName: "registerDelegationAddress" }}
        showCancel={true}
        gasError={undefined}
        validate={() => []}
        onHide={jest.fn()}
        onSetToast={onSetToast}
      />
    );
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(mockWriteContract).toHaveBeenCalledWith({
      foo: "bar",
      functionName: "registerDelegationAddress",
    });
    expect(onSetToast).toHaveBeenCalledWith({
      status: "confirm_wallet",
      title: "T",
    });
  });

  it("passes form-specific settlement handling as Wagmi mutation options", () => {
    const onWriteSettled = jest.fn();
    render(
      <DelegationSubmitGroups
        title="T"
        writeParams={{ functionName: "registerDelegationAddress" }}
        showCancel={false}
        gasError={undefined}
        onWriteSettled={onWriteSettled}
        validate={() => []}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(mockWriteContract).toHaveBeenCalledWith(
      { functionName: "registerDelegationAddress" },
      { onSettled: onWriteSettled }
    );
  });

  it("allows retrying after a previous gas error", () => {
    render(
      <DelegationSubmitGroups
        title="T"
        writeParams={{ functionName: "registerDelegationAddress" }}
        showCancel={false}
        gasError="CANNOT ESTIMATE GAS"
        validate={() => []}
        onHide={jest.fn()}
        onSetToast={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(mockWriteContract).toHaveBeenCalledWith({
      functionName: "registerDelegationAddress",
    });
  });

  it("does not submit while writeParams lack a functionName", () => {
    const onSetToast = jest.fn();
    render(
      <DelegationSubmitGroups
        title="T"
        writeParams={{ foo: "bar", functionName: undefined }}
        showCancel={false}
        gasError={undefined}
        validate={() => []}
        onHide={jest.fn()}
        onSetToast={onSetToast}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(mockWriteContract).not.toHaveBeenCalled();
    expect(onSetToast).not.toHaveBeenCalled();
  });

  it.each([
    ["submitted", true, false],
    ["success", false, true],
  ] as const)(
    "maps a confirmed transaction to the shared %s modal state",
    (status, isLoading, isSuccess) => {
      const onSetToast = jest.fn();
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: "0xabc",
        error: undefined,
      });
      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading,
        isSuccess,
        isError: false,
        error: undefined,
      });

      render(
        <DelegationSubmitGroups
          title="Register Delegation"
          writeParams={{ foo: "bar" }}
          showCancel={false}
          gasError={undefined}
          validate={() => []}
          onHide={jest.fn()}
          onSetToast={onSetToast}
        />
      );

      expect(onSetToast).toHaveBeenCalledWith({
        status,
        title: "Register Delegation",
        transactionHash: "0xabc",
      });
    }
  );

  it("shows receipt errors instead of success toast", () => {
    const onSetToast = jest.fn();
    mockUseWriteContract.mockReturnValue({
      writeContract: mockWriteContract,
      data: "0xabc",
      error: undefined,
    });
    mockUseWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: false,
      isError: true,
      error: new Error("receipt failed Request Arguments"),
    });

    render(
      <DelegationSubmitGroups
        title="Register Delegation"
        writeParams={{ foo: "bar" }}
        showCancel={false}
        gasError={undefined}
        validate={() => []}
        onHide={jest.fn()}
        onSetToast={onSetToast}
      />
    );

    expect(onSetToast).toHaveBeenCalledWith({
      status: "error",
      title: "Register Delegation Failed",
      message: "receipt failed",
      transactionHash: "0xabc",
    });
    expect(onSetToast).not.toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        title: "Register Delegation",
      })
    );
  });
});
