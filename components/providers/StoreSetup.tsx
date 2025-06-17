"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { wrapper } from "@/store/store";

export default function StoreSetup({ children }: { children: ReactNode }) {
  const store = wrapper.useWrappedStore({});

  return <Provider store={store.store}>{children}</Provider>;
}
