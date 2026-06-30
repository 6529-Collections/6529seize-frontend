"use client";

import {
  delegationContainerClass,
  delegationNarrowColumnClass,
  delegationRowClass,
  delegationWideColumnClass,
} from "@/components/delegation/delegation-tailwind-classes";
import DelegationMappingTool from "@/components/mapping-tools/DelegationMappingTool";
import { useSetTitle } from "@/contexts/TitleContext";
import styles from "@/styles/Home.module.scss";
import { useEffect, useState } from "react";

export default function DelegationMappingToolPage() {
  useSetTitle("Delegation Mapping Tool | Tools");

  const [html, setHtml] = useState("");

  useEffect(() => {
    fetch(
      "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegation-mapping-tool/how-to-use.html"
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
        <div className={delegationContainerClass}>
          <div className={`${delegationRowClass} tw-pt-4`}>
            <div className={delegationWideColumnClass}>
              <h1 className="tw-text-center">Delegation Mapping Tool</h1>
            </div>
          </div>
          <div className={`${delegationRowClass} tw-pt-2`}>
            <div className={delegationWideColumnClass}>
              <h5>Overview</h5>
            </div>
          </div>
          <div className={delegationRowClass}>
            <div className={delegationWideColumnClass}>
              The Delegation Mapping tool allows anyone to easily upload a CSV
              file with addresses to receive delegated addresses in return (from
              the NFTDelegation contract).{" "}
              <a href="#how-to-use">How to use this tool?</a>
            </div>
          </div>
          <div className={delegationRowClass}>
            <div className={delegationNarrowColumnClass}>
              <div className="tw-py-5">
                <DelegationMappingTool />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        id="how-to-use"
        className={`${delegationContainerClass} tw-pt-1 tw-pb-5`}
      >
        <div className={delegationRowClass}>
          <div
            className={`${styles["htmlContainer"]} ${delegationNarrowColumnClass}`}
            dangerouslySetInnerHTML={{
              __html: html,
            }}></div>
        </div>
      </div>
    </main>
  );
}
