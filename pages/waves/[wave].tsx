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

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function WavePage() {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Waves", href: "/waves" },
    { display: "Wave" },
  ];

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

  return (
    <>
      <Head>
        <title>Waves | 6529 SEIZE</title>
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
      </Head>
      <main className="tailwind-scope tw-min-h-screen tw-bg-iron-950 tw-overflow-x-hidden">
        <div>
          <Header />
          <Breadcrumb breadcrumbs={breadcrumbs} />
        </div>
        {wave && !isError && <WaveDetailed wave={wave} />}
      </main>
    </>
  );
}
