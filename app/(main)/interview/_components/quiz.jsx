"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { generateQuiz, saveQuizResult } from "@/actions/interview";
import QuizResult from "./quiz-result";
import useFetch from "@/hooks/use-fetch";
import { motion } from "framer-motion";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);

  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
  } = useFetch(generateQuiz);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
    setData: setResultData,
  } = useFetch(saveQuizResult);

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
      setCurrentQuestion(0);
    }
  }, [quizData]);

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++;
      }
    });
    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    try {
      await saveQuizResultFn(quizData, answers, score);
      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results");
    }
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setResultData(null);
    generateQuizFn();
  };

  if (generatingQuiz) {
    return (
      <Card className="glass mx-auto max-w-3xl">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
          <Progress className="h-1.5 w-full" value={70} />
          <p className="text-sm text-muted-foreground">Generating your tailored questions…</p>
        </CardContent>
      </Card>
    );
  }

  if (resultData) {
    return (
      <div className="mx-auto max-w-3xl">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  if (!quizData) {
    return (
      <Card className="glass mx-auto max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Ready to test your knowledge?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            This quiz contains 10 tailored questions designed around your skills
            and industry. Take your time and choose carefully.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={generateQuizFn} className="w-full" size="lg" aria-label="Start quiz">
            Start quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const question = quizData[currentQuestion];
  const progress = ((currentQuestion + (answers[currentQuestion] ? 1 : 0)) / quizData.length) * 100;

  return (
    <Card className="glass mx-auto max-w-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Question {currentQuestion + 1} of {quizData.length}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="mt-3 h-1.5" />
      </CardHeader>
      <CardContent className="space-y-6">
        <motion.p
          key={question.question}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-lg font-medium"
        >
          {question.question}
        </motion.p>

        <RadioGroup
          onValueChange={handleAnswer}
          value={answers[currentQuestion]}
          className="space-y-3"
          aria-label={`Options for question ${currentQuestion + 1}`}
        >
          {question.options.map((option, idx) => {
            const selected = answers[currentQuestion] === option;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-xl border p-3 transition cursor-pointer ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40 hover:bg-accent/10"
                }`}
              >
                <RadioGroupItem
                  value={option}
                  id={`option-${idx}`}
                  className="focus:ring-ring"
                />
                <Label htmlFor={`option-${idx}`} className="select-none">
                  {option}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion] || savingResult}
          className="ml-auto"
          aria-label={currentQuestion < quizData.length - 1 ? "Next question" : "Finish quiz"}
        >
          {savingResult
            ? "Saving…"
            : currentQuestion < quizData.length - 1
            ? "Next question"
            : "Finish quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
}