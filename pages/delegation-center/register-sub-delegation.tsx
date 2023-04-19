import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import delegationStyles from "../../components/delegation/Delegation.module.scss";
import { useEffect, useRef, useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { useAccount, useNetwork, useEnsName } from "wagmi";
import { ToastContainer, Toast } from "react-bootstrap";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const NewSubDelegationComponent = dynamic(
  () => import("../../components/delegation/NewSubDelegation"),
  { ssr: false }
);

export default function RegisterDelegation() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Delegation Center", href: "/delegation-center" },
    { display: "Register Sub-Delegation" },
  ]);

  const accountResolution = useAccount();
  const ensResolution = useEnsName({
    address: accountResolution.address,
    chainId: 1,
  });

  const toastRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<
    { title: string; message: string } | undefined
  >(undefined);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) {
      setToast(undefined);
    }
  }, [showToast]);

  useEffect(() => {
    if (toast) {
      setShowToast(true);
    }
  }, [toast]);

  return (
    <>
      <Head>
        <title>Register Delegation | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Register Delegation | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/delegation-center/register-delegation`}
        />
        <meta property="og:title" content="Register Delegation" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <NewSubDelegationComponent
          address={accountResolution.address as string}
          ens={ensResolution.data}
          onHide={() => {
            window.location.href = "/delegation-center";
          }}
          onSetToast={(toast: any) => {
            setToast({
              title: toast.title,
              message: toast.message,
            });
          }}
        />
        {toast && (
          <div
            className={delegationStyles.toastWrapper}
            onClick={(e) => {
              if (
                !toastRef.current ||
                !toastRef.current.contains(e.target as Node)
              ) {
                setShowToast(false);
              }
            }}>
            <ToastContainer
              position={"top-center"}
              className={delegationStyles.toast}
              ref={toastRef}>
              <Toast onClose={() => setShowToast(false)} show={showToast}>
                <Toast.Header>
                  <strong className="me-auto">{toast.title}</strong>
                </Toast.Header>
                {toast.message && (
                  <Toast.Body
                    dangerouslySetInnerHTML={{
                      __html: toast.message,
                    }}></Toast.Body>
                )}
              </Toast>
            </ToastContainer>
          </div>
        )}
      </main>
    </>
  );
}
