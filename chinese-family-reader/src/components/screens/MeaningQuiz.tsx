import { useEffect, useState, useCallback } from "react";
import { db } from "../../db";
import type { Word } from "../../types";

interface Props {
  onBack: () => void;
}

interface Choice {
  word: Word;
  isCorrect: boolean;
}

function buildChoices(words: Word[], target: Word): Choice[] {
  const others = words.filter((w) => w.id !== target.id && w.meaning);
  const wrong = others.sort(() => Math.random() - 0.5).slice(0, 3);
  return [{ word: target, isCorrect: true }, ...wrong.map((w) => ({ word: w, isCorrect: false }))]
    .sort(() => Math.random() - 0.5);
}

export default function MeaningQuiz({ onBack }: Props) {
  const [words, setWords] = useState<Word[]>([]);
  const [queue, setQueue] = useState<Word[]>([]);
  const [current, setCurrent] = useState<Word | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [feedback, setFeedback] = useState<"none" | "correct" | "wrong">("none");
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const loadWords = useCallback(async () => {
    const all = await db.words.toArray();
    const withMeaning = all.filter((w) => w.meaning);
    if (withMeaning.length < 2) {
      setError("需要至少 2 个有意思的词语才能玩。去词库添加意思吧！");
      return;
    }
    setWords(withMeaning);
    const shuffled = [...withMeaning].sort(() => Math.random() - 0.5);
    setQueue(shuffled.slice(1));
    setCurrent(shuffled[0]);
    setChoices(buildChoices(withMeaning, shuffled[0]));
    setFeedback("none");
    setScore(0);
    setTotal(0);
  }, []);

  useEffect(() => { loadWords(); }, [loadWords]);

  function handleChoice(c: Choice) {
    if (feedback !== "none") return;
    setTotal((t) => t + 1);
    if (c.isCorrect) {
      setScore((s) => s + 1);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }
    setTimeout(() => {
      if (queue.length === 0) {
        const next = [...words].sort(() => Math.random() - 0.5);
        setQueue(next.slice(1));
        setCurrent(next[0]);
        setChoices(buildChoices(words, next[0]));
      } else {
        const [next, ...rest] = queue;
        setQueue(rest);
        setCurrent(next);
        setChoices(buildChoices(words, next));
      }
      setFeedback("none");
    }, 700);
  }

  return (
    <div className="screen active">
      <div className="topbar">
        <button type="button" className="back" aria-label="返回" onClick={onBack}>←</button>
        <h2 className="title">看字选义</h2>
        {total > 0 && (
          <span className="chip">{score}/{total}</span>
        )}
      </div>

      {error ? (
        <div className="empty-state">
          <p>{error}</p>
          <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={onBack}>
            去词库
          </button>
        </div>
      ) : (
        <>
          <div className="flash-wrap" style={{ minHeight: 160 }}>
            <div className="flash-card" style={{ pointerEvents: "none", transform: "none" }}>
              <div className="flash-face flash-front" style={{ position: "relative", transform: "none" }}>
                <span className="hanzi-lg">{current?.hanzi}</span>
              </div>
            </div>
          </div>

          <p
            className="hint"
            style={{
              textAlign: "center",
              fontWeight: feedback !== "none" ? 600 : 400,
              color: feedback === "correct" ? "var(--success)" : feedback === "wrong" ? "var(--danger)" : undefined,
            }}
          >
            {feedback === "correct" ? "对了！" : feedback === "wrong" ? "再想想～" : "选一个意思："}
          </p>

          <div className="mq-choices">
            {choices.map((c) => (
              <button
                key={c.word.id}
                type="button"
                className="btn btn-ghost"
                style={{
                  background:
                    feedback !== "none" && c.isCorrect
                      ? "var(--success)"
                      : undefined,
                  color: feedback !== "none" && c.isCorrect ? "#fff" : undefined,
                  borderColor: feedback !== "none" && c.isCorrect ? "var(--success)" : undefined,
                }}
                onClick={() => handleChoice(c)}
              >
                {c.word.meaning}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
