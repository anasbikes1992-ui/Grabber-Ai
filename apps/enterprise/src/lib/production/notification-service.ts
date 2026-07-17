import { log } from "@/lib/production/logger";

type NotificationChannel = "email" | "whatsapp" | "sms" | "push";

type NotificationInput = {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  message: string;
  metadata?: Record<string, unknown>;
};

/**
 * Enterprise 1.0 baseline notification abstraction.
 * Provider adapters can replace this transport without changing callers.
 */
export async function sendNotification(input: NotificationInput) {
  if (process.env.NODE_ENV === "production" && process.env.NOTIFICATIONS_ENABLED !== "1") {
    throw new Error("notification service is not configured for production");
  }

  log("info", {
    event: "notification.queued",
    details: {
      channel: input.channel,
      to: input.to,
      subject: input.subject || "",
      metadata: input.metadata || {},
    },
  });

  return {
    ok: true,
    channel: input.channel,
    queuedAt: new Date().toISOString(),
  };
}
