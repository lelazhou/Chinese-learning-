import { useEffect, useState, useCallback } from "react";
import { db } from "../../db";
import type { Word } from "../../types";

interface Props {
  onBack: () => void;
}

interface Tile {
  id: string;
  hanzi: string;
  revealed: boolean;
  matched: boolean;
}

function buildTiles(words: Word[]): Tile[] {
  const pairs = [...words, ...words].map((w, i) => ({
    id: `${w.id}-${i}`,
    hanzi: w.hanzi,
    revealed: false,
    matched: false,
  }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

const MIN_PAIRS = 3;
const MAX_PAIRS = 8;

export default function MemoryGame({ onBack }: Props) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [firstId, setFirstId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [error, setError] = useState("");

  const init = useCallback(async () => {
    const words = await db.words.toArray();
    if (words.length < MIN_PAIRS) {
      setError(`至少需要 ${MIN_PAIRS} 个词语才能玩配对。先去词库添加吧！`);
      return;
    }
    const pick = words.slice(0, MAX_PAIRS);
    setTiles(buildTiles(pick));
    setFirstId(null);
    setLocked(false);
    setMoves(0);
    setWon(false);
    setError("");
  }, []);

  useEffect(() => { init(); }, [init]);

  function handleTile(id: string) {
    if (locked) return;
    setTiles((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t || t.matched || t.revealed) return prev;
      return prev.map((x) => x.id === id ? { ...x, revealed: true } : x);
    });

    if (!firstId) {
      setFirstId(id);
      return;
    }

    setLocked(true);
    setMoves((m) => m + 1);

    setTiles((prev) => {
      const first = prev.find((x) => x.id === firstId)!;
      const second = prev.find((x) => x.id === id)!;
      if (first.hanzi === second.hanzi) {
        const next = prev.map((x) =>
          x.id === firstId || x.id === id ? { ...x, matched: true, revealed: true } : x
        );
        const allDone = next.every((x) => x.matched);
        if (allDone) setWon(true);
        setFirstId(null);
        setLocked(false);
        return next;
      } else {
        setTimeout(() => {
          setTiles((p) =>
            p.map((x) =>
              x.id === firstId || x.id === id ? { ...x, revealed: false } : x
            )
          );
          setFirstId(null);
          setLocked(false);
        }, 600);
        return prev;
      }
    });
  }

  const cols = tiles.length <= 8 ? 4 : 4;
  const gridStyle = { gridTemplateColumns: `repeat(${cols}, 1fr)` };

  return (
    <div className="screen active">
      <div className="topbar">
        <button type="button" className="back" aria-label="返回" onClick={onBack}>←</button>
        <h2 className="title">配对</h2>
        {moves > 0 && <span className="chip">{moves} 步</span>}
      </div>

      {error ? (
        <div className="empty-state">
          <p>{error}</p>
          <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={onBack}>
            去词库
          </button>
        </div>
      ) : won ? (
        <div className="empty-state" style={{ padding: "60px 20px" }}>
          <p style={{ fontSize: "2.5rem" }}>🎉</p>
          <p style={{ fontWeight: 700, fontSize: "1.2rem" }}>完成！用了 {moves} 步</p>
          <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={init}>
            再来一局
          </button>
        </div>
      ) : (
        <>
          <p className="hint">点击翻开；两个字一样即成功。</p>
          <div className="memory-grid" style={gridStyle}>
            {tiles.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tile${t.matched ? " matched" : t.revealed ? "" : " hidden"}`}
                onClick={() => handleTile(t.id)}
                disabled={t.matched}
                aria-label={t.revealed || t.matched ? t.hanzi : "翻开"}
              >
                {(t.revealed || t.matched) ? t.hanzi : ""}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
