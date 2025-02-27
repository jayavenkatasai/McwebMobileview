// src/initChat.js
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.jsx";
import store from "./store/store";
import { setPurchaser, setVendorId } from "./store/slices/VendorSlice.js";

export function initChat(options) {
  const { vendorId, pruchaser, mountId = "chat-root" } = options;

  // Set initial vendor and user IDs
  store.dispatch(setPurchaser(pruchaser));
  store.dispatch(setVendorId(vendorId));

  const mountElement = document.getElementById(mountId);
  if (!mountElement) {
    console.error(`Mount element with id "${mountId}" not found`);
    return;
  }

  // Create a root and render your app (React 18+)
  const root = ReactDOM.createRoot(mountElement);
  root.render(
    <Provider store={store}>
      <App />
    </Provider>
  );
}

window.ExpoVendorChat = {
  initChat,
};
