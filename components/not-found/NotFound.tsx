"use client";

import styles from "./NotFound.module.scss";
import Image from "next/image";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/components/auth/Auth";

export default function NotFound() {
  const { setTitle } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "404 - NOT FOUND",
    });
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
