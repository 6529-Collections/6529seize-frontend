import React from "react";
import { render, renderHook, screen, fireEvent } from "@testing-library/react";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCompetitionDropNavigation } from "@/hooks/competitions/useCompetitionDropNavigation";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push });
(usePathname as jest.Mock).mockReturnValue("/p");
(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("q=1"));

describe("WaveDropMobileMenuOpen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue("/p");
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("q=1"));
  });

  it("preserves competition navigation and closes the mobile menu once", () => {
    const onOpenChange = jest.fn();
    const drop = {
      id: "entry-art",
      drop_type: ApiDropType.Participatory,
    } as ExtendedDrop;
    (usePathname as jest.Mock).mockReturnValue("/waves/w/competitions/alpha");
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("tab=leaderboard&default=1")
    );
    const { result } = renderHook(() => useCompetitionDropNavigation());
    render(
      <WaveDropMobileMenuOpen
        drop={drop}
        onNavigate={result.current}
        onOpenChange={onOpenChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Open drop" }));
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(
      "/waves/w/competitions/alpha?tab=leaderboard&drop=entry-art",
      { scroll: false }
    );
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
  it("renders nothing for chat drops", () => {
    const { container } = render(
      <WaveDropMobileMenuOpen
        drop={{ id: "d", drop_type: ApiDropType.Chat } as any}
        onOpenChange={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("updates router and calls callback", () => {
    const onOpenChange = jest.fn();
    render(
      <WaveDropMobileMenuOpen
        drop={{ id: "d1", drop_type: ApiDropType.Participatory } as any}
        onOpenChange={onOpenChange}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(push).toHaveBeenCalledWith("/p?q=1&drop=d1");
    expect(onOpenChange).toHaveBeenCalled();
  });
});
