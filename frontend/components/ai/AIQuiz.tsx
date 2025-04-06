// components/ai/AIQuiz.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  questions: QuizQuestion[];
}

export const AIQuiz: React.FC = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/generate/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ /* any parameters if needed */ }),
      });
      if (!res.ok) {
        throw new Error("Failed to generate quiz");
      }
      const data = await res.json();
      setQuiz(data.data);
      toast({
        title: "Quiz Generated",
        description: "Your AI-powered quiz is ready.",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error generating quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-900 rounded-md border border-zinc-800">
      <h2 className="text-xl font-bold mb-4">AI Quiz Challenge</h2>
      <Button onClick={generateQuiz} disabled={loading}>
        {loading ? "Generating Quiz..." : "Generate Quiz"}
      </Button>
      {quiz && (
        <div className="mt-4 space-y-4">
          {quiz.questions.map((q, index) => (
            <div key={index} className="p-4 border border-zinc-700 rounded">
              <p className="mb-2 font-semibold">{q.question}</p>
              <ul className="list-disc ml-6">
                {q.options.map((option, idx) => (
                  <li key={idx}>{option}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIQuiz;
