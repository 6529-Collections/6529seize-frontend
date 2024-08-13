import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useIsMobileScreen from "../../hooks/isMobileScreen";
import yaml from "js-yaml";
import { GetServerSideProps } from "next";

interface FileData {
  url: string;
  sha512: string;
  size: number;
}

interface LatestYml {
  version: string;
  files: FileData[];
}

interface DownloadLink {
  url: string;
  display: string;
}

interface OSInfo {
  name: "windows" | "mac" | "linux";
  url: string;
  displayName: string;
}

interface DownloadLinks {
  osName: string;
  version: string;
  files: DownloadLink[];
}

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function DesktopApp(
  props: Readonly<{
    pageProps: {
      downloadLinks: DownloadLinks[];
    };
  }>
) {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Desktop App" },
  ];

  const { downloadLinks } = props.pageProps;

  console.log("i am here", downloadLinks);

  const isMobile = useIsMobileScreen();

  return (
    <>
      <Head>
        <title>Desktop App | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Desktop App | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/tools/desktop-app`}
        />
        <meta property="og:title" content="Desktop App" />
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
          <Row>
            <Col
              sm={12}
              md={6}
              className="pt-4 pb-4 d-flex flex-wrap align-items-center justify-content-center gap-5">
              <Image
                priority
                loading="eager"
                src="/windows.svg"
                alt="Microsoft Windows"
                width="0"
                height="0"
                style={{
                  height: "auto",
                  width: "75%",
                  maxWidth: "300px",
                  maxHeight: "150px",
                }}
              />
            </Col>
            <Col
              sm={12}
              md={6}
              className={`pt-4 pb-4 d-flex align-items-center ${
                isMobile ? "justify-content-center" : "justify-content-start"
              }`}>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-2">
                  <a
                    href="https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/win/6529+CORE-win-x64-0.0.1.exe"
                    target="_blank"
                    rel="noreferrer"
                    className="font-larger decoration-hover-underline d-flex align-items-center gap-2">
                    64-bit (x64)
                    <FontAwesomeIcon icon={faDownload} height={16} width={16} />
                  </a>
                  <span className="font-color-h">(Recommended)</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <a
                    href="https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/win/6529+CORE-win-ia32-0.0.1.exe"
                    target="_blank"
                    rel="noreferrer"
                    className="font-larger decoration-hover-underline d-flex align-items-center gap-2">
                    32-bit (x32)
                    <FontAwesomeIcon icon={faDownload} height={16} width={16} />
                  </a>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <a
                    href="https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/win/6529+CORE-win-arm64-0.0.1.exe"
                    target="_blank"
                    rel="noreferrer"
                    className="font-larger decoration-hover-underline d-flex align-items-center gap-2">
                    ARM64
                    <FontAwesomeIcon icon={faDownload} height={16} width={16} />
                  </a>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <a
                    href="https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/win/6529+CORE-win-0.0.1.exe"
                    target="_blank"
                    rel="noreferrer"
                    className="font-larger decoration-hover-underline d-flex align-items-center gap-2">
                    Universal
                    <FontAwesomeIcon icon={faDownload} height={16} width={16} />
                  </a>
                  <span className="font-color-h">(Larger file size)</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
        <Container className="pt-5 pb-5">
          <Row>
            <Col
              sm={12}
              md={6}
              className="pt-4 pb-4 d-flex flex-wrap align-items-center justify-content-center gap-5">
              <Image
                priority
                loading="eager"
                src="/apple.svg"
                alt="Apple macOS"
                width="0"
                height="0"
                style={{
                  height: "auto",
                  width: "75%",
                  maxWidth: "300px",
                  maxHeight: "150px",
                }}
              />
            </Col>
            <Col
              sm={12}
              md={6}
              className={`pt-4 pb-4 d-flex align-items-center ${
                isMobile ? "justify-content-center" : "justify-content-start"
              }`}>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-2">
                  <a
                    href="https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/mac/6529+CORE-mac-arm64-0.0.1.dmg"
                    target="_blank"
                    rel="noreferrer"
                    className="font-larger decoration-hover-underline d-flex align-items-center gap-2">
                    Silicon
                    <FontAwesomeIcon icon={faDownload} height={16} width={16} />
                  </a>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <a
                    href="https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/mac/6529+CORE-mac-x64-0.0.1.dmg"
                    target="_blank"
                    rel="noreferrer"
                    className="font-larger decoration-hover-underline d-flex align-items-center gap-2">
                    Intel
                    <FontAwesomeIcon icon={faDownload} height={16} width={16} />
                  </a>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const osConfigs: OSInfo[] = [
    {
      name: "windows",
      url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/win/latest.yml",
      displayName: "Windows",
    },
    {
      name: "mac",
      url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/mac/latest-mac.yml",
      displayName: "macOS",
    },
    {
      name: "linux",
      url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/linux/latest-linux.yml",
      displayName: "Linux",
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

  const buildDisplayName = (
    url: string,
    os: "windows" | "mac" | "linux"
  ): string => {
    if (os === "windows") {
      if (url.includes("x64")) return "x64";
      if (url.includes("arm64")) return "ARM64";
      if (url.includes("ia32")) return "x32";
      return "Universal";
    } else if (os === "mac") {
      if (url.includes("arm64") || url.includes("Silicon")) return "Silicon";
      if (url.includes("x64") || url.includes("Intel")) return "Intel";
      return "Universal";
    } else if (os === "linux") {
      return "Universal";
    }
    return "Unknown";
  };

  const downloadLinks: DownloadLinks[] = [];

  for (const osConfig of osConfigs) {
    try {
      const ymlData = await fetchYml(osConfig.url);
      const files = ymlData.files
        .filter(
          (file) =>
            file.url.endsWith(".exe") ||
            file.url.endsWith(".dmg") ||
            file.url.endsWith(".AppImage")
        )
        .map((file) => ({
          url: `https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/${osConfig.name}/${file.url}`,
          display: buildDisplayName(file.url, osConfig.name),
        }));

      downloadLinks.push({
        osName: osConfig.displayName,
        version: ymlData.version,
        files,
      });
    } catch (error) {
      console.error(
        `Failed to fetch or process ${osConfig.displayName}:`,
        error
      );
    }
  }

  return {
    props: {
      downloadLinks,
    },
  };
};
