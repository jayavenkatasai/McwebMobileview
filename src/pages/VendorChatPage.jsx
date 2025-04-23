// src/pages/VendorChatPage.jsx
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import VendorChatApp from "../components/VendorChatApp";
import { setVendorId, setPurchaser } from "../store/slices/VendorSlice";

export default function VendorChatPage() {
  const { vendorId, purchaser } = useParams();
  console.log(vendorId, purchaser);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setVendorId(vendorId));
    dispatch(setPurchaser(purchaser));
  }, [vendorId, purchaser, dispatch]);

  useEffect(() => {
    console.log(vendorId);
  }, [vendorId, purchaser, dispatch]);

  return (
    <div className="fullpage-chat">
      <VendorChatApp />
    </div>
  );
}
