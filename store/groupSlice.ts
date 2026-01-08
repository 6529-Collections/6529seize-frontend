import type { Action, PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";
import type { AppState } from "./store";

interface GroupState {
  activeGroupId: string | null;
}

const initialState: GroupState = {
  activeGroupId: null,
};

interface HydrateAction extends Action<typeof HYDRATE> {
  payload: {
    counter: GroupState;
  };
}

export const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
    setActiveGroupId: (state, action: PayloadAction<string | null>) => {
      state.activeGroupId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(HYDRATE, (state, action: HydrateAction) => {
      return {
        ...state,
        ...action.payload.counter,
      };
    });
  },
});

export const { setActiveGroupId } = groupSlice.actions;
export const selectActiveGroupId = (state: AppState) =>
  state.group.activeGroupId;
