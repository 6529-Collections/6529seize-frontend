import { validateStrictAddress } from "@/components/waves/memes/submission/utils/addressValidation";

describe("addressValidation", () => {
  describe("validateStrictAddress", () => {
    it("should return true for valid Ethereum addresses", () => {
      expect(validateStrictAddress("0x1234567890123456789012345678901234567890")).toBe(true);
      expect(validateStrictAddress("0xAbCdEf1234567890AbCdEf1234567890AbCdEf12")).toBe(true);
    });

    it("should return false for addresses without 0x prefix", () => {
      expect(validateStrictAddress("1234567890123456789012345678901234567890")).toBe(false);
    });

    it("should return false for ENS names", () => {
      expect(validateStrictAddress("vitalik.eth")).toBe(false);
      expect(validateStrictAddress("6529.eth")).toBe(false);
    });

    it("should return false for invalid length", () => {
      expect(validateStrictAddress("0x123")).toBe(false);
      expect(validateStrictAddress("0x12345678901234567890123456789012345678901")).toBe(false);
    });

    it("should return false for non-hex characters", () => {
      expect(validateStrictAddress("0x123456789012345678901234567890123456789g")).toBe(false);
    });

    it("should return false for empty or whitespace input", () => {
      expect(validateStrictAddress("")).toBe(false);
      expect(validateStrictAddress("   ")).toBe(false);
    });
  });
});
