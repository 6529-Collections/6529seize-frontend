import React from "react";
import { useRouter } from "next/router";
import BrainMobileWaves from "./BrainMobileWaves";

const BrainMobileMessages: React.FC = () => {
  const router = useRouter();
  
  // Force the view parameter for messages when using this component
  if (router.query.view !== "messages") {
    const currentQuery = { ...router.query, view: "messages" };
    
    // Redirect to the messages view
    router.replace(
      { pathname: router.pathname, query: currentQuery },
      undefined,
      { shallow: true }
    );
  }

  // Use the shared component that handles both waves and messages
  return <BrainMobileWaves />;
};

export default BrainMobileMessages;
