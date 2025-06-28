"use client";

import styles from "./NotFound.module.scss";
import Image from "next/image";
import { useEffect } from "react";
import { useTitle } from "@/contexts/TitleContext";

export default function NotFound() {
  const { setTitle } = useTitle();
  useEffect(() => {
    setTitle("404 - NOT FOUND");
  }, []);

  return (
    <div className={styles.pageNotFound}>
      <Image
        width="0"
        height="0"
        style={{ height: "auto", width: "100px" }}
        src="/SummerGlasses.svg"
        alt="SummerGlasses"
      />
      <h2>404 | PAGE NOT FOUND</h2>
      <a href="/" className="pt-3">
        TAKE ME HOME
      </a>
    </div>
  );
}
