import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import VendorChatApp from "./components/VendorChatApp";
import { useDispatch, useSelector } from "react-redux";
import { GrChatOption } from "react-icons/gr";
import { ToastContainer } from "react-toastify";
import { useRef } from "react";
function App() {
  const [showChat, setShowChat] = useState(false);

  const displayref = useRef();
  return (
    <>
      <ToastContainer />
      <button className="chat-button" onClick={() => setShowChat(!showChat)}>
        <GrChatOption size={24} />
      </button>
      <div
        ref={displayref}
        className={`chat-container ${showChat ? "open" : ""}`}
      >
        <VendorChatApp></VendorChatApp>
      </div>
    </>
  );
}

export default App;
