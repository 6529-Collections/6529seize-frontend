import Head from "next/head";
import { Crumb } from "../components/breadcrumb/Breadcrumb";
import SidebarLayout from "../components/utils/sidebar/SidebarLayout";
import Stream from "../components/stream/Stream";

export default function StreamPage() {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Stream" },
  ];
  return (
    <>
      <Head>
        <title>Stream | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Stream | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/stream`}
        />
        <meta property="og:title" content="Strean" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
        <meta property="og:description" content="6529 SEIZE" />
      </Head>

      <SidebarLayout breadcrumbs={breadcrumbs}>
        <Stream />
      </SidebarLayout>
    </>
  );
}
