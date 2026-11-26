-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cursorSub" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_cursorSub_key" ON "User"("cursorSub");

