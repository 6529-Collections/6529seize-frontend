import styles from "./Header.module.scss";
import { Container, Row, Col, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import { AboutSection } from "../../pages/about/[section]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import { useAccount } from "wagmi";
import HeaderDesktopLink from "./HeaderDesktopLink";
import Link from "next/link";
import HeaderUser from "./user/HeaderUser";
import HeaderSearchButton from "./header-search/HeaderSearchButton";
import { AuthContext } from "../auth/Auth";

interface Props {
  onLoad?: () => void;
  onSetWallets?(wallets: string[]): any;
}

export interface HeaderLink {
  readonly name: string;
  readonly path: `/${string}`;
  readonly isNew?: boolean;
}

export default function Header(props: Readonly<Props>) {
  const { showWaves } = useContext(AuthContext);
  const router = useRouter();
  const account = useAccount();
  const [consolidations, setConsolidations] = useState<string[]>([]);
  const [burgerMenuOpen, setBurgerMenuOpen] = useState(false);

  const [showBurgerMenuCollections, setShowBurgerMenuCollections] =
    useState(false);
  const [showBurgerMenuAbout, setShowBurgerMenuAbout] = useState(false);
  const [showBurgerMenuCommunity, setShowBurgerMenuCommunity] = useState(false);
  const [showBurgerMenuTools, setShowBurgerMenuTools] = useState(false);
  const [showBurgerMenuBrain, setShowBurgerMenuBrain] = useState(false);

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
      } else if (account.address) {
        props.onSetWallets([account.address]);
      } else {
        props.onSetWallets([]);
      }
    }
  }, [consolidations, account.address]);

  useEffect(() => {
    if (account.address) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/consolidations/${account.address}`
      ).then((response: DBResponse) => {
        setConsolidations(Array.from(response.data));
      });
    } else {
      setConsolidations([]);
    }
  }, [account.address]);

  function printMobileRow(name: string, path: string) {
    return (
      <Row className="pt-3">
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
        className={`${styles.burgerMenu} ${
          burgerMenuOpen ? styles.burgerMenuOpen : ""
        }`}
      >
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
                }}
              ></FontAwesomeIcon>
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
                src="https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses.png"
                alt="6529Seize"
                width={319}
                height={50}
              />
            </Col>
          </Row>
          <Row className="pt-4 pb-3">
            <Col>
              <h3
                className={`d-flex justify-content-center ${styles.burgerMenuHeader}`}
              >
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
                  }`}
                >
                  Brain
                </h3>
              </Col>
              {showBurgerMenuBrain && (
                <Container>
                  <Row>
                    <Col xs={{ span: 6, offset: 3 }}>
                      <hr />
                    </Col>
                  </Row>
                  <Row className="pt-3">
                    <Col>
                      <Link href="/my-stream">
                        <h3>My Stream</h3>
                      </Link>
                    </Col>
                  </Row>
                  <Row className="pt-3">
                    <Col>
                      <Link href="/waves">
                        <h3>Waves</h3>
                      </Link>
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={{ span: 6, offset: 3 }}>
                      <hr />
                    </Col>
                  </Row>
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
                  }`}
              >
                Collections
              </h3>
            </Col>
            {showBurgerMenuCollections && (
              <Container>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/the-memes">
                      <h3>The Memes</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/6529-gradient">
                      <h3>Gradient</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/nextgen">
                      <h3>
                        <span>NextGen</span>&nbsp;
                        <span className={styles.new}>new</span>
                      </h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/meme-lab">
                      <h3>Meme Lab</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/rememes">
                      <h3>ReMemes</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
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
                  }`}
              >
                Community
              </h3>
            </Col>
            {showBurgerMenuCommunity && (
              <Container>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/community">
                      <h3>Community</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/community-activity">
                      <h3>Community Activity</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/groups">
                      <h3>Groups</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/nft-activity">
                      <h3>NFT Activity</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/community/prenodes">
                      <h3>Prenodes</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/community-metrics">
                      <h3>Community Metrics</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/community-stats">
                      <h3>Community Stats</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/levels">
                      <h3>Levels</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
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
                  }`}
              >
                Tools
              </h3>
            </Col>
            {showBurgerMenuTools && (
              <Container>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/tools/subscriptions-report">
                      <h3>Subscriptions Report</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/delegation/delegation-center">
                      <h3>Delegation Center</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/emma">
                      <h3>EMMA</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/meme-blocks">
                      <h3>Meme Blocks</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href="/open-data">
                      <h3>Open Data</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                {printMobileRow("Meme Accounting", "/meme-accounting")}
                {printMobileRow("Meme Gas", "/meme-gas")}
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
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
                  }`}
              >
                About
              </h3>
            </Col>
            {showBurgerMenuAbout && (
              <Container>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.MEMES}`}>
                      <h3>The Memes</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.SUBSCRIPTIONS}`}>
                      <h3>Subscriptions</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.MEMES_CALENDAR}`}>
                      <h3>Memes Calendar</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.MEME_LAB}`}>
                      <h3>Meme Lab</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.GRADIENTS}`}>
                      <h3>Gradient</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.GDRC1}`}>
                      <h3>GDRC1</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.NFT_DELEGATION}`}>
                      <h3>NFT Delegation</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.PRIMARY_ADDRESS}`}>
                      <h3>Primary Address</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.FAQ}`}>
                      <h3>FAQ</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.ENS}`}>
                      <h3>ENS</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.MINTING}`}>
                      <h3>Minting</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.NAKAMOTO_THRESHOLD}`}>
                      <h3>Nakamoto Threshold</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.LICENSE}`}>
                      <h3>License</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.APPLY}`}>
                      <h3>Apply</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.CONTACT_US}`}>
                      <h3>Contact Us</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.RELEASE_NOTES}`}>
                      <h3>Release Notes</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.DATA_DECENTR}`}>
                      <h3>Data Decentralization</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.TERMS_OF_SERVICE}`}>
                      <h3>Terms of Service</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.PRIVACY_POLICY}`}>
                      <h3>Privacy Policy</h3>
                    </Link>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <Link href={`/about/${AboutSection.COOKIE_POLICY}`}>
                      <h3>Cookie Policy</h3>
                    </Link>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
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
      <Container fluid className={styles.mainContainer}>
        <Row>
          <Col>
            <Container>
              <Row className={styles.headerRow}>
                <Col
                  xs={{ span: 8 }}
                  sm={{ span: 8 }}
                  md={{ span: 8 }}
                  lg={{ span: 3 }}
                  xl={{ span: 2 }}
                  xxl={{ span: 3 }}
                  className={`d-flex align-items-center justify-content-start ${styles.headerLeft}`}
                >
                  <Link href="/">
                    <Image
                      loading="eager"
                      priority
                      className={styles.logoIcon}
                      src="https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses.png"
                      alt="6529Seize"
                      width={319}
                      height={50}
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
                  className={`no-padding d-flex align-items-center justify-content-end ${styles.headerRight}`}
                >
                  <Container className="no-padding">
                    <Navbar expand="lg" variant="dark">
                      <Container
                        className={`d-flex align-items-center justify-content-end no-padding`}
                      >
                        <div
                          className={`${styles.dMdNone} d-flex align-items-center`}
                        >
                          <div className="tw-mr-6 xl:tw-mr-2">
                            <HeaderSearchButton />
                          </div>
                          <Image
                            loading="eager"
                            priority
                            width="0"
                            height="0"
                            style={{
                              height: "auto",
                              width: "auto",
                              maxHeight: "42px",
                            }}
                            className={`${styles.burgerMenuBtn} d-block `}
                            src="https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Icon.png"
                            alt="6529Seize"
                            onClick={() => setBurgerMenuOpen(true)}
                          />
                        </div>
                        <Navbar
                          id="seize-navbar-nav"
                          className={`justify-content-end d-none ${styles.dMdBlock}`}
                        >
                          <Nav className="justify-content-end ml-auto">
                            {showWaves && (
                              <NavDropdown
                                title="Brain"
                                align={"start"}
                                className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}
                              >
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
                              className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}
                            >
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
                              <NavDropdown.Divider />
                              <HeaderDesktopLink
                                link={{
                                  name: "NextGen",
                                  path: "/nextgen",
                                  isNew: true,
                                }}
                              />
                              <NavDropdown.Divider />
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
                              title="Community"
                              align={"start"}
                              className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}
                            >
                              <HeaderDesktopLink
                                link={{
                                  name: "Community",
                                  path: "/community",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Community Activity",
                                  path: "/community-activity",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Groups",
                                  path: "/groups",
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
                                  path: "/community/prenodes",
                                }}
                              />
                              <NavDropdown.Divider />
                              <HeaderDesktopLink
                                link={{
                                  name: "Community Metrics",
                                  path: "/community-metrics",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Community Stats",
                                  path: "/community-stats",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Levels",
                                  path: "/levels",
                                }}
                              />
                            </NavDropdown>
                            <NavDropdown
                              title="Tools"
                              align={"start"}
                              className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}
                            >
                              <HeaderDesktopLink
                                link={{
                                  name: "Subscriptions Report",
                                  path: "/tools/subscriptions-report",
                                }}
                              />
                              <NavDropdown.Divider />
                              <HeaderDesktopLink
                                link={{
                                  name: "Delegation Center",
                                  path: "/delegation/delegation-center",
                                }}
                              />
                              <NavDropdown.Divider />
                              <HeaderDesktopLink
                                link={{
                                  name: "EMMA",
                                  path: "/emma",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Meme Blocks",
                                  path: "/meme-blocks",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Open Data",
                                  path: "/open-data",
                                }}
                              />
                              <NavDropdown.Divider />
                              <HeaderDesktopLink
                                link={{
                                  name: "Meme Accounting",
                                  path: "/meme-accounting",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Meme Gas",
                                  path: "/meme-gas",
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
                              align={"start"}
                            >
                              <HeaderDesktopLink
                                link={{
                                  name: "The Memes",
                                  path: `/about/${AboutSection.MEMES}`,
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Subscriptions",
                                  path: "/about/subscriptions",
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Memes Calendar",
                                  path: `/about/${AboutSection.MEMES_CALENDAR}`,
                                }}
                              />
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
                              <NavDropdown.Divider />
                              <HeaderDesktopLink
                                link={{
                                  name: "GDRC1",
                                  path: `/about/${AboutSection.GDRC1}`,
                                }}
                              />
                              <NavDropdown.Divider />
                              <HeaderDesktopLink
                                link={{
                                  name: "NFT Delegation",
                                  path: `/about/${AboutSection.NFT_DELEGATION}`,
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Primary Address",
                                  path: `/about/${AboutSection.PRIMARY_ADDRESS}`,
                                }}
                              />
                              <NavDropdown.Divider />
                              <HeaderDesktopLink
                                link={{
                                  name: "FAQ",
                                  path: `/about/${AboutSection.FAQ}`,
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
                              <HeaderDesktopLink
                                link={{
                                  name: "License",
                                  path: `/about/${AboutSection.LICENSE}`,
                                }}
                              />
                              <NavDropdown.Divider />
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
                              <HeaderDesktopLink
                                link={{
                                  name: "Release Notes",
                                  path: `/about/${AboutSection.RELEASE_NOTES}`,
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Data Decentralization",
                                  path: `/about/${AboutSection.DATA_DECENTR}`,
                                }}
                              />
                              <NavDropdown.Divider />
                              <HeaderDesktopLink
                                link={{
                                  name: "Terms of Service",
                                  path: `/about/${AboutSection.TERMS_OF_SERVICE}`,
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Privacy Policy",
                                  path: `/about/${AboutSection.PRIVACY_POLICY}`,
                                }}
                              />
                              <HeaderDesktopLink
                                link={{
                                  name: "Cookie Policy",
                                  path: `/about/${AboutSection.COOKIE_POLICY}`,
                                }}
                              />
                            </NavDropdown>
                            <HeaderUser />
                            <HeaderSearchButton />
                          </Nav>
                        </Navbar>
                        <Image
                          loading="eager"
                          priority
                          width="0"
                          height="0"
                          style={{
                            height: "auto",
                            width: "auto",
                            maxHeight: "42px",
                            paddingLeft: "15px",
                          }}
                          className={`d-none ${styles.dMdBlock}`}
                          src="https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Icon.png"
                          alt="6529Seize"
                        />
                      </Container>
                    </Navbar>
                  </Container>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </>
  );
}
