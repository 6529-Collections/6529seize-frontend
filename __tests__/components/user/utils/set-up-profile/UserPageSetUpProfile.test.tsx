import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import UserPageSetUpProfile from "@/components/user/utils/set-up-profile/UserPageSetUpProfile";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext, type ContextType } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { hasIdentityGettingStartedSession } from "@/components/user/identity/getting-started/identityGettingStartedSession";

let mockMutationOptions:
  | { readonly onSuccess: (profile: ApiIdentity) => void }
  | undefined;
const mockMutate = jest.fn();

function ProfileSuccessHarness({
  profile,
  setToast,
}: {
  readonly profile: ApiIdentity;
  readonly setToast: ContextType<typeof AuthContext>["setToast"];
}) {
  const auth = useContext(AuthContext);
  const queryContext = useContext(ReactQueryWrapperContext);
  return (
    <AuthContext.Provider value={{ ...auth, requestAuth: jest.fn(), setToast }}>
      <ReactQueryWrapperContext.Provider
        value={{ ...queryContext, onProfileEdit: jest.fn() }}
      >
        <UserPageSetUpProfile profile={profile} />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
}

jest.mock(
  "@/components/user/utils/set-up-profile/UserPageSetUpProfileHeader",
  () => () => <div data-testid="header" />
);
jest.mock(
  "@/components/user/settings/UserSettingsUsername",
  () => (props: any) => (
    <button
      data-testid="username"
      onClick={() => {
        props.setUserName("newname");
        props.setIsAvailable(true);
        props.setIsLoading(false);
      }}
    >
      username
    </button>
  )
);
jest.mock("@/components/user/settings/UserSettingsClassification", () => () => (
  <div data-testid="classification" />
));
jest.mock("@/components/user/settings/UserSettingsPrimaryWallet", () => () => (
  <div data-testid="primary-wallet" />
));
jest.mock("@/components/user/settings/UserSettingsSave", () => (props: any) => (
  <button data-testid="save" disabled={props.disabled}>
    save
  </button>
));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(() => Promise.resolve({ handle: "newname" })),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/[user]",
  useSearchParams: () => ({ get: jest.fn() }),
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: (options: {
    readonly onSuccess: (profile: ApiIdentity) => void;
  }) => {
    mockMutationOptions = options;
    return { mutateAsync: mockMutate };
  },
}));

describe("UserPageSetUpProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockMutationOptions = undefined;
  });
  const profile: any = {
    handle: "user",
    wallets: [
      { wallet: "0x1", tdh: 1 },
      { wallet: "0x2", tdh: 0 },
    ],
    primary_wallet: "0x1",
  };

  it("renders primary wallet selector when multiple wallets", () => {
    render(
      <AuthContext.Provider
        value={{ requestAuth: jest.fn(), setToast: jest.fn() } as any}
      >
        <ReactQueryWrapperContext.Provider
          value={{ onProfileEdit: jest.fn() } as any}
        >
          <UserPageSetUpProfile profile={profile} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    expect(screen.getByTestId("primary-wallet")).toBeInTheDocument();
  });

  it("submits profile update on save", async () => {
    const user = userEvent.setup();
    const requestAuth = jest.fn().mockResolvedValue({ success: true });
    render(
      <AuthContext.Provider value={{ requestAuth, setToast: jest.fn() } as any}>
        <ReactQueryWrapperContext.Provider
          value={{ onProfileEdit: jest.fn() } as any}
        >
          <UserPageSetUpProfile profile={profile} />
        </ReactQueryWrapperContext.Provider>
      </AuthContext.Provider>
    );
    await user.click(screen.getByTestId("username"));
    await user.click(screen.getByTestId("save"));
    expect(requestAuth).toHaveBeenCalled();
    expect(mockMutate).toHaveBeenCalled();
  });

  it.each([
    { handle: null, message: "Profile created", hasCreationSession: true },
    { handle: "user", message: "Profile updated.", hasCreationSession: false },
  ])(
    "reports the correct success for a profile whose existing handle is $handle",
    ({ handle, message, hasCreationSession }) => {
      const setToast = jest.fn();
      render(
        <ProfileSuccessHarness
          profile={{ ...profile, handle }}
          setToast={setToast}
        />
      );

      act(() =>
        mockMutationOptions?.onSuccess({ ...profile, handle: "newname" })
      );

      expect(setToast).toHaveBeenCalledWith({ message, type: "success" });
      expect(hasIdentityGettingStartedSession("newname")).toBe(
        hasCreationSession
      );
    }
  );
});
