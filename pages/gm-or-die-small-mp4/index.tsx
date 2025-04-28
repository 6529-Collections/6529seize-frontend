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
      <meta
        httpEquiv="refresh"
        content="0;url=https://videos.files.wordpress.com/Pr49XLee/gm-or-die-small.mp4"
      />
      <p>
        You are being redirected to{" "}
        <a href="https://videos.files.wordpress.com/Pr49XLee/gm-or-die-small.mp4">
          https://videos.files.wordpress.com/Pr49XLee/gm-or-die-small.mp4
        </a>
      </p>
    </div>
  </>
);

export default IndexPage;
