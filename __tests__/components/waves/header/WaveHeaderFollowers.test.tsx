import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveHeaderFollowers from "@/components/waves/header/WaveHeaderFollowers";
import { useWaveFollowersCount } from "@/hooks/useWaveFollowersCount";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { loadLocaleMessages } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: jest.fn(() => "en-US"),
}));
jest.mock("@/hooks/useWaveFollowersCount", () => ({
  useWaveFollowersCount: jest.fn(),
}));
const mockCount = jest.mocked(useWaveFollowersCount);
beforeEach(() => jest.mocked(useBrowserLocale).mockReturnValue("en-US"));
const wave = { id: "wave", metrics: { subscribers_count: 99 } } as ApiWave;

it("uses the current reader count instead of the stored subscription metric", async () => {
  mockCount.mockReturnValue({ data: 5, isPending: false } as ReturnType<
    typeof useWaveFollowersCount
  >);
  const onClick = jest.fn();
  render(<WaveHeaderFollowers wave={wave} onFollowersClick={onClick} />);
  expect(screen.getByText("5")).toBeInTheDocument();
  expect(screen.queryByText("99")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "View joined followers" })
  ).toHaveAccessibleDescription("Joined followers: 5.");
  expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  await userEvent.click(
    screen.getByRole("button", { name: "View joined followers" })
  );
  expect(onClick).toHaveBeenCalledTimes(1);
});

it("renders a real zero count", () => {
  mockCount.mockReturnValue({ data: 0, isPending: false } as ReturnType<
    typeof useWaveFollowersCount
  >);
  render(<WaveHeaderFollowers wave={wave} onFollowersClick={jest.fn()} />);
  expect(screen.getByText("0")).toBeInTheDocument();
});

it.each([true, false])(
  "shows an unavailable count without falling back to historical followers (pending: %s)",
  async (isPending) => {
    mockCount.mockReturnValue({ data: undefined, isPending } as ReturnType<
      typeof useWaveFollowersCount
    >);
    const onClick = jest.fn();
    render(<WaveHeaderFollowers wave={wave} onFollowersClick={onClick} />);
    expect(
      screen.getByRole("button", { name: "View joined followers" })
    ).toBeEnabled();
    await userEvent.click(
      screen.getByRole("button", { name: "View joined followers" })
    );
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("99")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-busy",
      String(isPending)
    );
  }
);

it.each([
  ["en-US", "1,234", "View joined followers"],
  ["en-GB", "1,234", "View joined followers"],
  ["de-DE", "1.234", "Beigetretene Follower anzeigen"],
  ["fr-FR", "1\u202f234", "Afficher les membres"],
  ["es-ES", "1234", "Ver miembros"],
] as const)(
  "formats the count and accessible name in %s",
  async (locale, number, label) => {
    await loadLocaleMessages(locale);
    jest.mocked(useBrowserLocale).mockReturnValue(locale as SupportedLocale);
    mockCount.mockReturnValue({ data: 1234, isPending: false } as ReturnType<
      typeof useWaveFollowersCount
    >);
    render(<WaveHeaderFollowers wave={wave} onFollowersClick={jest.fn()} />);
    expect(
      screen.getByText(number, { normalizer: (value) => value })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
  }
);
