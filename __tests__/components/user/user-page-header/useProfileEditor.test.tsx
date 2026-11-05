import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useProfileEditor } from "@/components/user/user-page-header/useProfileEditor";
import type { CicStatement } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
  commonApiPostForm,
} from "@/services/api/common-api";
import { act, renderHook } from "@testing-library/react";
import { useContext, type ReactNode } from "react";

const mockReplace = jest.fn();
const mockAddFile = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/owner/identity",
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  useIpfsService: () => ({ addFile: mockAddFile }),
}));
jest.mock("@/components/waves/create-wave/services/multiPartUpload", () => ({
  multiPartUpload: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiDelete: jest.fn(),
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiPostForm: jest.fn(),
}));
const post = jest.mocked(commonApiPost);
const fetchApi = jest.mocked(commonApiFetch);
const deleteApi = jest.mocked(commonApiDelete);
const postForm = jest.mocked(commonApiPostForm);
const requestAuth = jest.fn();
const setToast = jest.fn();
const onProfileEdit = jest.fn();
const onProfileStatementAdd = jest.fn();
const onProfileStatementRemove = jest.fn();
const profile = {
  handle: "owner",
  query: "owner",
  primary_wallet: "0xowner",
  classification: ApiProfileClassification.Pseudonym,
  pfp: "ipfs://original",
  banner1: "#000000",
  banner2: "#111111",
} as ApiIdentity;
const statement = {
  id: "bio",
  statement_value: "Original About",
} as CicStatement;

function setup(
  savedStatement: CicStatement | null = null,
  targetProfile = profile
) {
  function Wrapper({ children }: { readonly children: ReactNode }) {
    const auth = useContext(AuthContext);
    const cache = useContext(ReactQueryWrapperContext);
    return (
      <AuthContext.Provider value={{ ...auth, requestAuth, setToast }}>
        <ReactQueryWrapperContext.Provider
          value={{
            ...cache,
            onProfileEdit,
            onProfileStatementAdd,
            onProfileStatementRemove,
          }}
        >
          {children}
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
  }
  return renderHook(
    (defaults) =>
      useProfileEditor({
        profile: targetProfile,
        statement: savedStatement,
        ...defaults,
      }),
    {
      wrapper: Wrapper,
      initialProps: { defaultBanner1: "#000000", defaultBanner2: "#111111" },
    }
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  requestAuth.mockResolvedValue({ success: true });
  fetchApi.mockResolvedValue({ available: true });
});

it("does not save an unchanged or whitespace-only empty About", async () => {
  const { result } = setup();
  expect(result.current.dirty).toBe(false);
  act(() => result.current.updateDraft({ about: "   " }));
  await act(async () => {
    expect(await result.current.save()).toBe(false);
  });
  expect(requestAuth).not.toHaveBeenCalled();
});

it("saves only the changed About and updates the cache", async () => {
  const { result } = setup();
  post.mockResolvedValue({ ...statement, statement_value: "New About" });
  act(() => result.current.updateDraft({ about: "New About" }));
  await act(async () => {
    expect(await result.current.save()).toBe(true);
  });
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith({
    endpoint: "profiles/0xowner/cic/statements",
    body: expect.objectContaining({
      statement_value: "New About",
      statement_type: "BIO",
    }),
  });
  expect(onProfileStatementAdd).toHaveBeenCalledWith({ profile });
  expect(result.current.dirty).toBe(false);
  expect(fetchApi).not.toHaveBeenCalled();
});

it("clears an existing About with DELETE", async () => {
  const { result } = setup(statement);
  act(() => result.current.updateDraft({ about: "  " }));
  await act(async () => {
    expect(await result.current.save()).toBe(true);
  });
  expect(deleteApi).toHaveBeenCalledWith({
    endpoint: "profiles/0xowner/cic/statements/bio",
  });
  expect(onProfileStatementRemove).toHaveBeenCalledWith({ profile });
  expect(post).not.toHaveBeenCalled();
  expect(result.current.about).toBe("");
  expect(result.current.dirty).toBe(false);
});

it("preserves every draft field after a moderation error", async () => {
  const { result } = setup();
  post.mockRejectedValueOnce(new Error("hate speech"));
  act(() =>
    result.current.updateDraft({ about: "Safe fixture", name: "renamed" })
  );
  await act(async () => {
    expect(await result.current.save()).toBe(false);
  });
  expect(result.current.aboutError).toBe("hate speech.");
  expect(result.current.about).toBe("Safe fixture");
  expect(result.current.name).toBe("renamed");
  expect(onProfileEdit).not.toHaveBeenCalled();
  expect(result.current.dirty).toBe(true);
});

it("retries remaining profile changes without writing an already saved About again", async () => {
  const { result } = setup();
  post
    .mockResolvedValueOnce({ ...statement, statement_value: "New About" })
    .mockRejectedValueOnce(new Error("Temporary error"));
  act(() =>
    result.current.updateDraft({ about: "New About", name: "renamed" })
  );
  await act(async () => {
    expect(await result.current.save()).toBe(false);
  });
  expect(result.current.error).toContain("Temporary error");
  expect(result.current.dirty).toBe(true);
  post.mockResolvedValueOnce({ ...profile, handle: "renamed" });
  await act(async () => {
    expect(await result.current.save()).toBe(true);
  });
  expect(post.mock.calls.map(([args]) => args.endpoint)).toEqual([
    "profiles/0xowner/cic/statements",
    "profiles",
    "profiles",
  ]);
  expect(mockReplace).toHaveBeenCalledWith("/renamed/identity", {
    scroll: false,
  });
  expect(result.current.dirty).toBe(false);
});

it("preserves a confirmed meme selection when another profile change needs a retry", async () => {
  const { result } = setup();
  postForm.mockResolvedValue({ pfp_url: "ipfs://meme" });
  post.mockRejectedValueOnce(new Error("Temporary error"));
  act(() =>
    result.current.updateDraft({
      name: "renamed",
      meme: {
        id: 1,
        animation: null,
        contract: "0x0000000000000000000000000000000000000001",
        icon: null,
        thumbnail: null,
        artist: null,
        name: "Meme",
        image: "meme.jpg",
        scaled: "meme.jpg",
      },
    })
  );
  await act(async () => {
    expect(await result.current.save()).toBe(false);
  });
  post.mockResolvedValueOnce({
    ...profile,
    handle: "renamed",
    pfp: "ipfs://meme",
  });
  await act(async () => {
    expect(await result.current.save()).toBe(true);
  });
  expect(postForm).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenLastCalledWith({
    endpoint: "profiles",
    body: expect.objectContaining({ pfp_url: "ipfs://meme" }),
  });
});

it("does not write when authentication or name availability fails", async () => {
  const { result } = setup();
  act(() => result.current.updateDraft({ name: "taken" }));
  requestAuth.mockResolvedValueOnce({ success: false });
  await act(async () => {
    expect(await result.current.save()).toBe(false);
  });
  expect(post).not.toHaveBeenCalled();
  fetchApi.mockResolvedValueOnce({ available: false, message: "Name taken" });
  await act(async () => {
    expect(await result.current.save()).toBe(false);
  });
  expect(result.current.error).toBe("Name taken.");
  expect(post).not.toHaveBeenCalled();
});

it("prevents duplicate saves while a request is pending", async () => {
  const { result } = setup();
  let resolvePost!: (value: CicStatement) => void;
  post.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolvePost = resolve;
      })
  );
  act(() => result.current.updateDraft({ about: "New About" }));
  let pending!: Promise<boolean>;
  await act(async () => {
    pending = result.current.save();
    expect(await result.current.save()).toBe(false);
  });
  expect(result.current.saving).toBe(true);
  expect(post).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolvePost({ ...statement, statement_value: "New About" });
    await pending;
  });
  expect(result.current.saving).toBe(false);
});

it("requires an image only when the cover is changed to image mode", async () => {
  const { result } = setup();
  act(() =>
    result.current.updateDraft({ coverMode: "image", about: "Safe About" })
  );
  await act(async () => {
    expect(await result.current.save()).toBe(false);
  });
  expect(result.current.error).toContain("Select an image");
  expect(post).not.toHaveBeenCalled();
  act(() => result.current.updateDraft({ coverMode: "gradient" }));
  post.mockResolvedValueOnce({ ...statement, statement_value: "Safe About" });
  await act(async () => {
    expect(await result.current.save()).toBe(true);
  });
  expect(fetchApi).not.toHaveBeenCalled();
});

it("keeps an untouched fallback cover clean when parent defaults refresh", () => {
  const { result, rerender } = setup(null, {
    ...profile,
    banner1: null,
    banner2: null,
  });
  expect(result.current.dirty).toBe(false);
  rerender({ defaultBanner1: "#222222", defaultBanner2: "#333333" });
  expect(result.current.dirty).toBe(false);
});
