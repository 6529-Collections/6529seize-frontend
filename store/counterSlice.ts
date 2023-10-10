import { createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";
import type { AppState } from "./store";

export interface CounterState {
  value: number;
}

const initialState: CounterState = {
  value: 0,
};

export const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    incrementCounter(state, action) {
      state.value += action.payload;
    },
    decrementCounter(state, action) {
      state.value -= action.payload;
    },
  },

  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.counter,
      };
    },
  },
});


export const { incrementCounter, decrementCounter } = counterSlice.actions;
export const selectCounter = (state: AppState) => state.counter.value;
export default counterSlice.reducer;