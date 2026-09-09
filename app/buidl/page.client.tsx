"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.css";
import clsx from "clsx";
import Image from "next/image";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
  ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME,
  CONTENT_PAGE_MAIN_CLASS,
} from "@/components/about/AboutLayout";

export default function BuidlPage() {
  useSetTitle("BUIDL");

  return (
    <main className={clsx(styles["main"], CONTENT_PAGE_MAIN_CLASS)}>
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
              <div className="tw-mt-6">
                <h1 className={ABOUT_DOCUMENTATION_PAGE_TITLE_CLASS_NAME}>
                  We are going to BUIDL together to spread the word about a
                  decentralized metaverse.
                </h1>
              </div>
              <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
                Tools to help in this goal are coming soon.
              </p>
            </header>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
