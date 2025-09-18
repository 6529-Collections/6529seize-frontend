"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";

interface Collection {
  id: string;
  name: string;
  href: string;
  description?: string;
}

interface CollectionsSubmenuProps {
  isOpen: boolean;
  sidebarCollapsed: boolean;
  onClose?: () => void;
}

const collections: Collection[] = [
  {
    id: "memes",
    name: "The Memes",
    href: "/the-memes",
    description: "The complete Memes collection",
  },
  {
    id: "6529gradient",
    name: "6529 Gradient",
    href: "/6529-gradient",
    description: "6529 Gradient collection",
  },
  {
    id: "nextgen",
    name: "NextGen",
    href: "/nextgen",
    description: "NextGen art collection",
  },
  {
    id: "memelab",
    name: "Meme Lab",
    href: "/meme-lab",
    description: "Experimental Meme Lab collection",
  },
  {
    id: "rememes",
    name: "ReMemes",
    href: "/rememes",
    description: "ReMemes collection",
  },
];

function CollectionsSubmenu({
  isOpen,
  sidebarCollapsed,
  onClose,
}: CollectionsSubmenuProps) {
  const pathname = usePathname();
  const [activeCollection, setActiveCollection] = useState<string>("memes");

  const currentCollection = collections.find((col) => pathname?.startsWith(col.href));

  const handleCollectionClick = (collection: Collection) => {
    setActiveCollection(collection.id);
    // Persist only the base collection route for future nav from main icon
    safeLocalStorage.setItem("lastCollectionBase", collection.href);
  };

  useEffect(() => {
    // Set active collection based on current pathname
    if (currentCollection) {
      setActiveCollection(currentCollection.id);
    } else if (isOpen) {
      // Default to memes when submenu opens
      setActiveCollection("memes");
    }
  }, [currentCollection, isOpen]);


  if (!isOpen) return null;

  return (
    <aside
      className={`tw-fixed tw-top-0 tw-bottom-0 tw-w-64 tw-bg-iron-950 tw-border-r tw-border-iron-800 tw-z-40 tw-shadow-xl tw-transition-all tw-duration-300 ${
        sidebarCollapsed ? "tw-left-16" : "tw-left-72"
      }`}
      role="complementary"
      aria-label="Collections submenu"
      id="collections-submenu"
    >
      {/* Header */}
      <header className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-b tw-border-iron-800">
        <span className="tw-text-white tw-font-semibold tw-text-xl tw-tracking-tight">
          Collections
        </span>
        <button
          onClick={onClose}
          className="tw-group tw-size-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800/85 tw-border tw-border-iron-700/70 tw-border-solid tw-backdrop-blur-sm tw-transition-all tw-duration-200 tw-shadow-[0_10px_24px_rgba(0,0,0,0.45)] desktop-hover:hover:tw-bg-iron-700/95 desktop-hover:hover:tw-border-iron-500/70 desktop-hover:hover:tw-shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
          title="Close collections menu"
          aria-label="Close collections menu"
          type="button"
        >
          <XMarkIcon
            className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-200 group-hover:tw-text-white tw-transition-transform tw-duration-200"
            aria-hidden="true"
          />
        </button>
      </header>

      {/* Collections List */}
      <nav className="tw-px-3 tw-py-4" aria-label="Collections navigation">
        <ul className="tw-space-y-1 tw-list-none tw-pl-0" role="list">
          {collections.map((collection) => (
            <li key={collection.id} role="listitem">
              <Link
                href={collection.href}
                onClick={() => handleCollectionClick(collection)}
                className={`tw-flex tw-items-center tw-px-3 tw-py-2.5 tw-border-solid tw-border-r-0 tw-border-y-0 tw-transition-all tw-duration-200 tw-no-underline tw-focus:tw-outline-none tw-focus:tw-ring-2 tw-focus:tw-ring-primary-400 tw-focus:tw-ring-offset-2 tw-focus:tw-ring-offset-iron-900 ${
                  activeCollection === collection.id
                    ? "tw-text-white tw-border-l-2 tw-border-white"
                    : "tw-text-iron-500 hover:tw-text-white tw-border-l-2 tw-border-transparent"
                }`}
                aria-current={activeCollection === collection.id ? "page" : undefined}
              >
                <span className="tw-font-medium">{collection.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default memo(CollectionsSubmenu);
