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
  display: {
    name: string;
    note?: string;
  };
}

interface OSInfo {
  name: "windows" | "mac" | "linux";
  url: string;
  displayName: string;
  enabled: boolean;
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
  const windowsLinks = downloadLinks.find((link) =>
    link.osName.toLowerCase().includes("windows")
  );
  const macLinks = downloadLinks.find((link) =>
    link.osName.toLowerCase().includes("mac")
  );
  const linuxLinks = downloadLinks.find((link) =>
    link.osName.toLowerCase().includes("linux")
  );

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
        {windowsLinks && (
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
                <DownloadLinksDisplay links={windowsLinks} />
              </Col>
            </Row>
          </Container>
        )}
        {macLinks && (
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
                <DownloadLinksDisplay links={macLinks} />
              </Col>
            </Row>
          </Container>
        )}
        {linuxLinks && (
          <Container className="pt-5 pb-5">
            <Row>
              <Col
                sm={12}
                md={6}
                className="pt-4 pb-4 d-flex flex-wrap align-items-center justify-content-center gap-5">
                <Image
                  priority
                  loading="eager"
                  src="/linux.svg"
                  alt="Linux"
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
                <DownloadLinksDisplay links={linuxLinks} />
              </Col>
            </Row>
          </Container>
        )}
      </main>
    </>
  );
}

function DownloadLinksDisplay(
  props: Readonly<{
    links: DownloadLinks;
  }>
) {
  return (
    <div className="d-flex flex-column gap-3">
      <h4>v{props.links?.version}</h4>
      {props.links?.files.map((file) => (
        <div key={file.url} className="d-flex align-items-center gap-2">
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="font-larger decoration-hover-underline d-flex align-items-center gap-2">
            {file.display.name}
            <FontAwesomeIcon icon={faDownload} height={16} width={16} />
          </a>
          {file.display.note && (
            <span className="font-color-h">({file.display.note})</span>
          )}
        </div>
      ))}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const osConfigs: OSInfo[] = [
    {
      name: "windows",
      url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/win/latest.yml",
      displayName: "Windows",
      enabled: true,
    },
    {
      name: "mac",
      url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/mac/latest-mac.yml",
      displayName: "macOS",
      enabled: false,
    },
    {
      name: "linux",
      url: "https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/linux/latest-linux.yml",
      displayName: "Linux",
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

  const buildDisplayName = (
    url: string,
    os: "windows" | "mac" | "linux"
  ): {
    name: string;
    note?: string;
  } => {
    if (os === "windows") {
      if (url.includes("x64"))
        return { name: "64-bit (x64)", note: "Recommended" };
      if (url.includes("arm64")) return { name: "ARM64" };
      if (url.includes("ia32")) return { name: "32-bit (x32)" };
      return { name: "Universal", note: "Larger file size" };
    } else if (os === "mac") {
      if (url.includes("arm64") || url.includes("Silicon"))
        return { name: "Silicon" };
      if (url.includes("x64") || url.includes("Intel"))
        return { name: "Intel" };
      return { name: "Universal" };
    } else if (os === "linux") {
      if (url.includes("AppImage"))
        return { name: "AppImage", note: "Recommended" };
      if (url.includes("deb")) return { name: "Debian", note: ".deb" };
      if (url.includes("rpm")) return { name: "Red Hat", note: ".rpm" };
      return { name: "Universal" };
    }
    return { name: "Unknown" };
  };

  const downloadLinks: DownloadLinks[] = [];

  for (const osConfig of osConfigs.filter((config) => config.enabled)) {
    try {
      const ymlData = await fetchYml(osConfig.url);
      const files = ymlData.files
        .filter(
          (file) =>
            file.url.endsWith(".exe") ||
            file.url.endsWith(".dmg") ||
            file.url.endsWith(".AppImage") ||
            file.url.endsWith(".deb") ||
            file.url.endsWith(".rpm")
        )
        .map((file) => ({
          url: `https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/${osConfig.name}/${file.url}`,
          display: buildDisplayName(file.url, osConfig.name),
        }))
        .sort((a, b) => {
          if (a.display.name.includes("Universal")) return 1;
          if (b.display.name.includes("Universal")) return -1;
          if (a.display.name.includes("64-bit")) return -1;
          if (b.display.name.includes("64-bit")) return 1;
          if (a.display.name.includes("32-bit")) return -1;
          if (b.display.name.includes("32-bit")) return 1;
          if (a.display.name.includes("ARM64")) return -1;
          if (b.display.name.includes("ARM64")) return 1;
          if (a.display.name.includes("Silicon")) return -1;
          if (b.display.name.includes("Silicon")) return 1;
          if (a.display.name.includes("Intel")) return -1;
          if (b.display.name.includes("Intel")) return 1;
          return 0;
        });

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
