import styles from "./Header.module.scss";
import { Container, Row, Col, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AboutSection } from "../../pages/about/[section]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import HeaderConnect from "./HeaderConnect";
import { useAccount } from "wagmi";
import SearchProfileButton from "./search-profile/SearchProfileButton";
import UserSetUpProfileCta from "../user/utils/no-profile/set-up-profile/UserSetUpProfileCta";

interface Props {
  onLoad?: () => void;
  onSetWallets?(wallets: string[]): any;
}

export default function Header(props: Readonly<Props>) {
  const router = useRouter();
  const account = useAccount();

  const [consolidations, setConsolidations] = useState<string[]>([]);
  const [burgerMenuOpen, setBurgerMenuOpen] = useState(false);

  const [showBurgerMenuCollections, setShowBurgerMenuCollections] =
    useState(false);
  const [showBurgerMenuAbout, setShowBurgerMenuAbout] = useState(false);
  const [showBurgerMenuCommunity, setShowBurgerMenuCommunity] = useState(false);
  const [showBurgerMenuTools, setShowBurgerMenuTools] = useState(false);

  useEffect(() => {
    function handleResize() {
      setShowBurgerMenuCollections(false);
      setBurgerMenuOpen(false);
      setShowBurgerMenuAbout(false);
      setShowBurgerMenuCommunity(false);
      setShowBurgerMenuTools(false);
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

  function printNavDropdown(name: string, path: string) {
    return (
      <NavDropdown.Item
        className={styles.dropdownItem}
        onClick={() => (window.location.href = path)}>
        {name}
      </NavDropdown.Item>
    );
  }

  function printHeaderConnect() {
    return <HeaderConnect />;
  }

  function printBurgerMenu() {
    return (
      <div
        className={`${styles.burgerMenu} ${
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
                className={`d-flex justify-content-center ${styles.burgerMenuHeader}`}>
                {printHeaderConnect()}
              </h3>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/">
                <h3>Home</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3
                onClick={() => {
                  setShowBurgerMenuCollections(!showBurgerMenuCollections);
                  setShowBurgerMenuCommunity(false);
                  setShowBurgerMenuAbout(false);
                  setShowBurgerMenuTools(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setShowBurgerMenuCollections(!showBurgerMenuCollections);
                    setShowBurgerMenuCommunity(false);
                    setShowBurgerMenuAbout(false);
                    setShowBurgerMenuTools(false);
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
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/the-memes">
                      <h3>The Memes</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/6529-gradient">
                      <h3>Gradient</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/nextgen">
                      <h3>
                        <span>NextGen</span>&nbsp;
                        <span className={styles.new}>new</span>
                      </h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/meme-lab">
                      <h3>Meme Lab</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/rememes">
                      <h3>ReMemes</h3>
                    </a>
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
                  }`}>
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
                    <a href="/community">
                      <h3>Community</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/community-activity">
                      <h3>Community Activity</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/nft-activity">
                      <h3>NFT Activity</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/community-metrics">
                      <h3>Community Metrics</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/community-stats">
                      <h3>Community Stats</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/levels">
                      <h3>Levels</h3>
                    </a>
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
                  }`}>
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
                    <a href="/delegation/delegation-center">
                      <h3>Delegation Center</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/emma">
                      <h3>EMMA</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/meme-blocks">
                      <h3>Meme Blocks</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/open-data">
                      <h3>Open Data</h3>
                    </a>
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
                  }`}>
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
                    <a href={`/about/${AboutSection.MEMES}`}>
                      <h3>The Memes</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.MEMES_CALENDAR}`}>
                      <h3>Memes Calendar</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.MEME_LAB}`}>
                      <h3>Meme Lab</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.GRADIENTS}`}>
                      <h3>Gradient</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.GDRC1}`}>
                      <h3>GDRC1</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.NFT_DELEGATION}`}>
                      <h3>NFT Delegation</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.FAQ}`}>
                      <h3>FAQ</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.ENS}`}>
                      <h3>ENS</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.MINTING}`}>
                      <h3>Minting</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.LICENSE}`}>
                      <h3>License</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.APPLY}`}>
                      <h3>Apply</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.CONTACT_US}`}>
                      <h3>Contact Us</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.RELEASE_NOTES}`}>
                      <h3>Release Notes</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.DATA_DECENTR}`}>
                      <h3>Data Decentralization</h3>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.TERMS_OF_SERVICE}`}>
                      <h3>Terms of Service</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.PRIVACY_POLICY}`}>
                      <h3>Privacy Policy</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href={`/about/${AboutSection.COOKIE_POLICY}`}>
                      <h3>Cookie Policy</h3>
                    </a>
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
                  className={`d-flex align-items-center justify-content-start ${styles.headerLeft}`}>
                  <a href="/">
                    <Image
                      loading="eager"
                      priority
                      className={styles.logoIcon}
                      src="https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Glasses.png"
                      alt="6529Seize"
                      width={319}
                      height={50}
                    />
                  </a>
                </Col>

                <Col
                  xs={{ span: 4 }}
                  sm={{ span: 4 }}
                  md={{ span: 4 }}
                  lg={{ span: 9 }}
                  className={`no-padding d-flex align-items-center justify-content-end ${styles.headerRight}`}>
                  <Container className="no-padding">
                    <Navbar expand="lg" variant="dark">
                      <Container
                        className={`d-flex align-items-center justify-content-end no-padding`}>
                        <div
                          className={`${styles.dMdNone} d-flex align-items-center`}>
                          <UserSetUpProfileCta />
                          <SearchProfileButton />
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
                          className={`justify-content-end d-none ${styles.dMdBlock}`}>
                          <Nav className="justify-content-end ml-auto">
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname === "/" ? "active" : ""
                              }`}
                              href="/">
                              Home
                            </Nav.Link>
                            <NavDropdown
                              title="Collections"
                              align={"start"}
                              className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/the-memes")
                                }>
                                The Memes
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/6529-gradient")
                                }>
                                Gradient
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/nextgen")
                                }>
                                <span>NextGen</span>&nbsp;
                                <span className={styles.new}>new</span>
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/meme-lab")
                                }>
                                Meme Lab
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/rememes")
                                }>
                                ReMemes
                              </NavDropdown.Item>
                            </NavDropdown>
                            <NavDropdown
                              title="Community"
                              align={"start"}
                              className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/community")
                                }>
                                Community
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/community-activity")
                                }>
                                Community Activity
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/nft-activity")
                                }>
                                NFT Activity
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/community-metrics")
                                }>
                                Community Metrics
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/community-stats")
                                }>
                                Community Stats
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/levels")
                                }>
                                Levels
                              </NavDropdown.Item>
                            </NavDropdown>
                            <NavDropdown
                              title="Tools"
                              align={"start"}
                              className={`${styles.mainNavLink} ${styles.mainNavLinkPadding}`}>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/delegation/delegation-center")
                                }>
                                Delegation Center
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/emma")
                                }>
                                EMMA
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/meme-blocks")
                                }>
                                Meme Blocks
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/open-data")
                                }>
                                Open Data
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              {printNavDropdown(
                                "Meme Accounting",
                                "/meme-accounting"
                              )}
                              {printNavDropdown("Meme Gas", "/meme-gas")}
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
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.MEMES}`)
                                }>
                                The Memes
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.MEMES_CALENDAR}`)
                                }>
                                Memes Calendar
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.MEME_LAB}`)
                                }>
                                Meme Lab
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.GRADIENTS}`)
                                }>
                                Gradient
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.GDRC1}`)
                                }>
                                GDRC1
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.NFT_DELEGATION}`)
                                }>
                                NFT Delegation
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.FAQ}`)
                                }>
                                FAQ
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.ENS}`)
                                }>
                                ENS
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.MINTING}`)
                                }>
                                Minting
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.LICENSE}`)
                                }>
                                License
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.APPLY}`)
                                }>
                                Apply
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.CONTACT_US}`)
                                }>
                                Contact Us
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.RELEASE_NOTES}`)
                                }>
                                Release Notes
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.DATA_DECENTR}`)
                                }>
                                Data Decentralization
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.TERMS_OF_SERVICE}`)
                                }>
                                Terms of Service
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.PRIVACY_POLICY}`)
                                }>
                                Privacy Policy
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = `/about/${AboutSection.COOKIE_POLICY}`)
                                }>
                                Cookie Policy
                              </NavDropdown.Item>
                            </NavDropdown>
                            {printHeaderConnect()}
                            <UserSetUpProfileCta />
                            <SearchProfileButton />
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
