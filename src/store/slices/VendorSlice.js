import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiurl } from "../../Endpoints/EndPoint";

export const fetchVendorToken = createAsyncThunk(
  "vendor/fetchVendorToken",
  async (vendorId) => {
    const response = await fetch(
      `${apiurl}/api/McentralApis/GenerateVendorToken`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: vendorId,
        }),
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch vendor token");
    }
    const data = await response.json();
    console.log(data);
    if (data.token) {
      localStorage.setItem("token", data.token);
      console.log("Token stored in localStorage:", data.token);
      return data.token; // Return only the token
    } else {
      throw new Error("No token received from server");
    }
    // return await data.json();
  }
);

const vendorSlice = createSlice({
  name: "vendor",
  initialState: {
    Token: "",
    loading: false,
    error: null,
    vendorId: "",
    purchaser: true,
    chats: [],
    activeChat: null,
    messagesByRoom: {}, // { roomId1: [...], roomId2: [...] }
    messages: [],
    input: "",
    unreadCounts: {},
  },
  reducers: {
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setInput: (state, action) => {
      state.input = action.payload;
    },
    setUnreadCounts: (state, action) => {
      state.unreadCounts = action.payload;
    },
    setVendorId: (state, action) => {
      state.vendorId = action.payload;
    },
    setPurchaser: (state, action) => {
      state.vendorId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorToken.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.Token = action.payload.token;
      })
      .addCase(fetchVendorToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setChats,
  setVendorId,
  setActiveChat,
  setMessages,
  setInput,
  setUnreadCounts,
  setPurchaser,
} = vendorSlice.actions;
export default vendorSlice.reducer;
