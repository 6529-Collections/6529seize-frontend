import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { Poppins } from "next/font/google";
import { createContext, useState } from "react";
import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";
import {
  AllowlistCustomTokenPool,
  AllowlistDescription,
  AllowlistOperation,
  AllowlistOperationDescription,
  AllowlistPhaseWithComponentAndItems,
  AllowlistTokenPool,
  AllowlistTransferPool,
  AllowlistWalletPool,
} from "../../../components/allowlist-tool/allowlist-tool.types";
import AllowlistToolBuilderOperations from "../../../components/allowlist-tool/builder/operations/AllowlistToolBuilderOperations";

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
  operations: AllowlistOperation[];
  setOperations: (operations: AllowlistOperation[]) => void;
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
};

export const AllowlistToolBuilderContext =
  createContext<AllowlistToolBuilderContextType>({
    operations: [],
    setOperations: () => {},
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
  });

export default function AllowlistToolAllowlistId({
  allowlist,
  operationDescriptions,
}: {
  allowlist: AllowlistDescription;
  operationDescriptions: AllowlistOperationDescription[];
}) {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Allowlist tool", href: "/allowlist-tool" },
    { display: allowlist.name },
  ]);
  const [operations, setOperations] = useState<AllowlistOperation[]>([]);

  const [transferPools, setTransferPools] = useState<AllowlistTransferPool[]>(
    []
  );
  const [tokenPools, setTokenPools] = useState<AllowlistTokenPool[]>([]);
  const [customTokenPools, setCustomTokenPools] = useState<
    AllowlistCustomTokenPool[]
  >([]);
  const [walletPools, setWalletPools] = useState<AllowlistWalletPool[]>([]);
  const [phases, setPhases] = useState<AllowlistPhaseWithComponentAndItems[]>(
    []
  );
  return (
    <>
      <Header />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <div className={`tw-min-h-screen tw-bg-zinc-950 ${poppins.className}`}>
        <div className="container tw-mx-auto tw-t-4 tw-pb-12">
          <h1 className="tw-uppercase tw-float-none tw-mb-0">
            {allowlist.name}
          </h1>

          <div id="allowlist-tool" className="tw-pt-8">
            <AllowlistToolBuilderContext.Provider
              value={{
                operations,
                setOperations,
                operationDescriptions,
                transferPools,
                setTransferPools,
                tokenPools,
                setTokenPools,
                customTokenPools,
                setCustomTokenPools,
                walletPools,
                setWalletPools,
                phases,
                setPhases,
              }}
            >
              <AllowlistToolBuilderOperations>
                <div className="tw-space-y-8">
                  <AllowlistToolBuilderTransferPools />
                  <AllowlistToolBuilderTokenPools />
                  <AllowlistToolBuilderCustomTokenPools />
                  <AllowlistToolBuilderWalletPools />
                  <AllowlistToolBuilderPhases />
                </div>
              </AllowlistToolBuilderOperations>
            </AllowlistToolBuilderContext.Provider>
          </div>
        </div>
      </div>
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
  const allowlist: AllowlistDescription = await allowlistResponse.json();
  const operationDescriptions: AllowlistOperationDescription[] =
    await operationDescriptionsResponse.json();

  if ("error" in allowlist) {
    return {
      redirect: {
        destination: "/allowlist-tool",
        permanent: false,
      },
    };
  }

  return { props: { allowlist, operationDescriptions } };
}
