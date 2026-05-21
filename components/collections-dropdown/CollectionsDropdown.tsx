"use client";

import CommonDropdownItemsWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsWrapper";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

type CollectionType = "memes" | "gradient" | "nextgen" | "memelab" | "rememes";
type CollectionsDropdownVariant = "default" | "title" | "brand";

interface CollectionItem {
  id: CollectionType;
  name: string;
  path: string;
}

const DEFAULT_COLLECTION: CollectionItem = {
  id: "memes",
  name: "The Memes",
  path: "/the-memes",
};

const COLLECTIONS: CollectionItem[] = [
  DEFAULT_COLLECTION,
  { id: "gradient", name: "6529 Gradient", path: "/6529-gradient" },
  { id: "nextgen", name: "NextGen", path: "/nextgen" },
  { id: "memelab", name: "Meme Lab", path: "/meme-lab" },
  { id: "rememes", name: "ReMemes", path: "/rememes" },
];

interface Props {
  readonly activePage: CollectionType;
  readonly variant?: CollectionsDropdownVariant;
  readonly triggerContent?: ReactNode | undefined;
}

export default function CollectionsDropdown(props: Readonly<Props>) {
  const variant = props.variant ?? "default";
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const activeCollection =
    COLLECTIONS.find((c) => c.id === props.activePage) ?? DEFAULT_COLLECTION;

  const handleSelect = (collection: CollectionItem) => {
    setIsOpen(false);
    router.push(collection.path);
  };

  const triggerClassNames: Record<CollectionsDropdownVariant, string> = {
    default:
      "tw-relative tw-block tw-w-full tw-truncate tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-py-3 tw-pl-3.5 tw-pr-10 tw-text-left tw-text-xs tw-font-semibold tw-text-iron-300 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 hover:tw-ring-iron-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 lg:tw-bg-iron-900",
    title:
      "tw-group tw-m-0 tw-inline-flex tw-min-w-0 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-200 tw-transition tw-duration-200 hover:tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 sm:tw-text-2xl md:tw-text-3xl",
    brand:
      "tw-group tw-m-0 tw-inline-flex tw-min-w-0 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-transition tw-duration-200 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400",
  };
  const iconClassNames: Record<CollectionsDropdownVariant, string> = {
    default: "tw-h-5 tw-w-5",
    title:
      "tw-h-5 tw-w-5 tw-shrink-0 tw-text-iron-400 tw-transition-colors tw-duration-200 group-hover:tw-text-white md:tw-h-6 md:tw-w-6",
    brand:
      "tw-h-5 tw-w-5 tw-shrink-0 tw-text-iron-400 tw-transition-colors tw-duration-200 group-hover:tw-text-white",
  };
  const triggerContent = props.triggerContent ?? activeCollection.name;
  const isDefaultVariant = variant === "default";

  const chevron = (
    <svg
      className={`${iconClassNames[variant]} tw-transition-transform tw-duration-200 ${
        isOpen ? "tw-rotate-0" : "-tw-rotate-90"
      }`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const triggerButton = (
    <button
      ref={buttonRef}
      type="button"
      aria-haspopup="true"
      aria-expanded={isOpen}
      {...(isDefaultVariant
        ? {}
        : { "aria-label": `Collection: ${activeCollection.name}` })}
      onClick={() => setIsOpen(!isOpen)}
      className={triggerClassNames[variant]}
    >
      {isDefaultVariant ? (
        <>
          {triggerContent}
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 -tw-mr-1 tw-flex tw-items-center tw-pr-3.5">
            {chevron}
          </div>
        </>
      ) : (
        <>
          {variant === "title" ? (
            <span className="tw-min-w-0 tw-truncate">{triggerContent}</span>
          ) : (
            triggerContent
          )}
          {chevron}
        </>
      )}
    </button>
  );

  const renderTrigger = () => {
    if (variant === "title") {
      return <span className="tw-min-w-0">{triggerButton}</span>;
    }

    if (isDefaultVariant) {
      return <div className="tw-relative tw-w-full">{triggerButton}</div>;
    }

    return triggerButton;
  };

  return (
    <div
      className={`tailwind-scope ${
        isDefaultVariant ? "tw-h-full tw-w-full" : "tw-min-w-0"
      }`}
    >
      {renderTrigger()}
      <CommonDropdownItemsWrapper
        isOpen={isOpen}
        filterLabel="Collection"
        buttonRef={buttonRef}
        setOpen={setIsOpen}
        onIsMobile={setIsMobile}
      >
        {COLLECTIONS.map((collection) => (
          <li
            key={`collection-${collection.id}`}
            className="tw-h-full"
            role="none"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect(collection)}
              className={`${
                isMobile ? "tw-px-4 tw-py-3" : "tw-px-3 tw-py-2"
              } tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-text-left tw-text-sm tw-font-medium tw-text-iron-200 tw-transition tw-duration-200 tw-ease-out hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 ${
                collection.id === props.activePage
                  ? "tw-bg-iron-800 tw-text-iron-100"
                  : ""
              }`}
            >
              <span className="tw-truncate">{collection.name}</span>
              {collection.id === props.activePage && (
                <FontAwesomeIcon
                  icon={faCheck}
                  className="tw-h-3.5 tw-w-3.5 tw-flex-shrink-0 tw-text-primary-300"
                  aria-hidden="true"
                />
              )}
            </button>
          </li>
        ))}
      </CommonDropdownItemsWrapper>
    </div>
  );
}
