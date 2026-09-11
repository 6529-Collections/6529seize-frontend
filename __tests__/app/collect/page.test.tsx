import CollectPage from "@/app/collect/page";
import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: jest.fn(() => ({})),
}));

jest.mock("@/components/collect/CollectPageClient", () => ({
  __esModule: true,
  default: () => <div>Collect planner</div>,
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

type SearchParams = Record<string, string | string[] | undefined>;

describe("Collect route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each<{ params: SearchParams; destination: string }>([
    {
      params: { intent: "explore", collection: "memes" },
      destination: "/the-memes",
    },
    {
      params: { intent: "explore", collection: "gradients" },
      destination: "/6529-gradient",
    },
    {
      params: { intent: "explore", collection: "pebbles" },
      destination: "/nextgen/collection/pebbles",
    },
    {
      params: { intent: "explore", collection: "all" },
      destination: "/the-memes",
    },
    {
      params: { intent: "specific", collection: "memes", token: "42" },
      destination: "/the-memes/42",
    },
    {
      params: { intent: "specific", collection: "gradients", token: "0" },
      destination: "/6529-gradient/0",
    },
    {
      params: { intent: "specific", collection: "pebbles", q: "10000000514" },
      destination: "/nextgen/token/10000000514",
    },
    {
      params: { intent: "explore", collection: "gradients", token: "10" },
      destination: "/6529-gradient",
    },
    {
      params: { collection: "memes", token: "42" },
      destination: "/the-memes/42",
    },
    {
      params: { collection: "pebbles", q: "10000000514" },
      destination: "/nextgen/token/10000000514",
    },
    {
      params: { intent: "specific", collection: "pebbles", q: "blue" },
      destination: "/nextgen/collection/pebbles",
    },
    {
      params: { intent: "explore", collection: "//example.com" },
      destination: "/the-memes",
    },
    {
      params: { intent: "specific", collection: "gradients", token: "../42" },
      destination: "/6529-gradient",
    },
    {
      params: { intent: "specific", collection: "gradients", token: "0?buy=1" },
      destination: "/6529-gradient",
    },
    {
      params: { intent: "specific", collection: "gradients", token: "01" },
      destination: "/6529-gradient",
    },
    {
      params: { intent: "specific", collection: "gradients", token: "42\n" },
      destination: "/6529-gradient",
    },
    {
      params: {
        intent: "specific",
        collection: "memes",
        token: "1".repeat(79),
      },
      destination: "/the-memes",
    },
    {
      params: { intent: "specific", collection: "memes", token: ["1", "2"] },
      destination: "/the-memes",
    },
    {
      params: {
        intent: "specific",
        collection: "memes",
        token: "42",
        q: "43",
        recipient: "untrusted",
        action: "buy",
      },
      destination: "/the-memes/42",
    },
  ])("redirects $params to $destination", async ({ params, destination }) => {
    await expect(
      CollectPage({ searchParams: Promise.resolve(params) })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith(destination);
    expect(screen.queryByText("Collect planner")).not.toBeInTheDocument();
  });

  it.each<SearchParams>([
    {},
    { collection: "gradients" },
    { q: "blue" },
    { token: "../42" },
    { intent: "unknown", token: "42" },
    { intent: ["explore", "full_set"], token: "42" },
    ...["full_set", "season", "artist", "pebbles_set", "tdh", "lowest"].map(
      (intent) => ({ intent, collection: "memes", token: "42" })
    ),
  ])("keeps the planner for %j", async (params) => {
    render(await CollectPage({ searchParams: Promise.resolve(params) }));

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByText("Collect planner")).toBeInTheDocument();
  });
});
