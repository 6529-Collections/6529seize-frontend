import type { ApiWave } from "@/generated/models/ApiWave";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ApiUpdateWaveHubRequest } from "@/generated/models/ApiUpdateWaveHubRequest";
import { useWaveSettingUpdater } from "@/components/waves/specs/useWaveSettingUpdater";
import { updateWaveHub } from "@/services/api/wave-hub-api";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import { createMockApiWave } from "@/__tests__/utils/mockFactories";
import { useContext, type ReactNode } from "react";

jest.mock("@/services/api/wave-hub-api", () => ({
  updateWaveHub: jest.fn().mockResolvedValue({}),
}));

const auth = createMockAuthContext({
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
});
const onWaveCreated = jest.fn();
const author = { id: "test-id", handle: "test-handle" } as ApiWave["author"];
const Wrapper = ({ children }: { children: ReactNode }) => {
  const queryContext = useContext(ReactQueryWrapperContext);
  return (
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider
        value={{ ...queryContext, onWaveCreated }}
      >
        {children}
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
};

beforeEach(() => jest.clearAllMocks());

it("sends only the changed chat setting, without competition fields", async () => {
  const wave = createMockApiWave({
    author,
    chat: {
      scope: { group: null },
      enabled: true,
      links_disabled: false,
    } as ApiWave["chat"],
  });
  const { result } = renderHook(() => useWaveSettingUpdater(wave), {
    wrapper: Wrapper,
  });
  const close = jest.fn();
  act(() =>
    result.current.saveChatUpdate(close, (chat) => ({
      ...chat,
      links_disabled: true,
    }))
  );
  await waitFor(() =>
    expect(updateWaveHub).toHaveBeenCalledWith(wave.id, {
      chat: { links_disabled: true },
    })
  );
  expect(close).toHaveBeenCalled();
  expect(onWaveCreated).toHaveBeenCalled();
});

it("clears slow mode explicitly while preserving omitted settings", async () => {
  const wave = createMockApiWave({
    author,
    chat: {
      scope: { group: null },
      enabled: true,
      slow_mode_cooldown_ms: 5000,
    } as ApiWave["chat"],
  });
  const { result } = renderHook(() => useWaveSettingUpdater(wave), {
    wrapper: Wrapper,
  });
  act(() =>
    result.current.saveChatUpdate(jest.fn(), (chat) => {
      const next = { ...chat };
      delete next.slow_mode_cooldown_ms;
      return next;
    })
  );
  await waitFor(() =>
    expect(updateWaveHub).toHaveBeenCalledWith(wave.id, {
      chat: { slow_mode_cooldown_ms: null },
    })
  );
});

it("closes an unchanged chat edit without authenticating or sending a patch", () => {
  const wave = createMockApiWave({
    author,
    chat: { scope: { group: null }, enabled: true } as ApiWave["chat"],
  });
  const { result } = renderHook(() => useWaveSettingUpdater(wave), {
    wrapper: Wrapper,
  });
  const close = jest.fn();
  act(() => result.current.saveChatUpdate(close, (chat) => chat));
  expect(updateWaveHub).not.toHaveBeenCalled();
  expect(auth.requestAuth).not.toHaveBeenCalled();
  expect(close).toHaveBeenCalled();
});

it("turns admin post deletion on with a single wave patch", async () => {
  const wave = createMockApiWave({
    author,
    wave: { admin_drop_deletion_enabled: false } as ApiWave["wave"],
  });
  const { result } = renderHook(() => useWaveSettingUpdater(wave), {
    wrapper: Wrapper,
  });
  const close = jest.fn();
  act(() => result.current.saveAdminDropDeletion(close, true));
  // Top-level field of the generated wave settings patch request.
  const expectedPatch = {
    admin_drop_deletion_enabled: true,
  } satisfies ApiUpdateWaveHubRequest;
  expect(
    ApiUpdateWaveHubRequest.getAttributeTypeMap().map(({ name }) => name)
  ).toContain("admin_drop_deletion_enabled");
  await waitFor(() =>
    expect(updateWaveHub).toHaveBeenCalledWith(wave.id, expectedPatch)
  );
  expect(close).toHaveBeenCalled();
  expect(onWaveCreated).toHaveBeenCalled();
});

it("keeps the admin post deletion editor open when saving fails", async () => {
  jest.mocked(updateWaveHub).mockRejectedValueOnce(new Error("rejected"));
  const wave = createMockApiWave({
    author,
    wave: { admin_drop_deletion_enabled: false } as ApiWave["wave"],
  });
  const { result } = renderHook(() => useWaveSettingUpdater(wave), {
    wrapper: Wrapper,
  });
  const close = jest.fn();
  act(() => result.current.saveAdminDropDeletion(close, true));
  await waitFor(() =>
    expect(auth.setToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    )
  );
  expect(close).not.toHaveBeenCalled();
  expect(onWaveCreated).not.toHaveBeenCalled();
});

it("closes an unchanged admin post deletion edit without sending a patch", () => {
  const wave = createMockApiWave({
    author,
    wave: { admin_drop_deletion_enabled: true } as ApiWave["wave"],
  });
  const { result } = renderHook(() => useWaveSettingUpdater(wave), {
    wrapper: Wrapper,
  });
  const close = jest.fn();
  act(() => result.current.saveAdminDropDeletion(close, true));
  expect(updateWaveHub).not.toHaveBeenCalled();
  expect(auth.requestAuth).not.toHaveBeenCalled();
  expect(close).toHaveBeenCalled();
});
