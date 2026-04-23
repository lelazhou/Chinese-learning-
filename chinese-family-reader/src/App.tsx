import { useEffect, useState } from "react";
import { seedIfEmpty } from "./db";
import type { NavTab, Screen } from "./types";
import NavBar from "./components/ui/NavBar";
import PlayHub from "./components/screens/PlayHub";
import Flashcards from "./components/screens/Flashcards";
import GameHub from "./components/screens/GameHub";
import MemoryGame from "./components/screens/MemoryGame";
import MeaningQuiz from "./components/screens/MeaningQuiz";
import Story from "./components/screens/Story";
import Library from "./components/screens/Library";
import Settings from "./components/screens/Settings";
import { useSettings } from "./hooks/useSettings";
import { useToast } from "./hooks/useToast";

export default function App() {
  const [screen, setScreen] = useState<Screen>("play");
  const { settings } = useSettings();
  const { toastRef, showToast } = useToast();

  useEffect(() => {
    seedIfEmpty();
  }, []);

  useEffect(() => {
    document.body.dataset.size = settings.fontSize;
  }, [settings.fontSize]);

  const navTab: NavTab =
    screen === "library"
      ? "library"
      : screen === "settings"
      ? "settings"
      : "play";

  function handleNav(tab: NavTab) {
    setScreen(tab);
  }

  function goTo(s: Screen) {
    setScreen(s);
  }

  return (
    <div id="app">
      {screen === "play" && (
        <PlayHub onGo={goTo} settings={settings} />
      )}
      {screen === "flashcards" && (
        <Flashcards onBack={() => goTo("play")} />
      )}
      {screen === "games" && (
        <GameHub onBack={() => goTo("play")} onGo={goTo} />
      )}
      {screen === "memory" && (
        <MemoryGame onBack={() => goTo("games")} />
      )}
      {screen === "meaning" && (
        <MeaningQuiz onBack={() => goTo("games")} />
      )}
      {screen === "story" && (
        <Story onBack={() => goTo("play")} settings={settings} showToast={showToast} />
      )}
      {screen === "library" && (
        <Library showToast={showToast} />
      )}
      {screen === "settings" && (
        <Settings showToast={showToast} />
      )}
      <NavBar active={navTab} onNav={handleNav} />
      <div className="toast" ref={toastRef} aria-live="polite" />
    </div>
  );
}
