import React from "react";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const IndexPage = () => (
  <>
    <div>
      <title>Redirecting...</title>
      <meta httpEquiv="refresh" content="0;url=/om/6529-museum-district/" />
      <p>
        You are being redirected to{" "}
        <a href="/om/6529-museum-district/">/om/6529-museum-district/</a>
      </p>
    </div>
  </>
);

export default IndexPage;
