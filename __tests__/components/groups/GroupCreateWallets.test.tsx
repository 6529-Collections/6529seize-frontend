import { useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupCreateWallets, {
  type GroupCreateWalletSources,
  GroupCreateWalletsType,
} from "@/components/groups/page/create/config/wallets/GroupCreateWallets";
import { AuthContext } from "@/components/auth/Auth";

let identitiesProps: any;
let emmaProps: any;
let uploadProps: any;

jest.mock(
  "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSelect",
  () => (props: any) => {
    identitiesProps = props;
    return <div />;
  }
);
jest.mock(
  "@/components/groups/page/create/config/wallets/CreateGroupWalletsEmma",
  () => (props: any) => {
    emmaProps = props;
    return <div />;
  }
);
jest.mock(
  "@/components/groups/page/create/config/wallets/CreateGroupWalletsUpload",
  () => (props: any) => {
    uploadProps = props;
    return <div />;
  }
);

describe("GroupCreateWallets", () => {
  beforeEach(() => {
    identitiesProps = null;
    emmaProps = null;
    uploadProps = null;
  });

  const renderComp = (
    props: {
      readonly wallets?: string[] | null;
      readonly walletsLimit?: number;
      readonly iAmIncluded?: boolean;
      readonly type?: GroupCreateWalletsType;
    } = {},
    connectedProfile: any = null
  ) => {
    const setWallets = jest.fn();
    let setIncludeMe: ((value: boolean) => void) | undefined;

    const WalletHarness = () => {
      const initialWallets =
        props.wallets === undefined ? ["0x1", "0x2"] : props.wallets;
      const [wallets, setCurrentWallets] = useState<string[] | null>(
        initialWallets
      );
      const [sources, setSources] = useState<GroupCreateWalletSources>({
        uploadedWallets: initialWallets,
        emmaWallets: null,
        selectedIdentities: [],
      });
      const [iAmIncluded, setIAmIncluded] = useState(
        props.iAmIncluded ?? false
      );
      setIncludeMe = setIAmIncluded;

      return (
        <GroupCreateWallets
          type={props.type ?? GroupCreateWalletsType.INCLUDE}
          wallets={wallets}
          walletsLimit={props.walletsLimit ?? 1}
          iAmIncluded={iAmIncluded}
          sources={sources}
          setSources={setSources}
          setWallets={(nextWallets) => {
            setCurrentWallets(nextWallets);
            setWallets(nextWallets);
          }}
        />
      );
    };

    const result = render(
      <AuthContext.Provider value={{ connectedProfile } as any}>
        <WalletHarness />
      </AuthContext.Provider>
    );
    return {
      ...result,
      setWallets,
      setIAmIncluded: (value: boolean) => setIncludeMe?.(value),
    };
  };

  it("shows over limit warning", () => {
    renderComp();
    expect(screen.getByText("Include Identities")).toHaveClass(
      "tw-m-0",
      "!tw-leading-none"
    );
    expect(
      screen.getByText(/Maximum allowed wallets count/)
    ).toBeInTheDocument();
  });

  it("uses the same compact heading alignment for excluded identities", () => {
    renderComp({
      type: GroupCreateWalletsType.EXCLUDE,
      walletsLimit: 5,
    });

    expect(screen.getByText("Exclude Identities")).toHaveClass(
      "tw-m-0",
      "!tw-leading-none"
    );
  });

  it("removes wallets when remove button clicked", async () => {
    const user = userEvent.setup();
    const { setWallets } = renderComp({ walletsLimit: 5 });
    await user.click(screen.getByLabelText("Remove wallets"));
    expect(setWallets).toHaveBeenCalledWith(null);
  });

  it("combines upload, EMMA, and identity sources without duplicates", async () => {
    const { setWallets } = renderComp({ wallets: null, walletsLimit: 5 });

    act(() => uploadProps.setWallets(["0xA", "0xB"]));
    await waitFor(() =>
      expect(setWallets).toHaveBeenLastCalledWith(["0xA", "0xB"])
    );

    act(() => emmaProps.setWallets(["0xb", "0xC"]));
    await waitFor(() =>
      expect(setWallets).toHaveBeenLastCalledWith(["0xA", "0xB", "0xC"])
    );

    act(() =>
      identitiesProps.onIdentitySelect({ wallet: "0xc", primary_wallet: "0xc" })
    );
    await waitFor(() =>
      expect(setWallets).toHaveBeenLastCalledWith(["0xA", "0xB", "0xC"])
    );
  });

  it("keeps the primary wallet while Include me is active", async () => {
    const connectedProfile = {
      primary_wallet: "0xMine",
      wallets: [{ wallet: "0xMine" }, { wallet: "0xMineTwo" }],
    };
    const { setWallets } = renderComp(
      { wallets: null, walletsLimit: 10000, iAmIncluded: true },
      connectedProfile
    );

    act(() => uploadProps.setWallets(["0xOther"]));
    await waitFor(() =>
      expect(setWallets).toHaveBeenLastCalledWith(["0xOther", "0xMine"])
    );
  });

  it("keeps the primary wallet when an upload changes after Include me is enabled", async () => {
    const connectedProfile = {
      primary_wallet: "0xMine",
      wallets: [{ wallet: "0xMine" }],
    };
    const { setIAmIncluded, setWallets } = renderComp(
      { wallets: null, walletsLimit: 10000 },
      connectedProfile
    );

    act(() => setIAmIncluded(true));
    act(() => uploadProps.setWallets(["0xOther"]));

    await waitFor(() =>
      expect(setWallets).toHaveBeenLastCalledWith(["0xOther", "0xMine"])
    );
  });
});
