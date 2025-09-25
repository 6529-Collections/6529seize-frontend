import BlockPicker from "@/app/tools/block-finder/page";
import { distributionPlanApiPost } from "@/services/distribution-plan-api";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

jest.mock("next/font/google", () => ({
  Poppins: () => ({ className: "font" }),
}));
jest.mock("@/services/distribution-plan-api", () => ({
  distributionPlanApiPost: jest.fn(),
}));
jest.mock("@/components/block-picker/BlockPickerTimeWindowSelect", () => {
  const BlockPickerTimeWindowSelectMock = (props: any) => (
    <div data-testid="window" />
  );
  BlockPickerTimeWindowSelectMock.displayName =
    "BlockPickerTimeWindowSelectMock";
  return BlockPickerTimeWindowSelectMock;
});

jest.mock("@/components/block-picker/BlockPickerDateSelect", () => {
  const BlockPickerDateSelectMock = (props: any) => <div data-testid="date" />;
  BlockPickerDateSelectMock.displayName = "BlockPickerDateSelectMock";
  return BlockPickerDateSelectMock;
});

jest.mock("@/components/block-picker/BlockPickerBlockNumberIncludes", () => {
  const BlockPickerBlockNumberIncludesMock = (props: any) => (
    <input
      data-testid="blocknos"
      value={props.blockNumberIncludes}
      onChange={(e) => props.setBlockNumberIncludes(e.target.value)}
    />
  );
  BlockPickerBlockNumberIncludesMock.displayName =
    "BlockPickerBlockNumberIncludesMock";
  return BlockPickerBlockNumberIncludesMock;
});

jest.mock("@/components/utils/button/PrimaryButton", () => {
  const PrimaryButtonMock = (props: any) => (
    <button onClick={props.onClicked}>{props.children}</button>
  );
  PrimaryButtonMock.displayName = "PrimaryButtonMock";
  return PrimaryButtonMock;
});

jest.mock("@/components/block-picker/result/BlockPickerResult", () => {
  const BlockPickerResultMock = () => <div data-testid="result" />;
  BlockPickerResultMock.displayName = "BlockPickerResultMock";
  return BlockPickerResultMock;
});

// Correctly mock Auth context
jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require("@/components/auth/Auth");

const mockedPost = distributionPlanApiPost as jest.Mock;

function renderPage() {
  return render(<BlockPicker />);
}

// Create a mock setTitle function
const mockSetTitle = jest.fn();

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: mockSetTitle,
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const setToast = jest.fn();
beforeEach(() => {
  useAuth.mockReturnValue({
    setToast,
  });
});

describe("BlockPicker page", () => {
  it("sets page title on mount", () => {
    mockSetTitle.mockClear();
    renderPage();
  });

  it("alerts on invalid block numbers", async () => {
    mockedPost.mockResolvedValue({});
    renderPage();

    await userEvent.type(screen.getByTestId("blocknos"), "abc");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/numeric/i),
        type: "error",
      })
    );

    expect(mockedPost).not.toHaveBeenCalled();
  });
});
