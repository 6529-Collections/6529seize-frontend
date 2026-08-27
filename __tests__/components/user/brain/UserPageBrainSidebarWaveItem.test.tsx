import React from "react";
import { render, screen } from "@testing-library/react";
import UserPageBrainSidebarWaveItem from "@/components/user/brain/UserPageBrainSidebarWaveItem";
import { formatSidebarWaveActivityTime } from "@/components/user/brain/userPageBrainSidebarWave.helpers";
import type { ProfileWaveActivitySidebarItem } from "@/types/profile-wave-activity.types";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, prefetch, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, fill, ...props }: any) =>
    React.createElement("img", { alt: alt ?? "", ...props }),
}));

const makeWave = (
  overrides: Partial<ProfileWaveActivitySidebarItem> = {}
): ProfileWaveActivitySidebarItem => ({
  id: "wave-1",
  name: "TDH Name Vote",
  picture: null,
  isPrivate: false,
  totalDropsCount: 12,
  latestPostTimestamp: Date.now() - 2 * 60 * 60 * 1000,
  ...overrides,
});

describe("UserPageBrainSidebarWaveItem", () => {
  it("uses the wave icon fallback and standard wave route", () => {
    const { container } = render(
      <UserPageBrainSidebarWaveItem wave={makeWave()} showTotalPosts />
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/waves/wave-1");
  });

  it("shows the profile-specific timestamp and truthful total count", () => {
    const latestPostTimestamp = Date.now() - 2 * 60 * 60 * 1000;
    const { container } = render(
      <UserPageBrainSidebarWaveItem
        wave={makeWave({ latestPostTimestamp })}
        showTotalPosts
      />
    );

    expect(screen.getByText(/^Last post /)).toBeInTheDocument();
    expect(screen.getByText("12 total wave posts")).toBeInTheDocument();
    expect(container.querySelector("time")).toHaveAttribute(
      "dateTime",
      new Date(latestPostTimestamp).toISOString()
    );
  });

  it("shows an honest no-post state and singular total label", () => {
    const { container } = render(
      <UserPageBrainSidebarWaveItem
        wave={makeWave({
          latestPostTimestamp: null,
          totalDropsCount: 1,
        })}
        showTotalPosts
      />
    );

    expect(screen.getByText("No posts by this profile")).toBeInTheDocument();
    expect(screen.getByText("1 total wave post")).toBeInTheDocument();
    expect(container.querySelector("time")).toBeNull();
  });

  it("keeps the picture decorative and exposes private status as text", () => {
    const { container } = render(
      <UserPageBrainSidebarWaveItem
        wave={makeWave({
          picture: "https://example.com/wave.png",
          isPrivate: true,
        })}
        showTotalPosts
      />
    );

    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(screen.getByText("Private wave")).toBeInTheDocument();
  });

  it("can show only the profile-specific timestamp", () => {
    render(
      <UserPageBrainSidebarWaveItem wave={makeWave()} showTotalPosts={false} />
    );

    expect(screen.getByText(/^Last post /)).toBeInTheDocument();
    expect(screen.queryByText("12 total wave posts")).toBeNull();
  });

  it("keeps relative-time values inside the selected unit", () => {
    const referenceTime = Date.UTC(2026, 7, 27, 12);

    expect(
      formatSidebarWaveActivityTime(
        "en-US",
        referenceTime - 59.6 * 60 * 1000,
        referenceTime
      )
    ).toBe("59m ago");
  });
});
