import { createSlice, PayloadAction } from "@reduxjs/toolkit";
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
    incrementCounter(state, action: PayloadAction<number>) {
      state.value += action.payload;
    },
    decrementCounter(state, action: PayloadAction<number>) {
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


// import { useDispatch, useSelector } from "react-redux";
// import {
//   selectCounter,
//   incrementCounter,
//   decrementCounter,
// } from "../../store/counterSlice";

// usage;
//   const counter = useSelector(selectCounter);
//   const dispatch = useDispatch();

//   useEffect(() => {
//     if (foo) {
//       dispatch(incrementCounter(1));
//     } else {
//       dispatch(decrementCounter(1));
//     }
//   }, [foo]);

//   useEffect(() => {
//     console.log("counter", counter);
//   }, [counter]);