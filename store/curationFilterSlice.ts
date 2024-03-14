import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";
import type { AppState } from "./store";

export interface CurationFilterState {
  activeCurationFilterId: string | null;
}

const initialState: CurationFilterState = {
  activeCurationFilterId: null,
};

export const curationFilterSlice = createSlice({
  name: "curationFilter",
  initialState,
  reducers: {
    setActiveCurationFilterId: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.activeCurationFilterId = action.payload;
    },
  },
  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.activeCurationFilterId,
      };
    },
  },
});

export const { setActiveCurationFilterId } = curationFilterSlice.actions;
export const selectActiveCurationFilterId = (state: AppState) =>
  state.curationFilter.activeCurationFilterId;
export default curationFilterSlice.reducer;
