import { useRouter } from "next/router";
import { ReactNode, useContext, useEffect, useState } from "react";
import { Wave } from "../../../generated/models/Wave";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Head from "next/head";
import { AuthContext } from "../../auth/Auth";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../header/HeaderPlaceholder";
import Breadcrumb, { Crumb } from "../../breadcrumb/Breadcrumb";
import { AnimatePresence, motion } from "framer-motion";

interface WaveLayoutProps {
  readonly wave: Wave;
  readonly children: ReactNode;
}

const Header = dynamic(() => import("../../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function WaveLayout({ wave: initialWave, children }: WaveLayoutProps) {
  const { setTitle, title } = useContext(AuthContext);
  const router = useRouter();
  const wave_id = (router.query.wave as string)?.toLowerCase();

  const { data: wave, isError } = useQuery<Wave>({
    queryKey: [QueryKey.WAVE, { wave_id }],
    queryFn: async () =>
      await commonApiFetch<Wave>({
        endpoint: `waves/${wave_id}`,
      }),
    enabled: !!wave_id,
    placeholderData: keepPreviousData,
    initialData: initialWave,
  });

    const getBreadCrumbs = (): Crumb[] => {
    return [
      { display: "Home", href: "/" },
      { display: "My Stream", href: "/my-stream" },
      { display: wave?.name ?? "" },
    ];
  };

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>(getBreadCrumbs());
  useEffect(() => {
    setTitle({
      title: `${wave?.name ?? "Waves"} | 6529 SEIZE`,
    });
    setBreadcrumbs(getBreadCrumbs());
  }, [wave]);

  useEffect(() => {
    const elementToRemove = document.getElementById("footer");
    if (elementToRemove) {
      elementToRemove.remove();
    }

    // Cleanup function to restore the removed element
    return () => {
      const parentElement = document.body; // Adjust this if the parent is different
      if (elementToRemove) {
        parentElement.appendChild(elementToRemove);
      }
    };
  }, []);
  
    return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Waves | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/waves`}
        />
        <meta property="og:title" content="Waves" />
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
      <main className="tailwind-scope tw-bg-black tw-flex tw-flex-col tw-h-screen tw-overflow-hidden">
        <div>
          <Header isSmall={true} />
          <Breadcrumb breadcrumbs={breadcrumbs} />
        </div>

        <div className="tw-flex-1 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-900">
          <AnimatePresence mode="wait">
            {!wave && !isError && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="tw-mt-4 tw-px-4"
              >
                <div className="lg:tw-flex lg:tw-items-start tw-justify-center tw-gap-x-4">
                  <div className="tw-w-full tw-flex tw-flex-col tw-gap-y-4 lg:tw-w-[20.5rem]">
                    {[1, 2, 3].map((index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="tw-h-48 tw-bg-iron-900 tw-rounded-xl tw-animate-pulse"
                      ></motion.div>
                    ))}
                  </div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="tw-flex-1"
                  >
                    <div className="tw-h-[calc(100vh-160px)] tw-bg-iron-950 tw-rounded-xl tw-animate-pulse"></div>
                  </motion.div>
                </div>
              </motion.div>
            )}
            {wave && !isError && (
              <motion.div
                key={`${wave.id}-content`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
};
