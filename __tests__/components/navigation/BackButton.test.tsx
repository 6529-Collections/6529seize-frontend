import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import BackButton from "@/components/navigation/BackButton";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: jest.fn(),
}));
jest.mock("@/hooks/useWave", () => ({
  useWave: jest.fn(),
}));
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: jest.fn(),
}));
jest.mock("@/components/utils/Spinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({
    isApp: false,
    isMobileDevice: false,
    hasTouchScreen: false,
  }),
}));

const mockClearLastVisited = jest.fn();
jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: () => ({
    clearLastVisited: mockClearLastVisited,
  }),
}));

const mockGoBack = jest.fn();
jest.mock("@/contexts/NavigationHistoryContext", () => ({
  useNavigationHistoryContext: () => ({
    goBack: mockGoBack,
  }),
}));

const { useRouter, useSearchParams, usePathname } = require("next/navigation");
const { useWaveData } = require("@/hooks/useWaveData");
const { useWave } = require("@/hooks/useWave");
const { useMyStreamOptional } = require("@/contexts/wave/MyStreamContext");

function setup(
  query: Record<string, string> = {},
  opts: { wave?: object; isDm?: boolean; activeWaveId?: string | null } = {}
) {
  const replace = jest.fn();
  const back = jest.fn();
  const setActiveWave = jest.fn();
  const searchParams = new URLSearchParams();
  Object.keys(query).forEach((key) => searchParams.set(key, query[key]));

  (useRouter as jest.Mock).mockReturnValue({ replace, back });
  (useSearchParams as jest.Mock).mockReturnValue(searchParams);
  (usePathname as jest.Mock).mockReturnValue("/test");
  (useWaveData as jest.Mock).mockReturnValue({ data: opts.wave });
  (useWave as jest.Mock).mockReturnValue({ isDm: opts.isDm ?? false });
  (useMyStreamOptional as jest.Mock).mockReturnValue({
    activeWave: {
      id: opts.activeWaveId ?? null,
      set: setActiveWave,
    },
  });

  const utils = render(<BackButton />);
  return { ...utils, replace, back, setActiveWave };
}

describe("BackButton", () => {
  afterEach(() => jest.clearAllMocks());

  it("removes drop param and replaces route", async () => {
    const { replace } = setup({ drop: "123" });
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(replace).toHaveBeenCalledWith("/test", { scroll: false });
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("navigates back to messages when wave is DM", async () => {
    const { replace, setActiveWave } = setup(
      { wave: "w1" },
      { wave: {}, isDm: true, activeWaveId: "w1" }
    );
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockClearLastVisited).toHaveBeenCalledWith("dm");
    expect(setActiveWave).toHaveBeenCalledWith(null, { isDirectMessage: true });
    expect(replace).not.toHaveBeenCalled();
  });

  it("navigates back to waves when wave is not DM", async () => {
    const { replace, setActiveWave } = setup(
      { wave: "w1" },
      { wave: {}, isDm: false, activeWaveId: "w1" }
    );
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockClearLastVisited).toHaveBeenCalledWith("wave");
    expect(setActiveWave).toHaveBeenCalledWith(null, {
      isDirectMessage: false,
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("calls goBack when no wave and no drop", async () => {
    setup({});
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
