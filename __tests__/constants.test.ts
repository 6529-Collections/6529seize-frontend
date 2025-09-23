/**
 * Tests for BASE_ENDPOINT validation in constants.ts
 *
 * These tests ensure that the validateBaseEndpoint function properly:
 * - Fails fast when environment variable is missing
 * - Validates URL format
 * - Enforces HTTPS in production
 * - Validates against domain allowlist
 * - Allows valid configurations
 *
 * They also assert that the exported value is the **normalized origin**
 * (scheme + host [+ port], no path/query, no trailing slash).
 */

// Deterministic per-test env isolation (no shared cache/order issues)
const withIsolatedEnv = (
  overrides: Record<string, string | undefined>,
  fn: () => void
) => {
  const snapshot: Record<string, string | undefined> = { ...process.env };
  const apply = (key: string, val: string | undefined) => {
    if (typeof val === "undefined") delete (process.env as any)[key];
    else (process.env as any)[key] = val;
  };

  try {
    // Apply overrides
    Object.keys(overrides).forEach((k) => apply(k, overrides[k]));

    // Load module in an isolated registry so no cache bleeds across tests
    jest.isolateModules(() => fn());
  } finally {
    // Restore original env snapshot precisely
    const currentKeys = new Set(Object.keys(process.env));
    const snapshotKeys = new Set(Object.keys(snapshot));
    // Remove keys that weren't originally present
    for (const k of Array.from(currentKeys)) {
      if (!snapshotKeys.has(k)) delete (process.env as any)[k];
    }
    // Restore original values
    for (const k of Array.from(snapshotKeys)) {
      const v = snapshot[k];
      if (typeof v === "undefined") delete (process.env as any)[k];
      else (process.env as any)[k] = v as string;
    }
  }
};

const importConstants = () => require("@/constants");

describe("validateBaseEndpoint", () => {
  it("throws error when BASE_ENDPOINT is missing", () => {
    expect(() =>
      withIsolatedEnv({ BASE_ENDPOINT: undefined }, () => {
        importConstants();
      })
    ).toThrow(/BASE_ENDPOINT[\s\S]*Required/);
  });

  it("throws error when BASE_ENDPOINT is empty string", () => {
    expect(() =>
      withIsolatedEnv({ BASE_ENDPOINT: "" }, () => {
        importConstants();
      })
    ).toThrow(/BASE_ENDPOINT must be a valid URL/);
  });

  it("throws error for invalid URL format", () => {
    expect(() =>
      withIsolatedEnv({ BASE_ENDPOINT: "not-a-url" }, () => {
        importConstants();
      })
    ).toThrow(/BASE_ENDPOINT must be a valid URL/);
  });

  it("throws error for malformed URLs", () => {
    expect(() =>
      withIsolatedEnv({ BASE_ENDPOINT: "https://" }, () => {
        importConstants();
      })
    ).toThrow(/BASE_ENDPOINT must be a valid URL/);
  });

  it("throws error for non-HTTPS URLs in production (except localhost)", () => {
    expect(() =>
      withIsolatedEnv({ BASE_ENDPOINT: "http://example.com" }, () => {
        importConstants();
      })
    ).toThrow(
      "BASE_ENDPOINT must use HTTPS protocol in production. Got: http://. Only localhost can use HTTP."
    );
  });

  it("throws error for FTP protocol", () => {
    expect(() =>
      withIsolatedEnv({ BASE_ENDPOINT: "ftp://6529.io" }, () => {
        importConstants();
      })
    ).toThrow(
      "BASE_ENDPOINT must use HTTPS protocol in production. Got: ftp://. Only localhost can use HTTP."
    );
  });

  it("throws error for non-allowlisted domain", () => {
    expect(() =>
      withIsolatedEnv({ BASE_ENDPOINT: "https://malicious.com" }, () => {
        importConstants();
      })
    ).toThrow(
      "BASE_ENDPOINT domain not in allowlist. Got: malicious.com. Allowed domains: 6529.io, www.6529.io, staging.6529.io, localhost, 127.0.0.1"
    );
  });

  it("throws error for subdomain of non-allowlisted domain", () => {
    expect(() =>
      withIsolatedEnv({ BASE_ENDPOINT: "https://fake.malicious.com" }, () => {
        importConstants();
      })
    ).toThrow(
      "BASE_ENDPOINT domain not in allowlist. Got: fake.malicious.com. Allowed domains: 6529.io, www.6529.io, staging.6529.io, localhost, 127.0.0.1"
    );
  });

  it("throws error for domain that ends with allowlisted domain but is not a subdomain", () => {
    expect(() =>
      withIsolatedEnv({ BASE_ENDPOINT: "https://fake6529.io" }, () => {
        importConstants();
      })
    ).toThrow(
      "BASE_ENDPOINT domain not in allowlist. Got: fake6529.io. Allowed domains: 6529.io, www.6529.io, staging.6529.io, localhost, 127.0.0.1"
    );
  });

  // Valid configuration tests (expect normalized origin)
  it("accepts valid HTTPS URL with 6529.io domain", () => {
    withIsolatedEnv({ BASE_ENDPOINT: "https://6529.io" }, () => {
      const constants = importConstants();
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe("https://6529.io");
    });
  });

  it("accepts valid HTTPS URL with www.6529.io domain", () => {
    withIsolatedEnv({ BASE_ENDPOINT: "https://www.6529.io" }, () => {
      const constants = importConstants();
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe("https://www.6529.io");
    });
  });

  it("accepts valid HTTPS URL with staging.6529.io domain", () => {
    withIsolatedEnv({ BASE_ENDPOINT: "https://staging.6529.io" }, () => {
      const constants = importConstants();
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe("https://staging.6529.io");
    });
  });

  it("accepts HTTP localhost URLs", () => {
    withIsolatedEnv({ BASE_ENDPOINT: "http://localhost:3000" }, () => {
      const constants = importConstants();
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe("http://localhost:3000");
    });
  });

  it("accepts HTTP 127.0.0.1 URLs", () => {
    withIsolatedEnv({ BASE_ENDPOINT: "http://127.0.0.1:3000" }, () => {
      const constants = importConstants();
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe("http://127.0.0.1:3000");
    });
  });

  it("accepts HTTPS localhost URLs", () => {
    withIsolatedEnv({ BASE_ENDPOINT: "https://localhost:3000" }, () => {
      const constants = importConstants();
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe("https://localhost:3000");
    });
  });

  it("accepts valid subdomain of allowlisted domain", () => {
    withIsolatedEnv({ BASE_ENDPOINT: "https://api.6529.io" }, () => {
      const constants = importConstants();
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe("https://api.6529.io");
    });
  });

  it("throws error if query params are present", () => {
    expect(() =>
      withIsolatedEnv({ BASE_ENDPOINT: "https://6529.io/app?ref=test" }, () => {
        importConstants();
      })
    ).toThrow("BASE_ENDPOINT must not have query params. Got: ?ref=test");
  });

  it("validates immediately on module import (fail-fast behavior)", () => {
    expect(() =>
      withIsolatedEnv({ BASE_ENDPOINT: "invalid-url" }, () => {
        importConstants();
      })
    ).toThrow();
  });

  it("exports VALIDATED_BASE_ENDPOINT constant for valid configuration", () => {
    withIsolatedEnv({ BASE_ENDPOINT: "https://6529.io" }, () => {
      const constants = importConstants();
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe("https://6529.io");
      expect(typeof constants.VALIDATED_BASE_ENDPOINT).toBe("string");
    });
  });

  // Edge case tests
  it("handles URLs with non-standard ports", () => {
    withIsolatedEnv({ BASE_ENDPOINT: "https://staging.6529.io:8080" }, () => {
      const constants = importConstants();
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe(
        "https://staging.6529.io:8080"
      );
    });
  });

  it("normalizes URLs with trailing slashes to origin without trailing slash", () => {
    withIsolatedEnv({ BASE_ENDPOINT: "https://6529.io/" }, () => {
      const constants = importConstants();
      expect(constants.VALIDATED_BASE_ENDPOINT).toBe("https://6529.io");
    });
  });
});
