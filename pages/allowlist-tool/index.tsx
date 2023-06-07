import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import styles from "../../styles/Home.module.scss";
import { createContext, useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import AllowlistToolPage from "../../components/allowlist-tool/AllowlistToolPage";
import { Slide, ToastContainer, TypeOptions, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

type AllowlistToolContextType = {
  setToasts: ({
    messages,
    type,
  }: {
    messages: string[];
    type: TypeOptions;
  }) => void;
};

const setToast = ({
  message,
  type,
}: {
  message: string;
  type: TypeOptions;
}) => {
  toast(message, {
    position: toast.POSITION.TOP_RIGHT,
    autoClose: 3000,
    hideProgressBar: false,
    draggable: false,
    closeOnClick: true,
    transition: Slide,
    theme: "dark",
    type,
  });
};

const setToasts = ({
  messages,
  type,
}: {
  messages: string[];
  type: TypeOptions;
}) => {
  messages.forEach((message) => setToast({ message, type }));
};

export const AllowlistToolContext = createContext<AllowlistToolContextType>({
  setToasts: () => {},
});

export default function AllowlistTool() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Allowlist tool" },
  ]);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  return (
    <main style={{ paddingBottom: "0px !important" }} className={styles.main}>
      <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <AllowlistToolContext.Provider value={{ setToasts }}>
        <AllowlistToolPage />
        <ToastContainer />
      </AllowlistToolContext.Provider>
    </main>
  );
}
