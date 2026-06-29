import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import CommunityStatsComponent from "@/components/communityStats/CommunityStats";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import { Col, Container, Row } from "react-bootstrap";

export default function CommunityStatsPage() {
  return (
    <main className={styles["main"]}>
      <Container fluid>
        <Row>
          <Col>
            <Container className="no-padding">
              <Row>
                <Col>
                  <div className="tailwind-scope">
                    <AboutContentsDropdown currentHref="/network/health/network-tdh" />
                  </div>
                  <CommunityStatsComponent />
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </main>
  );
}

export const generateMetadata = () => {
  return getAppMetadata({
    title: "Stats",
    description: "Network",
  });
};
