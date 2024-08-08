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

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function DesktopApp() {
  const breadcrumbs: Crumb[] = [
    { display: "Home", href: "/" },
    { display: "Desktop App" },
  ];

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
                    href="https://6529bucket.s3.eu-west-1.amazonaws.com/6529-core-app/mac/6529+CORE-mac-arm64-0.0.1.dmg"
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
