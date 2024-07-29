import Head from "next/head";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import Brain from "../../components/brain/Brain";
const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function MyStreamPage() {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Brain - My Stream" },
  ];
  return (
    <>
      <Head>
        <title>My Stream | 6529 SEIZE</title>
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
      </Head>

      <div className="tailwind-scope lg:tw-min-h-screen tw-bg-iron-950 tw-overflow-x-hidden">
        <div>
          <Header />
          <Breadcrumb breadcrumbs={breadcrumbs} />
        </div>
        <div className="tw-overflow-hidden tw-h-full tw-w-full">
          <Brain />
        </div>
      </div>
    </>
  );
}
