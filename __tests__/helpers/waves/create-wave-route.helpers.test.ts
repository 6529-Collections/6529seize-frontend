import {
  isCreateWaveSurface,
  CREATE_WAVE_QUERY_VALUE,
} from "@/helpers/waves/create-wave-route.helpers";

describe("create-wave route helpers", () => {
  it.each([
    ["/waves/create", null],
    ["/waves/create/", null],
    ["/waves/create///", null],
    ["/en/waves/create", null],
    ["/en/waves/create/advanced", null],
    ["/waves", CREATE_WAVE_QUERY_VALUE],
    ["/waves/saved-wave", CREATE_WAVE_QUERY_VALUE],
  ])("recognizes the create-wave surface for %s", (pathname, createParam) => {
    expect(isCreateWaveSurface({ pathname, createParam })).toBe(true);
  });

  it.each([
    ["/waves", null],
    ["/waves/active-wave", null],
    ["/messages/create", null],
    ["/waves", "dm"],
  ])("does not classify %s as create-wave", (pathname, createParam) => {
    expect(isCreateWaveSurface({ pathname, createParam })).toBe(false);
  });
});
