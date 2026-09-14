import { publicEnv } from "@/config/env";
import {
  isProfileCmsBuilderApiEnabledEnv,
  isProfileCmsBuilderEnabledEnv,
} from "@/config/profileCmsBuilderEnv";

jest.mock("@/config/env", () => ({ publicEnv: {} }));

describe("CMS direct URL rollout controls", () => {
  beforeEach(() => {
    delete publicEnv.PROFILE_CMS_BUILDER_ENABLED;
    delete publicEnv.NEXT_PUBLIC_PROFILE_CMS_BUILDER_ENABLED;
    delete publicEnv.PROFILE_CMS_BUILDER_API_ENABLED;
    delete publicEnv.NEXT_PUBLIC_PROFILE_CMS_BUILDER_API_ENABLED;
  });

  it("enables the builder and live adapter when no override is provided", () => {
    expect(isProfileCmsBuilderEnabledEnv()).toBe(true);
    expect(isProfileCmsBuilderApiEnabledEnv()).toBe(true);
  });

  it("lets an explicit disable override an enabled alias", () => {
    publicEnv.PROFILE_CMS_BUILDER_ENABLED = "false";
    publicEnv.NEXT_PUBLIC_PROFILE_CMS_BUILDER_ENABLED = "true";
    publicEnv.PROFILE_CMS_BUILDER_API_ENABLED = "true";
    publicEnv.NEXT_PUBLIC_PROFILE_CMS_BUILDER_API_ENABLED = "false";
    expect(isProfileCmsBuilderEnabledEnv()).toBe(false);
    expect(isProfileCmsBuilderApiEnabledEnv()).toBe(false);
  });

  it("rejects malformed flags and accepts supported explicit true values", () => {
    publicEnv.PROFILE_CMS_BUILDER_ENABLED = "tru";
    publicEnv.PROFILE_CMS_BUILDER_API_ENABLED = " YES ";
    expect(isProfileCmsBuilderEnabledEnv()).toBe(false);
    expect(isProfileCmsBuilderApiEnabledEnv()).toBe(true);
  });
});
