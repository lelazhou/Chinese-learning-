import Dexie, { type Table } from "dexie";
import type { Word, Settings } from "./types";

class AppDB extends Dexie {
  words!: Table<Word>;
  settings!: Table<Settings>;

  constructor() {
    super("FamilyChineseReader");
    this.version(1).stores({
      words: "++id, hanzi, isNew, createdAt",
      settings: "++id",
    });
  }
}

export const db = new AppDB();

const DEFAULT_SETTINGS: Omit<Settings, "id"> = {
  aiEnabled: false,
  workerUrl: "",
  fontSize: "normal",
};

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.toArray();
  if (row.length > 0) return row[0];
  const id = await db.settings.add(DEFAULT_SETTINGS as Settings);
  return { ...DEFAULT_SETTINGS, id };
}

export async function saveSettings(patch: Partial<Omit<Settings, "id">>) {
  const existing = await getSettings();
  await db.settings.put({ ...existing, ...patch });
}

/** Seed a few demo words if the library is empty. */
export async function seedIfEmpty() {
  const count = await db.words.count();
  if (count > 0) return;
  await db.words.bulkAdd([
    { hanzi: "学", pinyin: "xué", meaning: "to study / learn", notes: "", isNew: true, createdAt: Date.now() },
    { hanzi: "大", pinyin: "dà", meaning: "big", notes: "", isNew: true, createdAt: Date.now() },
    { hanzi: "小", pinyin: "xiǎo", meaning: "small", notes: "", isNew: false, createdAt: Date.now() },
    { hanzi: "人", pinyin: "rén", meaning: "person", notes: "", isNew: false, createdAt: Date.now() },
    { hanzi: "口", pinyin: "kǒu", meaning: "mouth", notes: "", isNew: false, createdAt: Date.now() },
    { hanzi: "手", pinyin: "shǒu", meaning: "hand", notes: "", isNew: false, createdAt: Date.now() },
  ] as Word[]);
}
