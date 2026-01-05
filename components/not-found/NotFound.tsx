"use client";

import { useTitle } from "@/contexts/TitleContext";
import Image from "next/image";
import { useEffect } from "react";

export default function NotFound({ label }: { readonly label?: string | undefined }) {
  let titleLabel;
  if (label) {
    titleLabel = label.toUpperCase();
  } else {
    titleLabel = "PAGE";
  }

  titleLabel = `404 | ${titleLabel} NOT FOUND`;

  const { setTitle } = useTitle();

  useEffect(() => {
    setTitle(titleLabel);
  }, [titleLabel, setTitle]);

  return (
    <section className="tw-w-full tw-h-full tw-min-h-screen tw-flex tw-justify-center tw-items-center">
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
        <Image
          unoptimized
          priority
          loading="eager"
          width="0"
          height="0"
          style={{ height: "auto", width: "100px" }}
          src="/SummerGlasses.svg"
          alt="SummerGlasses"
        />
        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-items-center tw-justify-center">
          <h3 className="tw-text-2xl tw-font-semibold">{titleLabel}</h3>
          <img
            src="/emojis/sgt_flushed.webp"
            alt="sgt_flushed"
            className="tw-w-8 tw-h-8"
          />
        </div>
        <p className="tw-text-center tw-font-medium md:tw-text-lg tw-text-gray-200">
          The {label ? `${label.toLowerCase()} or ` : ""}page you're looking for
          doesn't exist or has been moved.
        </p>
      </div>
    </section>
  );
}
