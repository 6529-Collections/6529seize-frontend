import Head from "next/head";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { Inter } from "next/font/google";
import { useState } from "react";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export default function Levels() {
  const [breadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Levels" },
  ]);
  return (
    <>
      <Head>
        <title>Levels | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Levels | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/levels`}
        />
        <meta property="og:title" content="Levels" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Header />
      <Breadcrumb breadcrumbs={breadcrumbs} />
      <div
        className={`tailwind-scope tw-bg-neutral-950 tw-min-h-screen ${inter.className}`}
      >
        <div className="tw-pt-12 tw-pb-12">
          <div className="tw-max-w-5xl tw-mx-auto tw-px-6">
            <div className="tw-max-w-3xl tw-pb-6 lg:tw-pb-8 tw-flex tw-flex-col">
              <h1 className="tw-uppercase tw-text-white">Levels</h1>
              <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                Levels are our integrated metric of TDH and Rep.
              </p>
              <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                TDH and rep are added together and the level is determined by
                the table below. It is our most integrated measure of trust in
                our ecosystem.
              </p>
              <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                Rep is not live yet so for this initial release, levels are
                determined solely by TDH.
              </p>
              <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                Levels start at zero and are currently capped at 100 (for
                25,000,000 TDH).
              </p>
              <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                Levels are determined by the table below. Once rep rolls out, it
                is possible to have a negative level.
              </p>
              <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                As with all metrics, they may be adjusted to better meet their
                objectives.
              </p>
            </div>
            <div className="tw-overflow-x-auto tw-ring-1 tw-ring-white/[0.15] tw-rounded-lg">
              <table className="tw-min-w-full tw-divide-y tw-divide-neutral-700/70">
                <thead className="tw-bg-[#212121]">
                  <tr>
                    <td className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-semibold tw-text-white tw-uppercase sm:tw-pl-6">
                      Level
                    </td>
                    <td className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-semibold tw-text-white tw-uppercase sm:tw-pl-6">
                      TDH
                    </td>
                  </tr>
                </thead>
                <tbody className="tw-bg-neutral-950 tw-divide-y tw-divide-neutral-700/70">
                  <tr className="hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out">
                    <td className="tw-whitespace-nowrap sm:tw-pl-6 tw-pr-3 tw-pl-4 tw-py-3 tw-text-sm tw-font-medium tw-text-neutral-400">
                      1
                    </td>
                    <td className="tw-whitespace-nowrap tw-py-3 tw-pl-4 tw-pr-3 sm:tw-pl-6 tw-text-sm tw-font-medium tw-text-neutral-400">
                      25
                    </td>
                  </tr>
                  <tr className="hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out">
                    <td className="tw-whitespace-nowrap sm:tw-pl-6 tw-pr-3 tw-pl-4 tw-py-3 tw-text-sm tw-font-medium tw-text-neutral-400">
                      1
                    </td>
                    <td className="tw-whitespace-nowrap tw-py-3 tw-pl-4 tw-pr-3 sm:tw-pl-6 tw-text-sm tw-font-medium tw-text-neutral-400">
                      25
                    </td>
                  </tr>
                  <tr className="hover:tw-bg-neutral-800 tw-transition tw-duration-300 tw-ease-out">
                    <td className="tw-whitespace-nowrap sm:tw-pl-6 tw-pr-3 tw-pl-4 tw-py-3 tw-text-sm tw-font-medium tw-text-neutral-400">
                      1
                    </td>
                    <td className="tw-whitespace-nowrap tw-py-3 tw-pl-4 tw-pr-3 sm:tw-pl-6 tw-text-sm tw-font-medium tw-text-neutral-400">
                      25
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
