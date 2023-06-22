import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";
import {
  AllowlistDescription,
  AllowlistOperationDescription,
} from "../../../components/allowlist-tool/allowlist-tool.types";
import AllowlistToolBuilderContextWrapper from "../../../components/allowlist-tool/builder/AllowlistToolBuilderContextWrapper";
import Head from "next/head";

const AllowlistToolBuilderPage = dynamic(
  () =>
    import(
      "../../../components/allowlist-tool/builder/AllowlistToolBuilderPage"
    ),
  {
    ssr: false,
  }
);

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function AllowlistToolAllowlistId({
  allowlistState,
  operationDescriptions,
}: {
  allowlistState: AllowlistDescription;
  operationDescriptions: AllowlistOperationDescription[];
}) {
  const [breadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Allowlist tool", href: "/allowlist-tool" },
    { display: allowlistState.name },
  ]);

  return (
    <>
      <Head>
        {/*  <style>{`
          html {
            overflow: hidden;
          }
        `}</style>  */}
      </Head>
      <div className="tw-sticky tw-top-0 tw-z-50">
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
      </div>
      <AllowlistToolBuilderContextWrapper
        allowlistState={allowlistState}
        operationDescriptions={operationDescriptions}
      >
        <AllowlistToolBuilderPage />
      </AllowlistToolBuilderContextWrapper>
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
