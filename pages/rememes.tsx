import Head from "next/head";
import styles from "../styles/Home.module.scss";
import Image from "next/image";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { Container, Row, Col } from "react-bootstrap";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function ReMemes() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "ReMemes" },
  ]);

  return (
    <>
      <Head>
        <title>ReMemes | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="ReMemes | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/rememes`}
        />
        <meta property="og:title" content="ReMemes" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={`${styles.main}`}>
          <Row>
            <Col>
              <Container>
                <Row className="d-flex align-items-center pt-4">
                  <Col>
                    <h1>ReMemes</h1>
                  </Col>
                </Row>
                <Row>
                  <Col
                    className="text-center pt-2 pb-2"
                    xs={{ span: 12 }}
                    sm={{ span: 12 }}
                    md={{ span: 3 }}
                    lg={{ span: 3 }}>
                    <Image
                      loading={"lazy"}
                      width="0"
                      height="0"
                      style={{
                        height: "auto",
                        width: "auto",
                        maxHeight: "350px",
                        maxWidth: "100%",
                      }}
                      src="/re-memes-w.jpeg"
                      alt="ReMemes"
                    />
                  </Col>
                  <Col className="pt-2 pb-2">
                    <p>
                      The ReMemes are the heart of The Memes community and core
                      to the mission.
                    </p>
                    <p>
                      The Meme Cards are CC0, which means that anyone can use
                      them to make derivative works (the &quot;ReMemes&quot;).
                    </p>
                    <p>
                      The ReMemes come in all styles, shapes and sizes, from
                      direct copies of The Memes to highly inventive and complex
                      work. The ReMemes are sold / minted by their creators in a
                      wide variety of formats, at different price points, with
                      different distribution methods, on their own contracts.
                      There are no &quot;official&quot; or &quot;approved&quot;
                      ReMemes. You do not need permission to make a ReMeme. We
                      love hearing about ReMemes but that is different than
                      seeking permission.
                    </p>
                    <p>
                      We believe that in the medium to long-term, the ReMemes
                      will be the most important carriers of the mission. If we
                      want to reach 100M people, we need to spread all types of
                      messages in all types of communities, across the world.
                      This can only be done by a network, this can only be done
                      by the ReMemers.
                    </p>
                    <p>
                      You do not need to own a Meme Card to make a ReMeme or buy
                      a ReMeme. Each ReMemer is operating completely
                      independently, they are kindred spirits on this mission.
                    </p>
                    <p>
                      We are currently working to support the ReMemes community
                      in two ways:
                    </p>
                    <ol>
                      <li>
                        We hope to make available (within Q1 2023) the tools we
                        use for allowlists and airdrops. They are not
                        user-friendly right now so we will put a web interface
                        on them so anyone can easily create their desired
                        distribution plan.
                      </li>

                      <li>
                        We would love an on-chain registry of ReMemes so we can
                        display them here and also others can display them
                        wherever they want. Our concern is how to manage
                        malicious contracts (the registry is otherwise trivial),
                        so we are open to ideas - we do not want a malicious
                        contract suddenly appearing here.
                      </li>
                    </ol>
                    <p>
                      Will we display ReMemes here? Yes, I hope so, once we
                      solve #2 in a safe way.
                    </p>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
