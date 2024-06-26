import Head from "next/head";
import { Crumb } from "../../components/breadcrumb/Breadcrumb";
import SidebarLayout from "../../components/utils/sidebar/SidebarLayout";
import Brain from "../../components/brain/Brain";

export default function BrainPage() {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Brain" },
  ];
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

      <SidebarLayout breadcrumbs={breadcrumbs}>
        <Brain />
      </SidebarLayout>
    </>
  );
}
