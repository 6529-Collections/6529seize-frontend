import { Web3Button } from "@web3modal/react";
import styles from "./Header.module.scss";
import { Container, Row, Col, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AboutSection } from "../../pages/about/[section]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Address = dynamic(() => import("../address/Address"), { ssr: false });

interface Props {
  onLoad?: () => void;
}

export default function Header(props: Props) {
  const router = useRouter();
  const { address, connector, isConnected } = useAccount();
  const [burgerMenuOpen, setBurgerMenuOpen] = useState(false);

  const [showBurgerMenuAbout, setShowBurgerMenuAbout] = useState(false);
  const [setShowBurgerMenuCommunity, setsetShowBurgerMenuCommunity] =
    useState(false);

  useEffect(() => {
    function handleResize() {
      setBurgerMenuOpen(false);
      setShowBurgerMenuAbout(false);
      setsetShowBurgerMenuCommunity(false);
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    if (props.onLoad) {
      props.onLoad();
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
            setsetShowBurgerMenuCommunity(false);
          }}></FontAwesomeIcon>
        <Container className="text-center">
          <Row className="pt-5 pb-4">
            <Col>
              <Image
                loading="eager"
                priority
                className={styles.logoIcon}
                src="/Seize_Logo_Glasses.png"
                alt="6539Seize"
                width={319}
                height={50}
              />
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3 className="d-flex justify-content-center">
                {isConnected ? (
                  <>
                    <Web3Button
                      label="Connect"
                      icon="hide"
                      avatar="hide"
                      balance="hide"
                    />
                    <NavDropdown
                      title={
                        <button className={styles.userDropdownBtn}>
                          <span className={styles.userDropdownBtnIcon}></span>
                        </button>
                      }
                      className={`${styles.userDropdown}`}
                      align={"end"}>
                      <NavDropdown.Item
                        key="profile-dropdown-item"
                        className={styles.dropdownItem}
                        onClick={() =>
                          (window.location.href = `/${address as string}`)
                        }>
                        Profile
                      </NavDropdown.Item>
                      <NavDropdown.Item
                        key="delegations-dropdown-item"
                        className={styles.dropdownItem}
                        onClick={() =>
                          (window.location.href = `/delegations-center`)
                        }>
                        Delegations Center
                      </NavDropdown.Item>
                    </NavDropdown>
                  </>
                ) : (
                  <Web3Button
                    label="Connect"
                    icon="hide"
                    avatar="hide"
                    balance="hide"
                  />
                )}
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
              <a href="/rememes">
                <h3>ReMemes</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3
                onClick={() => {
                  setsetShowBurgerMenuCommunity(!setShowBurgerMenuCommunity);
                  setShowBurgerMenuAbout(false);
                }}
                className={
                  setShowBurgerMenuCommunity
                    ? styles.burgerMenuCaretClose
                    : styles.burgerMenuCaretOpen
                }>
                Community
              </h3>
            </Col>
            {setShowBurgerMenuCommunity && (
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
                <Row className="pt-3">
                  <Col>
                    <a href="/community-metrics">
                      <h3>Community Metrics</h3>
                    </a>
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
                  setShowBurgerMenuAbout(!showBurgerMenuAbout);
                  setsetShowBurgerMenuCommunity(false);
                }}
                className={
                  showBurgerMenuAbout
                    ? styles.burgerMenuCaretClose
                    : styles.burgerMenuCaretOpen
                }>
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
                      src="/Seize_Logo_Glasses.png"
                      alt="6539Seize"
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
                        className={`d-flex align-items-center justify-content-end`}>
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
                          src="/Seize_Logo_2.png"
                          alt="6539Seize"
                          onClick={() => setBurgerMenuOpen(true)}
                        />
                        <Navbar
                          id="seize-navbar-nav"
                          className={`justify-content-end d-none ${styles.dMdBlock}`}>
                          <Nav className="justify-content-end ml-auto">
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname == "/" ? "active" : ""
                              }`}
                              href="/">
                              Home
                            </Nav.Link>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname == "/the-memes" ? "active" : ""
                              }`}
                              href="/the-memes?sort=age&sort_dir=ASC">
                              The Memes
                            </Nav.Link>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname == "/6529-gradient"
                                  ? "active"
                                  : ""
                              }`}
                              href="/6529-gradient?sort=id&sort_dir=ASC">
                              Gradient
                            </Nav.Link>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname == "/meme-lab" ? "active" : ""
                              }`}
                              href="/meme-lab">
                              Meme Lab
                            </Nav.Link>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname == "/rememes" ? "active" : ""
                              }`}
                              href="/rememes">
                              ReMemes
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
                                  (window.location.href = "/downloads")
                                }>
                                Downloads
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
                            {isConnected ? (
                              <>
                                <Web3Button
                                  label="Connect"
                                  icon="hide"
                                  avatar="hide"
                                  balance="hide"
                                />
                                <NavDropdown
                                  title={
                                    <button className={styles.userDropdownBtn}>
                                      <span
                                        className={
                                          styles.userDropdownBtnIcon
                                        }></span>
                                    </button>
                                  }
                                  className={`${styles.userDropdown}`}
                                  align={"end"}>
                                  <NavDropdown.Item
                                    key="profile-dropdown-item"
                                    className={styles.dropdownItem}
                                    onClick={() =>
                                      (window.location.href = `/${
                                        address as string
                                      }`)
                                    }>
                                    Profile
                                  </NavDropdown.Item>
                                  <NavDropdown.Item
                                    key="delegations-dropdown-item"
                                    className={styles.dropdownItem}
                                    onClick={() =>
                                      (window.location.href = `/delegations-center`)
                                    }>
                                    Delegations Center
                                  </NavDropdown.Item>
                                </NavDropdown>
                              </>
                            ) : (
                              <Web3Button
                                label="Connect"
                                icon="hide"
                                avatar="hide"
                                balance="hide"
                              />
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
                          src="/Seize_Logo_2.png"
                          alt="6539Seize"
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
