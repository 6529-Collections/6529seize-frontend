"use client";

import Footer from "@/components/footer/Footer";
import { usePathname } from "next/navigation";
import useDeviceInfo from "../../hooks/useDeviceInfo";

export default function FooterWrapper() {
  const { isApp } = useDeviceInfo();
  const pathname = usePathname();
  const myFeedRoutes = ["/my-feed", "/feed"];
  const hideFooter =
    isApp ||
    myFeedRoutes.some((path) => pathname?.startsWith(path)) ||
    ["/waves", "/messages", "/notifications", "/open-mobile"].some((path) =>
      pathname?.startsWith(path)
    );

  if (hideFooter) return null;

  return <Footer />;
}
