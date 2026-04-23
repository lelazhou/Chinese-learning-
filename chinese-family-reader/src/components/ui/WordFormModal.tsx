import { useState, useEffect } from "react";
import { db } from "../../db";
import type { Word } from "../../types";

interface Props {
  open: boolean;
  word: Word | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY = { hanzi: "", pinyin: "", meaning: "", notes: "", isNew: false };

export default function WordFormModal({ open, word, onClose, onSaved }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [hanziError, setHanziError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(
        word
          ? { hanzi: word.hanzi, pinyin: word.pinyin, meaning: word.meaning, notes: word.notes, isNew: word.isNew }
          : EMPTY
      );
      setHanziError("");
    }
  }, [open, word]);

  function set(k: keyof typeof EMPTY, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    const hanzi = form.hanzi.trim();
    if (!hanzi) { setHanziError("请填写汉字或词语"); return; }

    const clash = await db.words
      .where("hanzi").equals(hanzi)
      .first();
    if (clash && clash.id !== word?.id) {
      setHanziError("词库里已有相同的汉字或词语");
      return;
    }

    if (word?.id != null) {
      await db.words.update(word.id, { hanzi, pinyin: form.pinyin.trim(), meaning: form.meaning.trim(), notes: form.notes.trim(), isNew: form.isNew });
    } else {
      await db.words.add({ hanzi, pinyin: form.pinyin.trim(), meaning: form.meaning.trim(), notes: form.notes.trim(), isNew: form.isNew, createdAt: Date.now() });
    }
    onSaved();
    onClose();
  }

  return (
    <div className={`modal-root${open ? " is-open" : ""}`} aria-hidden={!open}>
      <button type="button" className="modal-backdrop" aria-label="关闭" onClick={onClose} />
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="wf-title">
        <div className="modal-head">
          <h3 id="wf-title">{word ? "编辑词语" : "添加词语"}</h3>
          <button type="button" className="modal-close" aria-label="关闭" onClick={onClose}>×</button>
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="wf-hanzi">
            汉字或词语 <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            id="wf-hanzi"
            type="text"
            className="input-field"
            maxLength={32}
            placeholder="例如：学、学校"
            autoComplete="off"
            value={form.hanzi}
            onChange={(e) => { set("hanzi", e.target.value); setHanziError(""); }}
          />
          {hanziError && <div className="form-error">{hanziError}</div>}
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="wf-pinyin">拼音（可选）</label>
          <input
            id="wf-pinyin"
            type="text"
            className="input-field"
            placeholder="例如：xué"
            autoComplete="off"
            value={form.pinyin}
            onChange={(e) => set("pinyin", e.target.value)}
          />
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="wf-meaning">意思（可选）</label>
          <input
            id="wf-meaning"
            type="text"
            className="input-field"
            placeholder="例如：to study / learn"
            autoComplete="off"
            value={form.meaning}
            onChange={(e) => set("meaning", e.target.value)}
          />
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="wf-notes">备注（可选）</label>
          <input
            id="wf-notes"
            type="text"
            className="input-field"
            placeholder="可空着"
            autoComplete="off"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={form.isNew}
            onChange={(e) => set("isNew", e.target.checked)}
          />
          <span>标记为「本周新字」</span>
        </label>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}
