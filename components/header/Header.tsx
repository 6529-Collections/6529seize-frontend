import styles from "./Header.module.scss";
import { Container, Row, Col, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AboutSection } from "../../pages/about/[section]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import HeaderDesktopLink from "./HeaderDesktopLink";
import Link from "next/link";
import HeaderUser from "./user/HeaderUser";
import HeaderSearchButton from "./header-search/HeaderSearchButton";
import { useAuth } from "../auth/Auth";
import HeaderNotifications from "./notifications/HeaderNotifications";
import useCapacitor from "../../hooks/useCapacitor";
import CapacitorWidget from "./capacitor/CapacitorWidget";
import { faBars, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import HeaderQR from "./qr/HeaderQR";
import useIsMobileScreen from "../../hooks/isMobileScreen";
interface Props {
  onLoad?: () => void;
  onSetWallets?(wallets: string[]): any;
  readonly isSmall?: boolean;
  readonly extraClass?: string;
}

export interface HeaderLink {
  readonly name: string;
  readonly path: `/${string}`;
  readonly isNew?: boolean;
}

export default function Header(props: Readonly<Props>) {
  const capacitor = useCapacitor();
  const { address, seizeConnectOpen } = useSeizeConnectContext();

  const isMobile = useIsMobileScreen();

  const { showWaves } = useAuth();
  const router = useRouter();
  const [consolidations, setConsolidations] = useState<string[]>([]);
  const [burgerMenuOpen, setBurgerMenuOpen] = useState(false);

  const [showBurgerMenuCollections, setShowBurgerMenuCollections] =
    useState(false);
  const [showBurgerMenuAbout, setShowBurgerMenuAbout] = useState(false);
  const [showBurgerMenuCommunity, setShowBurgerMenuCommunity] = useState(false);
  const [showBurgerMenuTools, setShowBurgerMenuTools] = useState(false);
  const [showBurgerMenuBrain, setShowBurgerMenuBrain] = useState(false);

  let logoSrc: string = "/6529.png";
  let logoWidth: number = 60;
  let logoHeight: number = 60;
  if (capacitor.isCapacitor) {
    logoWidth = 40;
    logoHeight = 40;
  }
  if (isMobile) {
    logoWidth = 50;
    logoHeight = 50;
  }

  useEffect(() => {
    function handleResize() {
      setShowBurgerMenuCollections(false);
      setBurgerMenuOpen(false);
      setShowBurgerMenuAbout(false);
      setShowBurgerMenuCommunity(false);
      setShowBurgerMenuTools(false);
      setShowBurgerMenuBrain(false);
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    if (props.onLoad) {
      props.onLoad();
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (props.onSetWallets) {
      const isConsolidation = consolidations.length > 1;
      if (isConsolidation) {
        props.onSetWallets(consolidations);
      } else if (address) {
        props.onSetWallets([address]);
      } else {
        props.onSetWallets([]);
      }
    }
  }, [consolidations, address]);

  useEffect(() => {
    if (address) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/consolidations/${address}`
      ).then((response: DBResponse) => {
        setConsolidations(Array.from(response.data));
      });
    } else {
      setConsolidations([]);
    }
  }, [address]);

  useEffect(() => {
    if (seizeConnectOpen) {
      setBurgerMenuOpen(false);
    }
  }, [seizeConnectOpen]);

  function printMobileHr() {
    return (
      <Row>
        <Col xs={{ span: 6, offset: 3 }}>
          <hr />
        </Col>
      </Row>
    );
  }

  function printMobileSubheader(name: string) {
    return (
      <Row>
        <Col xs={{ span: 6, offset: 3 }}>
          <h3 className={styles.burgerMenuSubheader}>{name}</h3>
        </Col>
      </Row>
    );
  }

  function printMobileRow(name: string, path: string) {
    return (
      <Row className="pt-3 pb-1">
        <Col>
          <a href={path}>
            <h3>{name}</h3>
          </a>
        </Col>
      </Row>
    );
  }

  function printBurgerMenu() {
    return (
      <div
        className={`inset-safe-area ${styles.burgerMenu} ${
          burgerMenuOpen ? styles.burgerMenuOpen : ""
        }`}>
        <Container className="pt-2 pb-2">
          <Row>
            <Col className="d-flex justify-content-end">
              <FontAwesomeIcon
                className={styles.burgerMenuClose}
                icon="times-circle"
                onClick={() => {
                  setBurgerMenuOpen(false);
                  setShowBurgerMenuCollections(false);
                  setShowBurgerMenuAbout(false);
                  setShowBurgerMenuCommunity(false);
                  setShowBurgerMenuTools(false);
                  setShowBurgerMenuBrain(false);
                }}></FontAwesomeIcon>
            </Col>
          </Row>
        </Container>
        <Container className="text-center">
          <Row className="pt-3 pb-3">
            <Col>
              <Image
                loading="eager"
                priority
                className={styles.logoIcon}
                src={logoSrc}
                alt="6529Seize"
                width={logoWidth}
                height={logoWidth}
              />
            </Col>
          </Row>
          <Row className="pt-4 pb-3">
            <Col>
              <h3
                className={`d-flex justify-content-center ${styles.burgerMenuHeader}`}>
                <HeaderUser />
              </h3>
            </Col>
          </Row>
          {showWaves && (
            <Row className="pt-3 pb-3">
              <Col>
                <h3
                  onClick={() => {
                    setShowBurgerMenuCollections(false);
                    setShowBurgerMenuCommunity(false);
                    setShowBurgerMenuAbout(false);
                    setShowBurgerMenuTools(false);
                    setShowBurgerMenuBrain(!showBurgerMenuBrain);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setShowBurgerMenuCollections(false);
                      setShowBurgerMenuCommunity(false);
                      setShowBurgerMenuAbout(false);
                      setShowBurgerMenuTools(false);
                      setShowBurgerMenuBrain(!showBurgerMenuBrain);
                    }
                  }}
                  className={`${styles.burgerMenuHeader}
                  ${
                    showBurgerMenuBrain
                      ? styles.burgerMenuCaretClose
                      : styles.burgerMenuCaretOpen
                  }`}>
                  Brain
                </h3>
              </Col>
              {showBurgerMenuBrain && (
                <Container>
                  {printMobileHr()}
                  {printMobileRow("My Stream", "/my-stream")}
                  {printMobileRow("Waves", "/waves")}
                  {printMobileHr()}
                </Container>
              )}
            </Row>
          )}
          <Row className="pt-3 pb-3">
            <Col>
              <h3
                onClick={() => {
                  setShowBurgerMenuCollections(!showBurgerMenuCollections);
                  setShowBurgerMenuCommunity(false);
                  setShowBurgerMenuAbout(false);
                  setShowBurgerMenuTools(false);
                  setShowBurgerMenuBrain(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setShowBurgerMenuCollections(!showBurgerMenuCollections);
                    setShowBurgerMenuCommunity(false);
                    setShowBurgerMenuAbout(false);
                    setShowBurgerMenuTools(false);
                    setShowBurgerMenuBrain(false);
                  }
                }}
                className={`${styles.burgerMenuHeader}
                  ${
                    showBurgerMenuCollections
                      ? styles.burgerMenuCaretClose
                      : styles.burgerMenuCaretOpen
                  }`}>
                Collections
              </h3>
            </Col>
            {showBurgerMenuCollections && (
              <Container>
                {printMobileHr()}
                {printMobileRow("The Memes", "/the-memes")}
                {printMobileRow("Gradient", "/6529-gradient")}
                {printMobileRow("NextGen", "/nextgen")}
                {printMobileRow("Meme Lab", "/meme-lab")}
                {printMobileRow("ReMemes", "/rememes")}
                {printMobileHr()}
              </Container>
            )}
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3
                onClick={() => {
                  setShowBurgerMenuCommunity(!showBurgerMenuCommunity);
                  setShowBurgerMenuCollections(false);
                  setShowBurgerMenuAbout(false);
                  setShowBurgerMenuTools(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setShowBurgerMenuCommunity(!showBurgerMenuCommunity);
                    setShowBurgerMenuCollections(false);
                    setShowBurgerMenuAbout(false);
                    setShowBurgerMenuTools(false);
                  }
                }}
                className={`${styles.burgerMenuHeader}
                  ${
                    showBurgerMenuCommunity
                      ? styles.burgerMenuCaretClose
                      : styles.burgerMenuCaretOpen
                  }`}>
                Network
              </h3>
            </Col>
            {showBurgerMenuCommunity && (
              <Container>
                {printMobileHr()}
                {printMobileRow("Identities", "/network")}
                {printMobileRow("Activity", "/network/activity")}
                {printMobileRow("Groups", "/network/groups")}
                {printMobileRow("NFT Activity", "/nft-activity")}
                {printMobileHr()}
                {printMobileRow("Prenodes", "/network/prenodes")}
                {printMobileHr()}
                {printMobileSubheader("Metrics")}
                {printMobileRow("Definitions", "/network/metrics")}
                {printMobileRow("Network Stats", "/network/stats")}
                {printMobileRow("Levels", "/network/levels")}
                {printMobileHr()}
              </Container>
            )}
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3
                onClick={() => {
                  setShowBurgerMenuTools(!showBurgerMenuTools);
                  setShowBurgerMenuCollections(false);
                  setShowBurgerMenuCommunity(false);
                  setShowBurgerMenuAbout(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setShowBurgerMenuTools(!showBurgerMenuTools);
                    setShowBurgerMenuCollections(false);
                    setShowBurgerMenuCommunity(false);
                    setShowBurgerMenuAbout(false);
                  }
                }}
                className={`${styles.burgerMenuHeader}
                  ${
                    showBurgerMenuTools
                      ? styles.burgerMenuCaretClose
                      : styles.burgerMenuCaretOpen
                  }`}>
                Tools
              </h3>
            </Col>
            {showBurgerMenuTools && (
              <Container>
                {printMobileHr()}
                {printMobileRow("App Wallets", "/tools/app-wallets")}
                {printMobileHr()}
                {printMobileSubheader("NFT Delegation")}
                {printMobileRow(
                  "Delegation Center",
                  "/delegation/delegation-center"
                )}
                {printMobileRow(
                  "Wallet Architecture",
                  "/delegation/wallet-architecture"
                )}
                {printMobileRow(
                  "Delegation FAQs",
                  "/delegation/delegation-faq"
                )}
                {printMobileRow(
                  "Consolidation Use Cases",
                  "/delegation/consolidation-use-cases"
                )}
                {printMobileRow("Wallet Checker", "/delegation/wallet-checker")}
                {printMobileHr()}
                {printMobileSubheader("The Memes Tools")}
                {capacitor.platform !== "ios" && (
                  <>
                    {printMobileRow(
                      "Memes Subscriptions",
                      "/tools/subscriptions-report"
                    )}
                  </>
                )}
                {printMobileRow("Meme Accounting", "/meme-accounting")}
                {printMobileRow("Meme Gas", "/meme-gas")}
                {printMobileHr()}
                {printMobileRow("EMMA", "/emma")}
                {printMobileRow("Block Finder", "/meme-blocks")}
                {printMobileRow("Open Data", "/open-data")}
                {printMobileHr()}
              </Container>
            )}
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3
                onClick={() => {
                  setShowBurgerMenuAbout(!showBurgerMenuAbout);
                  setShowBurgerMenuCollections(false);
                  setShowBurgerMenuCommunity(false);
                  setShowBurgerMenuTools(false);
                }}
                className={`${styles.burgerMenuHeader}
                  ${
                    showBurgerMenuAbout
                      ? styles.burgerMenuCaretClose
                      : styles.burgerMenuCaretOpen
                  }`}>
                About
              </h3>
            </Col>
            {showBurgerMenuAbout && (
              <Container>
                {printMobileHr()}
                {printMobileSubheader("NFTs")}
                {printMobileRow("The Memes", `/about/${AboutSection.MEMES}`)}
                {capacitor.platform !== "ios" && (
                  <>
                    {printMobileRow(
                      "Subscriptions",
                      `/about/${AboutSection.SUBSCRIPTIONS}`
                    )}
                  </>
                )}
                {printMobileRow(
                  "Memes Calendar",
                  `/about/${AboutSection.MEMES_CALENDAR}`
                )}
                {printMobileRow("Minting", `/about/${AboutSection.MINTING}`)}
                {printMobileRow(
                  "Nakamoto Threshold",
                  `/about/${AboutSection.NAKAMOTO_THRESHOLD}`
                )}
                {printMobileRow("Meme Lab", `/about/${AboutSection.MEME_LAB}`)}
                {printMobileRow(
                  "Gradients",
                  `/about/${AboutSection.GRADIENTS}`
                )}
                {printMobileHr()}
                {printMobileRow("GDRC1", `/about/${AboutSection.GDRC1}`)}
                {printMobileHr()}
                {printMobileSubheader("NFT Delegation")}
                {printMobileRow(
                  "About NFTD",
                  `/about/${AboutSection.NFT_DELEGATION}`
                )}
                {printMobileRow(
                  "Primary Address",
                  `/about/${AboutSection.PRIMARY_ADDRESS}`
                )}
                {printMobileHr()}
                {printMobileSubheader("Support")}
                {printMobileRow("FAQ", `/about/${AboutSection.FAQ}`)}
                {printMobileRow("Apply", `/about/${AboutSection.APPLY}`)}
                {printMobileRow(
                  "Contact Us",
                  `/about/${AboutSection.CONTACT_US}`
                )}
                {printMobileHr()}
                {printMobileSubheader("Resources")}
                {printMobileRow(
                  "Data Decentralization",
                  `/about/${AboutSection.DATA_DECENTR}`
                )}
                {printMobileRow("ENS", `/about/${AboutSection.ENS}`)}
                {printMobileRow("License", `/about/${AboutSection.LICENSE}`)}
                {printMobileRow(
                  "Release Notes",
                  `/about/${AboutSection.RELEASE_NOTES}`
                )}
                {printMobileHr()}
              </Container>
            )}
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <>
      {printBurgerMenu()}
      {capacitor.isCapacitor && <CapacitorWidget />}
      <Container
        fluid
        className={`${
          capacitor.isCapacitor
            ? styles.capacitorMainContainer
            : props.isSmall
            ? styles.mainContainerSmall
            : styles.mainContainer
        } ${props.extraClass}`}>
        <Row>
          <Col>
            <Container className={styles.capacitorHeaderRowContainerLandscape}>
              <Row
                className={
                  capacitor.isCapacitor
                    ? styles.capacitorHeaderRow
                    : props.isSmall
                    ? styles.headerRowSmall
                    : styles.headerRow
                }>
                <Col
                  xs={{ span: 8 }}
                  sm={{ span: 8 }}
                  md={{ span: 8 }}
                  lg={{ span: 3 }}
                  xl={{ span: 2 }}
                  xxl={{ span: 3 }}
                  className={`d-flex align-items-center justify-content-start`}>
                  <Link href="/">
                    <Image
                      loading="eager"
                      priority
                      className={
                        props.isSmall ? styles.logoIconSmall : styles.logoIcon
                      }
                      src={logoSrc}
                      alt="6529Seize"
                      width={logoWidth}
                      height={logoHeight}
                    />
                  </Link>
                </Col>

                <Col
                  xs={{ span: 4 }}
                  sm={{ span: 4 }}
                  md={{ span: 4 }}
                  lg={{ span: 9 }}
                  xl={{ span: 10 }}
                  xxl={{ span: 9 }}
                  className={`d-flex align-items-center justify-content-end ${styles.headerRight}`}>
                  <Container className="no-padding">
                    <Navbar expand="lg" variant="dark">
                      <Container
                        className={`d-flex align-items-center justify-content-end no-padding`}>
                        <div
                          className={`${styles.dMdNone} d-flex align-items-center`}>
                          <div className="tw-inline-flex tw-space-x-2 tw-mr-6 xl:tw-mr-2">
                            {showWaves && <HeaderNotifications />}
                            <HeaderSearchButton />
                          </div>
                          <button
                            type="button"
                            aria-label="Menu"
                            title="Menu"
                            onClick={() => setBurgerMenuOpen(true)}
                            className="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-h-11 tw-w-11 tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out">
                            <FontAwesomeIcon icon={faBars} height={20} />
                          </button>
                        </div>
                        <Navbar
                          id="seize-navbar-nav"
                          className={`justify-content-end d-none ${styles.dMdBlock}`}>
                          <Nav className="justify-content-end ml-auto">
                            {showWaves && (
                              <NavDropdown
                                title="Brain"
                                align={"start"}
                                className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}>
                                <HeaderDesktopLink
                                  link={{
                                    name: "My Stream",
                                    path: "/my-stream",
                                  }}
                                />
                                <HeaderDesktopLink
                                  link={{
                                    name: "Waves",
                                    path: "/waves",
                                  }}
                                />
                              </NavDropdown>
                            )}
                            <NavDropdown
                              title="Collections"
                              align={"start"}
                              className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}>
                              <HeaderDesktopLink
                                link={{
                                  name: "The Memes",
                                  path: "/the-memes",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Gradient",
                                  path: "/6529-gradient",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "NextGen",
                                  path: "/nextgen",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Meme Lab",
                                  path: "/meme-lab",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "ReMemes",
                                  path: "/rememes",
                                }}
                              />
                            </NavDropdown>
                            <NavDropdown
                              title="Network"
                              align={"start"}
                              className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}>
                              <HeaderDesktopLink
                                link={{
                                  name: "Identities",
                                  path: "/network",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Activity",
                                  path: "/network/activity",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Groups",
                                  path: "/network/groups",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "NFT Activity",
                                  path: "/nft-activity",
                                }}
                              />
                              <NavDropdown.Divider />
                              <HeaderDesktopLink
                                link={{
                                  name: "Prenodes",
                                  path: "/network/prenodes",
                                }}
                              />
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.submenuContainer}>
                                <div className="d-flex justify-content-between align-items-center gap-3 submenu-trigger">
                                  Metrics
                                  <FontAwesomeIcon
                                    icon={faChevronRight}
                                    height={16}
                                    width={16}
                                  />
                                </div>
                                <div className={styles.nestedMenu}>
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Definitions",
                                      path: "/network/metrics",
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Network Stats",
                                      path: "/network/stats",
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Levels",
                                      path: "/network/levels",
                                    }}
                                  />
                                </div>
                              </NavDropdown.Item>
                            </NavDropdown>
                            <NavDropdown
                              title="Tools"
                              align={"start"}
                              className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}>
                              <HeaderDesktopLink
                                link={{
                                  name: "App Wallets",
                                  path: "/tools/app-wallets",
                                }}
                              />
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.submenuContainer}>
                                <div className="d-flex justify-content-between align-items-center gap-3 submenu-trigger">
                                  NFT Delegation
                                  <FontAwesomeIcon
                                    icon={faChevronRight}
                                    height={16}
                                    width={16}
                                  />
                                </div>
                                <div className={styles.nestedMenu}>
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Delegation Center",
                                      path: "/delegation/delegation-center",
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Wallet Architecture",
                                      path: "/delegation/wallet-architecture",
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Delegation FAQs",
                                      path: "/delegation/delegation-faq",
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Consolidation Use Cases",
                                      path: "/delegation/consolidation-use-cases",
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Wallet Checker",
                                      path: "/delegation/wallet-checker",
                                    }}
                                  />
                                </div>
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.submenuContainer}>
                                <div className="d-flex justify-content-between align-items-center gap-3 submenu-trigger">
                                  The Memes Tools
                                  <FontAwesomeIcon
                                    icon={faChevronRight}
                                    height={16}
                                    width={16}
                                  />
                                </div>
                                <div className={styles.nestedMenu}>
                                  {capacitor.platform !== "ios" && (
                                    <HeaderDesktopLink
                                      link={{
                                        name: "Memes Subscriptions",
                                        path: "/tools/subscriptions-report",
                                      }}
                                    />
                                  )}
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Memes Accounting",
                                      path: "/meme-accounting",
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Memes Gas",
                                      path: "/meme-gas",
                                    }}
                                  />
                                </div>
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <HeaderDesktopLink
                                link={{
                                  name: "EMMA",
                                  path: "/emma",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Block Finder",
                                  path: "/meme-blocks",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Open Data",
                                  path: "/open-data",
                                }}
                              />
                            </NavDropdown>
                            <NavDropdown
                              title="About"
                              className={`${styles.mainNavLink} ${
                                styles.mainNavLinkPadding
                              } ${
                                router.pathname.includes("/about")
                                  ? "active"
                                  : ""
                              }`}
                              align={"start"}>
                              <NavDropdown.Item
                                className={styles.submenuContainer}>
                                <div className="d-flex justify-content-between align-items-center gap-3 submenu-trigger">
                                  NFTs
                                  <FontAwesomeIcon
                                    icon={faChevronRight}
                                    height={16}
                                    width={16}
                                  />
                                </div>
                                <div className={styles.nestedMenu}>
                                  <HeaderDesktopLink
                                    link={{
                                      name: "The Memes",
                                      path: `/about/${AboutSection.MEMES}`,
                                    }}
                                  />
                                  {capacitor.platform !== "ios" && (
                                    <HeaderDesktopLink
                                      link={{
                                        name: "Subscriptions",
                                        path: `/about/${AboutSection.SUBSCRIPTIONS}`,
                                      }}
                                    />
                                  )}
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Memes Calendar",
                                      path: `/about/${AboutSection.MEMES_CALENDAR}`,
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Minting",
                                      path: `/about/${AboutSection.MINTING}`,
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Nakamoto Threshold",
                                      path: `/about/${AboutSection.NAKAMOTO_THRESHOLD}`,
                                    }}
                                  />
                                  <NavDropdown.Divider />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Meme Lab",
                                      path: `/about/${AboutSection.MEME_LAB}`,
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Gradient",
                                      path: `/about/${AboutSection.GRADIENTS}`,
                                    }}
                                  />
                                </div>
                              </NavDropdown.Item>
                              <HeaderDesktopLink
                                link={{
                                  name: "GDRC1",
                                  path: `/about/${AboutSection.GDRC1}`,
                                }}
                              />
                              <NavDropdown.Item
                                className={styles.submenuContainer}>
                                <div className="d-flex justify-content-between align-items-center gap-3 submenu-trigger">
                                  NFT Delegation
                                  <FontAwesomeIcon
                                    icon={faChevronRight}
                                    height={16}
                                    width={16}
                                  />
                                </div>
                                <div className={styles.nestedMenu}>
                                  <HeaderDesktopLink
                                    link={{
                                      name: "About NFTD",
                                      path: `/about/${AboutSection.NFT_DELEGATION}`,
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Primary Address",
                                      path: `/about/${AboutSection.PRIMARY_ADDRESS}`,
                                    }}
                                  />
                                </div>
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.submenuContainer}>
                                <div className="d-flex justify-content-between align-items-center gap-3 submenu-trigger">
                                  Support
                                  <FontAwesomeIcon
                                    icon={faChevronRight}
                                    height={16}
                                    width={16}
                                  />
                                </div>
                                <div className={styles.nestedMenu}>
                                  <HeaderDesktopLink
                                    link={{
                                      name: "FAQ",
                                      path: `/about/${AboutSection.FAQ}`,
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Apply",
                                      path: `/about/${AboutSection.APPLY}`,
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Contact Us",
                                      path: `/about/${AboutSection.CONTACT_US}`,
                                    }}
                                  />
                                </div>
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.submenuContainer}>
                                <div className="d-flex justify-content-between align-items-center gap-3 submenu-trigger">
                                  Resources
                                  <FontAwesomeIcon
                                    icon={faChevronRight}
                                    height={16}
                                    width={16}
                                  />
                                </div>
                                <div className={styles.nestedMenu}>
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Data Decentralization",
                                      path: `/about/${AboutSection.DATA_DECENTR}`,
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "ENS",
                                      path: `/about/${AboutSection.ENS}`,
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "License",
                                      path: `/about/${AboutSection.LICENSE}`,
                                    }}
                                  />
                                  <HeaderDesktopLink
                                    link={{
                                      name: "Release Notes",
                                      path: `/about/${AboutSection.RELEASE_NOTES}`,
                                    }}
                                  />
                                </div>
                              </NavDropdown.Item>
                            </NavDropdown>
                            <HeaderUser />
                            {showWaves && <HeaderNotifications />}
                            <HeaderQR />
                            <HeaderSearchButton />
                          </Nav>
                        </Navbar>
                      </Container>
                    </Navbar>
                  </Container>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
      {capacitor.isCapacitor && (
        <Container className={styles.capacitorPlaceholder}></Container>
      )}
    </>
  );
}
