"use client";

import Footer from "@/components/footer/Footer";
import { usePathname } from "next/navigation";
import useDeviceInfo from "../../hooks/useDeviceInfo";

export default function FooterWrapper() {
  const { isApp } = useDeviceInfo();
  const pathname = usePathname();
  const myFeedRoutes = ["/my-feed"];
  const hideFooter =
    isApp ||
    myFeedRoutes.some((path) => pathname?.startsWith(path)) ||
    ["/waves", "/messages", "/notifications", "/open-mobile"].some((path) =>
      pathname?.startsWith(path)
    );

  if (hideFooter) return null;

  // 6529 Explained sets its text in four tones; the footer's links join
  // the lightest of them there rather than adding a fifth.
  const explained = ["/explained", "/network/tdh"].some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`)
  );

  return <Footer homeGallery={pathname === "/"} lightLinks={explained} />;
}
