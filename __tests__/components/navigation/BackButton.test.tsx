import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import BackButton from "../../../components/navigation/BackButton";

jest.mock("../../../contexts/NavigationHistoryContext", () => ({
  useNavigationHistoryContext: jest.fn(),
}));
jest.mock("../../../components/navigation/ViewContext", () => ({
  useViewContext: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock("../../../hooks/useWaveData", () => ({
  useWaveData: jest.fn(),
}));
jest.mock("../../../hooks/useWave", () => ({
  useWave: jest.fn(),
}));
jest.mock("../../../components/utils/Spinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));

const {
  useNavigationHistoryContext,
} = require("../../../contexts/NavigationHistoryContext");
const { useViewContext } = require("../../../components/navigation/ViewContext");
const { useRouter, useSearchParams, usePathname } = require("next/navigation");
const { useWaveData } = require("../../../hooks/useWaveData");
const { useWave } = require("../../../hooks/useWave");

function setup(query: any = {}, opts: any = {}) {
  const replace = jest.fn();
  const searchParams = new URLSearchParams();
  Object.keys(query).forEach(key => searchParams.set(key, query[key]));
  
  (useRouter as jest.Mock).mockReturnValue({ replace });
  (useSearchParams as jest.Mock).mockReturnValue(searchParams);
  (usePathname as jest.Mock).mockReturnValue("/test");
  (useNavigationHistoryContext as jest.Mock).mockReturnValue({
    canGoBack: opts.canGoBack ?? false,
    goBack: jest.fn(),
  });
  (useViewContext as jest.Mock).mockReturnValue({ hardBack: jest.fn() });
  (useWaveData as jest.Mock).mockReturnValue({ data: opts.wave });
  (useWave as jest.Mock).mockReturnValue({ isDm: opts.isDm ?? false });
  const utils = render(<BackButton />);
  return { ...utils, replace };
}


describe("BackButton", () => {
  afterEach(() => jest.clearAllMocks());

  it("removes drop param and replaces route", async () => {
    const { replace } = setup({ drop: "123" });
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(replace).toHaveBeenCalledWith("/test", { scroll: false });
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("navigates hard back to messages when wave is DM", async () => {
    const { replace } = setup({ wave: "w1" }, { wave: {}, isDm: true });
    const hardBack = (useViewContext as jest.Mock).mock.results[0].value.hardBack;
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(hardBack).toHaveBeenCalledWith("messages");
    expect(replace).not.toHaveBeenCalled();
  });

  it("navigates hard back to waves when wave is not DM", async () => {
    const { replace } = setup({ wave: "w1" }, { wave: {}, isDm: false });
    const hardBack = (useViewContext as jest.Mock).mock.results[0].value.hardBack;
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(hardBack).toHaveBeenCalledWith("waves");
    expect(replace).not.toHaveBeenCalled();
  });

  it("calls goBack when no params and canGoBack", async () => {
    setup({}, { canGoBack: true });
    const { goBack } = (useNavigationHistoryContext as jest.Mock).mock.results[0].value;
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(goBack).toHaveBeenCalled();
  });
});

