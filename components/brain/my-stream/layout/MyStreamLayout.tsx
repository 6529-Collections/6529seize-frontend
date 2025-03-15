import { ReactNode, useContext, useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../header/HeaderPlaceholder";
import Breadcrumb, { Crumb } from "../../../breadcrumb/Breadcrumb";
import Brain from "../../Brain";
import { AuthContext } from "../../../auth/Auth";
import { createBreakpoint } from "react-use";
import useCapacitor from "../../../../hooks/useCapacitor";
import { LayoutProvider, useLayout } from "./LayoutContext";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

const Header = dynamic(() => import("../../../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

// Main layout content that uses the Layout context
function MyStreamLayoutContent({ children }: { readonly children: ReactNode }) {
  const { setTitle, title, showWaves } = useContext(AuthContext);
  const { headerRef } = useLayout();

  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "My Stream" },
  ];

  useEffect(() => setTitle({ title: "My Stream | 6529 SEIZE" }), []);
  
  // Update header spacer height and context when header changes
  useEffect(() => {
    // Function to update spacer and ensure context measurements are accurate
    const updateSpacerAndContext = () => {
      const spacer = document.getElementById('header-spacer');
      if (spacer && headerRef.current) {
        const headerHeight = headerRef.current.offsetHeight;
        spacer.style.height = `${headerHeight}px`;
    
      }
    };
    
    // Initial update - run immediately and then again after a short delay to ensure DOM is ready
    // This helps replace the default 102px with the actual measurement as soon as possible
    updateSpacerAndContext();
    setTimeout(updateSpacerAndContext, 100);
    
    // Set up observers to watch for header height and window size changes
    const resizeObserver = new ResizeObserver(updateSpacerAndContext);
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }
    
    // Also watch window resize
    window.addEventListener('resize', updateSpacerAndContext);
    
    return () => {
      if (headerRef.current) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateSpacerAndContext);
    };
  }, [headerRef]);

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

      <div className="tailwind-scope tw-min-h-screen tw-flex tw-flex-col tw-bg-black">
        {/* Header with sticky positioning and high z-index */}
        <div ref={headerRef} className="tw-sticky tw-top-0 tw-z-50 tw-bg-black">
          <Header isSmall={true} />
          <div className="tw-z-50 tw-w-full">
            <Breadcrumb breadcrumbs={breadcrumbs} />
          </div>
        </div>

        {/* Main content with proper spacing */}
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
