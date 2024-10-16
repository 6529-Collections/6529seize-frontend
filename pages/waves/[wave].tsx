import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import Head from "next/head";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import WaveDetailed from "../../components/waves/detailed/WaveDetailed";
import { useRouter } from "next/router";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../components/react-query-wrapper/ReactQueryWrapper";
import { ApiWave } from "../../generated/models/ApiWave";
import { commonApiFetch } from "../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../components/auth/Auth";
import {
  getCommonHeaders,
  getWave,
  getWaveDrops,
  getWavesOverview,
} from "../../helpers/server.helpers";
import {
  WAVE_DROPS_PARAMS,
  WAVE_FOLLOWING_WAVES_PARAMS,
} from "../../components/react-query-wrapper/utils/query-utils";
import { ApiWaveDropsFeed } from "../../generated/models/ApiWaveDropsFeed";

interface Props {
  readonly wave: ApiWave | null;
  readonly wavesOverview: ApiWave[] | null;
  readonly waveDrops: ApiWaveDropsFeed | null;
}

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function WavePage({ pageProps }: { readonly pageProps: Props }) {
  const { setWave, setWavesOverviewPage, setWaveDrops } = useContext(
    ReactQueryWrapperContext
  );
  const { setTitle, title } = useContext(AuthContext);
  const queryClient = useQueryClient();

  if (pageProps.wave) {
    const waveInit = queryClient.getQueryData<ApiWave>([
      QueryKey.WAVE,
      { wave_id: pageProps.wave.id },
    ]);

    if (!waveInit) {
      setWave(pageProps.wave);
    }
  }

  if (pageProps.wavesOverview) {
    const followingWavesInit = queryClient.getQueryData<ApiWave[]>([
      QueryKey.WAVES_OVERVIEW,
      {
        limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
        type: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
        only_waves_followed_by_authenticated_user:
          WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user,
      },
    ]);

    if (!followingWavesInit) {
      setWavesOverviewPage(pageProps.wavesOverview);
    }
  }

  if (pageProps.waveDrops && pageProps.wave) {
    const waveDropsInit = queryClient.getQueryData<ApiWaveDropsFeed>([
      QueryKey.DROPS,
      {
        waveId: pageProps.wave.id,
        limit: WAVE_DROPS_PARAMS.limit,
        dropId: null,
      },
    ]);

    if (!waveDropsInit) {
      setWaveDrops({
        waveDrops: pageProps.waveDrops,
        waveId: pageProps.wave.id,
      });
    }
  }

  const router = useRouter();
  const wave_id = (router.query.wave as string)?.toLowerCase();

  const { data: wave } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${wave_id}`,
      }),
    enabled: !!wave_id,
    staleTime: 60000,
    initialData: pageProps.wave ?? undefined,
    placeholderData: keepPreviousData,
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
        {/* tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-900 */}
        <div className="tw-flex-1">{wave && <WaveDetailed wave={wave} />}</div>
      </main>
    </>
  );
}

export async function getServerSideProps(
  req: any,
  res: any,
  resolvedUrl: any
): Promise<{
  props: Props;
}> {
  try {
    const headers = getCommonHeaders(req);
    const waveId = req.query.wave.toLowerCase() as string;
    const [wave, wavesOverview, waveDrops] = await Promise.all([
      getWave({ waveId, headers }),
      getWavesOverview({
        headers,
        limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
        offset: 0,
        type: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
        onlyWavesFollowedByAuthenticatedUser:
          WAVE_FOLLOWING_WAVES_PARAMS.only_waves_followed_by_authenticated_user,
      }),
      await getWaveDrops({ waveId, headers }),
    ]);
    return {
      props: {
        wave,
        wavesOverview,
        waveDrops,
      },
    };
  } catch (e: any) {
    return {
      props: {
        wave: null,
        wavesOverview: null,
        waveDrops: null,
      },
    };
  }
}
