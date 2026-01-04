"use client";

import React, { useState } from "react";
import type {
  ActiveDropState,
} from "@/types/dropInteractionTypes";
import BrainContent from "../content/BrainContent";
import Notifications from "./index";

const NotificationsContainer: React.FC = () => {
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);

  const onCancelReplyQuote = () => {
    setActiveDrop(null);
  };

  return (
    <BrainContent
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}
      showPinnedWaves={false}>
      <Notifications 
        activeDrop={activeDrop}
        setActiveDrop={setActiveDrop}
      />
    </BrainContent>
  );
};

export default NotificationsContainer; 
