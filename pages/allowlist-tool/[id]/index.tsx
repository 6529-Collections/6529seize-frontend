import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { Poppins } from "next/font/google";
import { createContext, useState } from "react";
import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";
import {
  AllowlistCustomTokenPool,
  AllowlistDescription,
  AllowlistOperation,
  AllowlistOperationCode,
  AllowlistOperationDescription,
  AllowlistPhaseWithComponentAndItems,
  AllowlistTokenPool,
  AllowlistTransferPool,
  AllowlistWalletPool,
} from "../../../components/allowlist-tool/allowlist-tool.types";
import AllowlistToolBuilderOperations from "../../../components/allowlist-tool/builder/operations/AllowlistToolBuilderOperations";
import { ToastContainer, toast, Slide, TypeOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import { useRouter } from "next/router";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const AllowlistToolBuilderTransferPools = dynamic(
  () =>
    import(
      "../../../components/allowlist-tool/builder/transfer-pools/AllowlistToolBuilderTransferPools"
    ),
  {
    ssr: false,
  }
);

const AllowlistToolBuilderTokenPools = dynamic(
  () =>
    import(
      "../../../components/allowlist-tool/builder/token-pools/AllowlistToolBuilderTokenPools"
    ),
  {
    ssr: false,
  }
);

const AllowlistToolBuilderCustomTokenPools = dynamic(
  () =>
    import(
      "../../../components/allowlist-tool/builder/custom-token-pools/AllowlistToolBuilderCustomTokenPools"
    ),
  {
    ssr: false,
  }
);

const AllowlistToolBuilderWalletPools = dynamic(
  () =>
    import(
      "../../../components/allowlist-tool/builder/wallet-pools/AllowlistToolBuilderWalletPools"
    ),
  {
    ssr: false,
  }
);

const AllowlistToolBuilderPhases = dynamic(
  () =>
    import(
      "../../../components/allowlist-tool/builder/phases/AllowlistToolBuilderPhases"
    ),
  {
    ssr: false,
  }
);

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

type AllowlistToolBuilderContextType = {
  allowlist: AllowlistDescription | null;
  setAllowlist: (allowlist: AllowlistDescription) => void;
  operations: AllowlistOperation[];
  setOperations: (operations: AllowlistOperation[]) => void;
  addNewOperation: (operation: AllowlistOperation) => void;
  addOperations: (operations: AllowlistOperation[]) => void;
  operationDescriptions: AllowlistOperationDescription[];
  transferPools: AllowlistTransferPool[];
  setTransferPools: (transferPools: AllowlistTransferPool[]) => void;
  tokenPools: AllowlistTokenPool[];
  setTokenPools: (tokenPools: AllowlistTokenPool[]) => void;
  customTokenPools: AllowlistCustomTokenPool[];
  setCustomTokenPools: (customTokenPools: AllowlistCustomTokenPool[]) => void;
  walletPools: AllowlistWalletPool[];
  setWalletPools: (walletPools: AllowlistWalletPool[]) => void;
  phases: AllowlistPhaseWithComponentAndItems[];
  setPhases: (phases: AllowlistPhaseWithComponentAndItems[]) => void;
  setToasts: ({
    messages,
    type,
  }: {
    messages: string[];
    type: TypeOptions;
  }) => void;
};

const setToast = ({
  message,
  type,
}: {
  message: string;
  type: TypeOptions;
}) => {
  toast(message, {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 3000,
    hideProgressBar: false,
    draggable: false,
    closeOnClick: true,
    transition: Slide,
    theme: "dark",
    type,
  });
};

const setToasts = ({
  messages,
  type,
}: {
  messages: string[];
  type: TypeOptions;
}) => {
  messages.forEach((message) => setToast({ message, type }));
};

export const AllowlistToolBuilderContext =
  createContext<AllowlistToolBuilderContextType>({
    allowlist: null,
    setAllowlist: () => {},
    operations: [],
    setOperations: () => {},
    addNewOperation: () => {},
    addOperations: () => {},
    operationDescriptions: [],
    transferPools: [],
    setTransferPools: () => {},
    tokenPools: [],
    setTokenPools: () => {},
    customTokenPools: [],
    setCustomTokenPools: () => {},
    walletPools: [],
    setWalletPools: () => {},
    phases: [],
    setPhases: () => {},
    setToasts: () => {},
  });

export default function AllowlistToolAllowlistId({
  allowlistState,
  operationDescriptions,
}: {
  allowlistState: AllowlistDescription;
  operationDescriptions: AllowlistOperationDescription[];
}) {
  const router = useRouter();
  const [breadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Allowlist tool", href: "/allowlist-tool" },
    { display: allowlistState.name },
  ]);

  const [allowlist, setAllowlist] =
    useState<AllowlistDescription>(allowlistState);
  const [operations, setOperations] = useState<AllowlistOperation[]>([]);

  const [transferPools, setTransferPools] = useState<AllowlistTransferPool[]>(
    []
  );
  const [optimisticTransferPools, setOptimisticTransferPools] = useState<
    AllowlistTransferPool[]
  >([]);
  const [tokenPools, setTokenPools] = useState<AllowlistTokenPool[]>([]);
  const [optimisticTokenPools, setOptimisticTokenPools] = useState<
    AllowlistTokenPool[]
  >([]);
  const [customTokenPools, setCustomTokenPools] = useState<
    AllowlistCustomTokenPool[]
  >([]);
  const [optimisticCustomTokenPools, setOptimisticCustomTokenPools] = useState<
    AllowlistCustomTokenPool[]
  >([]);
  const [walletPools, setWalletPools] = useState<AllowlistWalletPool[]>([]);
  const [optimisticWalletPools, setOptimisticWalletPools] = useState<
    AllowlistWalletPool[]
  >([]);
  const [phases, setPhases] = useState<AllowlistPhaseWithComponentAndItems[]>(
    []
  );
  const [optimisticPhases, setOptimisticPhases] = useState<
    AllowlistPhaseWithComponentAndItems[]
  >([]);

  const doOperationOptimisticUpdate = (operation: AllowlistOperation) => {
    const { code } = operation;
    switch (code) {
      case AllowlistOperationCode.GET_COLLECTION_TRANSFERS:
        setOptimisticTransferPools([
          ...optimisticTransferPools,
          {
            id: operation.params.id,
            allowlistId: router.query.id as string,
            name: operation.params.name,
            description: operation.params.description,
            contract: operation.params.contract,
            blockNo: operation.params.blockNo,
          },
        ]);
        break;
      case AllowlistOperationCode.CREATE_TOKEN_POOL:
        setOptimisticTokenPools([
          ...optimisticTokenPools,
          {
            id: operation.params.id,
            allowlistId: router.query.id as string,
            name: operation.params.name,
            description: operation.params.description,
            transferPoolId: operation.params.transferPoolId,
            tokenIds: operation.params.tokenIds,
          },
        ]);
        break;
      case AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL:
        setOptimisticCustomTokenPools([
          ...optimisticCustomTokenPools,
          {
            id: operation.params.id,
            allowlistId: router.query.id as string,
            name: operation.params.name,
            description: operation.params.description,
          },
        ]);
        break;
      case AllowlistOperationCode.CREATE_WALLET_POOL:
        setOptimisticWalletPools([
          ...optimisticWalletPools,
          {
            id: operation.params.id,
            allowlistId: router.query.id as string,
            name: operation.params.name,
            description: operation.params.description,
          },
        ]);
        break;
      case AllowlistOperationCode.ADD_PHASE:
        setOptimisticPhases([
          ...optimisticPhases,
          {
            id: operation.params.id,
            allowlistId: router.query.id as string,
            name: operation.params.name,
            description: operation.params.description,
            insertionOrder: 0,
            components: [],
          },
        ]);
      case AllowlistOperationCode.ADD_COMPONENT:
      case AllowlistOperationCode.ADD_ITEM:
        break;
      case AllowlistOperationCode.CREATE_ALLOWLIST:
      case AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS:
      case AllowlistOperationCode.ITEM_EXCLUE_TOKEN_IDS:
      case AllowlistOperationCode.ITEM_SELECT_TOKEN_IDS:
      case AllowlistOperationCode.ITEM_REMOVE_FIRST_N_TOKENS:
      case AllowlistOperationCode.ITEM_REMOVE_LAST_N_TOKENS:
      case AllowlistOperationCode.ITEM_SELECT_FIRST_N_TOKENS:
      case AllowlistOperationCode.ITEM_SELECT_LAST_N_TOKENS:
        break;
      default:
        assertUnreachable(code);
    }
  };

  const addOperations = (newOperations: AllowlistOperation[]) => {
    setOptimisticTransferPools([]);
    setOptimisticTokenPools([]);
    setOptimisticCustomTokenPools([]);
    setOptimisticWalletPools([]);
    setOptimisticPhases([]);
    newOperations.forEach((operation) => {
      if (operation.hasRan) {
        return;
      }
      doOperationOptimisticUpdate(operation);
    });
    setOperations([...operations, ...newOperations]);
  };

  const addNewOperation = (operation: AllowlistOperation) => {
    if (!operation.hasRan) {
      doOperationOptimisticUpdate(operation);
    }
    setOperations([...operations, operation]);
  };

  return (
    <>
      <Header />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <AllowlistToolBuilderContext.Provider
        value={{
          allowlist,
          setAllowlist,
          operations,
          setOperations,
          addNewOperation,
          addOperations,
          operationDescriptions,
          transferPools: [...transferPools, ...optimisticTransferPools],
          setTransferPools,
          tokenPools: [...tokenPools, ...optimisticTokenPools],
          setTokenPools,
          customTokenPools: [
            ...customTokenPools,
            ...optimisticCustomTokenPools,
          ],
          setCustomTokenPools,
          walletPools: [...walletPools, ...optimisticWalletPools],
          setWalletPools,
          phases: [...phases, ...optimisticPhases],
          setPhases,
          setToasts,
        }}
      >
        <div
          id="allowlist-tool"
          className={`tw-min-h-screen tw-relative tw-bg-neutral-950 ${poppins.className}`}
        >
          <div className="container tw-mx-auto tw-pt-6 tw-pb-12">
            <div className="tw-space-y-6 tw-ml-80">
              <h1 className="tw-uppercase tw-mb-0 tw-float-none">
                {allowlist.name}
              </h1>
              <AllowlistToolBuilderTransferPools />
              <AllowlistToolBuilderTokenPools />
              <AllowlistToolBuilderCustomTokenPools />
              <AllowlistToolBuilderWalletPools />
              <AllowlistToolBuilderPhases />
            </div>
            <AllowlistToolBuilderOperations />
          </div>
        </div>
        <ToastContainer />
      </AllowlistToolBuilderContext.Provider>
    </>
  );
}

export async function getServerSideProps(req: { query: { id: string } }) {
  const allowlistResponse = await fetch(
    `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${req.query.id}`
  );
  const operationDescriptionsResponse = await fetch(
    `${process.env.ALLOWLIST_API_ENDPOINT}/other/operations`
  );
  const allowlistState: AllowlistDescription = await allowlistResponse.json();
  const operationDescriptions: AllowlistOperationDescription[] =
    await operationDescriptionsResponse.json();

  if ("error" in allowlistState) {
    return {
      redirect: {
        destination: "/allowlist-tool",
        permanent: false,
      },
    };
  }

  return { props: { allowlistState, operationDescriptions } };
}
