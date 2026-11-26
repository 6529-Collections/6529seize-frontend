import { getPhoneNavigationRoute } from "@/helpers/waves/phone-navigation-route";

it.each([
  ["/waves", "", null, "waves", null],
  ["/waves", "view=profile-feed", null, "feed", "waves"],
  ["/waves/wave-a", "", "wave-a", "conversation", "waves"],
  [
    "/waves/wave-a",
    "returnTo=%2Fwaves%3Fview%3Dprofile-feed",
    "wave-a",
    "conversation",
    "feed",
  ],
  ["/messages", "", null, "messages", null],
  ["/messages/dm-a", "", "dm-a", "conversation", "messages"],
] as const)(
  "keeps the correct live return screen for %s?%s",
  (pathname, query, waveId, screen, destination) => {
    expect(
      getPhoneNavigationRoute(pathname, new URLSearchParams(query), waveId)
    ).toMatchObject({ screen, destination });
  }
);

it.each([
  "/waves/create",
  "/messages/compose",
  "/notifications",
  "/preferences",
])("keeps unrelated routes outside the conversation stack: %s", (pathname) => {
  expect(
    getPhoneNavigationRoute(pathname, new URLSearchParams(), null)
  ).toBeNull();
});
