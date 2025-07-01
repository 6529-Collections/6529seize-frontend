import React from "react";
import { getServerSideProps } from "@/pages/tools/app-wallets/[app-wallet-address]";

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
  it("getServerSideProps returns metadata", async () => {
    const ctx = { query: { "app-wallet-address": "0xdef" } } as any;
    const res = await getServerSideProps(ctx, null as any, "/p");
    expect(res).toEqual({
      props: {
        address: "0xdef",
        metadata: { title: "fmt-0xdef | App Wallets" },
      },
    });
  });
});
