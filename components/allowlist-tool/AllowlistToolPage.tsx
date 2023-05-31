import dynamic from "next/dynamic";
import { Poppins } from "next/font/google";
import { createContext, useState } from "react";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const AllowlistToolHeader = dynamic(() => import("./AllowlistToolHeader"), {
  ssr: false,
});

const AllowlistToolAllowlists = dynamic(
  () => import("./AllowlistToolAllowlists"),
  {
    ssr: false,
  }
);

export default function AllowlistToolPage() {
  return (
    <>
      <div
        className={`tw-min-h-screen tw-bg-neutral-900 ${poppins.className}`}
        id="allowlist-tool"
      >
        <div className="container tw-mx-auto tw-pt-6">
          <AllowlistToolHeader />
          <AllowlistToolAllowlists />
        </div>
      </div>
    </>
  );
}
