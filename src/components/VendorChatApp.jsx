// VendorChatApp.jsx (Vendor side)
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

// Connect to the socket server.
const socket = io("http://localhost:8002");
const vendorId = "vendor123"; // Replace with your actual logged-in vendor ID

function VendorChatApp() {
  const [chats, setChats] = useState([]);             // Vendor's chat list
  const [activeChat, setActiveChat] = useState(null);   // Currently active chat
  const [messages, setMessages] = useState([]);         // Messages in the active chat
  const [input, setInput] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});   // { roomId: unreadCount }

  // Use a ref to always have the current active chat inside the socket listener.
  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // On mount, set up dummy chats and join all rooms.
  useEffect(() => {
    const dummyChats = [
      { roomId: "room1", customerName: "Customer A", vendorId: vendorId },
      { roomId: "room2", customerName: "Customer B", vendorId: vendorId },
    ];
    setChats(dummyChats);
    // Join every room so the vendor receives messages (and notifications) for all chats.
    dummyChats.forEach((chat) => {
      socket.emit("joinRoom", { roomId: chat.roomId });
    });
  }, []);

  // Register a stable socket listener.
  useEffect(() => {
    const handleMessage = (data) => {
      // Process messages only for rooms that are in our chat list.
      if (chats.find((chat) => chat.roomId === data.roomId)) {
        // If the chat is currently active, update the message list and reset its unread count.
        if (activeChatRef.current && activeChatRef.current.roomId === data.roomId) {
          setMessages((prev) => [...prev, data]);
          setUnreadCounts((prev) => ({ ...prev, [data.roomId]: 0 }));
        } else {
          // Otherwise, increment the unread count.
          setUnreadCounts((prev) => ({
            ...prev,
            [data.roomId]: (prev[data.roomId] || 0) + 1,
          }));
          // OPTIONAL: Trigger a toast or browser notification here.
        }
      }
    };

    socket.on("chatMessage", handleMessage);
    return () => {
      socket.off("chatMessage", handleMessage);
    };
  }, [chats]);

  // When a vendor selects a chat, we update the active chat (but we do not leave any room).
  const joinChat = (chat) => {
    setActiveChat(chat);
    setMessages([]);
    // Ensure we're joined to this room (this is idempotent now).
    socket.emit("joinRoom", { roomId: chat.roomId });
    // Reset unread count for this room.
    setUnreadCounts((prev) => ({ ...prev, [chat.roomId]: 0 }));
  };

  const sendMessage = () => {
    if (activeChat && input.trim() !== "") {
      const messageData = {
        roomId: activeChat.roomId,
        senderId: vendorId,
        sender: "vendor",
        message: input,
      };
      socket.emit("chatMessage", messageData);
      // Optionally update the UI immediately.
      setMessages((prev) => [...prev, { ...messageData, sentAt: new Date() }]);
      setInput("");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#eef" }}>
      {/* Sidebar with chat list and unread notifications */}
      <div style={{ width: "30%", borderRight: "1px solid #ccc", padding: "10px" }}>
        <h3>Your Chats</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {chats.map((chat) => (
            <li
              key={chat.roomId}
              onClick={() => joinChat(chat)}
              style={{
                cursor: "pointer",
                padding: "8px",
                marginBottom: "4px",
                background: activeChat && activeChat.roomId === chat.roomId ? "#ddd" : "transparent",
              }}
            >
              {chat.customerName}
              {unreadCounts[chat.roomId] > 0 && (
                <span
                  style={{
                    marginLeft: "5px",
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "0.8rem",
                  }}
                >
                  {unreadCounts[chat.roomId]}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Window */}
      <div style={{ width: "70%", padding: "10px", display: "flex", flexDirection: "column" }}>
        {activeChat ? (
          <>
            <h3>Chat with {activeChat.customerName}</h3>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
              }}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    textAlign: msg.sender === "vendor" ? "right" : "left",
                    margin: "8px 0",
                  }}
                >
                  <span
                    style={{
                      background: msg.sender === "vendor" ? "#cce5ff" : "#d4edda",
                      padding: "8px",
                      borderRadius: "5px",
                      display: "inline-block",
                    }}
                  >
                    {msg.message}
                  </span>
                  <br />
                  <small>{new Date(msg.sentAt).toLocaleTimeString()}</small>
                </div>
              ))}
            </div>
            <div style={{ display: "flex" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                style={{ flex: 1, padding: "10px", marginRight: "10px" }}
              />
              <button onClick={sendMessage} style={{ padding: "10px" }}>
                Send
              </button>
            </div>
          </>
        ) : (
          <p>Please select a chat to start messaging.</p>
        )}
      </div>
    </div>
  );
}

export default VendorChatApp;
