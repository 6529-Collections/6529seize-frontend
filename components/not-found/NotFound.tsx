"use client";

import { useTitle } from "@/contexts/TitleContext";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function NotFound({ label }: { readonly label?: string }) {
  const { setTitle } = useTitle();
  useEffect(() => {
    const title = `404 - ${label?.toUpperCase() ?? "PAGE"} NOT FOUND`;
    setTitle(title);
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
        <h3>404 | {label?.toUpperCase() ?? "PAGE"} NOT FOUND</h3>
        <img
          src="/emojis/sgt_flushed.webp"
          alt="sgt_flushed"
          className="tw-ml-0.5 tw-w-8 tw-h-8"
        />
      </div>
      <Link href="/" className="tw-mt-4 tw-text-md tw-font-semibold">
        TAKE ME HOME
      </Link>
    </div>
  );
}
