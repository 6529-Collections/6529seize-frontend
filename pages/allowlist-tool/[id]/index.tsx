import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";

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
      <AllowlistToolBuilderHeader />
      <AllowlistToolBuilderTransferPools />
      <AllowlistToolBuilderTokenPools />
      <AllowlistToolBuilderCustomPools />
      <AllowlistToolBuilderWalletPools />
      <AllowlistToolBuilderPhases />
    </>
  );
}
