import React from "react";
import { render, screen } from "@testing-library/react";
import NotificationsWrapper from "@/components/brain/notifications/NotificationsWrapper";
import { useRouter } from "next/navigation";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import type { NotificationDisplayItem } from "@/types/feed.types";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock("@/hooks/usePrefetchWaveData", () => ({
  usePrefetchWaveData: jest.fn(),
}));
jest.mock(
  "@/components/brain/notifications/NotificationItems",
  () => (props: any) => {
    // expose callbacks
    return (
      <div
        data-testid="items"
        onClick={() => {
          props.onReply({ drop: { id: "d", wave: { id: "w" } }, partId: "p" });
          props.onDropContentClick({ wave: { id: "w" }, serial_no: 1 } as any);
        }}
      />
    );
  }
);

const push = jest.fn();
const prefetchWaveData = jest.fn();
const notificationsFromDistinctWaves = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  related_drops: [{ wave: { id: `visible-wave-${index + 1}` } }],
})) as unknown as NotificationDisplayItem[];
(useRouter as jest.Mock).mockReturnValue({ push });

describe("NotificationsWrapper", () => {
  beforeEach(() => {
    push.mockClear();
    prefetchWaveData.mockClear();
    (usePrefetchWaveData as jest.Mock).mockReturnValue(prefetchWaveData);
  });

  it("shows loading spinner and handles actions", () => {
    const setActive = jest.fn();
    render(
      <NotificationsWrapper
        items={[]}
        loadingOlder={true}
        activeDrop={null}
        setActiveDrop={setActive}
      />
    );
    expect(
      screen.getByText(/Loading older notifications/i)
    ).toBeInTheDocument();
  });

  it("prefetches only for an actual reply, not for rendered notifications", () => {
    const setActive = jest.fn();
    render(
      <NotificationsWrapper
        items={notificationsFromDistinctWaves}
        loadingOlder={false}
        activeDrop={null}
        setActiveDrop={setActive}
      />
    );

    expect(prefetchWaveData).not.toHaveBeenCalled();

    screen.getByTestId("items").click();

    expect(setActive).toHaveBeenCalledTimes(1);
    expect(prefetchWaveData).toHaveBeenCalledTimes(1);
    expect(prefetchWaveData).toHaveBeenCalledWith("w");
    expect(push).toHaveBeenCalledWith("/waves/w?serialNo=1");
  });
});
