import React from "react";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const IndexPage = () => (
  <>
    <div>
      <title>Redirecting...</title>
      <meta httpEquiv="refresh" content="0;url=index.xml" />
      <p>
        You are being redirected to <a href="index.xml">index.xml</a>
      </p>
    </div>
  </>
);

export default IndexPage;
