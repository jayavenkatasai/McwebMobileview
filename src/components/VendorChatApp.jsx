// VendorChatApp.jsx (Vendor side)
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import useFetch from "../Hooks/useFetch";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorToken } from "../store/slices/VendorSlice";
import { IoArrowBackOutline } from "react-icons/io5";
import {
  setChats,
  setActiveChat,
  setMessages,
  setInput,
  setUnreadCounts,
} from "../store/slices/VendorSlice";
import { apiurl, socketurl } from "../Endpoints/EndPoint";
import './VendorChatApp.css'

const socket = io(socketurl);
const vendorId = "68644";

function VendorChatApp() {
  const { chats, unreadCounts, activeChat, input, messages } = useSelector(
    (state) => state.vendor
  );
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchVendorToken(68644));
  }, []);

  const {
    data: GetchatsData,
    loading: GetChatsLoading,
    error: GetChatsError,
    fetchData: GetChatsForVendor,
  } = useFetch();

  const {
    data: chatmessageRes,
    loading: chatMessageLoading,
    error: chatMessageError,
    fetchData: GetchatMessages,
  } = useFetch();

  const {
    data: postedMessage,
    loading: postedMessageLoading,
    error: postedMessageError,
    fetchData: PostchatMessages,
  } = useFetch();

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    if (GetChatsError) {
      console.error(GetChatsError);
      dispatch(setChats([]));
    } else if (GetchatsData) {
      dispatch(setChats(GetchatsData));
    }
  }, [GetchatsData, GetChatsError, dispatch]);

  useEffect(() => {
    chats.forEach((chat) => {
      socket.emit("joinRoom", { roomId: chat.roomId });
    });
  }, []);

  useEffect(() => {
    const handleMessage = (data) => {
      if (chats.find((chat) => chat.roomId === data.roomId)) {
        if (
          activeChatRef.current &&
          activeChatRef.current.roomId === data.roomId
        ) {
          setMessages((prev) => [...prev, data]);
          setUnreadCounts((prev) => ({ ...prev, [data.roomId]: 0 }));
        } else {
          setUnreadCounts((prev) => ({
            ...prev,
            [data.roomId]: (prev[data.roomId] || 0) + 1,
          }));
        }
      }
    };

    socket.on("chatMessage", handleMessage);
    return () => {
      socket.off("chatMessage", handleMessage);
    };
  }, [chats]);

  useEffect(() => {
    GetChatsForVendor(
      `${apiurl}/api/ExpoChat/GetRoomsById/?vendorId=${vendorId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, //
        },
      }
    );
  }, []);

  //neww

  // Update chats in Redux when fetched.
  useEffect(() => {
    if (GetChatsError) {
      console.error(GetChatsError);
      dispatch(setChats([]));
    } else if (GetchatsData) {
      dispatch(setChats(GetchatsData));
    }
  }, [GetchatsData, GetChatsError, dispatch]);

  // Join all rooms.
  useEffect(() => {
    chats.forEach((chat) => {
      // Use a consistent property name (roomId).
      socket.emit("joinRoom", { roomId: chat.roomId });
    });
  }, [chats]);

  // Socket listener for incoming messages.
  useEffect(() => {
    const handleMessage = (data) => {
      // Check if the message belongs to one of our chats.
      if (chats.find((chat) => chat.roomId === data.roomId)) {
        if (
          activeChatRef.current &&
          activeChatRef.current.roomId === data.roomId
        ) {
          // Append new message to active chat.
          dispatch(setMessages([...messages, data]));
          dispatch(setUnreadCounts({ ...unreadCounts, [data.roomId]: 0 }));
        } else {
          // Increase unread count for the relevant chat.
          dispatch(
            setUnreadCounts({
              ...unreadCounts,
              [data.roomId]: (unreadCounts[data.roomId] || 0) + 1,
            })
          );
        }
      }
    };

    socket.on("chatMessage", handleMessage);
    return () => {
      socket.off("chatMessage", handleMessage);
    };
  }, [chats, messages, unreadCounts, dispatch]);

  //new-----

  const joinChat = async (chat) => {
    dispatch(setActiveChat(chat));
    dispatch(setMessages([]));

    try {
      // Ensure your API URL is correct: adding a slash between GetRoom and roomId.
      const fetchedMessages = await GetchatMessages(
        `${apiurl}/api/ExpoChat/GetRoom${chat.roomId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      console.log(fetchedMessages);
      if (fetchedMessages && fetchedMessages.length > 0) {
        dispatch(setMessages(fetchedMessages));
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }

    socket.emit("joinRoom", { roomId: chat.roomId });
    // Reset unread count for this room.
    dispatch(setUnreadCounts({ ...unreadCounts, [chat.roomId]: 0 }));
  };

  const sendMessage = async () => {
    if (activeChat && input.trim() !== "") {
      const messageData = {
        roomId: activeChat.roomId,
        senderId: vendorId,
        sender: "vendor",
        message: input,
      };
      // Emit the message via socket.
      socket.emit("chatMessage", messageData);
      // Optimistically update the UI.
      dispatch(
        setMessages([...messages, { ...messageData, sentAt: new Date() }])
      );
      dispatch(setInput(""));

      // Post the message using the custom hook.
      try {
        await PostchatMessages(`${apiurl}/api/ExpoChat/PostChatMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: {
            message: input,
            vendorName: activeChat.vendorName,
            sender: "vendor",
            room: messageData.roomId,
            vendorId: activeChat.vendorId,
          },
        });
      } catch (error) {
        console.error("Error posting message:", error);
      }
    }
  };

  return (
    <div className="chat-app-container">
      {/* Sidebar with chat list and unread notifications */}
      {!activeChat && <div className="chat-list-container">
        <h3 className="chat-list-header">Your Chats</h3>
        {GetChatsLoading && <p>Loading...</p>}
        <ul className="chat-list">
          {chats.map((chat) => (
            <li
              key={chat.roomId}
              onClick={() => joinChat(chat)}
              className="chat-list-item"
            >
              <div className="chat-name">{chat.customerName}</div>

              {unreadCounts[chat.roomId] > 0 && (
                <span className="unread-count">
                  {unreadCounts[chat.roomId]}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      }

      {/* Chat Window */}
    
        {activeChat && (
              <div className="chat-conversation-container">
                <div className="conversation-header">
                  <IoArrowBackOutline
                    className="back-button"
                    onClick={() => dispatch(setActiveChat(null))}
                  />
            <h3 className="conversation-title"> Chat with {activeChat.customerName}</h3>
             </div>
            <div
             className="conversation-messages"
          >
             {chatMessageLoading && (
              <p className="loading">Loading messages...</p>
            )}
              {messages.map((msg, index) => (
                <div
                  key={index}
                   className={`chat-message ${
                  msg.sender === "vendor" ? "sent" : "received"
                }`}
                 
                >
                      <div className="message-text"> {msg.message}</div>
                
                <div className="message-timestamp">
                  {(msg.createdDate && (
                    <small>
                      {new Intl.DateTimeFormat("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      }).format(new Date(msg.createdDate))}
                    </small>
                  )) || (
                    <small>
                      {new Intl.DateTimeFormat("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      }).format(new Date(msg.sentAt))}
                    </small>
                  )}
                     </div>
                </div>
              ))}
            </div>
            <div className="conversation-input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => dispatch(setInput(e.target.value))}
                placeholder="Type your message..."
               className="conversation-input"
              />
              <button onClick={sendMessage} className="send-button">
                Send
              </button>
          </div>
          </div>
       
        ) }
      </div>
  
  );
}

export default VendorChatApp;
