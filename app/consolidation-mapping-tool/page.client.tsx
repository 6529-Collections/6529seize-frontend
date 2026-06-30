"use client";

import ConsolidationMappingTool from "@/components/mapping-tools/ConsolidationMappingTool";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";
import { useEffect, useState } from "react";

const containerClass =
  "tw-mx-auto tw-w-full tw-px-3 sm:tw-max-w-[540px] md:tw-max-w-[720px] lg:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]";
const rowClass = "tw-flex tw-flex-wrap -tw-mx-3";
const wideColumnClass =
  "tw-w-full tw-px-3 md:tw-ml-[8.333333%] md:tw-w-10/12 lg:tw-ml-[16.666667%] lg:tw-w-8/12";
const narrowColumnClass =
  "tw-w-full tw-px-3 sm:tw-ml-[8.333333%] sm:tw-w-10/12 md:tw-ml-[16.666667%] md:tw-w-8/12 lg:tw-ml-[25%] lg:tw-w-6/12";

export default function ConsolidationMappingToolPage() {
  useSetTitle("Consolidation Mapping Tool | Tools");

  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch(
      "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/consolidation-mapping-tool/how-to-use.html"
    ).then((response) => {
      if (response.status === 200) {
        response.text().then((htmlText) => {
          setHtml(htmlText);
        });
      }
    });
  }, []);

  return (
    <main className={`${styles["main"]} tailwind-scope`}>
      <div className="tw-w-full tw-px-3">
        <div className={containerClass}>
          <div className={`${rowClass} tw-pt-4`}>
            <div className={wideColumnClass}>
              <h1 className="tw-text-center">Consolidation Mapping Tool</h1>
            </div>
          </div>
          <div className={`${rowClass} tw-pt-2`}>
            <div className={wideColumnClass}>
              <h5>Overview</h5>
            </div>
          </div>
          <div className={rowClass}>
            <div className={wideColumnClass}>
              The Consolidation Mapping tool allows anyone to easily upload a
              CSV file with addresses and balances to receive consolidated
              addresses in return (from the NFTDelegation contract).{" "}
              <a href="#how-to-use">How to use this tool?</a>
            </div>
          </div>
          <div className={rowClass}>
            <div className={narrowColumnClass}>
              <div className="tw-py-5">
                <ConsolidationMappingTool />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="how-to-use" className={`${containerClass} tw-pt-1 tw-pb-5`}>
        <div className={rowClass}>
          <div
            className={`${styles["htmlContainer"]} ${narrowColumnClass}`}
            dangerouslySetInnerHTML={{
              __html: html,
            }}></div>
        </div>
      </div>
    </main>
  );
}
