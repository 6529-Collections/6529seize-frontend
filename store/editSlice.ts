import { Action, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";
import type { AppState } from "./store";

interface EditState {
  editingDropId: string | null;
}

const initialState: EditState = {
  editingDropId: null,
};

interface HydrateAction extends Action<typeof HYDRATE> {
  payload: {
    edit: EditState;
  };
}

export const editSlice = createSlice({
  name: "edit",
  initialState,
  reducers: {
    setEditingDropId: (state, action: PayloadAction<string | null>) => {
      state.editingDropId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(HYDRATE, (state, action: HydrateAction) => {
      return {
        ...state,
        ...action.payload.edit,
      };
    });
  },
});

export const { setEditingDropId } = editSlice.actions;
export const selectEditingDropId = (state: AppState) =>
  state.edit.editingDropId;