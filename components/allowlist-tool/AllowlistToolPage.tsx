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
        <div className="tw-max-w-[65.625rem] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] 
        min-[1300px]:tw-max-w-[1250px] min-[1400px]:tw-max-w-[1350px] min-[1500px]:tw-max-w-[1450px] min-[1600px]:tw-max-w-[96.875rem] min-[1800px]:tw-max-w-[109.375rem] min-[2000px]:tw-max-w-[121.875rem] tw-px-6 min-[1101px]:tw-px-4 tw-mx-auto tw-pt-6">
          <AllowlistToolHeader />
          <AllowlistToolAllowlists />
        </div>
      </div>
    </>
  );
}
