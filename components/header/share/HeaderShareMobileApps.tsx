import { MOBILE_APP_IOS, MOBILE_APP_ANDROID } from "@/constants";
import Image from "next/image";
import Link from "next/link";

export function ShareMobileApp({
  platform,
  target = "_blank",
}: {
  readonly platform: "ios" | "android";
  readonly target?: "_blank" | "_self";
}) {
  const appUrl = platform === "ios" ? MOBILE_APP_IOS : MOBILE_APP_ANDROID;
  const imageSrc = platform === "ios" ? "/app-store.png" : "/play-store.png";
  const altText =
    platform === "ios" ? "6529 Mobile iOS" : "6529 Mobile Android";

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (target === "_self") {
      e.preventDefault();
      // Force a top-level redirect to avoid Play Store errors
      if (typeof window !== "undefined" && window.top) {
        window.top.location.href = appUrl;
      }
    }
  };

  return (
    <Link
      href={appUrl}
      target={target}
      rel="noopener noreferrer"
      onClick={handleClick}
      className="decoration-none tw-flex tw-flex-col tw-items-center tw-gap-8"
    >
      <Image
        unoptimized
        priority
        loading="eager"
        src={imageSrc}
        alt={altText}
        width={200}
        height={60}
        placeholder="empty"
        className="hover:tw-scale-[1.03] tw-transition-all tw-duration-300 tw-ease-out"
      />
    </Link>
  );
}
