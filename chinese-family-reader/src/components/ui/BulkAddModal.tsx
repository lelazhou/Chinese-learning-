import { useState } from "react";
import { db } from "../../db";
import type { Word } from "../../types";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}

interface ParsedEntry {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

async function parseBulk(text: string): Promise<{ entries: ParsedEntry[]; skipped: number }> {
  const existing = new Set((await db.words.toArray()).map((w) => w.hanzi));
  const entries: ParsedEntry[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const raw = line.trim();
    if (!raw) continue;

    if (raw.includes(",")) {
      const parts = raw.split(",").map((s) => s.trim());
      const hanzi = parts[0];
      if (!hanzi) continue;
      if (existing.has(hanzi) || seen.has(hanzi)) { skipped++; continue; }
      seen.add(hanzi);
      entries.push({ hanzi, pinyin: parts[1] ?? "", meaning: parts.slice(2).join(",").trim() });
    } else {
      for (const ch of raw) {
        if (!ch.trim()) continue;
        if (existing.has(ch) || seen.has(ch)) { skipped++; continue; }
        seen.add(ch);
        entries.push({ hanzi: ch, pinyin: "", meaning: "" });
      }
    }
  }
  return { entries, skipped };
}

export default function BulkAddModal({ open, onClose, onImported }: Props) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<{ count: number; skipped: number } | null>(null);
  const [importing, setImporting] = useState(false);

  async function handlePreview(val: string) {
    setText(val);
    if (!val.trim()) { setPreview(null); return; }
    const { entries, skipped } = await parseBulk(val);
    setPreview({ count: entries.length, skipped });
  }

  async function handleImport() {
    setImporting(true);
    const { entries } = await parseBulk(text);
    if (entries.length === 0) { setImporting(false); return; }
    const words: Omit<Word, "id">[] = entries.map((e) => ({
      hanzi: e.hanzi,
      pinyin: e.pinyin,
      meaning: e.meaning,
      notes: "",
      isNew: false,
      createdAt: Date.now(),
    }));
    await db.words.bulkAdd(words as Word[]);
    onImported(entries.length);
    setText("");
    setPreview(null);
    setImporting(false);
    onClose();
  }

  return (
    <div className={`modal-root${open ? " is-open" : ""}`} aria-hidden={!open}>
      <button type="button" className="modal-backdrop" aria-label="关闭" onClick={onClose} />
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="bulk-title">
        <div className="modal-head">
          <h3 id="bulk-title">批量添加</h3>
          <button type="button" className="modal-close" aria-label="关闭" onClick={onClose}>×</button>
        </div>
        <p className="hint" style={{ marginTop: 0 }}>
          直接粘贴一串汉字，每个字会独立存入词库。也可<strong>每行一个词语</strong>，
          或用 <strong>词语,拼音,意思</strong>（英文逗号）带注释。
        </p>
        <div className="form-row">
          <label className="form-label" htmlFor="bulk-text">粘贴列表</label>
          <textarea
            id="bulk-text"
            className="input-field"
            placeholder={"天地人山水火木金土\n或：天,tiān,sky"}
            value={text}
            onChange={(e) => handlePreview(e.target.value)}
          />
        </div>
        {preview && (
          <p className="hint">
            将导入约 <strong>{preview.count}</strong> 条
            {preview.skipped > 0 && `（跳过 ${preview.skipped} 个已有词语）`}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!preview || preview.count === 0 || importing}
            onClick={handleImport}
          >
            {importing ? "导入中…" : "导入"}
          </button>
        </div>
      </div>
    </div>
  );
}
