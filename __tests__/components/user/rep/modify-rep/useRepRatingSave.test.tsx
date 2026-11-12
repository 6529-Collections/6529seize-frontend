import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useRepRatingSave } from "@/components/user/rep/modify-rep/useRepRatingSave";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiPost } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { useContext, type ReactNode } from "react";

jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
const post = jest.mocked(commonApiPost);
const requestAuth = jest.fn();
const onProfileRepModify = jest.fn();
const owner = { id: "owner", handle: "owner" } as ApiIdentity;
const updates = ["alice", "bob"].map((handle) => ({
  profile: { id: handle, query: handle, handle } as ApiIdentity,
  category: "Artist",
  amount: 0,
}));

function setup() {
  let viewer = owner;
  const client = new QueryClient();
  function Wrapper({ children }: { readonly children: ReactNode }) {
    const auth = useContext(AuthContext);
    const queries = useContext(ReactQueryWrapperContext);
    return (
      <QueryClientProvider client={client}>
        <AuthContext
          value={{
            ...auth,
            connectedProfile: viewer,
            activeProfileProxy: null,
            requestAuth,
            setToast: jest.fn(),
          }}
        >
          <ReactQueryWrapperContext value={{ ...queries, onProfileRepModify }}>
            {children}
          </ReactQueryWrapperContext>
        </AuthContext>
      </QueryClientProvider>
    );
  }
  const hook = renderHook(useRepRatingSave, { wrapper: Wrapper });
  return {
    ...hook,
    switchProfile: () => {
      viewer = { ...owner, id: "another-owner" };
      hook.rerender();
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  requestAuth.mockResolvedValue({ success: true });
  onProfileRepModify.mockResolvedValue(undefined);
  post.mockResolvedValue(undefined);
});

it("does not write when the principal changes while authentication is pending", async () => {
  let authenticate!: (value: { success: boolean }) => void;
  requestAuth.mockReturnValue(
    new Promise((resolve) => {
      authenticate = resolve;
    })
  );
  const { result, switchProfile } = setup();
  let saving!: Promise<boolean>;
  act(() => {
    saving = result.current.save(updates);
  });
  switchProfile();
  await act(async () => {
    authenticate({ success: true });
    await saving;
  });
  expect(post).not.toHaveBeenCalled();
});

it("stops remaining writes if the principal changes during a batch", async () => {
  let complete!: () => void;
  post.mockReturnValueOnce(
    new Promise<void>((resolve) => {
      complete = resolve;
    })
  );
  const { result, switchProfile } = setup();
  let saving!: Promise<boolean>;
  await act(async () => {
    saving = result.current.save(updates);
  });
  expect(post).toHaveBeenCalledTimes(1);
  switchProfile();
  await act(async () => {
    complete();
    await saving;
  });
  expect(post).toHaveBeenCalledTimes(1);
  expect(onProfileRepModify).toHaveBeenCalledTimes(1);
  expect(onProfileRepModify).toHaveBeenCalledWith(
    expect.objectContaining({
      connectedProfile: owner,
      targetProfiles: [updates[0]!.profile],
    })
  );
});

it("keeps saving locked until the shared cache refresh finishes", async () => {
  let finishRefresh!: () => void;
  onProfileRepModify.mockReturnValueOnce(
    new Promise<void>((resolve) => {
      finishRefresh = resolve;
    })
  );
  const { result } = setup();
  let saving!: Promise<boolean>;
  await act(async () => {
    saving = result.current.save([updates[0]!]);
  });
  expect(onProfileRepModify).toHaveBeenCalledTimes(1);
  expect(result.current.isSaving).toBe(true);
  await act(async () => {
    expect(await result.current.save([updates[1]!])).toBe(false);
  });
  expect(post).toHaveBeenCalledTimes(1);
  await act(async () => {
    finishRefresh();
    expect(await saving).toBe(true);
  });
  expect(result.current.isSaving).toBe(false);
});
