import { useState, useEffect } from "react";
import { db, saveSettings } from "../../db";
import type { Word } from "../../types";
import { useSettings } from "../../hooks/useSettings";

interface Props {
  showToast: (msg: string) => void;
}

export default function Settings({ showToast }: Props) {
  const { settings } = useSettings();
  const [workerUrl, setWorkerUrl] = useState(settings.workerUrl ?? "");

  useEffect(() => {
    setWorkerUrl(settings.workerUrl ?? "");
  }, [settings.workerUrl]);

  async function toggleAI() {
    await saveSettings({ aiEnabled: !settings.aiEnabled });
  }

  async function setFontSize(size: "small" | "normal" | "large") {
    await saveSettings({ fontSize: size });
  }

  async function saveWorkerUrl() {
    await saveSettings({ workerUrl: workerUrl.trim() });
    showToast("已保存 Worker 地址");
  }

  async function handleExport() {
    const words = await db.words.toArray();
    const blob = new Blob([JSON.stringify({ version: 1, words }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chinese-reader-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("已导出备份");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as { version?: number; words: Word[] };
      if (!Array.isArray(data.words)) throw new Error("格式不对");
      const existing = new Set((await db.words.toArray()).map((w) => w.hanzi));
      const toAdd = data.words.filter((w) => w.hanzi && !existing.has(w.hanzi));
      await db.words.bulkAdd(
        toAdd.map((w) => ({
          hanzi: w.hanzi,
          pinyin: w.pinyin ?? "",
          meaning: w.meaning ?? "",
          notes: w.notes ?? "",
          isNew: w.isNew ?? false,
          createdAt: w.createdAt ?? Date.now(),
        })) as Word[]
      );
      showToast(`导入成功，添加了 ${toAdd.length} 个词语`);
    } catch {
      showToast("导入失败，请检查文件格式");
    }
    e.target.value = "";
  }

  async function handleClearAll() {
    if (!confirm("确定清空整个词库吗？此操作无法撤销。")) return;
    await db.words.clear();
    showToast("已清空词库");
  }

  return (
    <div className="screen active">
      <h2 className="title" style={{ margin: "0 0 16px" }}>设置</h2>

      {/* AI Toggle */}
      <div className="list-row" style={{ marginBottom: 10 }}>
        <div className="meta">
          <strong>AI 故事</strong>
          <small>关闭后「故事」变灰</small>
        </div>
        <button
          type="button"
          className={`toggle${settings.aiEnabled ? " on" : ""}`}
          aria-pressed={settings.aiEnabled}
          aria-label="AI 故事"
          onClick={toggleAI}
        />
      </div>

      {/* Worker URL */}
      <div className="list-row" style={{ marginBottom: 10, flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
        <div className="meta">
          <strong>Worker 地址</strong>
          <small>Cloudflare Worker 的 URL（用于 AI 故事）</small>
        </div>
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <input
            type="url"
            className="input-field"
            placeholder="https://your-worker.workers.dev"
            value={workerUrl}
            onChange={(e) => setWorkerUrl(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" className="btn btn-ghost" style={{ flex: "none", minWidth: 60 }} onClick={saveWorkerUrl}>
            保存
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div className="list-row" style={{ marginBottom: 10 }}>
        <div className="meta">
          <strong>文字大小</strong>
          <small>影响全局字号</small>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["small", "normal", "large"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`btn ${settings.fontSize === s ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: "none", minWidth: 44 }}
              onClick={() => setFontSize(s)}
            >
              {s === "small" ? "小" : s === "normal" ? "中" : "大"}
            </button>
          ))}
        </div>
      </div>

      {/* Export / Import */}
      <div className="list-row" style={{ marginBottom: 10 }}>
        <div className="meta">
          <strong>导出 / 导入备份</strong>
          <small>JSON 格式，包含全部词语</small>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={handleExport}>
          导出
        </button>
        <label className="btn btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: "var(--tap)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          导入
          <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
        </label>
      </div>

      {/* Danger zone */}
      <div className="list-row" style={{ marginBottom: 10 }}>
        <div className="meta">
          <strong>清空词库</strong>
          <small>删除所有词语，操作不可撤销</small>
        </div>
        <button type="button" className="btn btn-danger" style={{ flex: "none", fontSize: "0.85rem", padding: "0 14px" }} onClick={handleClearAll}>
          清空
        </button>
      </div>

      <p className="hint" style={{ marginTop: 16 }}>
        版本 1.0 · 数据仅保存在本机浏览器
      </p>
    </div>
  );
}
