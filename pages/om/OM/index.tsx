import React from 'react';
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const IndexPage = () => (
  <>
    <Header extraClass="header-wp" />
    <div>
  <title>Redirecting...</title>
  <meta httpEquiv="refresh" content="0;url=/om/" />
  <p>You are being redirected to <a href="/om/">/om/</a></p>
</div>

  </>
);

export default IndexPage;