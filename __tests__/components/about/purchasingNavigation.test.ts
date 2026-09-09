import {
  getAboutNavItemHref,
  getVisibleAboutNavGroups,
} from "@/components/about/about.routes";

it.each([true, false])(
  "applies purchasing visibility to About index, dropdown and sidebar data (restricted=%s)",
  (restricted) => {
    const hrefs = getVisibleAboutNavGroups({
      hideSubscriptions: restricted,
    }).flatMap((group) => group.items.map(getAboutNavItemHref));
    for (const href of ["/about/minting", "/about/subscriptions"]) {
      expect(hrefs.includes(href)).toBe(!restricted);
    }
    expect(hrefs).toContain("/about/the-memes");
  }
);
