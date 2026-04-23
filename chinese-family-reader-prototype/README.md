# Family Chinese Reader — clickable prototype

Open **`index.html`** in a browser (double-click in Explorer, or drag the file into Chrome/Edge).

- **登录:** 首屏为 **使用 Google 登录**（演示：约 1 秒后写入假会话，**不**调用真实 Google OAuth）。也可 **跳过登录（演示）**。
- **设置:** 显示当前「账号」摘要；**退出登录** 会清除 `sessionStorage` 并回到登录页。
- **玩:** 识字卡片、游戏、故事（演示文案，无真实 AI）。
- **词库:** **添加词语**（底部弹窗：汉字/词语、拼音、意思、本周新字）、**批量添加**（每行一词，或 `词语,拼音,意思`）、搜索、编辑、删除；数据存 **localStorage**（`familyReaderProtoVocab`）。
- **词库 / 设置:** 底部导航切换；设置里可关 AI 看「故事」变灰。

设计说明见仓库根目录的 [DESIGN-chinese-family-reader.md](../DESIGN-chinese-family-reader.md)。
