import dynamic from "next/dynamic";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { Poppins } from "next/font/google";
import { useState } from "react";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import BlockPickerEasy from "../../components/block-picker/easy/BlockPickerEasy";
import BlockPickerAdvanced from "../../components/block-picker/advanced/BlockPickerAdvanced";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export default function BlockPicker() {
  const [defaultBreadCrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Block picker" },
  ]);
  const [breadcrumbs] = useState<Crumb[]>(defaultBreadCrumbs);

  return (
    <>
      <Header />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <div className={`tw-bg-neutral-900 ${poppins.className}`}>
        <div
          id="allowlist-tool"
          className="tw-overflow-y-auto tw-min-h-screen tw-relative"
        >
          <div className="tw-space-y-8">
            <BlockPickerEasy />
            <BlockPickerAdvanced/>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
