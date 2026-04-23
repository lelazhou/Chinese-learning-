import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import type { Screen, Settings } from "../../types";

interface Props {
  onGo: (s: Screen) => void;
  settings: Settings;
}

export default function PlayHub({ onGo, settings }: Props) {
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;
  const newCount = useLiveQuery(() => db.words.where("isNew").equals(1).count()) ?? 0;

  const storyAvailable = settings.aiEnabled && online;
  const storySubtext = !settings.aiEnabled
    ? "在「设置」里打开 AI 故事"
    : !online
    ? "需要网络才能生成故事"
    : newCount
    ? `${newCount} 个本周新字 · 点击开始`
    : "用认识的字写小故事";

  return (
    <div className="screen active">
      <div className="play-hero">
        <h1>玩一玩</h1>
        <p>用认识的字来练习</p>
      </div>
      <div className="big-cards">
        <button
          type="button"
          className="big-card cards"
          onClick={() => onGo("flashcards")}
        >
          <span className="label">识字卡片</span>
          <span className="sub">翻翻卡片，看看拼音和意思</span>
        </button>
        <button
          type="button"
          className="big-card games"
          onClick={() => onGo("games")}
        >
          <span className="label">游戏</span>
          <span className="sub">配对、看字选义</span>
        </button>
        <button
          type="button"
          className={`big-card story${!storyAvailable ? " dim" : ""}`}
          disabled={!storyAvailable}
          onClick={() => storyAvailable && onGo("story")}
        >
          <span className="label">故事</span>
          <span className="sub">{storySubtext}</span>
        </button>
      </div>
    </div>
  );
}
