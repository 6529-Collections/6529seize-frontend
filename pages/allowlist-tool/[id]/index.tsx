import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const AllowlistToolBuilderHeader = dynamic(
  () =>
    import(
      "../../../components/allowlist-tool/builder/AllowlistToolBuilderHeader"
    ),
  {
    ssr: false,
  }
);

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

const AllowlistToolBuilderCustomPools = dynamic(
  () =>
    import(
      "../../../components/allowlist-tool/builder/custom-pools/AllowlistToolBuilderCustomPools"
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

export default function AllowlistToolAllowlistId() {
  return (
    <>
      <Header />
      <div className={`tw-min-h-screen tw-bg-[#131315] ${poppins.className}`}>
        <div className="container tw-mx-auto tw-pt-12">
          <AllowlistToolBuilderHeader />
          
         <div className="tw-pt-8 tw-space-y-8">
         <AllowlistToolBuilderTransferPools />
          <AllowlistToolBuilderTokenPools />
          <AllowlistToolBuilderCustomPools />
          <AllowlistToolBuilderWalletPools />
          <AllowlistToolBuilderPhases />
         </div>
         
        </div>
      </div>
    </>
  );
}
