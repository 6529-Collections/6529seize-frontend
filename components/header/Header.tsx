import { Web3Modal } from "@web3modal/react";
import { Web3Button } from "@web3modal/react";
import { mainnet } from "wagmi/chains";

import styles from "./Header.module.scss";
import {
  Container,
  Row,
  Col,
  Nav,
  Navbar,
  NavDropdown,
  Dropdown,
} from "react-bootstrap";
import { useAccount } from "wagmi";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AboutSection } from "../../pages/about/[section]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DBResponse } from "../../entities/IDBResponse";
import { fetchUrl } from "../../services/6529api";
import Cookies from "js-cookie";
import { CW_PROJECT_ID, VIEW_MODE_COOKIE } from "../../constants";
import { EthereumClient } from "@web3modal/ethereum";

interface Props {
  onLoad?: () => void;
  onSetWallets?(wallets: string[]): any;
}

enum VIEW {
  CONSOLIDATION = "Consolidation",
  WALLET = "Wallet",
}

export default function Header(props: Props) {
  const router = useRouter();
  const [consolidations, setConsolidations] = useState<string[]>([]);
  const [isConsolidation, setIsConsolidation] = useState(false);
  const { address, connector, isConnected } = useAccount();
  const [burgerMenuOpen, setBurgerMenuOpen] = useState(false);
  const [view, setView] = useState<VIEW>();

  const [showBurgerMenuAbout, setShowBurgerMenuAbout] = useState(false);
  const [showBurgerMenuCommunity, setShowBurgerMenuCommunity] = useState(false);
  const [showBurgerMenuTools, setShowBurgerMenuTools] = useState(false);

  useEffect(() => {
    const viewMode = Cookies.get(VIEW_MODE_COOKIE);
    console.log(VIEW_MODE_COOKIE, viewMode);
    if (viewMode === VIEW.CONSOLIDATION) {
      setView(VIEW.CONSOLIDATION);
    } else {
      setView(VIEW.WALLET);
    }
  }, []);

  useEffect(() => {
    if (view) {
      Cookies.set(VIEW_MODE_COOKIE, view);
      if (props.onSetWallets) {
        if (isConsolidation && view === VIEW.CONSOLIDATION) {
          props.onSetWallets(consolidations);
        } else if (address) {
          props.onSetWallets([address]);
        } else {
          props.onSetWallets([]);
        }
      }
    }
  }, [view, isConsolidation, isConnected]);

  useEffect(() => {
    function handleResize() {
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
    if (isConnected && address) {
      fetchUrl(
        `${process.env.API_ENDPOINT}/api/consolidations/${address}`
      ).then((response: DBResponse) => {
        if (
          response.data.length === 1 &&
          consolidations.length === 1 &&
          props.onSetWallets
        ) {
          props.onSetWallets([address]);
        } else {
          setConsolidations(Array.from(response.data));
        }
      });
    } else {
      setConsolidations([]);
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (consolidations.length > 1) {
      setIsConsolidation(true);
    } else {
      setIsConsolidation(false);
    }
  }, [consolidations]);

  function printBurgerMenu() {
    return (
      <div
        className={`${styles.burgerMenu} ${
          burgerMenuOpen ? styles.burgerMenuOpen : ""
        }`}>
        <FontAwesomeIcon
          className={styles.burgerMenuClose}
          icon="times-circle"
          onClick={() => {
            setBurgerMenuOpen(false);
            setShowBurgerMenuAbout(false);
            setShowBurgerMenuCommunity(false);
            setShowBurgerMenuTools(false);
          }}></FontAwesomeIcon>
        <Container className="text-center">
          <Row className="pt-5 pb-4">
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
          <Row className="pt-3 pb-3">
            <Col>
              <h3
                className={`d-flex justify-content-center ${styles.burgerMenuHeader}`}>
                <Web3Button
                  label="Connect"
                  icon="hide"
                  avatar="hide"
                  balance="hide"
                />
                {isConnected && (
                  <>
                    <button
                      className={`${styles.userProfileBtn}`}
                      onClick={() =>
                        (window.location.href = `/${address as string}`)
                      }>
                      <FontAwesomeIcon icon="user"></FontAwesomeIcon>
                    </button>
                    {isConsolidation && (
                      <NavDropdown
                        className={`${styles.consolidationDropDown}`}
                        title={
                          <button
                            className={`${styles.consolidationDropdownBtn} ${
                              isConsolidation && view === VIEW.CONSOLIDATION
                                ? styles.consolidationBtnActive
                                : ""
                            }`}>
                            <Image
                              loading="eager"
                              priority
                              src="/consolidation-icon_b.png"
                              alt="consolidation"
                              width={20}
                              height={20}
                            />
                          </button>
                        }
                        align={"end"}>
                        <NavDropdown.Item
                          className={styles.dropdownItemViewMode}
                          onClick={() => setView(VIEW.WALLET)}>
                          {view === VIEW.WALLET && (
                            <FontAwesomeIcon
                              className={styles.viewModeIcon}
                              icon="check-circle"></FontAwesomeIcon>
                          )}
                          Wallet
                        </NavDropdown.Item>
                        <NavDropdown.Item
                          onClick={() => setView(VIEW.CONSOLIDATION)}
                          className={styles.dropdownItemViewMode}>
                          {view === VIEW.CONSOLIDATION && (
                            <FontAwesomeIcon
                              className={`${styles.viewModeIcon} ${styles.viewModeIconConsolidation}`}
                              icon="check-circle"></FontAwesomeIcon>
                          )}
                          Consolidation
                        </NavDropdown.Item>
                      </NavDropdown>
                    )}
                  </>
                )}
              </h3>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/the-memes?sort=age&sort_dir=ASC">
                <h3>The Memes</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/6529-gradient?sort=id&sort_dir=ASC">
                <h3>Gradient</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/meme-lab">
                <h3>Meme Lab</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/nextgen">
                <h3>NextGen</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/rememes">
                <h3>ReMemes</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <a href="/nextgen">
                <h3>NextGen</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3
                onClick={() => {
                  setShowBurgerMenuCommunity(!showBurgerMenuCommunity);
                  setShowBurgerMenuAbout(false);
                  setShowBurgerMenuTools(false);
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
                    <a href="/latest-activity">
                      <h3>Latest Activity</h3>
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
                    <a href="/consolidation-use-cases">
                      <h3>Consolidation Use Cases</h3>
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
                    <a href="/downloads">
                      <h3>Downloads</h3>
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
                  setShowBurgerMenuCommunity(false);
                  setShowBurgerMenuAbout(false);
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
                    <a href="/allowlist-tool">
                      <h3>Allowlist Plan</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/distribution-plan-tool">
                      <h3>Distribution Plan</h3>
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
                    <a href="/delegation-mapping-tool">
                      <h3>Delegation Mapping</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/consolidation-mapping-tool">
                      <h3>Consolidation Mapping</h3>
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
                  setShowBurgerMenuAbout(!showBurgerMenuAbout);
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
                  className={`d-flex align-items-center justify-content-end ${styles.headerRight}`}>
                  <Container>
                    <Navbar expand="lg" variant="dark">
                      <Container
                        className={`d-flex align-items-center justify-content-end no-padding`}>
                        <Image
                          loading="eager"
                          priority
                          width="0"
                          height="0"
                          style={{
                            height: "auto",
                            width: "auto",
                            maxHeight: "42px",
                            paddingLeft: "35px",
                          }}
                          className={`${styles.burgerMenuBtn} d-block ${styles.dMdNone}`}
                          src="https://d3lqz0a4bldqgf.cloudfront.net/seize_images/Seize_Logo_Icon.png"
                          alt="6529Seize"
                          onClick={() => setBurgerMenuOpen(true)}
                        />
                        <Navbar
                          id="seize-navbar-nav"
                          className={`justify-content-end d-none ${styles.dMdBlock}`}>
                          <Nav className="justify-content-end ml-auto">
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname === "/the-memes" ? "active" : ""
                              }`}
                              href="/the-memes?sort=age&sort_dir=ASC">
                              The Memes
                            </Nav.Link>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname === "/6529-gradient"
                                  ? "active"
                                  : ""
                              }`}
                              href="/6529-gradient?sort=id&sort_dir=ASC">
                              Gradient
                            </Nav.Link>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname === "/meme-lab" ? "active" : ""
                              }`}
                              href="/meme-lab">
                              Meme Lab
                            </Nav.Link>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname === "/rememes" ? "active" : ""
                              }`}
                              href="/rememes">
                              ReMemes
                            </Nav.Link>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname === "/nextgen" ? "active" : ""
                              }`}
                              href="/nextgen">
                              NextGen
                            </Nav.Link>
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
                                  (window.location.href = "/latest-activity")
                                }>
                                Latest Activity
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
                                  (window.location.href =
                                    "/consolidation-use-cases")
                                }>
                                Consolidation Use Cases
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/downloads")
                                }>
                                Downloads
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
                                  (window.location.href = "/allowlist-tool")
                                }>
                                Allowlist Plan
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/distribution-plan-tool")
                                }>
                                Distribution Plan
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/delegation-mapping-tool")
                                }>
                                Delegation Mapping
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/consolidation-mapping-tool")
                                }>
                                Consolidation Mapping
                              </NavDropdown.Item>
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
                            <Web3Button
                              label="Connect"
                              icon="hide"
                              avatar="hide"
                              balance="hide"
                            />
                            {isConnected && (
                              <>
                                <button
                                  className={`${styles.userProfileBtn}`}
                                  onClick={() =>
                                    (window.location.href = `/${
                                      address as string
                                    }`)
                                  }>
                                  <FontAwesomeIcon icon="user"></FontAwesomeIcon>
                                </button>
                                {isConsolidation && (
                                  <NavDropdown
                                    className={`${styles.consolidationDropDown}`}
                                    title={
                                      <button
                                        className={`${
                                          styles.consolidationDropdownBtn
                                        } ${
                                          isConsolidation &&
                                          view === VIEW.CONSOLIDATION
                                            ? styles.consolidationBtnActive
                                            : ""
                                        }`}>
                                        <Image
                                          loading="eager"
                                          priority
                                          src="/consolidation-icon_b.png"
                                          alt="consolidation"
                                          width={20}
                                          height={20}
                                        />
                                      </button>
                                    }
                                    align={"end"}>
                                    <NavDropdown.Item
                                      className={styles.dropdownItemViewMode}
                                      onClick={() => setView(VIEW.WALLET)}>
                                      {view === VIEW.WALLET && (
                                        <FontAwesomeIcon
                                          className={styles.viewModeIcon}
                                          icon="check-circle"></FontAwesomeIcon>
                                      )}
                                      Wallet
                                    </NavDropdown.Item>
                                    <NavDropdown.Item
                                      onClick={() =>
                                        setView(VIEW.CONSOLIDATION)
                                      }
                                      className={styles.dropdownItemViewMode}>
                                      {view === VIEW.CONSOLIDATION && (
                                        <FontAwesomeIcon
                                          className={`${styles.viewModeIcon} ${styles.viewModeIconConsolidation}`}
                                          icon="check-circle"></FontAwesomeIcon>
                                      )}
                                      Consolidation
                                    </NavDropdown.Item>
                                  </NavDropdown>
                                )}
                              </>
                            )}
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
                            paddingLeft: "35px",
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
