import type { NavTab } from "../../types";

interface Props {
  active: NavTab;
  onNav: (tab: NavTab) => void;
}

export default function NavBar({ active, onNav }: Props) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      <button
        type="button"
        className={`nav-btn ${active === "play" ? "on" : ""}`}
        onClick={() => onNav("play")}
      >
        <span className="sym" aria-hidden="true">玩</span>
        玩
      </button>
      <button
        type="button"
        className={`nav-btn ${active === "library" ? "on" : ""}`}
        onClick={() => onNav("library")}
      >
        <span className="sym" aria-hidden="true">词</span>
        词库
      </button>
      <button
        type="button"
        className={`nav-btn ${active === "settings" ? "on" : ""}`}
        onClick={() => onNav("settings")}
      >
        <span className="sym" aria-hidden="true">设</span>
        设置
      </button>
    </nav>
  );
}
