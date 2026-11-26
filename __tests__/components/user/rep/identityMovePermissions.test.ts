import { canManageGivenRatings } from "@/components/user/rep/ratingsManagement";
import {
  getCanEditNic,
  getCanEditRep,
} from "@/components/user/rep/UserPageRep.helpers";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { setIdentityFreezeAt } from "@/__tests__/helpers/identityFreeze";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        NEXT_PUBLIC_IDENTITY_FREEZE_AT: (
          globalThis as { __identityFreezeAt?: string }
        ).__identityFreezeAt,
      };
    },
  };
});

const FREEZE = Date.UTC(2026, 10, 24, 0, 0, 0);
const rater = {
  id: "rater",
  handle: "rater",
  wallets: [{ wallet: "0x1" }],
} as unknown as ApiIdentity;
const target = {
  id: "target",
  handle: "target",
  wallets: [{ wallet: "0x2" }],
} as unknown as ApiIdentity;

const permissions = () => ({
  rep: getCanEditRep({
    myProfile: rater,
    targetProfile: target,
    activeProfileProxy: null,
  }),
  nic: getCanEditNic({
    connectedProfile: rater,
    targetProfile: target,
    activeProfileProxy: null,
    address: "0x1",
  }),
  given: canManageGivenRatings(rater, rater, null),
});

beforeEach(() => {
  jest.useFakeTimers();
  setIdentityFreezeAt("2026-11-24T00:00:00Z");
});

afterEach(() => {
  jest.useRealTimers();
  setIdentityFreezeAt(undefined);
});

it("lets a profile rate before the freeze", () => {
  jest.setSystemTime(FREEZE - 1);
  expect(permissions()).toEqual({ rep: true, nic: true, given: true });
});

it("closes REP, NIC and given-rating edits from the freeze", () => {
  jest.setSystemTime(FREEZE);
  expect(permissions()).toEqual({ rep: false, nic: false, given: false });
});
