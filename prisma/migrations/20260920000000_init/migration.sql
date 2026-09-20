-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant');
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'read', 'failed', 'received');

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "waId" TEXT NOT NULL,
    "name" TEXT,
    "lastMessage" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "metaMessageId" TEXT,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'UTILITY',
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "language" TEXT NOT NULL DEFAULT 'ar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "businessName" TEXT NOT NULL DEFAULT 'WhatsApp Majid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_waId_key" ON "Conversation"("waId");
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");
CREATE UNIQUE INDEX "Message_metaMessageId_key" ON "Message"("metaMessageId");
CREATE INDEX "Message_conversationId_timestamp_idx" ON "Message"("conversationId", "timestamp");
CREATE UNIQUE INDEX "Template_name_key" ON "Template"("name");
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
