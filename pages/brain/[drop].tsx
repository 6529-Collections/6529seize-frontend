import { useRouter } from "next/router";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import DropsListItem from "../../components/drops/view/item/DropsListItem";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import Head from "next/head";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { useContext } from "react";
import { AuthContext } from "../../components/auth/Auth";
import { Drop } from "../../generated/models/Drop";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function BrainDropPage() {
  const { connectedProfile } = useContext(AuthContext);
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Brain", href: "/brain" },
    { display: "Drop" },
  ];
  const router = useRouter();
  const drop_id = (router.query.drop as string)?.toLowerCase();

  const { data: drop } = useQuery<Drop>({
    queryKey: [
      QueryKey.DROP,
      { drop_id, context_profile: connectedProfile?.profile?.handle },
    ],
    queryFn: async () =>
      await commonApiFetch<Drop>({
        endpoint: `drops/${drop_id}`,
        params: connectedProfile?.profile?.handle
          ? { context_profile: connectedProfile.profile.handle }
          : {},
      }),
    enabled: !!drop_id,
  });

  return (
    <>
      <Head>
        <title>Brain | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Brain | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/brain`}
        />
        <meta property="og:title" content="Brain" />
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
        <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen tw-mt-6 lg:tw-mt-8 tw-pb-16 lg:tw-pb-20 tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <div className="tw-max-w-2xl tw-mx-auto">
            {drop && (
              <DropsListItem
                drop={drop}
                showFull={true}
                showExternalLink={false}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
