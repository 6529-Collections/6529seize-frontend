import React from "react";
import { generateMetadata } from "@/app/tools/app-wallets/[app-wallet-address]/page";

jest.mock("next/dynamic", () => () => (p: any) => (
  <div data-testid="wallet" {...p} />
));

jest.mock("@/helpers/Helpers", () => ({
  formatAddress: jest.fn((a: string) => `fmt-${a}`),
}));

// Mock TitleContext
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("App Wallet page", () => {
  it("exposes metadata", async () => {
    process.env.BASE_ENDPOINT = "https://base.test";
    const meta = await generateMetadata({
      params: { "app-wallet-address": "0xdef" },
    });
    expect(meta.title).toEqual("fmt-0xdef | App Wallets");
    expect(meta.description).toEqual("Tools | 6529.io");
  });
});
