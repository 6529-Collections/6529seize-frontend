"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { useSetTitle } from "@/contexts/TitleContext";
import useCapacitor from "@/hooks/useCapacitor";
import {
  BellIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

interface DownloadCardProps {
  readonly href: string;
  readonly title: string;
  readonly icon: ReactNode;
}

function DownloadCard({ href, title, icon }: DownloadCardProps) {
  return (
    <Link
      href={href}
      className="tw-group tw-relative tw-flex tw-items-center tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-gradient-to-br tw-from-iron-950 tw-to-iron-900/50 tw-px-6 tw-py-4 tw-h-24 tw-w-full sm:tw-max-w-2xl sm:tw-mx-auto tw-shadow-sm tw-shadow-black/20 tw-transition-all tw-duration-300 tw-ease-out tw-no-underline desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-shadow-lg desktop-hover:hover:tw-shadow-black/40 desktop-hover:hover:tw-translate-y-[-2px] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-500">
      <div className="tw-absolute tw-inset-0 tw-rounded-xl tw-bg-gradient-to-br tw-from-white/0 tw-to-white/0 tw-transition-opacity tw-duration-300 desktop-hover:group-hover:tw-from-white/5 desktop-hover:group-hover:tw-to-white/0" />
      <div className="tw-relative tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-text-white desktop-hover:group-hover:tw-scale-110 tw-transition-transform tw-duration-300">
        {icon}
      </div>
      <span className="tw-relative tw-text-lg tw-font-semibold tw-text-white tw-transition-colors tw-duration-300 desktop-hover:group-hover:tw-text-iron-100">
        {title}
      </span>
    </Link>
  );
}

export default function CommunityDownloads() {
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  useSetTitle("Open Data");

  const items = [
    {
      href: "/open-data/network-metrics",
      title: "Network Metrics",
      icon: <ChartBarIcon className="tw-w-full tw-h-full" />,
    },
    ...(!capacitor.isIos || country === "US"
      ? [
          {
            href: "/open-data/meme-subscriptions",
            title: "Meme Subscriptions",
            icon: <BellIcon className="tw-w-full tw-h-full" />,
          },
        ]
      : []),
    {
      href: "/open-data/rememes",
      title: "Rememes",
      icon: <SparklesIcon className="tw-w-full tw-h-full" />,
    },
    {
      href: "/open-data/team",
      title: "Team",
      icon: <UserGroupIcon className="tw-w-full tw-h-full" />,
    },
    {
      href: "/open-data/royalties",
      title: "Royalties",
      icon: <CurrencyDollarIcon className="tw-w-full tw-h-full" />,
    },
  ];

  return (
    <div className="tw-container tw-mx-auto tw-px-4 tw-py-4 sm:tw-px-6 lg:tw-px-8">
      <div className="tw-mb-12">
        <h1>Open Data</h1>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-4">
        {items.map((item) => (
          <DownloadCard
            key={item.href}
            href={item.href}
            title={item.title}
            icon={item.icon}
          />
        ))}
      </div>
    </div>
  );
}
