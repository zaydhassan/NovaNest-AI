"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Play,
  Square,
  Loader2,
  Sparkles,
  Volume2,
  RotateCcw,
  MessageSquare,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import useFetch from "@/hooks/use-fetch";
import {
  nextInterviewQuestion,
  scoreMockInterview,
} from "@/actions/mock-interview";

/**
 * Voice mock interview using the browser's Web Speech API.
 * - The AI interviewer's questions are spoken (SpeechSynthesis) + shown.
 * - The candidate answers by voice (SpeechRecognition) with a text fallback.
 * - At the end the transcript is scored by Gemini and the session is saved.
 */
export default function VoiceMockInterview({ userIndustry }) {
  const [role, setRole] = useState("");
  const [started, setStarted] = useState(false);
  const [transcript, setTranscript] = useState([]); // [{role, text}]
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [scoreResult, setScoreResult] = useState(null);
  const [supported, setSupported] = useState(true);
  const [micBlocked, setMicBlocked] = useState(false);

  const recRef = useRef(null);
  const finalRef = useRef("");
  const scrollRef = useRef(null);
  const transcriptRef = useRef([]);

  // Keep a ref in sync with the transcript state so async callbacks (the
  // speech-recognition onend handler) read fresh history instead of a stale
  // closure from when listening started.
  const pushTurn = useCallback((turn) => {
    transcriptRef.current = [...transcriptRef.current, turn];
    setTranscript(transcriptRef.current);
  }, []);

  const {
    loading: askingQuestion,
    fn: askFn,
  } = useFetch(nextInterviewQuestion);
  const { loading: scoring, fn: scoreFn } = useFetch(scoreMockInterview);

  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    setSupported(Boolean(SR));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript, interim, currentQuestion]);

  const speak = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch {
      /* no-op */
    }
  }, []);

  const askNext = useCallback(
    async (currentTranscript) => {
      const q = await askFn(role, userIndustry, currentTranscript);
      if (q && q.trim()) {
        setCurrentQuestion(q);
        speak(q);
        pushTurn({ role: "interviewer", text: q });
      } else {
        toast.error(
          "Couldn't generate a question right now. The AI service may be busy — try again in a moment."
        );
      }
    },
    [askFn, role, userIndustry, speak, pushTurn]
  );

  const startInterview = async () => {
    if (!role.trim()) {
      toast.error("Enter a target role to start.");
      return;
    }
    setStarted(true);
    setMicBlocked(false);
    transcriptRef.current = [];
    setTranscript([]);
    setScoreResult(null);
    setCurrentQuestion("");
    // Ask the first question on the next tick so state is ready.
    setTimeout(() => askNext([]), 0);
  };

  const stopRecognition = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* no-op */
    }
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    setTextAnswer("");
    setInterim("");
    finalRef.current = "";
    const SR =
      (typeof window !== "undefined" && window.SpeechRecognition) ||
      window.webkitSpeechRecognition;
    if (!SR) {
      toast.message("Voice input isn't supported here — type your answer instead.");
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (finalText) finalRef.current = (finalRef.current + " " + finalText).trim();
      setInterim(interimText);
    };
    rec.onend = () => {
      setListening(false);
      const final = finalRef.current.trim();
      if (final) {
        submitAnswer(final);
      }
      setInterim("");
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicBlocked(true);
        toast.error(
          "Microphone blocked. Allow mic access for this site (browser address bar → camera/mic icon), make sure you're on http://localhost:3000 (not an IP), and that Windows allows apps to use the mic. You can still type answers below."
        );
      } else {
        toast.error(`Mic error: ${e.error}`);
      }
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const submitAnswer = (text) => {
    const clean = (text || "").trim();
    if (!clean) return;
    setTextAnswer("");
    setInterim("");
    pushTurn({ role: "candidate", text: clean });
    setCurrentQuestion("");
    askNext([...transcriptRef.current]);
  };

  const endAndScore = async () => {
    stopRecognition();
    if (transcriptRef.current.length < 2) {
      toast.error("Answer at least one question before scoring.");
      return;
    }
    const result = await scoreFn({ role, transcript: transcriptRef.current });
    if (result) {
      setScoreResult(result.scored);
      setStarted(false);
      toast.success("Interview scored and saved!");
    }
  };

  const reset = () => {
    setStarted(false);
    transcriptRef.current = [];
    setTranscript([]);
    setCurrentQuestion("");
    setScoreResult(null);
    setTextAnswer("");
    setInterim("");
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* no-op */
    }
  };

  if (!started && !scoreResult) {
    return (
      <Card className="glass mx-auto max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Mic className="h-4 w-4" />
            </span>
            Voice Mock Interview
          </CardTitle>
          <CardDescription>
            Have a real spoken interview with our AI interviewer. It asks one
            question at a time, you answer out loud, and we score the whole
            conversation at the end.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mi-role">Target role</Label>
            <Input
              id="mi-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Senior Frontend Engineer"
              onKeyDown={(e) => e.key === "Enter" && startInterview()}
            />
            {userIndustry && (
              <p className="text-xs text-muted-foreground">
                Tailored to your industry: {userIndustry}
              </p>
            )}
          </div>
          <Button onClick={startInterview} disabled={askingQuestion} className="w-full gap-2">
            {askingQuestion ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start interview
          </Button>
          {!supported && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
              Your browser doesn&apos;t support voice input — you can still type
              answers, and the interviewer will speak its questions.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (scoreResult) {
    return <InterviewResult result={scoreResult} role={role} onReset={reset} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <User className="h-3.5 w-3.5" /> {role}
          </Badge>
          {listening ? (
            <Badge className="gap-1.5 bg-rose-500/15 text-rose-500">
              <Mic className="h-3.5 w-3.5 animate-pulse" /> Listening…
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5">
              <MicOff className="h-3.5 w-3.5" /> Mic idle
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Restart
        </Button>
      </div>

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="max-h-[420px] min-h-[260px] space-y-3 overflow-y-auto rounded-2xl border border-border bg-card/40 p-4"
      >
        <AnimatePresence initial={false}>
          {transcript.map((turn, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${turn.role === "interviewer" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  turn.role === "interviewer"
                    ? "bg-primary/15 text-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <span className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {turn.role === "interviewer" ? (
                    <>
                      <Sparkles className="h-3 w-3" /> Interviewer
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3" /> You
                    </>
                  )}
                </span>
                {turn.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {askingQuestion && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Interviewer is thinking…
          </div>
        )}
        {interim && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl bg-muted/50 px-3.5 py-2.5 text-sm italic text-muted-foreground">
              {interim}…
            </div>
          </div>
        )}
      </div>

      {/* Mic-blocked guidance */}
      {micBlocked && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <p className="font-medium">Microphone is blocked.</p>
          <p className="mt-1 text-xs">
            Allow mic for this site, use <code>http://localhost:3000</code> (not a
            LAN IP), and make sure Windows allows mic access. You can also just
            type your answer below — the interviewer still speaks its questions.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {supported && (
          <Button
            onClick={listening ? stopRecognition : startListening}
            disabled={askingQuestion}
            className="gap-2"
          >
            {listening ? (
              <>
                <Square className="h-4 w-4" /> Stop
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" /> Answer by voice
              </>
            )}
          </Button>
        )}
        {currentQuestion && (
          <Button
            variant="outline"
            onClick={() => speak(currentQuestion)}
            className="gap-2"
          >
            <Volume2 className="h-4 w-4" /> Repeat
          </Button>
        )}
        <Button
          onClick={endAndScore}
          disabled={scoring || transcript.length < 2}
          variant="default"
          className="ml-auto gap-2"
        >
          {scoring ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          End &amp; score
        </Button>
      </div>

      {/* Text fallback answer */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" /> Or type your answer
        </Label>
        <Textarea
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder="Type your answer and submit…"
          className="h-20"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitAnswer(textAnswer);
            }
          }}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={!textAnswer.trim() || askingQuestion}
          onClick={() => submitAnswer(textAnswer)}
          className="gap-2"
        >
          Submit answer
        </Button>
      </div>
    </div>
  );
}

function InterviewResult({ result, role, onReset }) {
  const score = Math.round(Number(result?.score ?? 0));
  const bars = [
    { key: "communication", label: "Communication" },
    { key: "technicalDepth", label: "Technical depth" },
    { key: "structure", label: "Structure (STAR)" },
  ];

  return (
    <Card className="glass mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Interview result — {role}
        </CardTitle>
        <CardDescription>Saved to your interview history.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-5">
          <div className="relative grid h-24 w-24 place-items-center rounded-full ring-aurora">
            <span className="text-3xl font-extrabold">{score}</span>
            <span className="absolute -bottom-5 text-[10px] text-muted-foreground">/ 100</span>
          </div>
          <div className="flex-1 space-y-2">
            {bars.map((b) => (
              <div key={b.key}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-medium">{Math.round(Number(result?.[b.key] ?? 0))}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Number(result?.[b.key] ?? 0))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {result?.strengths?.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-emerald-500">Strengths</p>
            <ul className="space-y-1">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result?.improvements?.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-amber-500">To improve</p>
            <ul className="space-y-1">
              {result.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> New interview
        </Button>
      </CardContent>
    </Card>
  );
}