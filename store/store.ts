import { configureStore } from "@reduxjs/toolkit";
import { createWrapper } from "next-redux-wrapper";
import { groupSlice } from "./groupSlice";
import { editSlice } from "./editSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      [groupSlice.name]: groupSlice.reducer,
      [editSlice.name]: editSlice.reducer,
    },
    devTools: process.env.NODE_ENV !== "production",
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const wrapper = createWrapper<AppStore>(makeStore);
