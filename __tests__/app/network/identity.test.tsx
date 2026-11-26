import { notFound } from "next/navigation";
import { setTestPublicEnv } from "@/__tests__/helpers/testPublicEnv";
import NetworkIdentityPage from "@/app/network/identity/page";

jest.mock("next/navigation", () => ({ notFound: jest.fn() }));

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        ...(globalThis as { __testPublicEnv?: object }).__testPublicEnv,
      };
    },
  };
});

jest.mock("@/components/chain-identity/ChainIdentityPage", () => ({
  __esModule: true,
  default: () => null,
}));

beforeEach(() => {
  jest.clearAllMocks();
  setTestPublicEnv({});
});

it("is not found in a build without the 6529 Network flows", () => {
  NetworkIdentityPage();
  expect(notFound).toHaveBeenCalled();
});

it("is not found with the flag on but no gateway", () => {
  setTestPublicEnv({ NEXT_PUBLIC_FEATURE_CHAIN_IDENTITY: "true" });
  NetworkIdentityPage();
  expect(notFound).toHaveBeenCalled();
});

it("shows the page with the flag on and a gateway", () => {
  setTestPublicEnv({
    NEXT_PUBLIC_FEATURE_CHAIN_IDENTITY: "true",
    NEXT_PUBLIC_CHAIN_GATEWAY_URL: "https://gateway.example.test",
  });
  NetworkIdentityPage();
  expect(notFound).not.toHaveBeenCalled();
});
