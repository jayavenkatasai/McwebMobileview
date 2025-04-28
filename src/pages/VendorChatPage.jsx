// src/pages/VendorChatPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import VendorChatApp from "../components/VendorChatApp";
import { setVendorId, setPurchaser } from "../store/slices/VendorSlice";
import ExpoChatApp from "../components/ExpoChatApp";
import { validcheckurl } from "../Endpoints/EndPoint";
export default function VendorChatPage() {
  const { vendorId, purchaser } = useParams();
  console.log(vendorId, purchaser);
  const [activeTab, setActiveTab] = useState("vendor");
  const [ispaid, setispaid] = useState(null);
  const dispatch = useDispatch();
  async function checksubscription(vendorId) {
    try {
      const response = await fetch(`${validcheckurl}?u_no=${vendorId}`, {
        method: "GET",
      });

      const res = await response.json();

      if (res.success) {
        const planDetails = res.data?.planDetails;

        if (planDetails?.planid) {
          const today = new Date();
          const expiryDate = new Date(planDetails.planexpiry);

          // Compare today's date with expiry date
          if (today < expiryDate) {
            return true; // Subscription is valid
          } else {
            return false; // Subscription expired
          }
        } else {
          return false; // No valid plan id
        }
      } else {
        return false; // Response not successful
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  useEffect(() => {
    const checkexecute = async () => {
      console.log("executing is paid");
      const issubscribed = await checksubscription(vendorId); // Make sure vendorId is in scope
      console.log(issubscribed);
      setispaid(issubscribed); // Set directly
    };

    checkexecute();
  }, [vendorId]); // Dependency array should include vendorId if it's dynamic
  useEffect(() => {
    dispatch(setVendorId(vendorId));
    dispatch(setPurchaser(purchaser));
  }, [vendorId, purchaser, dispatch]);

  useEffect(() => {
    console.log(vendorId);
  }, [vendorId, purchaser, dispatch]);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <div
        className="tab-switcher"
        style={{ position: "relative", left: "370px", top: "39px" }}
      >
        {ispaid && (
          <button
            className="tab-switcher-button"
            onClick={() =>
              setActiveTab(activeTab === "expo" ? "vendor" : "expo")
            }
          >
            {activeTab == "vendor" ? "Expo Chats" : "Customer Chats"}
          </button>
        )}
      </div>

      <div className="fullpage-chat">
        {activeTab === "vendor" ? <VendorChatApp /> : <ExpoChatApp />}
      </div>
    </div>
  );
}
