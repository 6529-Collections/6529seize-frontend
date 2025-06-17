import { Poppins } from "next/font/google";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import "react-toastify/dist/ReactToastify.css";
import { useSetTitle } from "../../../contexts/TitleContext";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});
export default function DistributionPlanToolWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useSetTitle("EMMA | Tools");

  return (
    <div className={`tw-bg-neutral-900 ${poppins.className}`}>
      <div
        id="allowlist-tool"
        className="tailwind-scope tw-overflow-y-auto tw-min-h-screen tw-relative">
        {children}
      </div>
    </div>
  );
}
