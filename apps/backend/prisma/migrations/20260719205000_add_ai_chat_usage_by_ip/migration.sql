-- CreateTable
CREATE TABLE "AiChatUsageByIp" (
    "ipHash" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChatUsageByIp_pkey" PRIMARY KEY ("ipHash","dateKey")
);

-- EnableRowLevelSecurity
ALTER TABLE "AiChatUsageByIp" ENABLE ROW LEVEL SECURITY;
