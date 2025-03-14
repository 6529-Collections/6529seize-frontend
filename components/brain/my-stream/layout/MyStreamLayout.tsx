import { ReactNode, useContext, useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../header/HeaderPlaceholder";
import Breadcrumb, { Crumb } from "../../../breadcrumb/Breadcrumb";
import Brain from "../../Brain";
import { AuthContext } from "../../../auth/Auth";
import { createBreakpoint } from "react-use";
import useCapacitor from "../../../../hooks/useCapacitor";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const Header = dynamic(() => import("../../../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function MyStreamLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { setTitle, title, showWaves } = useContext(AuthContext);

  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "My Stream" },
  ];

  useEffect(() => setTitle({ title: "My Stream | 6529 SEIZE" }), []);

  const capacitor = useCapacitor();
  const containerClassName = `lg:tw-pt-4 tw-relative tw-flex tw-flex-col tw-h-[calc(100vh-9.5rem)] lg:tw-h-full lg:tw-flex-1 tailwind-scope  ${
    capacitor.platform === "ios"
      ? "tw-pb-[calc(4rem+88px)]"
      : capacitor.platform === "android"
      ? "tw-pb-[70px]"
      : ""
  }`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="My Stream | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/my-stream`}
        />
        <meta property="og:title" content="My Stream" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
        <meta property="og:description" content="6529 SEIZE" />
        <style>{`
        body {
          overflow: hidden !important;
        }
      `}</style>
      </Head>

      <div className="tailwind-scope tw-min-h-screen tw-flex tw-flex-col tw-bg-black">
        <div>
          <Header isSmall={true} />
          <div className="tw-z-50">
            <Breadcrumb breadcrumbs={breadcrumbs} />
          </div>
        </div>

        {showWaves && (
          <div className="tw-flex-1" id="my-stream-content">
            <Brain>
              <div className={containerClassName}>{children}</div>
            </Brain>
          </div>
        )}
      </div>
    </>
  );
}
