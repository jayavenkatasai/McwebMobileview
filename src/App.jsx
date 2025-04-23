// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import "./App.css";
// import VendorChatApp from "./components/VendorChatApp";
// import { useDispatch, useSelector } from "react-redux";
// import { GrChatOption } from "react-icons/gr";
// import { ToastContainer } from "react-toastify";
// import { useRef } from "react";
// function App() {
//   const [showChat, setShowChat] = useState(false);

//   const displayref = useRef();
//   return (
//     <>
//       <ToastContainer />
//       <button className="chat-button" onClick={() => setShowChat(!showChat)}>
//         <GrChatOption size={24} />
//       </button>
//       <div
//         ref={displayref}
//         className={`chat-container ${showChat ? "open" : ""}`}
//       >
//         <VendorChatApp></VendorChatApp>
//       </div>
//     </>
//   );
// }

// export default App;

// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import VendorChatPage from "./pages/VendorChatPage";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* whenever you hit /vendorchat/:vendorId/:purchaser */}
        <Route
          path="/vendorchat/:vendorId/:purchaser"
          element={<VendorChatPage />}
        />
        {/* optional: redirect root to a default route */}
        <Route path="*" element={<Navigate to="/vendorchat/69385/true" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
