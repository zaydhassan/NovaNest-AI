import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { chatSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";
import {
  UnauthorizedError,
  UserNotFoundError,
} from "@/lib/errors";
import { generateTextStream } from "@/lib/ai/gemini";
import { recallMemory } from "@/lib/career/memory/memory-service";
import { retrieveRelevantMemories } from "@/lib/career/memory/memory-engine";
import { recordTimelineEvent } from "@/lib/career/timeline/timeline-engine";
import { createNotification } from "@/lib/notifications";
import { bumpActivity } from "@/lib/gamify";
import { fromChat } from "@/lib/career/memory/memory-extractors";
import { Coordinator } from "@/lib/career/agents/coordinator";
import { gatherChatContextData } from "@/lib/career/agents/chat-context-data";
import { parseCitations } from "@/lib/career/ui/citations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const b64 = (obj) =>
  Buffer.from(JSON.stringify(obj), "utf8").toString("base64");

async function resolveUser() {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      clerkUserId: true,
      industry: true,
      experience: true,
      skills: true,
      bio: true,
      streak: true,
    },
  });
  if (!user) throw new UserNotFoundError();
  return user;
}

export async function POST(req) {
  let user;
  try {
    user = await resolveUser();
  } catch (e) {
    const status = e instanceof UnauthorizedError ? 401 : 404;
    return NextResponse.json({ error: e.message || "Unauthorized" }, { status });
  }

  let parsed;
  try {
    const body = await req.json();
    parsed = chatSchema.safeParse(body);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues?.[0]?.message ?? "Invalid message." },
      { status: 400 }
    );
  }
  const { text, sessionId } = parsed.data;

  try {
    rateLimit({ key: `chat:${user.clerkUserId}`, limit: 30, windowMs: 60_000 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 429 });
  }

  const [memory, ctxData, structured] = await Promise.all([
    recallMemory({ userId: user.id, query: text, limit: 12 }).catch(() => []),
    gatherChatContextData(user).catch((e) => {
      console.error("[NovaNest] chat context gather failed:", e?.message);
      return {
        extras: {},
        metrics: {},
        recentMocks: null,
        resumeSummary: null,
        applicationsSummary: null,
        goal: null,
        recommendedTopics: [],
      };
    }),
    retrieveRelevantMemories({ userId: user.id, query: text }).catch(() => ({
      block: "",
      manifest: { sources: [], citations: [], totalItems: 0 },
    })),
  ]);

  const plan = await Coordinator.route({
    userId: user.id,
    input: text,
    memory,
    user,
    ctx: ctxData,
  }).catch((e) => {
    console.error("[NovaNest] coordinator.route failed:", e?.message);
    return null;
  });

  const basePrompt =
    plan?.synthesisPrompt ??
    `You are NovaNest, an AI career companion. Answer the user's message warmly and concretely.\n\nUser message:\n${text}\n\nReply:`;

  const synthesisPrompt = structured?.block
    ? `${structured.block}\n\n${basePrompt}`
    : basePrompt;

  let session = null;
  let userMessage = null;
  try {
    await db.$transaction(async (tx) => {
      if (sessionId) {
        session = await tx.chatSession.findFirst({
          where: { id: sessionId, userId: user.id },
          select: { id: true, title: true },
        });
      }
      if (!session) {
        session = await tx.chatSession.create({
          data: {
            userId: user.id,
            title: text.slice(0, 80),
          },
        });
      }
      userMessage = await tx.chatMessage.create({
        data: {
          userId: user.id,
          sessionId: session.id,
          role: "user",
          content: text,
        },
      });
    });
  } catch (e) {
    console.error("[NovaNest] chat session/user-message persist failed:", e?.message);
    return NextResponse.json({ error: "Couldn't start the conversation." }, { status: 500 });
  }

  const finalSessionId = session.id;

  const meta = {
    intent: plan?.intent ?? "general",
    agentIds: plan?.agentIds ?? ["coach"],
    followUps: plan?.followUps ?? [],
    memoryBlocks: plan?.memoryBlocks ?? [],
    structuredMemories: structured?.manifest ?? null,
  };

  const headers = new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Session-Id": finalSessionId,
    "X-Career-OS-Meta": b64(meta),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let replyText = "";
      try {
        for await (const chunk of generateTextStream(synthesisPrompt, {
          signal: req.signal,
        })) {
          if (req.signal?.aborted) break;
          replyText += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        console.error("[NovaNest] chat stream failed:", e?.message);
        if (!replyText) {
          controller.enqueue(
            encoder.encode(
              "I had trouble generating a reply just now. Please try again."
            )
          );
        }
      } finally {
        controller.close();
      }

      if (replyText.trim()) {
        const citations = parseCitations(replyText, meta.memoryBlocks);
        try {
          await db.$transaction(async (tx) => {
            await tx.chatMessage.create({
              data: {
                userId: user.id,
                sessionId: finalSessionId,
                role: "assistant",
                content: replyText,
                data: {
                  agentIds: meta.agentIds,
                  intent: meta.intent,
                  citations,
                  followUps: meta.followUps,
                },
              },
            });
            await recordTimelineEvent(
              {
                userId: user.id,
                type: "coach",
                title: "Asked the Coach",
                description: text.slice(0, 140),
                occurredAt: new Date(),
                sourceType: "chat",
                sourceId: userMessage?.id ?? finalSessionId,
              },
              tx
            );
          });
        } catch (e) {
          console.error("[NovaNest] chat assistant-message persist failed:", e?.message);
        }

        createNotification(user.id, {
          type: "coach_nudge",
          title: "Coach conversation updated",
          body: "Your Career OS memory was updated from this conversation.",
          href: "/coach",
          data: { sessionId: finalSessionId },
        }).catch((e) => console.error("[NovaNest] chat notify:", e?.message));

        bumpActivity(user.id, "coach_message").catch((e) =>
          console.error("[NovaNest] bumpActivity coach_message:", e?.message)
        );

        fromChat(user.id, userMessage, text, replyText).catch((e) =>
          console.error("[NovaNest] fromChat:", e?.message)
        );
      }
    },
  });

  return new Response(stream, { headers });
}