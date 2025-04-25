import { configureStore } from "@reduxjs/toolkit";

import vendorReducer from "./slices/VendorSlice";
import ExpoReducer from "./slices/ExpoSlice";

const store = configureStore({
  reducer: {
    vendor: vendorReducer,
    expo: ExpoReducer,
  },
});

export default store;
