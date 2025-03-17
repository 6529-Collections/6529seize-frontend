import { ReactNode, useCallback, useContext, useEffect, useRef } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../header/HeaderPlaceholder";
import Breadcrumb, { Crumb } from "../../../breadcrumb/Breadcrumb";
import Brain from "../../Brain";
import { AuthContext } from "../../../auth/Auth";
import useCapacitor from "../../../../hooks/useCapacitor";
import { LayoutProvider, useLayout } from "./LayoutContext";


const Header = dynamic(() => import("../../../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

// Main layout content that uses the Layout context
function MyStreamLayoutContent({ children }: { readonly children: ReactNode }) {
  const { setTitle, title, showWaves } = useContext(AuthContext);
  const { registerRef, spaces } = useLayout();

  // Local refs for component-specific needs
  const headerElementRef = useRef<HTMLDivElement | null>(null);
  const spacerElementRef = useRef<HTMLDivElement | null>(null);

  // Callback ref for registration with LayoutContext (header)
  const setHeaderRef = useCallback(
    (element: HTMLDivElement | null) => {
      // Update local ref
      headerElementRef.current = element;

      // Register with LayoutContext
      registerRef("header", element);
    },
    [registerRef]
  );
  
  // Callback ref for registration with LayoutContext (spacer)
  const setSpacerRef = useCallback(
    (element: HTMLDivElement | null) => {
      // Update local ref
      spacerElementRef.current = element;

      // Register with LayoutContext
      registerRef("spacer", element);
    },
    [registerRef]
  );

  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "My Stream" },
  ];

  useEffect(() => setTitle({ title: "My Stream | 6529 SEIZE" }), []);

  const capacitor = useCapacitor();
  // Use flexbox instead of fixed height
  const containerClassName = `tw-relative tw-flex tw-flex-col tw-flex-1 tailwind-scope ${
    capacitor.isCapacitor ? "tw-pb-[calc(4rem+88px)]" : ""
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

      <div className="tailwind-scope tw-flex tw-flex-col tw-bg-black">
        <div
          ref={setHeaderRef}
          className="tw-z-50 tw-top-0 tw-sticky tw-bg-black"
        >
          <Header isSmall={true} />
          <div className="tw-z-50 tw-w-full">
            <Breadcrumb breadcrumbs={breadcrumbs} />
          </div>
        </div>

        {showWaves && spaces.measurementsComplete && (
          <div className="tw-flex-1" id="my-stream-content">
            <div ref={setSpacerRef} className="tw-h-4"></div>
            <Brain>
              <div className={containerClassName}>{children}</div>
            </Brain>
          </div>
        )}
      </div>
    </>
  );
}

// Wrapper component that provides the LayoutContext
export default function MyStreamLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <LayoutProvider>
      <MyStreamLayoutContent>{children}</MyStreamLayoutContent>
    </LayoutProvider>
  );
}
