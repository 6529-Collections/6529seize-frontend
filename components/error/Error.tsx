"use client";

import { useTitle } from "@/contexts/TitleContext";
import { faArrowLeft, faHome } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "react-bootstrap";

export default function ErrorComponent() {
  const { setTitle } = useTitle();
  const router = useRouter();

  useEffect(() => {
    setTitle("6529 Error");
  }, [setTitle]);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-screen">
      <Image
        unoptimized
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
      <Button
        variant="outline-light"
        onClick={() => handleGoBack()}
        className="tw-mt-4 tw-flex tw-items-center tw-gap-x-2">
        <FontAwesomeIcon icon={faArrowLeft} />
        <span>BACK TO PREVIOUS PAGE</span>
      </Button>
      <Link
        href="/"
        className="decoration-none tw-mt-5 tw-text-lg tw-font-semibold tw-flex tw-items-center tw-gap-x-2">
        <FontAwesomeIcon icon={faHome} />
        <span>6529 HOME</span>
      </Link>
    </div>
  );
}
