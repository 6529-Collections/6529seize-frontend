"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useTitle } from "@/contexts/TitleContext";

export default function NotFound() {
  const { setTitle } = useTitle();
  useEffect(() => {
    setTitle("404 - NOT FOUND");
  }, []);

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-start tw-pt-[100px]">
      <Image
        unoptimized
        width="0"
        height="0"
        style={{ height: "auto", width: "100px" }}
        src="/SummerGlasses.svg"
        alt="SummerGlasses"
      />
      <div className="tw-flex tw-flex-wrap tw-gap-1 tw-px-4 tw-items-flex-start tw-justify-center">
        <h3>404 | PAGE NOT FOUND</h3>
        <img
          src="/emojis/sgt_flushed.webp"
          alt="sgt_flushed"
          className="tw-ml-0.5 tw-w-8 tw-h-8"
        />
      </div>
      <a href="/" className="tw-mt-4 tw-text-md tw-font-semibold">
        TAKE ME HOME
      </a>
    </div>
  );
}
