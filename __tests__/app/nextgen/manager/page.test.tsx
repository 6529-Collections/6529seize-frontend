import { render } from "@testing-library/react";
import React from "react";

process.env.BASE_ENDPOINT = "http://localhost";

const NextGenAdminPage = require("@/app/nextgen/manager/page").default;

jest.mock("@/components/nextGen/admin/NextGenAdmin", () => () => <div data-testid="admin" />);

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

describe("NextGen admin page", () => {
  it("renders admin component", () => {
    render(<NextGenAdminPage />);
  });
});

