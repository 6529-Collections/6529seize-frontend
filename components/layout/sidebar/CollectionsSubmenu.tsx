"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

interface Collection {
  id: string;
  name: string;
  href: string;
  description?: string;
}

interface CollectionsSubmenuProps {
  isOpen: boolean;
  sidebarCollapsed: boolean;
}

// Memoized collections array to prevent unnecessary re-renders
const collections: Collection[] = [
  {
    id: "memes",
    name: "The Memes",
    href: "/the-memes",
    description: "The complete Memes collection",
  },
  {
    id: "memelab",
    name: "Meme Lab",
    href: "/meme-lab",
    description: "Experimental Meme Lab collection",
  },
  {
    id: "gradients",
    name: "Gradients",
    href: "/gradients",
    description: "Gradients collection",
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
];

function CollectionsSubmenu({
  isOpen,
  sidebarCollapsed,
}: CollectionsSubmenuProps) {
  const pathname = usePathname();
  const [activeCollection, setActiveCollection] = useState<string>("memes");

  // Memoize the current collection for performance
  const currentCollection = useMemo(() => {
    return collections.find((col) => pathname?.startsWith(col.href));
  }, [pathname]);

  // Optimize collection click handler
  const handleCollectionClick = useCallback((collectionId: string) => {
    setActiveCollection(collectionId);
  }, []);

  useEffect(() => {
    // Set active collection based on current pathname
    if (currentCollection) {
      setActiveCollection(currentCollection.id);
    } else if (isOpen) {
      // Default to memes when submenu opens
      setActiveCollection("memes");
    }
  }, [currentCollection, isOpen]);

  // Calculate positioning based on sidebar state
  const submenuPositioning = useMemo(() => {
    const baseClasses = "tw-fixed tw-top-0 tw-bottom-0 tw-w-64 tw-bg-iron-900 tw-border-r tw-border-iron-800 tw-z-40 tw-shadow-xl tw-transition-all tw-duration-300";
    const leftPosition = sidebarCollapsed ? 'tw-left-16' : 'tw-left-16 lg:tw-left-80';
    return `${baseClasses} ${leftPosition}`;
  }, [sidebarCollapsed]);

  if (!isOpen) return null;

  return (
    <aside 
      className={submenuPositioning}
      role="complementary"
      aria-label="Collections submenu"
      id="collections-submenu"
    >
      {/* Header */}
      <header className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-4 tw-border-b tw-border-iron-800">
        <h2 className="tw-text-white tw-font-semibold tw-text-lg">
          Collections
        </h2>
        <button
          onClick={onExpandSidebar}
          className="tw-p-1 tw-rounded-lg tw-text-iron-400 hover:tw-text-white hover:tw-bg-iron-800 tw-transition-colors tw-bg-transparent tw-border-0"
          title="Expand main menu"
          aria-label="Expand main sidebar"
          type="button"
        >
          <ChevronLeftIcon className="tw-h-5 tw-w-5" aria-hidden="true" />
        </button>
      </header>

      {/* Collections List */}
      <nav className="tw-px-3 tw-py-4" aria-label="Collections navigation">
        <ul className="tw-space-y-1 tw-list-none tw-pl-0" role="list">
          {collections.map((collection) => {
            const isActive = activeCollection === collection.id;
            return (
              <li key={collection.id} role="listitem">
                <Link
                  href={collection.href}
                  onClick={() => handleCollectionClick(collection.id)}
                  className={`tw-flex tw-flex-col tw-px-3 tw-py-2.5 tw-rounded-lg tw-transition-all tw-duration-200 tw-no-underline tw-focus:tw-outline-none tw-focus:tw-ring-2 tw-focus:tw-ring-primary-400 tw-focus:tw-ring-offset-2 tw-focus:tw-ring-offset-iron-900 ${
                    isActive
                      ? "tw-bg-primary-500/20 tw-text-primary-400"
                      : "tw-text-iron-300 hover:tw-bg-iron-800 hover:tw-text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  aria-describedby={collection.description ? `${collection.id}-description` : undefined}
                >
                  <span className="tw-font-medium">{collection.name}</span>
                  {collection.description && (
                    <span
                      id={`${collection.id}-description`}
                      className={`tw-text-xs tw-mt-0.5 ${
                        isActive ? "tw-text-primary-400/80" : "tw-text-iron-500"
                      }`}
                    >
                      {collection.description}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

// Memoized export for performance optimization
export default memo(CollectionsSubmenu);