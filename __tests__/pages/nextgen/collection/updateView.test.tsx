import React from "react";
import { render } from "@testing-library/react";
import NextGenCollectionPage from "@/pages/nextgen/collection/[collection]/[[...view]]/index";
import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

const push = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push,
  replace: jest.fn(),
  asPath: "/",
  query: {},
});

let setViewFn: any;
jest.mock("next/dynamic", () => () => (props: any) => {
  setViewFn = props.setView;
  return <div data-testid="collection" />;
});

jest.mock("@/components/auth/Auth", () => ({
  AuthContext: React.createContext({ setTitle: jest.fn() }),
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

describe("NextGenCollectionPage updateView", () => {
  it("pushes new url when view changes", () => {
    render(
      <NextGenCollectionPage
        collection={{ name: "Cool" }}
        view={ContentView.OVERVIEW}
      />
    );
    setViewFn(ContentView.PROVENANCE);
    expect(push).toHaveBeenCalledWith("/nextgen/collection/cool/provenance");
  });
});
