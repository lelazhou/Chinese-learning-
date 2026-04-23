import type { Screen } from "../../types";

interface Props {
  onBack: () => void;
  onGo: (s: Screen) => void;
}

export default function GameHub({ onBack, onGo }: Props) {
  return (
    <div className="screen active">
      <div className="topbar">
        <button type="button" className="back" aria-label="返回" onClick={onBack}>←</button>
        <h2 className="title">游戏</h2>
      </div>
      <ul className="list">
        <li>
          <button
            type="button"
            className="big-card games"
            style={{ width: "100%" }}
            onClick={() => onGo("memory")}
          >
            <span className="label">配对</span>
            <span className="sub">翻翻乐：找出一样的字</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className="big-card cards"
            style={{ width: "100%" }}
            onClick={() => onGo("meaning")}
          >
            <span className="label">看字选义</span>
            <span className="sub">看汉字，选对意思</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
