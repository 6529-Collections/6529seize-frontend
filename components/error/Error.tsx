"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useTitle } from "@/contexts/TitleContext";

export default function ErrorComponent() {
  const { setTitle } = useTitle();
  useEffect(() => {
    setTitle("6529 Error");
  }, []);

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-screen">
      <Image
        width="0"
        height="0"
        style={{ height: "auto", width: "100px" }}
        src="/SummerGlasses.svg"
        alt="SummerGlasses"
      />
      <div className="tw-flex tw-flex-wrap tw-gap-1 tw-px-4 tw-items-flex-start tw-justify-center">
        <h3>Welcome to the 6529 Page of Doom</h3>
        <img
          src="/emojis/sgt_grimacing.webp"
          alt="sgt_grimacing"
          className="tw-ml-0.5 tw-w-8 tw-h-8"
        />
      </div>
      <p className="tw-mt-2 tw-text-center tw-text-lg tw-font-semibold tw-px-4">
        Looks like something went wrong. Try again or reach out to us at{" "}
        <a href="mailto:support@6529.io">support@6529.io</a>
      </p>
      <a href="/" className="tw-mt-4 tw-text-md tw-font-semibold">
        TAKE ME HOME
      </a>
    </div>
  );
}
