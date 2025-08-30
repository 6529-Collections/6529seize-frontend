"use client";

import MyStreamLayout from "@/components/brain/my-stream/layout/MyStreamLayout";
import MyStreamWrapper from "@/components/brain/my-stream/MyStreamWrapper";

export default function MyStreamPageClient() {
  return (
    <MyStreamLayout>
      <MyStreamWrapper />
    </MyStreamLayout>
  );
}