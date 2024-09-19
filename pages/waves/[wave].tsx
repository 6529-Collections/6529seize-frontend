import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import Head from "next/head";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import WaveDetailed from "../../components/waves/detailed/WaveDetailed";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../components/react-query-wrapper/ReactQueryWrapper";
import { Wave } from "../../generated/models/Wave";
import { commonApiFetch } from "../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { AuthContext, TitleType } from "../../components/auth/Auth";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function WavePage() {
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
  });

  const getBreadCrumbs = (): Crumb[] => {
    return [
      { display: "Home", href: "/" },
      { display: "My Stream", href: "/my-stream" },
      { display: wave?.name ?? "" },
    ];
  };

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>(getBreadCrumbs());
  useEffect(() => setBreadcrumbs(getBreadCrumbs()), [wave]);
  useEffect(
    () =>
      setTitle({
        title: `${wave?.name ?? "Waves"} | 6529 SEIZE`,
      }),
    [wave]
  );

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
       {/*  <style>{`
          body {
            overflow: hidden !important;
          }
        `}</style> */}
      </Head>
      <main className="tailwind-scope tw-bg-black tw-flex tw-flex-col">
        <div>
          <Header />
          <Breadcrumb breadcrumbs={breadcrumbs} />
        </div>

        <div className="tw-flex-1">
          {wave && !isError && <WaveDetailed wave={wave} />}
        </div>
      </main>
    </>
  );
}
