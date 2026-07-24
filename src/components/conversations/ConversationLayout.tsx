"use client";

import { useState } from "react";
import ConversationSidebar from "./ConversationSidebar";
import ConversationChat from "./ConversationChat";
import ConversationDetails from "./ConversationDetails";
import { Conversation } from "./types";

export default function ConversationLayout() {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);


  return (
    <div className="flex h-[700px] w-full overflow-hidden rounded-xl border">

      <ConversationSidebar
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
      />


      <ConversationChat
        conversation={selectedConversation}
      />


      <ConversationDetails
        conversation={selectedConversation}
      />

    </div>
  );
}