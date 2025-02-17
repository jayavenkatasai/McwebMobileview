import { configureStore } from "@reduxjs/toolkit";

import vendorReducer from "./slices/VendorSlice"

const store = configureStore({
    reducer: {
        vendor: vendorReducer
    }
})

export default store;