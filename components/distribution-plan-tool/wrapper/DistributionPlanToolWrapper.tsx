"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import { Poppins } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";

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
