import { useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import type { Word } from "../../types";

interface Props {
  onBack: () => void;
}

type Filter = "all" | "new";

export default function Flashcards({ onBack }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [online] = useState(() => navigator.onLine);

  const allWords = useLiveQuery(() => db.words.toArray()) ?? [];
  const deck: Word[] = filter === "new"
    ? allWords.filter((w) => w.isNew)
    : allWords;

  const card = deck[Math.min(index, deck.length - 1)];

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!deck.length) return;
      setFlipped(false);
      setIndex((i) => (i + dir + deck.length) % deck.length);
    },
    [deck.length]
  );

  function handleFilterChange(f: Filter) {
    setFilter(f);
    setIndex(0);
    setFlipped(false);
  }

  return (
    <div className="screen active">
      <div className="topbar">
        <button type="button" className="back" aria-label="返回" onClick={onBack}>←</button>
        <h2 className="title">识字卡片</h2>
        <span className={`chip${online ? "" : " offline"}`}>{online ? "在线" : "离线"}</span>
      </div>

      <div className="seg" role="tablist">
        <button
          type="button"
          className={filter === "all" ? "on" : ""}
          onClick={() => handleFilterChange("all")}
        >
          全部 ({allWords.length})
        </button>
        <button
          type="button"
          className={filter === "new" ? "on" : ""}
          onClick={() => handleFilterChange("new")}
        >
          本周新字 ({allWords.filter((w) => w.isNew).length})
        </button>
      </div>

      <div className="flash-wrap">
        {deck.length === 0 ? (
          <div className="empty-state">
            <p>{filter === "new" ? "本周还没有新字" : "词库还是空的"}</p>
            <p>{filter === "new" ? "去词库里标记「本周新字」" : "先去词库添加词语"}</p>
          </div>
        ) : (
          <div
            className={`flash-card${flipped ? " flipped" : ""}`}
            role="button"
            tabIndex={0}
            aria-label="点按翻面"
            onClick={() => setFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setFlipped((f) => !f);
              }
              if (e.key === "ArrowRight") go(1);
              if (e.key === "ArrowLeft") go(-1);
            }}
          >
            <div className="flash-face flash-front">
              <span className="hanzi-lg">{card?.hanzi}</span>
            </div>
            <div className="flash-face flash-back">
              {card?.pinyin && <span className="pinyin">{card.pinyin}</span>}
              {card?.meaning && <span className="meaning">{card.meaning}</span>}
              {!card?.pinyin && !card?.meaning && (
                <span className="meaning" style={{ opacity: 0.7 }}>（暂无注释）</span>
              )}
            </div>
          </div>
        )}
      </div>

      {deck.length > 0 && (
        <p className="hint" style={{ textAlign: "center" }}>
          {Math.min(index, deck.length - 1) + 1} / {deck.length}
        </p>
      )}

      <div className="footer-bar">
        <button type="button" className="btn btn-ghost" onClick={() => go(-1)} disabled={deck.length < 2}>
          上一张
        </button>
        <button type="button" className="btn btn-primary" onClick={() => go(1)} disabled={deck.length < 2}>
          下一张
        </button>
      </div>
    </div>
  );
}
