import { convertActivityLogParams } from "@/helpers/profile-logs.helpers";
import {
  ProfileActivityFilterTargetType,
  ProfileActivityLogType,
  RateMatter,
} from "@/types/enums";

describe("convertActivityLogParams", () => {
  const base = {
    page: 1,
    pageSize: 10,
    logTypes: [ProfileActivityLogType.DROP_CREATED],
    matter: null,
    targetType: ProfileActivityFilterTargetType.ALL,
    handleOrWallet: null,
    groupId: "g1",
  };

  it("includes group id when no handle", () => {
    const res = convertActivityLogParams({
      params: base,
      disableActiveGroup: false,
    });
    expect(res.group_id).toBe("g1");
    expect(res.log_type).toBe("DROP_CREATED");
  });

  it("disables group when flag set", () => {
    const res = convertActivityLogParams({
      params: base,
      disableActiveGroup: true,
    });
    expect(res.group_id).toBeUndefined();
  });

  it("handles ALL target type", () => {
    const params = { ...base, handleOrWallet: "u" };
    const res = convertActivityLogParams({ params, disableActiveGroup: false });
    expect(res.include_incoming).toBe("true");
    expect(res.profile).toBe("u");
    expect(res.group_id).toBeUndefined();
  });

  it("handles INCOMING and OUTGOING target types", () => {
    const incoming = convertActivityLogParams({
      params: {
        ...base,
        handleOrWallet: "u",
        targetType: ProfileActivityFilterTargetType.INCOMING,
      },
      disableActiveGroup: false,
    });
    expect(incoming.target).toBe("u");
    const outgoing = convertActivityLogParams({
      params: {
        ...base,
        handleOrWallet: "u",
        targetType: ProfileActivityFilterTargetType.OUTGOING,
      },
      disableActiveGroup: false,
    });
    expect(outgoing.profile).toBe("u");
  });

  it("produces empty log_type when none selected", () => {
    const res = convertActivityLogParams({
      params: { ...base, logTypes: [] },
      disableActiveGroup: false,
    });
    expect(res.log_type).toBe("");
  });

  it("omits group id when handle present even if disableActiveGroup false", () => {
    const res = convertActivityLogParams({
      params: { ...base, handleOrWallet: "user" },
      disableActiveGroup: false,
    });
    expect(res.group_id).toBeUndefined();
  });

  it("adds REP rating matter and sorts log types", () => {
    const params = {
      ...base,
      logTypes: [
        ProfileActivityLogType.HANDLE_EDIT,
        ProfileActivityLogType.DROP_CREATED,
      ],
      matter: RateMatter.REP,
    };
    const res = convertActivityLogParams({ params, disableActiveGroup: false });
    expect(res.log_type).toBe("DROP_CREATED,HANDLE_EDIT");
    expect(res.rating_matter).toBe("REP");
  });

  it("passes Wave REP rating matter through", () => {
    const res = convertActivityLogParams({
      params: { ...base, matter: RateMatter.WAVE_REP },
      disableActiveGroup: false,
    });

    expect(res.rating_matter).toBe("WAVE_REP");
  });

  it("does not forward rating matter for non-REP profile filters", () => {
    const nic = convertActivityLogParams({
      params: { ...base, matter: RateMatter.NIC },
      disableActiveGroup: false,
    });
    const dropRep = convertActivityLogParams({
      params: { ...base, matter: RateMatter.DROP_REP },
      disableActiveGroup: false,
    });

    expect(nic.rating_matter).toBeUndefined();
    expect(dropRep.rating_matter).toBeUndefined();
  });

  it("converts numbers to strings", () => {
    const res = convertActivityLogParams({
      params: base,
      disableActiveGroup: false,
    });
    expect(res.page).toBe("1");
    expect(res.page_size).toBe("10");
  });
});
