"use client";

import { LockClosedIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DropForgeNoPower() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    if (seconds === 1) {
      const t = setTimeout(() => router.replace("/"), 1000);
      return () => clearTimeout(t);
    }
    if (seconds > 1) {
      const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [seconds, router]);

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-py-12 tw-text-center">
      <LockClosedIcon className="tw-h-[100px] tw-w-[100px] tw-flex-shrink-0 tw-text-iron-500" />
      <b className="tw-text-lg tw-text-iron-200">You have no power here</b>
      <p className="tw-text-base tw-text-iron-500">Redirecting in {seconds}</p>
    </div>
  );
}
