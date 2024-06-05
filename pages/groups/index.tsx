import dynamic from "next/dynamic";
import Groups from "../../components/groups/page/Groups";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import Head from "next/head";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function GroupsPage() {
  return (
    <>
      <Head>
        <title>Groups | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Groups | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/groups`}
        />
        <meta property="og:title" content="Groups" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className="tw-min-h-[100dvh]">
        <Header />
        <div className="tailwind-scope tw-bg-iron-950 tw-min-h-screen tw-pb-16 lg:tw-pb-20">
          <Groups />
        </div>
      </main>
    </>
  );
}
