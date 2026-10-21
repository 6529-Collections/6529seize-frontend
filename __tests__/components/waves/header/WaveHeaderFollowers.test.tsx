import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveHeaderFollowers from "@/components/waves/header/WaveHeaderFollowers";
import { useWaveFollowersCount } from "@/hooks/useWaveFollowersCount";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock("@/helpers/Helpers", () => ({
  numberWithCommas: (n: number) => `num-${n}`,
}));
jest.mock("@/hooks/useWaveFollowersCount", () => ({
  useWaveFollowersCount: jest.fn(),
}));
const mockCount = jest.mocked(useWaveFollowersCount);
const wave = { id: "wave", metrics: { subscribers_count: 99 } } as ApiWave;

it("uses the current reader count instead of the stored subscription metric", async () => {
  mockCount.mockReturnValue({ data: 5, isPending: false } as ReturnType<
    typeof useWaveFollowersCount
  >);
  const onClick = jest.fn();
  render(<WaveHeaderFollowers wave={wave} onFollowersClick={onClick} />);
  expect(screen.getByText("num-5")).toBeInTheDocument();
  expect(screen.queryByText("num-99")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button"));
  expect(onClick).toHaveBeenCalledTimes(1);
});

it("renders a real zero count", () => {
  mockCount.mockReturnValue({ data: 0, isPending: false } as ReturnType<
    typeof useWaveFollowersCount
  >);
  render(<WaveHeaderFollowers wave={wave} onFollowersClick={jest.fn()} />);
  expect(screen.getByText("num-0")).toBeInTheDocument();
});

it.each([true, false])(
  "shows an unavailable count without falling back to historical followers (pending: %s)",
  (isPending) => {
    mockCount.mockReturnValue({ data: undefined, isPending } as ReturnType<
      typeof useWaveFollowersCount
    >);
    render(<WaveHeaderFollowers wave={wave} onFollowersClick={jest.fn()} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("num-99")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-busy",
      String(isPending)
    );
  }
);
