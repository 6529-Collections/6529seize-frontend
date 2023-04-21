import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { useEffect, useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { DocumentationSection } from "../../components/delegation/documentation/DelegationDocumentation";
import { useRouter } from "next/router";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const Documentation = dynamic(
  () =>
    import("../../components/delegation/documentation/DelegationDocumentation")
);

interface Props {
  section: DocumentationSection;
}

export default function DelegationsDocumentation(props: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DocumentationSection>(
    props.section
  );

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Delegation", href: "/delegation/delegation-center" },
    { display: "Getting Started" },
  ]);

  useEffect(() => {
    if (activeSection) {
      router.push(
        {
          pathname: `${activeSection}`,
        },
        undefined,
        { shallow: true }
      );

      window.scrollTo(0, 0);
    }
  }, [activeSection]);

  return (
    <>
      <Head>
        <title>Delegations - Getting Started | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Delegations - Getting Started | 6529 SEIZE"
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/delegation-documentation/getting-started`}
        />
        <meta property="og:title" content="Delegations - Getting Started" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Documentation
          section={activeSection}
          setActiveSection={(section: DocumentationSection) => {
            setActiveSection(section);
          }}
        />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const sectionPath = req.query.documentationSection;

  if (
    sectionPath &&
    Object.values(DocumentationSection).includes(
      sectionPath as DocumentationSection
    )
  ) {
    const section = sectionPath as DocumentationSection;

    return {
      props: {
        section,
      },
    };
  } else {
    return {
      redirect: {
        permanent: false,
        destination: "/404",
      },
      props: {},
    };
  }
}
