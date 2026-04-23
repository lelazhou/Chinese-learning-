import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import type { Word } from "../../types";
import WordFormModal from "../ui/WordFormModal";
import BulkAddModal from "../ui/BulkAddModal";

interface Props {
  showToast: (msg: string) => void;
}

export default function Library({ showToast }: Props) {
  const [search, setSearch] = useState("");
  const [wordModalOpen, setWordModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editing, setEditing] = useState<Word | null>(null);

  const words: Word[] = useLiveQuery(
    async () => {
      const all = await db.words.orderBy("createdAt").reverse().toArray();
      if (!search.trim()) return all;
      const q = search.trim().toLowerCase();
      return all.filter(
        (w) =>
          w.hanzi.includes(q) ||
          w.pinyin.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q)
      );
    },
    [search]
  ) ?? [];

  async function toggleNew(w: Word) {
    await db.words.update(w.id!, { isNew: !w.isNew });
  }

  async function deleteWord(w: Word) {
    if (!confirm(`删除「${w.hanzi}」？`)) return;
    await db.words.delete(w.id!);
    showToast("已删除");
  }

  function openAdd() {
    setEditing(null);
    setWordModalOpen(true);
  }

  function openEdit(w: Word) {
    setEditing(w);
    setWordModalOpen(true);
  }

  const totalCount = useLiveQuery(() => db.words.count()) ?? 0;
  const newCount = useLiveQuery(() => db.words.where("isNew").equals(1).count()) ?? 0;

  return (
    <div className="screen active">
      <h2 className="title" style={{ margin: "0 0 4px" }}>词库</h2>
      <p className="hint" style={{ margin: "0 0 12px" }}>
        共 {totalCount} 个词语，其中 {newCount} 个本周新字
      </p>

      <div className="library-actions">
        <button type="button" className="btn btn-primary" onClick={openAdd}>添加词语</button>
        <button type="button" className="btn btn-ghost" onClick={() => setBulkModalOpen(true)}>批量添加</button>
      </div>

      <input
        type="search"
        className="input-field"
        placeholder="搜索：汉字、拼音或意思"
        autoComplete="off"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      {words.length === 0 ? (
        <div className="empty-state">
          <p>{search ? "没有匹配的词语" : "词库还是空的"}</p>
          {!search && <p>点击「添加词语」或「批量添加」</p>}
        </div>
      ) : (
        <ul className="list">
          {words.map((w: Word) => (
            <li key={w.id} className="list-row">
              <span className="hz">{w.hanzi}</span>
              <div className="meta">
                <strong>{w.pinyin || "—"}</strong>
                <small>{w.meaning || "（无意思）"}</small>
              </div>
              <button
                type="button"
                className={`toggle${w.isNew ? " on" : ""}`}
                aria-label="本周新字"
                aria-pressed={w.isNew}
                onClick={() => toggleNew(w)}
              />
              <div className="row-actions">
                <button type="button" className="icon-btn" title="编辑" aria-label="编辑" onClick={() => openEdit(w)}>✎</button>
                <button type="button" className="icon-btn danger" title="删除" aria-label="删除" onClick={() => deleteWord(w)}>🗑</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <WordFormModal
        open={wordModalOpen}
        word={editing}
        onClose={() => setWordModalOpen(false)}
        onSaved={() => showToast(editing ? "已保存修改" : "已添加词语")}
      />
      <BulkAddModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onImported={(n) => showToast(`已导入 ${n} 个词语`)}
      />
    </div>
  );
}
