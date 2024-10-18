import React from "react";
import MyStream from "./MyStream";
import { useRouter } from "next/router";
import MyStreamWave from "./MyStreamWave";

const MyStreamWrapper: React.FC = () => {
  const router = useRouter();
  const { wave: waveId } = router.query;

  if (typeof waveId === "string") {
    return <MyStreamWave waveId={waveId} />;
  }
  return <MyStream />;
};

export default MyStreamWrapper;
