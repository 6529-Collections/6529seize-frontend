import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { safeLocalStorage } from "@/helpers/safeLocalStorage";

// Layout hint only. It remembers whether the last completed country lookup on
// this device was US, so the iOS Subscription Minting row can keep reserving
// blank space during the next launch's country check instead of collapsing and
// re-inserting. It is never read as permission: purchasing UI, links and
// requests still wait for the real lookup, and storage failures are ignored.
const US_COUNTRY_HINT_KEY = "6529:us-country-hint";
const US_COUNTRY_HINT_VALUE = "US";

export function readUsCountryHint(): boolean {
  try {
    return (
      safeLocalStorage.getItem(US_COUNTRY_HINT_KEY) === US_COUNTRY_HINT_VALUE
    );
  } catch {
    return false;
  }
}

// Call with the country from a completed lookup only. Any answer other than US
// (including an empty one) clears the hint; a failed lookup must not call this.
export function rememberCountryHint(country: string | null | undefined): void {
  try {
    if (shouldHideSubscriptions({ capacitorIsIos: true, country })) {
      safeLocalStorage.removeItem(US_COUNTRY_HINT_KEY);
    } else {
      safeLocalStorage.setItem(US_COUNTRY_HINT_KEY, US_COUNTRY_HINT_VALUE);
    }
  } catch {
    // Storage can be unavailable or full; the hint only affects layout.
  }
}
