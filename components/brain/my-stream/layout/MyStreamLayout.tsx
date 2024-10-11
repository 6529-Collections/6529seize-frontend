import { ReactNode, useContext, useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../header/HeaderPlaceholder";
import Breadcrumb, { Crumb } from "../../../breadcrumb/Breadcrumb";
import Brain from "../../Brain";
import MyStreamLayoutTabs from "./MyStreamLayoutTabs";
import { AuthContext, WAVES_MIN_ACCESS_LEVEL } from "../../../auth/Auth";

const Header = dynamic(() => import("../../../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function MyStreamLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { setTitle, title } = useContext(AuthContext);
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "My Stream" },
  ];

  const { showWaves } = useContext(AuthContext);
  useEffect(() => setTitle({ title: "My Stream | 6529 SEIZE" }), []);

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

      <div className="tailwind-scope lg:tw-min-h-screen tw-bg-black">
        <div>
          <Header isSmall={true} />
          <Breadcrumb breadcrumbs={breadcrumbs} />
        </div>

        {showWaves && (
          <>
            <div>
              {/* <div className="tw-max-w-5xl tw-mx-auto">
                <div className="tw-rounded-xl tw-bg-white/[0.02] tw-p-4 tw-text-iron-500 tw-text-[13px] tw-leading-5 tw-mb-4">
                  <div className="tw-inline-flex tw-gap-x-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                      className="tw-size-5 tw-text-iron-400 tw-flex-shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                      />
                    </svg>
                    <span>
                      These pages are in closed alpha for level{" "}
                      {WAVES_MIN_ACCESS_LEVEL} and above. They are not ready for
                      public release. Lots of improvements and bugs to fix.
                      Currently only &quot;chat&quot; waves are active.
                    </span>
                  </div>
                </div>
                <MyStreamLayoutTabs />
              </div> */}
            </div>
            <div className="tw-h-full tw-w-full">
              <Brain>
                <div>{children}</div>
              </Brain>
            </div>
          </>
        )}
      </div>
    </>
  );
}
