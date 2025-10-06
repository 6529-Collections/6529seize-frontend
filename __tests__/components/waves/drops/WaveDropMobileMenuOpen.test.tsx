import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
