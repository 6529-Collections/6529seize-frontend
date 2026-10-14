"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useId, useRef, useState } from "react";
import Image from "next/image";

export const recipientKey = (person: CommunityMemberMinimal): string =>
  (person.primary_wallet ?? person.wallet).toLowerCase();

export const recipientName = (person: CommunityMemberMinimal): string =>
  person.handle ?? person.display ?? person.primary_wallet ?? person.wallet;

function RecipientAvatar({
  person,
  small = false,
}: {
  readonly person: CommunityMemberMinimal;
  readonly small?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`tw-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-full tw-bg-iron-800 tw-font-semibold tw-text-iron-400 ${small ? "tw-size-6 tw-text-xs" : "tw-size-10 tw-text-base"}`}
    >
      {person.pfp ? (
        <Image
          src={getScaledImageUri(person.pfp, ImageScale.W_AUTO_H_50)}
          alt=""
          width={small ? 24 : 40}
          height={small ? 24 : 40}
          unoptimized
          className="tw-size-full tw-object-cover"
        />
      ) : (
        recipientName(person).charAt(0).toUpperCase()
      )}
    </span>
  );
}

function MatchingHandle({
  name,
  query,
}: {
  readonly name: string;
  readonly query: string;
}) {
  const start = name.toLowerCase().indexOf(query.toLowerCase());
  if (start < 0) return name;
  const end = start + query.length;
  return (
    <>
      {name.slice(0, start)}
      <span className="tw-text-primary-300">{name.slice(start, end)}</span>
      {name.slice(end)}
    </>
  );
}

export default function DirectMessageRecipients({
  selected,
  onToggle,
  onRemove,
  disabled,
}: {
  readonly selected: CommunityMemberMinimal[];
  readonly onToggle: (person: CommunityMemberMinimal) => void;
  readonly onRemove: (wallet: string) => void;
  readonly disabled: boolean;
}) {
  const locale = useBrowserLocale();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const search = query.trim();
  const canSearch = search.length >= 3;
  const params = { param: search, only_profile_owners: "true", sort: "level" };
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: [QueryKey.PROFILE_SEARCH, params],
    queryFn: ({ signal }) =>
      commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
        params,
        signal,
      }),
    enabled: canSearch,
    refetchOnWindowFocus: false,
  });
  const selectedKeys = new Set(selected.map(recipientKey));
  let searchStatus = "";
  if (canSearch) {
    if (isFetching) {
      searchStatus = t(locale, "quickDm.recipientLoading");
    } else if (isError) {
      searchStatus = t(locale, "quickDm.recipientSearchError");
    } else if (data) {
      searchStatus = data.length
        ? t(locale, "quickDm.recipientResults", {
            count: formatNumber(locale, data.length),
          })
        : t(locale, "quickDm.recipientEmpty", { query: search });
    }
  }

  return (
    <>
      <div className="tw-flex tw-min-h-[50px] tw-flex-wrap tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-[7px] focus-within:tw-border-primary-400 focus-within:tw-ring-1 focus-within:tw-ring-primary-400">
        <label
          htmlFor={inputId}
          className="tw-m-0 tw-mr-0.5 tw-text-[15px] tw-font-medium tw-text-iron-400"
        >
          {t(locale, "quickDm.recipientLabel")}
        </label>
        {selected.map((person) => (
          <span
            key={recipientKey(person)}
            className="tw-inline-flex tw-min-h-8 tw-max-w-full tw-items-center tw-gap-1.5 tw-rounded-full tw-bg-iron-800 tw-pl-1 tw-text-[13px] tw-font-semibold tw-text-iron-50"
          >
            <RecipientAvatar person={person} small />
            <span className="tw-min-w-0 tw-max-w-[140px] tw-truncate">
              {recipientName(person)}
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onRemove(recipientKey(person));
                inputRef.current?.focus();
              }}
              aria-label={t(locale, "quickDm.recipientRemove", {
                name: recipientName(person),
              })}
              className="tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-50"
            >
              <XMarkIcon
                aria-hidden="true"
                className="tw-size-3.5"
                strokeWidth={2.5}
              />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            const last = selected.at(-1);
            if (
              event.key === "Backspace" &&
              !query &&
              last &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              onRemove(recipientKey(last));
            }
            // Enter in recipient search must not accidentally create a conversation.
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder={
            selected.length ? t(locale, "quickDm.recipientAddMore") : undefined
          }
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="tw-h-[34px] tw-min-w-[90px] tw-flex-1 tw-border-0 tw-bg-transparent tw-p-0 tw-text-base tw-font-medium tw-text-iron-50 tw-caret-primary-300 tw-shadow-none tw-outline-none tw-ring-0 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-ring-0"
        />
      </div>
      <output aria-live="polite" aria-atomic="true" className="tw-sr-only">
        {searchStatus}
      </output>
      {canSearch && isFetching && (
        <div className="tw-mt-5">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              aria-hidden="true"
              className="tw-flex tw-h-[62px] tw-items-center tw-gap-3 tw-px-1.5 tw-py-2 motion-safe:tw-animate-pulse"
            >
              <div className="tw-size-10 tw-rounded-full tw-bg-iron-900" />
              <div className="tw-flex-1">
                <div className="tw-h-3 tw-w-[45%] tw-rounded-md tw-bg-iron-900" />
                <div className="tw-mt-2 tw-h-2.5 tw-w-[28%] tw-rounded-md tw-bg-iron-900" />
              </div>
            </div>
          ))}
        </div>
      )}
      {canSearch && !isFetching && isError && (
        <div className="tw-py-8 tw-text-center tw-text-sm tw-text-iron-400">
          <p>{t(locale, "quickDm.recipientSearchError")}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {t(locale, "quickDm.recipientRetry")}
          </button>
        </div>
      )}
      {canSearch && !isFetching && !isError && data?.length === 0 && (
        <p className="tw-m-0 tw-break-words tw-px-2 tw-py-8 tw-text-center tw-text-sm tw-text-iron-400">
          {t(locale, "quickDm.recipientEmpty", { query: search })}
        </p>
      )}
      {canSearch && !isFetching && !isError && (data?.length ?? 0) > 0 && (
        <ul
          aria-label={t(locale, "quickDm.recipientPeople")}
          className="tw-mb-0 tw-mt-3 tw-list-none tw-p-0"
        >
          {data?.map((person) => {
            const selectedPerson = selectedKeys.has(recipientKey(person));
            const details = t(
              locale,
              person.tdh > 0
                ? "quickDm.recipientLevelTdh"
                : "quickDm.recipientLevel",
              {
                level: formatNumber(locale, person.level),
                tdh: formatNumber(locale, person.tdh, {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }),
              }
            );
            return (
              <li key={person.wallet}>
                <button
                  type="button"
                  aria-pressed={selectedPerson}
                  aria-label={t(locale, "quickDm.recipientOption", {
                    name: recipientName(person),
                    details,
                  })}
                  disabled={disabled}
                  onClick={() => onToggle(person)}
                  className="tw-flex tw-min-h-[62px] tw-w-full tw-items-center tw-gap-3 tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-1.5 tw-py-2 tw-text-left tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 active:tw-bg-iron-900 desktop-hover:hover:tw-bg-iron-950"
                >
                  <RecipientAvatar person={person} />
                  <span className="tw-min-w-0 tw-flex-1">
                    <span className="tw-block tw-truncate tw-text-[15px] tw-font-semibold tw-leading-5 tw-text-iron-50">
                      <MatchingHandle
                        name={recipientName(person)}
                        query={search}
                      />
                    </span>
                    <span className="tw-mt-0.5 tw-block tw-text-[13px] tw-font-medium tw-leading-[18px] tw-text-iron-400">
                      {details}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`tw-flex tw-size-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-[1.5px] tw-border-solid ${selectedPerson ? "tw-border-primary-500 tw-bg-primary-500" : "tw-border-iron-500 tw-bg-transparent"}`}
                  >
                    {selectedPerson && (
                      <CheckIcon
                        className="tw-size-3.5 tw-text-white"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
