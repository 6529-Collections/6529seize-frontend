"use client";

import React, { useState } from "react";
import {
  ActiveDropState,
} from "@/types/dropInteractionTypes";
import BrainContent from "../content/BrainContent";
import Notifications from "./Notifications";

const NotificationsContainer: React.FC = () => {
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  return (
    <BrainContent
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}>
      <Notifications 
        activeDrop={activeDrop}
        setActiveDrop={setActiveDrop}
      />
    </BrainContent>
  );
};

export default NotificationsContainer; 