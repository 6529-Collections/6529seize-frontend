import { useGroupMutations } from "@/hooks/groups/useGroupMutations";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { createGroup, publishGroup } from "@/services/groups/groupMutations";
import { getWalletAddress } from "@/services/auth/auth.utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";

jest.mock("@/services/groups/groupMutations", () => ({
  createGroup: jest.fn(),
  publishGroup: jest.fn(),
  hideGroup: jest.fn(),
  validateGroupPayload: () => ({ valid: true, issues: [] }),
  toErrorMessage: () => "Could not publish",
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: jest.fn(() => "wallet-a"),
  getWalletRole: () => null,
}));

const payload: ApiCreateGroup = {
  name: "A saved group",
  group: {
    tdh: {
      min: 1,
      max: null,
      inclusion_strategy: ApiGroupTdhInclusionStrategy.Tdh,
    },
    rep: {
      min: null,
      max: null,
      direction: null,
      user_identity: null,
      category: null,
    },
    cic: { min: null, max: null, direction: null, user_identity: null },
    level: { min: null, max: null },
    owns_nfts: [],
    identity_addresses: [],
    excluded_identity_addresses: [],
  },
};

function setup(requestAuth = async () => ({ success: true })) {
  const client = new QueryClient();
  return renderHook(() => useGroupMutations({ requestAuth }), {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getWalletAddress).mockReturnValue("wallet-a");
  jest
    .mocked(createGroup)
    .mockImplementation(async () =>
      Object.assign(new ApiGroupFull(), { id: "draft-1" })
    );
  jest.mocked(publishGroup).mockRejectedValue(new Error("response lost"));
});

it("reuses the same draft after an unknown publication result and forgets it after success", async () => {
  const { result } = setup();
  await act(async () => {
    await result.current.submit({ payload });
  });
  jest
    .mocked(publishGroup)
    .mockResolvedValue(Object.assign(new ApiGroupFull(), { id: "draft-1" }));
  await act(async () => {
    await result.current.submit({ payload });
  });
  expect(createGroup).toHaveBeenCalledTimes(1);
  expect(publishGroup).toHaveBeenNthCalledWith(2, {
    id: "draft-1",
    oldVersionId: null,
  });
  await act(async () => {
    await result.current.submit({ payload });
  });
  expect(createGroup).toHaveBeenCalledTimes(2);
});

it("does not reuse a draft after changed content or a different wallet", async () => {
  const { result } = setup();
  await act(async () => {
    await result.current.submit({ payload });
  });
  const edited = { ...payload, name: "Edited group" };
  await act(async () => {
    await result.current.submit({ payload: edited });
  });
  expect(createGroup).toHaveBeenCalledTimes(2);
  jest.mocked(getWalletAddress).mockReturnValue("wallet-b");
  await act(async () => {
    await result.current.submit({ payload: edited });
  });
  expect(createGroup).toHaveBeenCalledTimes(3);
});

it("serializes same-render submissions before authentication and releases the lock after failure", async () => {
  const auth = createDeferredPromise<{ success: boolean }>();
  const requestAuth = jest.fn(() => auth.promise);
  const { result } = setup(requestAuth);
  await act(async () => {
    const first = result.current.submit({ payload });
    const second = result.current.submit({ payload });
    expect(await second).toEqual(
      expect.objectContaining({ ok: false, reason: "busy" })
    );
    expect(requestAuth).toHaveBeenCalledTimes(1);
    expect(createGroup).not.toHaveBeenCalled();
    auth.resolve({ success: true });
    await first;
  });
  jest
    .mocked(publishGroup)
    .mockResolvedValue(Object.assign(new ApiGroupFull(), { id: "draft-1" }));
  await act(async () => {
    expect(await result.current.submit({ payload })).toEqual(
      expect.objectContaining({ ok: true })
    );
  });
  expect(createGroup).toHaveBeenCalledTimes(1);
});

it("retains a moderation-rejected draft for an approved exact resubmission", async () => {
  jest
    .mocked(publishGroup)
    .mockRejectedValueOnce("This group name was rejected by moderation");
  const { result } = setup();
  await act(async () => {
    await result.current.submit({ payload });
  });
  jest
    .mocked(publishGroup)
    .mockResolvedValue(Object.assign(new ApiGroupFull(), { id: "draft-1" }));
  await act(async () => {
    await result.current.submit({ payload });
  });
  expect(createGroup).toHaveBeenCalledTimes(1);
  expect(publishGroup).toHaveBeenLastCalledWith({
    id: "draft-1",
    oldVersionId: null,
  });
});
