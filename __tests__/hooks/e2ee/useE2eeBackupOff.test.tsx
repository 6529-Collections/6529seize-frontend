import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useE2eeBackupOff } from "@/hooks/e2ee/useE2eeBackup";
import type { E2eeBackupManager, E2eeBackupSnapshot } from "@/lib/e2ee/backup";
import {
  contextFor,
  createFakeE2eeEngine,
  E2eeTestProvider,
} from "../../components/e2ee/fakeE2eeEngine";

function fakeBackup(phase: E2eeBackupSnapshot["phase"]) {
  let current = { phase, busy: false } as E2eeBackupSnapshot;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(patch: Partial<E2eeBackupSnapshot>) {
      current = { ...current, ...patch };
      listeners.forEach((listener) => listener());
    },
  };
}

function renderWith(backup: ReturnType<typeof fakeBackup> | null) {
  let renders = 0;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <E2eeTestProvider
      value={contextFor(createFakeE2eeEngine(), {
        backup: backup as unknown as E2eeBackupManager | null,
      })}
    >
      {children}
    </E2eeTestProvider>
  );
  const result = renderHook(
    () => {
      renders += 1;
      return useE2eeBackupOff();
    },
    { wrapper }
  );
  return { ...result, renders: () => renders };
}

describe("useE2eeBackupOff", () => {
  it("is false while there is no backup to read (encrypted messages off)", () => {
    expect(renderWith(null).result.current).toBe(false);
  });

  it("follows the phase, without re-rendering on progress updates", () => {
    const backup = fakeBackup("on");
    const { result, renders } = renderWith(backup);
    expect(result.current).toBe(false);
    const before = renders();
    act(() => backup.set({ busy: true }));
    act(() => backup.set({ busy: false }));
    expect(renders()).toBe(before);
    act(() => backup.set({ phase: "off" }));
    expect(result.current).toBe(true);
  });
});
