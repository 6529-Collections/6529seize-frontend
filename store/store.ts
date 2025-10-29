import { publicEnv } from "@/config/env";
import { configureStore } from "@reduxjs/toolkit";
import { editSlice } from "./editSlice";
import { groupSlice } from "./groupSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      [groupSlice.name]: groupSlice.reducer,
      [editSlice.name]: editSlice.reducer,
    },
    devTools: publicEnv.NODE_ENV !== "production",
  });

type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore["getState"]>;
