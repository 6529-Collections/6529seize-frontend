export const PREFERENCES_ENTRY_SOURCE_PARAM = "from";

const PREFERENCES_PROFILE_ENTRY_SOURCE = "profile";

export type PreferencesRouteTab = "blocked-profiles" | "reports";

export const getPreferencesHref = ({
  tab,
  fromProfile = false,
}: {
  readonly tab?: PreferencesRouteTab | undefined;
  readonly fromProfile?: boolean | undefined;
} = {}): string => {
  const params = new URLSearchParams();

  if (tab) {
    params.set("tab", tab);
  }
  if (fromProfile) {
    params.set(
      PREFERENCES_ENTRY_SOURCE_PARAM,
      PREFERENCES_PROFILE_ENTRY_SOURCE
    );
  }

  const query = params.toString();
  return query ? `/preferences?${query}` : "/preferences";
};

export const PROFILE_PREFERENCES_HREF = getPreferencesHref({
  fromProfile: true,
});

export const isProfilePreferencesEntry = (
  source: string | readonly string[] | null | undefined
): boolean => {
  const value = typeof source === "string" ? source : source?.[0];
  return value === PREFERENCES_PROFILE_ENTRY_SOURCE;
};
