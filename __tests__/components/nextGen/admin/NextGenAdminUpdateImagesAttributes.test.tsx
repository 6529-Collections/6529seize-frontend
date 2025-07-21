import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NextGenAdminUpdateImagesAttributes from "@/components/nextGen/admin/NextGenAdminUpdateImagesAttributes";
import { useCoreContractWrite } from "@/components/nextGen/nextgen_helpers";

// Mock dependencies
jest.mock("@/components/nextGen/nextgen_helpers");
jest.mock("@/components/nextGen/NextGenContractWriteStatus", () => {
  return function MockNextGenContractWriteStatus({
    isLoading,
    hash,
    error,
  }: any) {
    return (
      <div data-testid="contract-write-status">
        Status: {isLoading ? "Loading" : "Ready"}
        {hash && <div data-testid="hash">{hash}</div>}
        {error && <div data-testid="error">{error.message}</div>}
      </div>
    );
  };
});
jest.mock("@/components/nextGen/admin/NextGenAdmin", () => ({
  printAdminErrors: (errors: string[]) => (
    <div data-testid="admin-errors">
      {errors.map((error, index) => (
        <div key={index}>{error}</div>
      ))}
    </div>
  ),
}));
jest.mock("@/components/nextGen/admin/NextGenAdminShared", () => ({
  NextGenAdminHeadingRow: ({ close, title }: any) => (
    <div data-testid="heading-row">
      <h2>{title}</h2>
      <button onClick={close} data-testid="close-btn">
        Close
      </button>
    </div>
  ),
}));

describe("NextGenAdminUpdateImagesAttributes", () => {
  const mockClose = jest.fn();
  const mockWriteContract = jest.fn();
  const mockReset = jest.fn();

  const defaultContractWrite = {
    writeContract: mockWriteContract,
    reset: mockReset,
    isLoading: false,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: null,
    params: {
      address: "0x123" as `0x${string}`,
      abi: [],
      chainId: 1,
      functionName: "test",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCoreContractWrite as jest.Mock).mockReturnValue(defaultContractWrite);
  });

  describe("Component Rendering", () => {
    it("renders all form fields with correct labels", () => {
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      expect(
        screen.getByText("Update Images and Attributes")
      ).toBeInTheDocument();
      expect(screen.getByText(/Token IDs/)).toBeInTheDocument();
      expect(screen.getAllByText(/Images/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Attributes/).length).toBeGreaterThan(0);
      expect(
        screen.getByRole("button", { name: "Submit" })
      ).toBeInTheDocument();
    });

    it("renders heading row with close functionality", () => {
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      expect(screen.getByTestId("heading-row")).toBeInTheDocument();
      fireEvent.click(screen.getByTestId("close-btn"));
      expect(mockClose).toHaveBeenCalled();
    });

    it("renders contract write status component", () => {
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      expect(screen.getByTestId("contract-write-status")).toBeInTheDocument();
    });
  });

  describe("Form Input Handling", () => {
    it("updates token IDs when textarea value changes", async () => {
      const user = userEvent.setup();
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      const textareas = screen.getAllByPlaceholderText("One line per entry");
      const tokenIdsInput = textareas[0]; // First textarea is Token IDs
      await user.type(tokenIdsInput, "1\n2\n3");

      expect(tokenIdsInput).toHaveValue("1\n2\n3");
      expect(screen.getByText(/Token IDs x3/)).toBeInTheDocument();
    });

    it("updates images when textarea value changes", async () => {
      const user = userEvent.setup();
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      const textareas = screen.getAllByPlaceholderText("One line per entry");
      const imagesInput = textareas[1]; // Second textarea is Images
      await user.type(imagesInput, "image1.jpg\nimage2.jpg");

      expect(imagesInput).toHaveValue("image1.jpg\nimage2.jpg");
      expect(screen.getByText(/Images x2/)).toBeInTheDocument();
    });

    it("updates attributes when textarea value changes", async () => {
      const user = userEvent.setup();
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      const textareas = screen.getAllByPlaceholderText("One line per entry");
      const attributesInput = textareas[2]; // Third textarea is Attributes
      await user.type(attributesInput, "attr1\nattr2");

      expect(attributesInput).toHaveValue("attr1\nattr2");
      expect(screen.getByText(/Attributes x2/)).toBeInTheDocument();
    });

    it("clears arrays when input is empty", async () => {
      const user = userEvent.setup();
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      const textareas = screen.getAllByPlaceholderText("One line per entry");
      const tokenIdsInput = textareas[0]; // First textarea is Token IDs
      await user.type(tokenIdsInput, "1\n2");
      expect(screen.getByText(/Token IDs x2/)).toBeInTheDocument();

      await user.clear(tokenIdsInput);
      expect(screen.queryByText(/Token IDs x/)).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("shows validation errors when fields are empty", async () => {
      const user = userEvent.setup();
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      await user.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(screen.getByTestId("admin-errors")).toBeInTheDocument();
      });

      expect(
        screen.getByText("At least one token ID is required")
      ).toBeInTheDocument();
      expect(
        screen.getByText("At least one image is required")
      ).toBeInTheDocument();
      expect(
        screen.getByText("At least one attribute is required")
      ).toBeInTheDocument();
    });

    it("shows validation error when array lengths do not match", async () => {
      const user = userEvent.setup();
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      const textareas = screen.getAllByPlaceholderText("One line per entry");
      await user.type(textareas[0], "1\n2"); // Token IDs
      await user.type(textareas[1], "image1.jpg"); // Images
      await user.type(textareas[2], "attr1\nattr2"); // Attributes

      await user.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(
          screen.getByText(
            "Number of entries for token IDs, images and attributes must all be the same"
          )
        ).toBeInTheDocument();
      });
    });

    it("does not show errors when validation passes", async () => {
      const user = userEvent.setup();
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      const textareas = screen.getAllByPlaceholderText("One line per entry");
      await user.type(textareas[0], "1\n2"); // Token IDs
      await user.type(textareas[1], "image1.jpg\nimage2.jpg"); // Images
      await user.type(textareas[2], "attr1\nattr2"); // Attributes

      await user.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
      });

      expect(screen.queryByTestId("admin-errors")).not.toBeInTheDocument();
    });
  });

  describe("Contract Interaction", () => {
    it("calls writeContract with correct arguments when validation passes", async () => {
      const user = userEvent.setup();
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      const textareas = screen.getAllByPlaceholderText("One line per entry");
      await user.type(textareas[0], "1\n2"); // Token IDs
      await user.type(textareas[1], "image1.jpg\nimage2.jpg"); // Images
      await user.type(textareas[2], "attr1\nattr2"); // Attributes

      await user.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(mockWriteContract).toHaveBeenCalledWith({
          address: "0x123",
          abi: [],
          chainId: 1,
          functionName: "test",
          args: [
            [1, 2],
            ["image1.jpg", "image2.jpg"],
            ["attr1", "attr2"],
          ],
        });
      });
    });

    it("disables submit button during loading", async () => {
      const user = userEvent.setup();
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      const textareas = screen.getAllByPlaceholderText("One line per entry");
      await user.type(textareas[0], "1"); // Token IDs
      await user.type(textareas[1], "image1.jpg"); // Images
      await user.type(textareas[2], "attr1"); // Attributes

      await user.click(screen.getByRole("button", { name: "Submit" }));

      expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    });

    it("resets loading state on contract success", () => {
      (useCoreContractWrite as jest.Mock).mockReturnValue({
        ...defaultContractWrite,
        isSuccess: true,
        data: undefined,
      });

      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      expect(screen.getByRole("button", { name: "Submit" })).not.toBeDisabled();
    });

    it("resets loading state on contract error", () => {
      (useCoreContractWrite as jest.Mock).mockReturnValue({
        ...defaultContractWrite,
        isError: true,
        error: { message: "Contract error", name: "ContractError" } as any,
      });

      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      expect(screen.getByRole("button", { name: "Submit" })).not.toBeDisabled();
    });
  });

  describe("Contract Hook Integration", () => {
    it("calls useCoreContractWrite with correct function name", () => {
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      expect(useCoreContractWrite).toHaveBeenCalledWith(
        "updateImagesAndAttributes",
        expect.any(Function)
      );
    });

    it("calls reset when component mounts and user submits", async () => {
      const user = userEvent.setup();
      render(<NextGenAdminUpdateImagesAttributes close={mockClose} />);

      const textareas = screen.getAllByPlaceholderText("One line per entry");
      await user.type(textareas[0], "1"); // Token IDs
      await user.type(textareas[1], "image1.jpg"); // Images
      await user.type(textareas[2], "attr1"); // Attributes

      await user.click(screen.getByRole("button", { name: "Submit" }));

      expect(mockReset).toHaveBeenCalled();
    });
  });
});
