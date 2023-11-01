import { Col, Row } from "react-bootstrap";
import styles from "./UserPage.module.scss";
import Tippy from "@tippyjs/react";
import { truncateTextMiddle } from "../../helpers/AllowlistToolHelpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { removeProtocol } from "../../helpers/Helpers";
import Image from "next/image";
import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../entities/IProfile";

export default function UserPageLinks({
  user,
  userAddress,
  activeAddress,
  profile,
}: {
  user: string;
  userAddress: string;
  activeAddress: string | null;
  profile: IProfileAndConsolidations;
}) {
  const [ownerLinkCopied, setIsOwnerLinkCopied] = useState(false);
  const [ownerLink, setOwnerLink] = useState("");

  useEffect(() => {
    let oLink = process.env.BASE_ENDPOINT
      ? process.env.BASE_ENDPOINT
      : "https://seize.io";

    if (profile.profile?.handle) {
      oLink += `/${profile.profile.handle}`;
    } else {
      oLink += `/${user}`;
    }

    if (activeAddress) {
      const activeAddressEns = profile.consolidation.wallets.find(
        (w) => w.wallet.address.toLowerCase() === activeAddress.toLowerCase()
      )?.wallet.ens;
      oLink += `?address=${activeAddressEns ?? activeAddress}`;
    }

    setOwnerLink(oLink);
  }, [user, profile, activeAddress]);

  return (
    <Col xs={12} sm={6} className={`pt-2 pb-2 ${styles.linksContainer}`}>
      <Row className="pb-2">
        <Col>
          <Tippy
            content={ownerLinkCopied ? "Copied" : "Copy"}
            placement={"right"}
            theme={"light"}
            hideOnClick={false}
          >
            <span
              className={styles.ownerLink}
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(ownerLink);
                }
                setIsOwnerLinkCopied(true);
                setTimeout(() => {
                  setIsOwnerLinkCopied(false);
                }, 1000);
              }}
            >
              {truncateTextMiddle(removeProtocol(ownerLink), 50)}{" "}
              <FontAwesomeIcon icon="link" className={styles.ownerLinkIcon} />
            </span>
          </Tippy>
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <span className="pt-3">
            <a
              href={`https://opensea.io/${userAddress}`}
              target="_blank"
              rel="noreferrer"
            >
              <Image
                className={styles.marketplace}
                src="/opensea.png"
                alt="opensea"
                width={40}
                height={40}
              />
            </a>
            <a
              href={`https://x2y2.io/user/${userAddress}`}
              target="_blank"
              rel="noreferrer"
            >
              <Image
                className={styles.marketplace}
                src="/x2y2.png"
                alt="x2y2"
                width={40}
                height={40}
              />
            </a>
            {profile.profile?.website && (
              <a
                href={profile.profile.website}
                target="_blank"
                rel="noreferrer"
              >
                <FontAwesomeIcon icon="globe" className={styles.marketplace} />
              </a>
            )}
          </span>
        </Col>
      </Row>
    </Col>
  );
}
