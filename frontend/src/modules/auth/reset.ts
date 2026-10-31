import prisma from "@/lib/db";
import crypto from "crypto";

export async function createPasswordResetToken(email: string): Promise<{ token: string; user: { id: string; email: string; name: string } } | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return { token: rawToken, user: { id: user.id, email: user.email, name: user.name } };
}

export async function consumePasswordResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const resetRecord = await prisma.passwordReset.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetRecord) return null;
  if (resetRecord.usedAt) return null;
  if (new Date() > resetRecord.expiresAt) return null;

  await prisma.passwordReset.update({
    where: { id: resetRecord.id },
    data: { usedAt: new Date() },
  });

  return resetRecord.userId;
}

