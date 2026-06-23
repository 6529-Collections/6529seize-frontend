import { renderHook, act, waitFor } from "@testing-library/react";
import useWaveMessagesStore from "@/contexts/wave/hooks/useWaveMessagesStore";

describe("useWaveMessagesStore", () => {
  const baseDrop = {
    id: "d1",
    serial_no: 1,
    wave: { id: "wave1" },
    author: { handle: "a" },
    parts: [],
    metadata: [],
    created_at: "2020",
    title: "",
    type: "FULL",
  } as any;

  it("allows subscription and updates data", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const listener = jest.fn();

    act(() => result.current.subscribe("wave1", listener));
    expect(listener).toHaveBeenCalledWith(undefined);

    act(() => {
      result.current.updateData({ key: "wave1", drops: [baseDrop] } as any);
    });

    const data = result.current.getData("wave1");
    expect(data?.drops[0]?.id).toBe("d1");
    await waitFor(() =>
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: "wave1" })
      )
    );
  });

  it("removes drops and exposes updated state", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const listener = jest.fn();

    act(() => result.current.subscribe("wave1", listener));
    act(() => {
      result.current.updateData({ key: "wave1", drops: [baseDrop] } as any);
    });
    await waitFor(() =>
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: "wave1" })
      )
    );
    listener.mockClear();

    act(() => result.current.removeDrop("wave1", "d1"));
    expect(result.current.getData("wave1")?.drops).toHaveLength(0);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ drops: [] })
    );

    const lateListener = jest.fn();
    act(() => result.current.subscribe("wave1", lateListener));
    expect(lateListener).toHaveBeenCalledWith(
      expect.objectContaining({ drops: [] })
    );
  });

  it("keeps subscription functions stable and sends current data to late subscribers", async () => {
    const { result } = renderHook(() => useWaveMessagesStore());
    const initialSubscribe = result.current.subscribe;
    const initialUnsubscribe = result.current.unsubscribe;
    const initialRemoveDrop = result.current.removeDrop;
    const initialOptimisticUpdateDrop = result.current.optimisticUpdateDrop;
    const listener = jest.fn();

    act(() => {
      result.current.updateData({ key: "wave1", drops: [baseDrop] } as any);
    });

    await waitFor(() =>
      expect(result.current.getData("wave1")?.drops[0]?.id).toBe("d1")
    );
    expect(result.current.subscribe).toBe(initialSubscribe);
    expect(result.current.unsubscribe).toBe(initialUnsubscribe);
    expect(result.current.removeDrop).toBe(initialRemoveDrop);
    expect(result.current.optimisticUpdateDrop).toBe(
      initialOptimisticUpdateDrop
    );

    act(() => result.current.subscribe("wave1", listener));

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        drops: expect.arrayContaining([expect.objectContaining({ id: "d1" })]),
      })
    );

    const newerDrop = {
      ...baseDrop,
      id: "d2",
      serial_no: 2,
      created_at: "2021",
    };

    act(() => {
      result.current.updateData({ key: "wave1", drops: [newerDrop] } as any);
    });

    await waitFor(() =>
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({
          drops: expect.arrayContaining([
            expect.objectContaining({ id: "d2" }),
          ]),
        })
      )
    );
  });
});
