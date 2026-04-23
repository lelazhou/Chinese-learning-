import { useLiveQuery } from "dexie-react-hooks";
import { db, saveSettings } from "../db";
import type { Settings } from "../types";

const DEFAULT: Settings = {
  aiEnabled: false,
  workerUrl: "",
  fontSize: "normal",
};

export function useSettings() {
  const settings: Settings = useLiveQuery(async () => {
    const rows = await db.settings.toArray();
    return rows[0] ?? DEFAULT;
  }) ?? DEFAULT;

  return { settings, saveSettings };
}
