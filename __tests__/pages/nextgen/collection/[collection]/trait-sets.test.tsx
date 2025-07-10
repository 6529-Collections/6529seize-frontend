import React from "react";
import { render } from "@testing-library/react";
import Page, {
  getServerSideProps,
} from "../../../../../pages/nextgen/collection/[collection]/trait-sets";

let headerProps: any = null;
let setsProps: any = null;

jest.mock(
  "../../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader",
  () => ({
    NextGenCollectionHead: (p: any) => {
      headerProps = p;
      return <div data-testid="head" />;
    },
    getServerSideCollection: jest.fn(() =>
      Promise.resolve({ props: { ok: true } })
    ),
  })
);

jest.mock(
  "../../../../../components/nextGen/collections/NextGenNavigationHeader",
  () => () => <div data-testid="nav" />
);

jest.mock("next/dynamic", () => () => (p: any) => {
  setsProps = p;
  return <div data-testid="dynamic" />;
});

const {
  getServerSideCollection,
} = require("../../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader");

describe("NextGen trait sets page", () => {
  beforeEach(() => {
    headerProps = null;
    setsProps = null;
  });

  it("passes collection to components", () => {
    const props = { collection: { id: 1 } } as any;
    render(<Page {...props} />);
    expect(headerProps).toEqual({ collection: props.collection });
    expect(setsProps).toEqual({ collection: props.collection });
  });

  it("delegates getServerSideProps", async () => {
    const req = {} as any;
    const res = await getServerSideProps(req, null as any, "/p");
    expect(getServerSideCollection).toHaveBeenCalledWith(req, "Trait Sets");
    expect(res).toEqual(await getServerSideCollection.mock.results[0].value);
  });
});
