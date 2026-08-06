"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.css";
import Image from "next/image";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
  CONTENT_PAGE_MAIN_CLASS,
  CONTENT_PAGE_TITLE_CLASS,
} from "@/components/about/AboutLayout";

export default function BuidlPage() {
  useSetTitle("BUIDL");

  return (
    <main className={`${styles["main"]} ${CONTENT_PAGE_MAIN_CLASS}`}>
      <Container fluid className="tw-px-5 tw-py-16 sm:tw-px-6 lg:tw-px-8">
        <Row className="tw-min-h-[calc(100vh-8rem)] tw-items-center">
          <Col className="tw-text-center">
            <header className="tw-mx-auto tw-flex tw-max-w-3xl tw-flex-col tw-items-center">
              <Image
                unoptimized
                src="/SummerGlasses.svg"
                width={100}
                height={100}
                alt="SummerGlasses"
              />
              <h1 className={`${CONTENT_PAGE_TITLE_CLASS} tw-mb-4 tw-mt-6`}>
                We are going to BUIDL together to spread the word about a
                decentralized metaverse.
              </h1>
              <p className="tw-mb-0 tw-text-base tw-leading-7 tw-text-iron-300">
                Tools to help in this goal are coming soon.
              </p>
            </header>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
