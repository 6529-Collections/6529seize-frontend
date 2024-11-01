import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import yaml from "js-yaml";
import { GetServerSideProps } from "next";
import Link from "next/link";

interface FileData {
  url: string;
  sha512: string;
  size: number;
}

interface LatestYml {
  version: string;
  files: FileData[];
}

interface OSInfo {
  name: "windows" | "mac" | "linux";
  url: string;
  displayName: string;
  downloadPath: string;
  image: string;
  enabled: boolean;
  version?: string;
}

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function Apps(
  props: Readonly<{
    pageProps: {
      versions: OSInfo[];
    };
  }>
) {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "6529 Apps" },
  ];

  const { versions } = props.pageProps;

  const windowsVersion = versions.find((v) => v.name === "windows");
  const macVersion = versions.find((v) => v.name === "mac");
  const linuxVersion = versions.find((v) => v.name === "linux");

  return (
    <>
      <Head>
        <title>6529 Apps | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="6529 Apps | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/tools/6529-apps`}
        />
        <meta property="og:title" content="6529 Apps" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container className="pt-5 pb-5">
          <Row className="mb-3">
            <Col>
              <h3>Desktop</h3>
            </Col>
          </Row>
          <Row>
            {windowsVersion && (
              <Col sm={12} md={4} className="pt-2 pb-2">
                <DesktopLinkDisplay osInfo={windowsVersion} />
              </Col>
            )}
            {macVersion && (
              <Col sm={12} md={4} className="pt-2 pb-2">
                <DesktopLinkDisplay osInfo={macVersion} />
              </Col>
            )}
            {linuxVersion && (
              <Col sm={12} md={4} className="pt-2 pb-2">
                <DesktopLinkDisplay osInfo={linuxVersion} />
              </Col>
            )}
          </Row>
          <Row className="mt-5  mb-3">
            <Col>
              <h3>Mobile</h3>
            </Col>
          </Row>
          <Row>
            <Col sm={12} md={4} className="pt-2 pb-2">
              <MobileLinkDisplay
                displayName="iOS"
                info="Join public beta (TestFlight)"
                image="/ios.svg"
                link="https://testflight.apple.com/join/DFjBF2a2"
              />
            </Col>
            <Col sm={12} md={4} className="pt-2 pb-2">
              <MobileLinkDisplay
                displayName="Android"
                info="Coming Soon"
                image="/android.svg"
              />
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}

function DesktopLinkDisplay(
  props: Readonly<{
    osInfo: OSInfo;
  }>
) {
  const downloadLink = `https://d3lqz0a4bldqgf.cloudfront.net/${props.osInfo.downloadPath}/${props.osInfo.version}.html`;
  return (
    <Link
      href={downloadLink}
      target="_blank"
      rel="noopener noreferrer"
      className="text-decoration-none">
      <div className="seize-card d-flex flex-column align-items-center justify-content-between h-100">
        <div></div>
        <Image
          priority
          loading="eager"
          src={props.osInfo.image}
          alt={props.osInfo.displayName}
          width="0"
          height="0"
          style={{
            height: "auto",
            width: "75%",
            maxWidth: "200px",
            maxHeight: "80px",
          }}
        />
        <h4 className="mt-4">
          {props.osInfo.displayName}{" "}
          {props.osInfo.version ? `v${props.osInfo.version}` : "Latest"}
        </h4>
      </div>
    </Link>
  );
}

function MobileLinkDisplay(
  props: Readonly<{
    displayName: string;
    info: string;
    image: string;
    link?: string;
  }>
) {
  const card = (
    <div className="seize-card d-flex flex-column align-items-center justify-content-between h-100">
      <div></div>
      <Image
        priority
        loading="eager"
        src={props.image}
        alt={props.displayName}
        width="0"
        height="0"
        style={{
          height: "auto",
          width: "75%",
          maxWidth: "200px",
          maxHeight: "80px",
        }}
      />
      <h4 className="mt-4">{props.displayName}</h4>
      <p>{props.info}</p>
    </div>
  );

  if (props.link) {
    return (
      <Link
        href={props.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-decoration-none">
        {card}
      </Link>
    );
  }

  return card;
}

export const getServerSideProps: GetServerSideProps = async () => {
  const osConfigs: OSInfo[] = [
    {
      name: "windows",
      url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/win/latest.yml",
      displayName: "Windows",
      downloadPath: "/6529-core-app/win/links/",
      image: "/windows.svg",
      enabled: true,
    },
    {
      name: "mac",
      url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/mac/latest-mac.yml",
      displayName: "macOS",
      downloadPath: "/6529-core-app/mac/links/",
      image: "/apple.svg",
      enabled: true,
    },
    {
      name: "linux",
      url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/linux/latest-linux.yml",
      displayName: "Linux",
      downloadPath: "/6529-core-app/linux/links/",
      image: "/linux.svg",
      enabled: true,
    },
  ];

  const fetchYml = async (url: string): Promise<LatestYml> => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }

    const text = await response.text();
    return yaml.load(text) as LatestYml;
  };

  const versions: OSInfo[] = [];
  for (const osConfig of osConfigs.filter((config) => config.enabled)) {
    try {
      const ymlData = await fetchYml(osConfig.url);
      versions.push({ ...osConfig, version: ymlData.version });
    } catch (error) {
      console.error(
        `Failed to fetch or process ${osConfig.displayName}:`,
        error
      );
    }
  }

  return {
    props: {
      versions,
    },
  };
};
