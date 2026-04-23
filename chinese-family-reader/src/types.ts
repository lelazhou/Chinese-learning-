export interface Word {
  id?: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  notes: string;
  isNew: boolean;
  createdAt: number;
}

export interface Settings {
  id?: number;
  aiEnabled: boolean;
  workerUrl: string;
  fontSize: "small" | "normal" | "large";
}

export type Screen =
  | "play"
  | "flashcards"
  | "games"
  | "memory"
  | "meaning"
  | "story"
  | "library"
  | "settings";

export type NavTab = "play" | "library" | "settings";

export type StoryLength = "short" | "med" | "long";
export type StoryTheme = "动物" | "学校" | "家庭" | "自由";
export type StoryScope = "all" | "new";
