"use client";

import { publicEnv } from "@/config/env";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Col, Container, Nav, Navbar, Row } from "react-bootstrap";
import { DBResponse } from "../../entities/IDBResponse";
import useIsMobileScreen from "../../hooks/isMobileScreen";
import useCapacitor from "../../hooks/useCapacitor";
import { fetchUrl } from "../../services/6529api";
import { useAppWallets } from "../app-wallets/AppWalletsContext";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { useCookieConsent } from "../cookies/CookieConsentContext";
import HeaderSearchButton from "./header-search/HeaderSearchButton";
import styles from "./Header.module.scss";
import HeaderDesktopNav from "./HeaderDesktopNav";
import HeaderLogo from "./HeaderLogo";
import HeaderMobileMenu from "./HeaderMobileMenu";
import HeaderNotifications from "./notifications/HeaderNotifications";
import HeaderOpenMobile from "./open-mobile/HeaderOpenMobile";
import HeaderShare from "./share/HeaderShare";
import HeaderUser from "./user/HeaderUser";

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
  const { country } = useCookieConsent();
  const { appWalletsSupported } = useAppWallets();
  const { address, seizeConnectOpen } = useSeizeConnectContext();

  const isMobile = useIsMobileScreen();

  const { showWaves } = useAuth();
  const pathname = usePathname();
  const [consolidations, setConsolidations] = useState<string[]>([]);
  const [burgerMenuOpen, setBurgerMenuOpen] = useState(false);

  const [showBurgerMenuCollections, setShowBurgerMenuCollections] =
    useState(false);
  const [showBurgerMenuAbout, setShowBurgerMenuAbout] = useState(false);
  const [showBurgerMenuCommunity, setShowBurgerMenuCommunity] = useState(false);
  const [showBurgerMenuTools, setShowBurgerMenuTools] = useState(false);
  const [showBurgerMenuBrain, setShowBurgerMenuBrain] = useState(false);

  let containerClassName = styles.mainContainer;
  let rowClassName = styles.headerRow;
  if (capacitor.isCapacitor) {
    containerClassName = styles.capacitorMainContainer;
    rowClassName = styles.capacitorHeaderRow;
  } else if (props.isSmall || isMobile) {
    containerClassName = styles.mainContainerSmall;
    rowClassName = styles.headerRowSmall;
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
    setShowBurgerMenuCollections(false);
    setBurgerMenuOpen(false);
    setShowBurgerMenuAbout(false);
    setShowBurgerMenuCommunity(false);
    setShowBurgerMenuTools(false);
    setShowBurgerMenuBrain(false);
  }, [pathname]);

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
      fetchUrl(`${publicEnv.API_ENDPOINT}/api/consolidations/${address}`).then(
        (response: DBResponse) => {
          if (!response.data) {
            setConsolidations([]);
            return;
          }
          setConsolidations(Array.from(response.data));
        }
      );
    } else {
      setConsolidations([]);
    }
  }, [address]);

  useEffect(() => {
    if (seizeConnectOpen) {
      setBurgerMenuOpen(false);
    }
  }, [seizeConnectOpen]);

  return (
    <>
      <HeaderMobileMenu
        burgerMenuOpen={burgerMenuOpen}
        setBurgerMenuOpen={setBurgerMenuOpen}
        showBurgerMenuCollections={showBurgerMenuCollections}
        setShowBurgerMenuCollections={setShowBurgerMenuCollections}
        showBurgerMenuAbout={showBurgerMenuAbout}
        setShowBurgerMenuAbout={setShowBurgerMenuAbout}
        showBurgerMenuCommunity={showBurgerMenuCommunity}
        setShowBurgerMenuCommunity={setShowBurgerMenuCommunity}
        showBurgerMenuTools={showBurgerMenuTools}
        setShowBurgerMenuTools={setShowBurgerMenuTools}
        showBurgerMenuBrain={showBurgerMenuBrain}
        setShowBurgerMenuBrain={setShowBurgerMenuBrain}
        isSmall={props.isSmall}
        isCapacitor={capacitor.isCapacitor}
        isMobile={isMobile}
        showWaves={showWaves}
        appWalletsSupported={appWalletsSupported}
        capacitorIsIos={capacitor.isIos}
        country={country}
      />
      <Container fluid className={`${containerClassName} ${props.extraClass}`}>
        <Row>
          <Col>
            <Container className={styles.rowContainer}>
              <Row className={rowClassName}>
                <Col
                  xs={{ span: 8 }}
                  sm={{ span: 8 }}
                  md={{ span: 8 }}
                  lg={{ span: 3 }}
                  xl={{ span: 2 }}
                  xxl={{ span: 3 }}
                  className={`d-flex align-items-center justify-content-start`}>
                  <HeaderLogo
                    isSmall={props.isSmall}
                    isCapacitor={capacitor.isCapacitor}
                    isMobile={isMobile}
                  />
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
                        <div className={styles.dMdNone}>
                          <div className="d-flex align-items-center">
                            <div className="tw-inline-flex tw-space-x-3 tw-mr-3">
                              <HeaderOpenMobile />
                              {showWaves && <HeaderNotifications />}
                              <HeaderSearchButton />
                            </div>
                            <button
                              type="button"
                              aria-label="Menu"
                              title="Menu"
                              onClick={() => setBurgerMenuOpen(true)}
                              className="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-h-10 tw-w-10 tw-border-0 tw-text-iron-300 hover:tw-text-iron-50 tw-shadow-sm hover:tw-bg-iron-700 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 tw-transition tw-duration-300 tw-ease-out">
                              <FontAwesomeIcon icon={faBars} height={20} />
                            </button>
                          </div>
                        </div>
                        <Navbar
                          id="seize-navbar-nav"
                          className={`tw-hidden ${styles.dMdBlock}`}>
                          <Nav className="ml-auto">
                            <HeaderDesktopNav
                              showWaves={showWaves}
                              appWalletsSupported={appWalletsSupported}
                              capacitorIsIos={capacitor.isIos}
                              country={country}
                              pathname={pathname ?? undefined}
                            />
                            <HeaderUser />
                            {showWaves && <HeaderNotifications />}
                            <HeaderShare />
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
