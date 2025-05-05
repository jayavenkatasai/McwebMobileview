// VendorChatApp.jsx (Vendor side)
import React, { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import useFetch from "../Hooks/useFetch";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorToken } from "../store/slices/VendorSlice";
import { IoArrowBackOutline } from "react-icons/io5";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdOutlineRefresh } from "react-icons/md";
import "../Loading/SpinnerLoading.css";
import {
  setChats,
  setActiveChat,
  setMessages,
  setInput,
  setUnreadCounts,
} from "../store/slices/ExpoSlice";
import { apiurl, socketurl } from "../Endpoints/EndPoint";
import "./VendorChatApp.css";
import { useMemo } from "react";

//const vendorId = "69385"; //68644

function ExpoChatApp({ sharedSocket }) {
  const [refreshloading, setrefreshloading] = useState(false);
  const socket = useMemo(() => io(socketurl, { autoConnect: true }), []); //sharedSocket; //
  // const socket = io(socketurl);
  const {
    chats,
    unreadCounts,
    activeChat,
    input,
    messages,
    Token,
    // vendorId,
    // purchaser,
  } = useSelector((state) => state.expo);
  const { vendorId, purchaser } = useSelector((state) => state.vendor);
  console.log(vendorId, purchaser);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchVendorToken(vendorId));
  }, []);
  const previousRoomIdsRef = useRef(new Set());
  useEffect(() => {
    previousRoomIdsRef.current = new Set(chats.map((c) => c.roomId));
  }, [chats]);

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
    socket.emit("vendorjoin", { vendorId: vendorId });
    // chats.forEach((chat) => {
    //   socket.emit("joinRoom", { roomId: chat.roomId });
    // });
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
    if (localStorage.getItem("token")?.length > 0) {
      GetChatsForVendor(
        `${apiurl}/api/ExpoChat/GetRoomsById/?vendorId=${vendorId}&purchaser=${purchaser}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, //
          },
        }
      );
    }
  }, [Token, dispatch]);
  const joinedRooms = useRef(new Set());
  // join new rooms only
  useEffect(() => {
    chats.forEach((chat) => {
      if (!joinedRooms.current.has(chat.roomId)) {
        socket.emit("joinRoom", { roomId: chat.roomId });
        joinedRooms.current.add(chat.roomId);
        console.log(`Joined new room ${chat.roomId}`);
      }
    });
  }, [chats, socket]);

  // refresh button
  // New: refreshChats function triggered by the refresh button.
  // const refreshChats = async () => {
  //   setrefreshloading(true);
  //   try {
  //     const response = await fetch(
  //       `${apiurl}/api/McentralApis/GetRoomsById/?vendorId=${vendorId}&purchaser=${purchaser}`,
  //       {
  //         method: "GET",
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         },
  //       }
  //     );
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch updated chats");
  //     }
  //     setrefreshloading(false);
  //     const updatedChats = await response.json();

  //     // Identify new chat rooms that are not in the current list.
  //     const currentRoomIds = new Set(chats?.map((chat) => chat.roomId));
  //     const newChats = updatedChats.filter(
  //       (chat) => !currentRoomIds.has(chat.roomId)
  //     );

  //     if (newChats.length > 0) {
  //       toast.info("A new chat has arrived!");
  //       // Only emit joinRoom for new chat rooms.
  //       newChats.forEach((chat) => {
  //         socket.emit("joinRoom", { roomId: chat.roomId });
  //       });
  //     }
  //     // Update Redux with the new chat list.
  //     dispatch(setChats(updatedChats));
  //   } catch (error) {
  //     console.error("Error refreshing vendor chat data:", error);
  //   } finally {
  //     setrefreshloading(false);
  //   }
  // };

  const refreshChats = useCallback(
    async (shouldNotify = true) => {
      setrefreshloading(true);
      try {
        const resp = await fetch(
          `${apiurl}/api/ExpoChat/GetRoomsById/?vendorId=${vendorId}&purchaser=${purchaser}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!resp.ok) throw new Error("Failed to fetch updated chats");
        const updatedChats = await resp.json();

        // compute which rooms are *actually new*
        const prev = previousRoomIdsRef.current;
        const newChats = updatedChats.filter((chat) => !prev.has(chat.roomId));

        // if we *really* have new ones AND the caller wants notifications...
        if (shouldNotify && newChats.length > 0) {
          toast.info("A new chat has arrived!");
          newChats.forEach((chat) =>
            socket.emit("joinRoom", { roomId: chat.roomId })
          );
        }

        // update Redux
        dispatch(setChats(updatedChats));
      } catch (err) {
        console.error("Error refreshing vendor chat data:", err);
      } finally {
        setrefreshloading(false);
      }
    },
    [dispatch, purchaser, vendorId, socket]
  );
  // At the top of your VendorChatApp.jsx, assume you have:
  const isVendorPaid = false; // Replace with your actual check from Redux or an API

  // Inside your VendorChatApp component, add:
  useEffect(() => {
    const handleCustomerDisconnect = (data) => {
      console.log("Customer disconnected from room:", data.roomId);
      if (!purchaser) {
        // Filter out the chat room that the customer has disconnected from.
        const updatedChats = chats.filter(
          (chat) => chat.roomId !== data.roomId
        );
        dispatch(setChats(updatedChats));
        refreshChats();
        toast.info(`Chat room ${data.roomId} removed (customer disconnected)`);
      } else {
        // For paid vendors, you might keep the room or mark it inactive in some way.
        console.log("Vendor is paid; keeping disconnected room:", data.roomId);
      }
    };

    socket.on("customerDisconnected", handleCustomerDisconnect);

    return () => {
      socket.off("customerDisconnected", handleCustomerDisconnect);
    };
  }, [chats, dispatch, purchaser]);

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
  useEffect(() => {
    const handleRefreshData = async (data) => {
      console.log("Vendor refreshdata received:", data);
      // Reuse the same logic as refreshChats.
      refreshChats(false);
    };

    socket.on("refreshdata", handleRefreshData);
    return () => {
      socket.off("refreshdata", handleRefreshData);
    };
  }, []);
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
      {!activeChat && (
        <div className="chat-list-container">
          <div className="chat-list-header-container">
            {/* <p className="chat-list-header"></p> */}
            {GetChatsLoading || refreshloading ? (
              <div className="spinnerContainer">
                <div className="spinner"></div>
                {/* <p>Loading....</p> */}
              </div>
            ) : (
              <MdOutlineRefresh
                onClick={refreshChats}
                className="refresh-button"
              />
            )}

            {/* <button onClick={refreshChats}>Refresh</button> */}
          </div>
          {GetChatsLoading || refreshloading ? (
            <div className="spinnerContainer">
              <div className="spinner"></div>
              {/* <p>Loading....</p> */}
            </div>
          ) : (
            chats.length === 0 && (
              <p
                style={{
                  color: "#000",
                  margin: "0px",
                  padding: "5px",
                  fontSize: "18px",
                  fontWeight: "500",
                }}
              >
                No customers are available to chat
              </p>
            )
          )}
          <ul className="chat-list">
            {chats.map((chat) => (
              <li
                key={chat.roomId}
                onClick={() => joinChat(chat)}
                className="chat-list-item"
              >
                <div className="chat-name">
                  {chat.customerName || chat.customerId}
                </div>

                {unreadCounts[chat.roomId] > 0 && (
                  <span className="unread-count">
                    {unreadCounts[chat.roomId]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chat Window */}

      {activeChat && (
        <div className="chat-conversation-container">
          <div className="conversation-header">
            <IoArrowBackOutline
              className="back-button"
              onClick={() => dispatch(setActiveChat(null))}
            />
            <h3 className="conversation-title">
              {activeChat.customerName || activeChat.customerId}
            </h3>
          </div>
          <div>
            <p style={{ textAlign: "left", paddingLeft: "20px" }}>
              Email:{" "}
              {activeChat.customerEmail ? (
                <a href={`mailto:${activeChat.customerEmail}`}>
                  {activeChat.customerEmail}
                </a>
              ) : (
                "No Email available"
              )}
            </p>
          </div>
          <div className="conversation-messages">
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button onClick={sendMessage} className="send-button">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpoChatApp;
