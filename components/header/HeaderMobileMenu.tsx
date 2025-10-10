"use client";

import { AboutSection } from "@/enums";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Container, Row } from "react-bootstrap";
import styles from "./Header.module.scss";
import HeaderLogo from "./HeaderLogo";
import {
  printMobileHr,
  printMobileRow,
  printMobileSubheader,
} from "./HeaderMobileUtils";
import HeaderQRScanner from "./share/HeaderQRScanner";
import HeaderUser from "./user/HeaderUser";

interface HeaderMobileMenuProps {
  readonly burgerMenuOpen: boolean;
  readonly setBurgerMenuOpen: (open: boolean) => void;
  readonly showBurgerMenuCollections: boolean;
  readonly setShowBurgerMenuCollections: (show: boolean) => void;
  readonly showBurgerMenuAbout: boolean;
  readonly setShowBurgerMenuAbout: (show: boolean) => void;
  readonly showBurgerMenuCommunity: boolean;
  readonly setShowBurgerMenuCommunity: (show: boolean) => void;
  readonly showBurgerMenuTools: boolean;
  readonly setShowBurgerMenuTools: (show: boolean) => void;
  readonly showBurgerMenuBrain: boolean;
  readonly setShowBurgerMenuBrain: (show: boolean) => void;
  readonly isSmall?: boolean;
  readonly isCapacitor: boolean;
  readonly isMobile: boolean;
  readonly showWaves: boolean;
  readonly appWalletsSupported: boolean;
  readonly capacitorIsIos: boolean;
  readonly country: string;
}

export default function HeaderMobileMenu({
  burgerMenuOpen,
  setBurgerMenuOpen,
  showBurgerMenuCollections,
  setShowBurgerMenuCollections,
  showBurgerMenuAbout,
  setShowBurgerMenuAbout,
  showBurgerMenuCommunity,
  setShowBurgerMenuCommunity,
  showBurgerMenuTools,
  setShowBurgerMenuTools,
  showBurgerMenuBrain,
  setShowBurgerMenuBrain,
  isSmall,
  isCapacitor,
  isMobile,
  showWaves,
  appWalletsSupported,
  capacitorIsIos,
  country,
}: HeaderMobileMenuProps) {
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
              icon={faTimesCircle}
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
            <HeaderLogo
              isSmall={isSmall}
              isCapacitor={isCapacitor}
              isMobile={isMobile}
            />
          </Col>
        </Row>
        <Row className="pt-4 pb-3">
          <Col>
            <h3
              className={`d-flex justify-content-center gap-2 ${styles.burgerMenuHeader}`}>
              <HeaderUser />
              <HeaderQRScanner
                onScanSuccess={() => {
                  setBurgerMenuOpen(false);
                }}
              />
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
                {printMobileRow("My Stream", "/?tab=feed")}
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
              {printMobileRow("Memes Calendar", "/meme-calendar")}
              {printMobileRow("TDH", "/network/tdh")}
              {printMobileHr()}
              {printMobileSubheader("Metrics")}
              {printMobileRow("Definitions", "/network/definitions")}
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
              {appWalletsSupported && (
                <>
                  {printMobileHr()}
                  {printMobileRow("App Wallets", "/tools/app-wallets")}
                </>
              )}
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
              {printMobileRow("Delegation FAQs", "/delegation/delegation-faq")}
              {printMobileRow(
                "Consolidation Use Cases",
                "/delegation/consolidation-use-cases"
              )}
              {printMobileRow("Wallet Checker", "/delegation/wallet-checker")}
              {printMobileHr()}
              {printMobileSubheader("The Memes Tools")}
              {(!capacitorIsIos || country === "US") && (
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
              {printMobileRow("API", "/tools/api")}
              {printMobileRow("EMMA", "/emma")}
              {printMobileRow("Block Finder", "/tools/block-finder")}
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
              {(!capacitorIsIos || country === "US") && (
                <>
                  {printMobileRow(
                    "Subscriptions",
                    `/about/${AboutSection.SUBSCRIPTIONS}`
                  )}
                </>
              )}
              {printMobileRow("Minting", `/about/${AboutSection.MINTING}`)}
              {printMobileRow(
                "Nakamoto Threshold",
                `/about/${AboutSection.NAKAMOTO_THRESHOLD}`
              )}
              {printMobileRow("Meme Lab", `/about/${AboutSection.MEME_LAB}`)}
              {printMobileRow("Gradients", `/about/${AboutSection.GRADIENTS}`)}
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
              {printMobileSubheader("6529 Capital")}
              {printMobileRow("About 6529 Capital", `/capital`)}
              {printMobileRow(
                "Company Portfolio",
                `/capital/company-portfolio`
              )}
              {printMobileRow("NFT Fund", `/capital/fund`)}
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
