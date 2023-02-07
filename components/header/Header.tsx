import styles from "./Header.module.scss";
import { Container, Row, Col, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useRouter } from "next/router";
import Image from "next/image";
import dynamic from "next/dynamic";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

const Address = dynamic(() => import("../address/Address"), { ssr: false });

export default function Header() {
  const router = useRouter();
  const { address, connector, isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const { disconnect } = useDisconnect();
  const [burgerMenuOpen, setBurgerMenuOpen] = useState(false);
  const [showBurgerMenuConnectOptions, setShowBurgerMenuConnectOptions] =
    useState(false);

  const [showBurgerMenuAbout, setShowBurgerMenuAbout] = useState(false);
  const [setShowBurgerMenuCommunity, setsetShowBurgerMenuCommunity] =
    useState(false);

  useEffect(() => {
    function handleResize() {
      setBurgerMenuOpen(false);
      setShowBurgerMenuAbout(false);
      setsetShowBurgerMenuCommunity(false);
      setShowBurgerMenuConnectOptions(false);
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function printBurgerMenu() {
    return (
      <div
        className={`${styles.burgerMenu} ${
          burgerMenuOpen ? styles.burgerMenuOpen : ""
        }`}>
        <span
          className={styles.burgerMenuClose}
          onClick={() => {
            setBurgerMenuOpen(false);
            setShowBurgerMenuAbout(false);
            setsetShowBurgerMenuCommunity(false);
            setShowBurgerMenuConnectOptions(false);
          }}>
          X
        </span>
        <Container className="text-center">
          <Row className="pt-5 pb-4">
            <Col>
              <Image
                className={styles.logoIcon}
                priority={true}
                src="/Seize_Logo_Glasses.png"
                alt="6539Seize"
                width={319}
                height={50}
              />
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3>
                <button
                  name="show menu"
                  className={
                    showBurgerMenuConnectOptions
                      ? styles.burgerMenuCaretClose
                      : styles.burgerMenuCaretOpen
                  }
                  onClick={() => {
                    setShowBurgerMenuConnectOptions(
                      !showBurgerMenuConnectOptions
                    );
                    setsetShowBurgerMenuCommunity(false);
                    setShowBurgerMenuAbout(false);
                  }}>
                  {isConnected ? (
                    <Address
                      address={address}
                      ens={null}
                      resolveEns={true}
                      hideCopy={true}
                      disableLink={true}
                    />
                  ) : (
                    "Connect"
                  )}
                </button>
              </h3>
            </Col>
            {showBurgerMenuConnectOptions && (
              <Container>
                <Row>
                  <Col xs={{ span: 6, offset: 3 }}>
                    <hr />
                  </Col>
                </Row>
                {isConnected ? (
                  <>
                    <h4
                      className="pt-3"
                      onClick={() =>
                        (window.location.href = `/${address as string}`)
                      }>
                      Profile
                    </h4>
                    <h4
                      className="pt-3"
                      onClick={() => {
                        disconnect();
                        setShowBurgerMenuConnectOptions(false);
                      }}>
                      Disconnect
                    </h4>
                  </>
                ) : (
                  connectors
                    .filter((a) => a.ready)
                    .map((connector) => (
                      <h4
                        onClick={() => {
                          connect({ connector });
                          setShowBurgerMenuConnectOptions(false);
                        }}
                        className="pt-3"
                        key={`${connector.name}-dropdown-item-burger-menu`}>
                        {connector.name}
                      </h4>
                    ))
                )}
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
                  setShowBurgerMenuConnectOptions(false);
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
                    <a href="/metrics">
                      <h3>Metrics</h3>
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
              <a href="/buidl">
                <h3>BUIDL</h3>
              </a>
            </Col>
          </Row>
          <Row className="pt-3 pb-3">
            <Col>
              <h3
                onClick={() => {
                  setShowBurgerMenuAbout(!showBurgerMenuAbout);
                  setShowBurgerMenuConnectOptions(false);
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
                    <a href="/about?section=the-memes">
                      <h3>The Memes</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/about?section=memes-calendar">
                      <h3>Memes Calendar</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/about?section=memes-faq">
                      <h3>Memes FAQ</h3>
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
                    <a href="/about?section=6529-gradient">
                      <h3>Gradient</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/about?section=gradients-faq">
                      <h3>Gradients FAQ</h3>
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
                    <a href="/about?section=mission">
                      <h3>Mission</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/about?section=release-notes">
                      <h3>Release Notes</h3>
                    </a>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <a href="/about?section=contact-us">
                      <h3>Contact Us</h3>
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
                  xs={{ span: 6 }}
                  sm={{ span: 4 }}
                  md={{ span: 2 }}
                  lg={{ span: 2 }}
                  className={`d-flex align-items-center justify-content-start ${styles.headerLeft}`}>
                  <a href="/">
                    <Image
                      className={styles.logoIcon}
                      priority={true}
                      src="/Seize_Logo_Glasses.png"
                      alt="6539Seize"
                      width={319}
                      height={50}
                    />
                  </a>
                </Col>
                <Col
                  xs={{ span: 6 }}
                  sm={{ span: 8 }}
                  md={{ span: 10 }}
                  lg={{ span: 10 }}
                  className={`d-flex align-items-center justify-content-end ${styles.headerRight}`}>
                  <Container>
                    <Navbar expand="lg" variant="dark">
                      <Container
                        className={`d-flex align-items-center justify-content-end`}>
                        <img
                          className={`${styles.logoIcon2} ${styles.burgerMenuBtn} d-block ${styles.dMdNone}`}
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
                                router.pathname == "/rememes" ? "active" : ""
                              }`}
                              href="/rememes">
                              ReMemes
                            </Nav.Link>
                            <NavDropdown
                              title="Community"
                              align={"start"}
                              className={`${styles.mainNavLink}`}>
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
                                  (window.location.href = "/metrics")
                                }>
                                Metrics
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href = "/downloads")
                                }>
                                Downloads
                              </NavDropdown.Item>
                            </NavDropdown>
                            <Nav.Link
                              className={`${styles.mainNavLink} ${
                                router.pathname == "/buidl" ? "active" : ""
                              }`}
                              href="/buidl">
                              BUIDL
                            </Nav.Link>
                            <NavDropdown
                              title="About"
                              className={`${styles.mainNavLink} ${
                                router.pathname.includes("/about")
                                  ? "active"
                                  : ""
                              }`}
                              align={"start"}>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/about?section=the-memes")
                                }>
                                The Memes
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/about?section=memes-calendar")
                                }>
                                Memes Calendar
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/about?section=memes-faq")
                                }>
                                Memes FAQ
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/about?section=6529-gradient")
                                }>
                                6529 Gradient
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/about?section=gradients-faq")
                                }>
                                Gradients FAQ
                              </NavDropdown.Item>
                              <NavDropdown.Divider />
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/about?section=mission")
                                }>
                                Mission
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/about?section=release-notes")
                                }>
                                Release Notes
                              </NavDropdown.Item>
                              <NavDropdown.Item
                                className={styles.dropdownItem}
                                onClick={() =>
                                  (window.location.href =
                                    "/about?section=contact-us")
                                }>
                                Contact Us
                              </NavDropdown.Item>
                            </NavDropdown>
                            {isConnected ? (
                              <NavDropdown
                                title={
                                  <Address
                                    address={address}
                                    ens={null}
                                    resolveEns={true}
                                    hideCopy={true}
                                    disableLink={true}
                                  />
                                }
                                className={`${styles.mainNavLink} ${
                                  router.pathname == "" ? "active" : ""
                                }`}
                                align={"start"}>
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
                                  key="disconnect-dropdown-item"
                                  className={styles.dropdownItem}
                                  onClick={() => disconnect()}>
                                  Disconnect
                                </NavDropdown.Item>
                              </NavDropdown>
                            ) : (
                              <NavDropdown
                                title="Connect"
                                className={`${styles.mainNavLink} ${styles.connectBtn} ${styles.fontBlack}`}
                                align={"start"}>
                                {connectors
                                  .filter((a) => a.ready)
                                  .map((connector) => (
                                    <NavDropdown.Item
                                      key={`${connector.name}-dropdown-item`}
                                      className={`${styles.dropdownItem}`}
                                      onClick={() => connect({ connector })}>
                                      {connector.name}
                                    </NavDropdown.Item>
                                  ))}
                              </NavDropdown>
                            )}
                          </Nav>
                        </Navbar>
                        <img
                          className={`${styles.logoIcon2} d-none ${styles.dMdBlock}`}
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
