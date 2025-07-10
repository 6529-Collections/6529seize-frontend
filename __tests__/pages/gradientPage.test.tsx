import React, { useMemo } from "react";
import { render, screen } from "@testing-library/react";
import GradientPage, { getServerSideProps } from "@/pages/6529-gradient/[id]";
import { AuthContext } from "@/components/auth/Auth";
import { fetchUrl } from "@/services/6529api";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("@/services/6529api");

const TestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setTitle = jest.fn();
  const authContextValue = useMemo(() => ({ setTitle }), [setTitle]);
  return (
    <AuthContext.Provider value={authContextValue as any}>
      {children}
    </AuthContext.Provider>
  );
};

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

describe("GradientPage", () => {
  it("renders gradient component", () => {
    render(
      <TestProvider>
        <GradientPage id="1" name="Gradient #1" image="img" metadata={{}} />
      </TestProvider>
    );
    expect(screen.getByTestId("dynamic")).toBeInTheDocument();
  });
});

describe("GradientPage getServerSideProps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns data from api", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({
      data: [{ name: "G1", thumbnail: "t.png" }],
    });
    const result = await getServerSideProps(
      { query: { id: "5" } } as any,
      null as any,
      null as any
    );
    expect(result).toEqual({
      props: {
        id: "5",
        name: "G1",
        image: "t.png",
        metadata: {
          title: "G1",
          ogImage: "t.png",
          description: "6529 Gradient",
        },
      },
    });
  });

  it("uses defaults when api empty", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({ data: [] });
    process.env.BASE_ENDPOINT = "https://base.6529.io";
    const result = await getServerSideProps(
      { query: { id: "8" } } as any,
      null as any,
      null as any
    );
    expect(result).toEqual({
      props: {
        id: "8",
        name: "Gradient #8",
        image: "https://base.6529.io/6529io.png",
        metadata: {
          title: "Gradient #8",
          ogImage: "https://base.6529.io/6529io.png",
          description: "6529 Gradient",
        },
      },
    });
  });
});
