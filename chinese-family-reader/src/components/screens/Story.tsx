import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import type { Settings, StoryLength, StoryScope, StoryTheme, Word } from "../../types";

interface Props {
  onBack: () => void;
  settings: Settings;
  showToast: (msg: string) => void;
}

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g;

function validateStory(text: string, allowed: Set<string>): string[] {
  const chars = text.match(CJK_RE) ?? [];
  return [...new Set(chars.filter((c) => !allowed.has(c)))];
}

const LENGTH_MAP: Record<StoryLength, string> = {
  short: "very short (3–5 sentences)",
  med: "short (6–8 sentences)",
  long: "medium (9–12 sentences)",
};

const THEMES: StoryTheme[] = ["动物", "学校", "家庭", "自由"];

async function callWorker(
  workerUrl: string,
  allowed: string[],
  length: StoryLength,
  theme: StoryTheme,
  repairNote?: string
): Promise<string> {
  const themeName = theme === "自由" ? "any topic" : `the theme of "${theme}"`;
  const systemPrompt = `You are a Chinese children's story writer. 
Write a ${LENGTH_MAP[length]} story in Simplified Chinese about ${themeName}.
STRICT RULE: You may ONLY use Chinese characters from this exact list: ${allowed.join("")}
Do NOT use any other Chinese characters. 
You may use punctuation (。，？！…「」) freely.
${repairNote ?? ""}
Return ONLY the story text, no explanations.`;

  const res = await fetch(workerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: systemPrompt, message: "请写故事。" }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(err || `HTTP ${res.status}`);
  }
  const data = await res.json() as { story?: string; text?: string; content?: string };
  return (data.story ?? data.text ?? data.content ?? "").trim();
}

export default function Story({ onBack, settings, showToast }: Props) {
  const [scope, setScope] = useState<StoryScope>("all");
  const [length, setLength] = useState<StoryLength>("short");
  const [theme, setTheme] = useState<StoryTheme>("动物");
  const [storyText, setStoryText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const words: Word[] = useLiveQuery(() => db.words.toArray()) ?? [];
  const deck: Word[] = scope === "new"
    ? words.filter((w) => w.isNew)
    : words;

  async function generate() {
    if (deck.length === 0) {
      showToast(scope === "new" ? "本周还没有新字" : "词库是空的");
      return;
    }
    if (!settings.workerUrl) {
      setErrorMsg("请先在「设置」里填写 Worker 地址");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setStoryText("");
    setErrorMsg("");

    const allowed = deck.map((w: Word) => w.hanzi.split("")).flat();
    const allowedSet = new Set<string>(allowed);
    const allowedChars = deck.map((w: Word) => w.hanzi).join("");

    try {
      let text = await callWorker(settings.workerUrl, [allowedChars], length, theme);
      const bad = validateStory(text, allowedSet);

      if (bad.length > 0) {
        text = await callWorker(
          settings.workerUrl,
          [allowedChars],
          length,
          theme,
          `Previous attempt used forbidden characters: ${bad.join("")}. Remove them entirely.`
        );
        const bad2 = validateStory(text, allowedSet);
        if (bad2.length > 0) {
          setErrorMsg(`故事里有还没学的字（${bad2.join("")}），换一篇试试？`);
          setStatus("error");
          return;
        }
      }

      setStoryText(text);
      setStatus("done");
    } catch (e) {
      setErrorMsg((e as Error).message || "生成失败，请检查网络和 Worker 设置");
      setStatus("error");
    }
  }

  const showForm = status === "idle" || status === "error";

  return (
    <div className="screen active">
      <div className="topbar">
        <button type="button" className="back" aria-label="返回" onClick={onBack}>←</button>
        <h2 className="title">故事</h2>
      </div>

      {showForm && (
        <div>
          <div className="field">
            <label>用哪些字</label>
            <div className="options">
              <label className="radio-row">
                <input type="radio" name="scope" value="all" checked={scope === "all"} onChange={() => setScope("all")} />
                <span>全部认识的字（{words.length} 个）</span>
              </label>
              <label className="radio-row">
                <input type="radio" name="scope" value="new" checked={scope === "new"} onChange={() => setScope("new")} />
                <span>只有本周新字（{words.filter((w) => w.isNew).length} 个）</span>
              </label>
            </div>
          </div>

          <div className="field">
            <label>长度</label>
            <div className="seg" style={{ marginBottom: 0 }}>
              {(["short", "med", "long"] as StoryLength[]).map((l) => (
                <button key={l} type="button" className={length === l ? "on" : ""} onClick={() => setLength(l)}>
                  {l === "short" ? "很短" : l === "med" ? "短" : "稍长"}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>主题</label>
            <div className="seg" style={{ marginBottom: 0, flexWrap: "wrap", gap: 4 }}>
              {THEMES.map((t) => (
                <button key={t} type="button" className={theme === t ? "on" : ""} onClick={() => setTheme(t)}
                  style={{ flex: "1 1 auto" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {status === "error" && errorMsg && (
            <div className="hint" style={{ color: "var(--danger)", marginBottom: 12 }}>{errorMsg}</div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            onClick={generate}
            disabled={deck.length === 0}
          >
            生成故事
          </button>
          {deck.length === 0 && (
            <p className="hint" style={{ textAlign: "center" }}>
              {scope === "new" ? "本周还没有新字" : "词库是空的，先去添加词语"}
            </p>
          )}
        </div>
      )}

      {status === "loading" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div className="spinner" />
          <p className="hint">正在生成故事…</p>
        </div>
      )}

      {status === "done" && storyText && (
        <div>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>读一读</p>
          <article className="story-box">{storyText}</article>
          <div className="footer-bar">
            <button type="button" className="btn btn-ghost" onClick={() => setStatus("idle")}>改选项</button>
            <button type="button" className="btn btn-primary" onClick={generate}>再生成</button>
          </div>
        </div>
      )}
    </div>
  );
}
