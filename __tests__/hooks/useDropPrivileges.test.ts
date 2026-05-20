import { act, renderHook } from "@testing-library/react";
import {
  useDropPrivileges,
  SubmissionRestriction,
  ChatRestriction,
} from "@/hooks/useDropPriviledges";

describe("useDropPrivileges", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns not logged in restrictions", () => {
    const { result } = renderHook(() =>
      useDropPrivileges({
        isLoggedIn: false,
        isProxy: false,
        canChat: true,
        canDrop: true,
        chatDisabled: false,
        slowModeCooldownMs: null,
        nextDropAllowed: null,
        submissionStarts: null,
        submissionEnds: null,
        maxDropsCount: null,
        identityDropsCount: null,
      })
    );
    expect(result.current.submissionRestriction).toBe(
      SubmissionRestriction.NOT_LOGGED_IN
    );
    expect(result.current.chatRestriction).toBe(ChatRestriction.NOT_LOGGED_IN);
  });

  it("handles submission ended and chat disabled", () => {
    const now = Date.now();
    const { result } = renderHook(() =>
      useDropPrivileges({
        isLoggedIn: true,
        isProxy: false,
        canChat: true,
        canDrop: true,
        chatDisabled: true,
        slowModeCooldownMs: null,
        nextDropAllowed: null,
        submissionStarts: now - 1000,
        submissionEnds: now - 500,
        maxDropsCount: null,
        identityDropsCount: null,
      })
    );
    expect(result.current.submissionRestriction).toBe(
      SubmissionRestriction.ENDED
    );
    expect(result.current.chatRestriction).toBe(ChatRestriction.DISABLED);
  });

  it("returns slow mode before generic chat permission", () => {
    const now = Date.now();
    const { result } = renderHook(() =>
      useDropPrivileges({
        isLoggedIn: true,
        isProxy: false,
        canChat: false,
        canDrop: true,
        chatDisabled: false,
        slowModeCooldownMs: 30_000,
        nextDropAllowed: now + 20_000,
        submissionStarts: null,
        submissionEnds: null,
        maxDropsCount: null,
        identityDropsCount: null,
      })
    );

    expect(result.current.chatRestriction).toBe(ChatRestriction.SLOW_MODE);
  });

  it("returns disabled before slow mode", () => {
    const now = Date.now();
    const { result } = renderHook(() =>
      useDropPrivileges({
        isLoggedIn: true,
        isProxy: false,
        canChat: true,
        canDrop: true,
        chatDisabled: true,
        slowModeCooldownMs: 30_000,
        nextDropAllowed: now + 20_000,
        submissionStarts: null,
        submissionEnds: null,
        maxDropsCount: null,
        identityDropsCount: null,
      })
    );

    expect(result.current.chatRestriction).toBe(ChatRestriction.DISABLED);
  });

  it("does not apply slow mode after countdown expires", () => {
    const now = Date.now();
    const { result } = renderHook(() =>
      useDropPrivileges({
        isLoggedIn: true,
        isProxy: false,
        canChat: true,
        canDrop: true,
        chatDisabled: false,
        slowModeCooldownMs: 30_000,
        nextDropAllowed: now - 1,
        submissionStarts: null,
        submissionEnds: null,
        maxDropsCount: null,
        identityDropsCount: null,
      })
    );

    expect(result.current.chatRestriction).toBeNull();
  });

  it("returns no permission when expired slow mode data still has no chat permission", () => {
    const now = Date.now();
    const { result } = renderHook(() =>
      useDropPrivileges({
        isLoggedIn: true,
        isProxy: false,
        canChat: false,
        canDrop: true,
        chatDisabled: false,
        slowModeCooldownMs: 30_000,
        nextDropAllowed: now - 1,
        submissionStarts: null,
        submissionEnds: null,
        maxDropsCount: null,
        identityDropsCount: null,
      })
    );

    expect(result.current.chatRestriction).toBe(ChatRestriction.NO_PERMISSION);
  });

  it("recalculates slow mode when the countdown expires without prop changes", () => {
    jest.useFakeTimers();
    jest.setSystemTime(100_000);

    const { result } = renderHook(() =>
      useDropPrivileges({
        isLoggedIn: true,
        isProxy: false,
        canChat: false,
        canDrop: true,
        chatDisabled: false,
        slowModeCooldownMs: 30_000,
        nextDropAllowed: 101_000,
        submissionStarts: null,
        submissionEnds: null,
        maxDropsCount: null,
        identityDropsCount: null,
      })
    );

    expect(result.current.chatRestriction).toBe(ChatRestriction.SLOW_MODE);

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(result.current.chatRestriction).toBe(ChatRestriction.NO_PERMISSION);
  });

  it("calls slow mode expiry callback once for stale chat permission", () => {
    jest.useFakeTimers();
    jest.setSystemTime(100_000);
    const onSlowModeCooldownExpired = jest.fn();

    renderHook(() =>
      useDropPrivileges({
        isLoggedIn: true,
        isProxy: false,
        canChat: false,
        canDrop: true,
        chatDisabled: false,
        slowModeCooldownMs: 30_000,
        nextDropAllowed: 101_000,
        submissionStarts: null,
        submissionEnds: null,
        maxDropsCount: null,
        identityDropsCount: null,
        onSlowModeCooldownExpired,
      })
    );

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(onSlowModeCooldownExpired).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1_000);
    });

    expect(onSlowModeCooldownExpired).toHaveBeenCalledTimes(1);
  });

  it("calls slow mode expiry callback once for already expired stale data", () => {
    jest.useFakeTimers();
    jest.setSystemTime(100_000);
    const onSlowModeCooldownExpired = jest.fn();

    const { rerender } = renderHook(
      (props: Parameters<typeof useDropPrivileges>[0]) =>
        useDropPrivileges(props),
      {
        initialProps: {
          isLoggedIn: true,
          isProxy: false,
          canChat: false,
          canDrop: true,
          chatDisabled: false,
          slowModeCooldownMs: 30_000,
          nextDropAllowed: 99_000,
          submissionStarts: null,
          submissionEnds: null,
          maxDropsCount: null,
          identityDropsCount: null,
          onSlowModeCooldownExpired,
        },
      }
    );

    expect(onSlowModeCooldownExpired).toHaveBeenCalledTimes(1);

    rerender({
      isLoggedIn: true,
      isProxy: false,
      canChat: false,
      canDrop: true,
      chatDisabled: false,
      slowModeCooldownMs: 30_000,
      nextDropAllowed: 99_000,
      submissionStarts: null,
      submissionEnds: null,
      maxDropsCount: null,
      identityDropsCount: null,
      onSlowModeCooldownExpired,
    });

    expect(onSlowModeCooldownExpired).toHaveBeenCalledTimes(1);
  });
});
