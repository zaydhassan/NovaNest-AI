"use client";

import { Trophy, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/site/animated-counter";
import { ConfettiBurst } from "@/components/site/confetti-burst";

const EASE = [0.22, 1, 0.36, 1];

export default function QuizResult({
  result,
  hideStartNew = false,
  onStartNew,
}) {
  if (!result) return null;

  const score = result.quizScore ?? 0;
  const passed = score >= 70;
  // Circular ring geometry.
  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - score / 100);

  return (
    <div className="relative mx-auto max-w-3xl">
      <ConfettiBurst originX="50%" originY="18%" />

      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mb-8 flex items-center gap-2"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl ring-aurora text-white shadow-glow">
          <Trophy className="h-5 w-5" />
        </span>
        <h1 className="gradient-title text-3xl">Quiz Results</h1>
      </motion.div>

      <CardContent className="space-y-8">
        {/* Score ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="flex flex-col items-center gap-5"
        >
          <div className="relative grid h-32 w-32 place-items-center">
            <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
              <circle cx="60" cy="60" r={R} fill="none" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r={R} fill="none"
                stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={C}
                initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.1, delay: 0.25, ease: EASE }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="hsl(var(--cyan))" />
                  <stop offset="0.5" stopColor="hsl(var(--purple))" />
                  <stop offset="1" stopColor="hsl(var(--emerald))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-2xl font-extrabold tabular-nums">
              <AnimatedCounter value={score} decimals={1} suffix="%" />
            </div>
          </div>
          <Progress value={score} className="w-full max-w-sm" />
          <p className={`text-sm font-medium ${passed ? "text-emerald-500" : "text-muted-foreground"}`}>
            {passed ? "Great work — you're interview-ready on this set." : "Keep going — review the questions below and retry."}
          </p>
        </motion.div>

        {/* Improvement Tip */}
        {result.improvementTip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-xl border border-border bg-muted/50 p-4"
          >
            <p className="font-medium text-foreground">Improvement tip</p>
            <p className="mt-1 text-sm text-muted-foreground">{result.improvementTip}</p>
          </motion.div>
        )}

        {/* Questions Review */}
        <div className="space-y-4">
          <h3 className="font-medium">Question review</h3>
          {result.questions.map((q, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: EASE }}
              className="rounded-xl border border-border bg-card p-4 shadow-elevated transition-colors hover:border-white/15"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{q.question}</p>
                {q.isCorrect ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: index * 0.05 }}
                    className="flex-shrink-0"
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </motion.span>
                ) : (
                  <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                )}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Your answer: {q.userAnswer}</p>
                {!q.isCorrect && <p>Correct answer: {q.answer}</p>}
              </div>
              {q.explanation && (
                <div className="mt-3 rounded-lg bg-muted p-2 text-sm">
                  <p className="font-medium">Explanation</p>
                  <p className="text-muted-foreground">{q.explanation}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>

      {!hideStartNew && (
        <CardFooter className="mt-6">
          <Button onClick={onStartNew} variant="gradient" className="w-full gap-2">
            <RotateCcw className="h-4 w-4" />
            Start new quiz
          </Button>
        </CardFooter>
      )}
    </div>
  );
}