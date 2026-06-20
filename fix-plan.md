# v1.0.0 修复规划

> 基于 2026-06-20 全量代码审查结果整理
> 来源：11 个并行审查代理覆盖 10 个子包 + monorepo 根配置

---

## 一、Critical（必须修复）

### 1. utils — 大小写敏感的导入路径

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/utils` |
| **位置** | `src/index.ts:4` |
| **问题** | `export { Experience } from './experience'` 但远程仓库文件是 `Experience.ts`（大写 E）。Windows 不区分大小写所以本地通过，Linux/macOS CI 会报 `Cannot find module` |
| **建议** | 配置 git 对文件名大小写严格，同步本地文件名 |
| **修复规划** | 1) `git config core.ignorecase false`；2) 根目录加 `.gitattributes` 含 `*.ts text eol=lf`；3) `git mv --cached` 两步法同步 |
| **当前状态** | 待解决 |

**用户描述/补充：**
远程仓库使用的是小写 experience.ts，所以这是 Windows git 的大小写问题。

---

### 2. utils — splitGroups 死循环

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/utils` |
| **位置** | `src/splitGroups.ts:13` |
| **问题** | `groupSize <= 0` 时 `Math.min(sum, groupSize)` 返回 0 或负数，`sum -= 0` 不减少或 `sum -= -1` 反而增加，导致死循环挂起引擎 |
| **建议** | 函数入口加 `if (groupSize <= 0) throw new RangeError('groupSize must be > 0')` |
| **修复规划** | 在 `splitGroups` 函数开头添加参数校验 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 3. utils — getRandomRangeValue 当 min > max 时返回错误

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/utils` |
| **位置** | `src/getRandomRangeValue.ts:7-10` |
| **问题** | `(10, 5)` 时 `max - min + 1 = -4`，`Math.random() * -4` 为 `[-4,0)`，最终返回 `[6,9]`，静默产生错误结果 |
| **建议** | 抛 `RangeError` 或自动交换 min/max |
| **修复规划** | 函数入口加 `if (min > max) throw new RangeError('min must be <= max')` |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 4. bedrock-url — 相对 URL 解析错误

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/bedrock-url` |
| **位置** | `src/bedrock-url.ts:19-33` |
| **问题** | 基 URL 的 query/hash 含 `/` 时（如 `bedrock://ns/path?key=foo/bar`），`lastIndexOf('/')` 找到错误 `/`，解析结果出错 |
| **建议** | 构造函数先过 `#parse`，然后用解析出的 `#pathname` / `#host` 等组件做相对解析，而不是在原始 `href` 上做字符串操作 |
| **修复规划** | 重构构造函数，先解析 base URL 再基于组件做相对路径解析 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 5. bedrock-url — URLSearchParams 不可迭代

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/bedrock-url` |
| **位置** | `src/url-search-params.ts:79-91` |
| **问题** | 缺少 `Symbol.iterator`、`entries()`、`keys()`/`values()` 返回数组而非迭代器。`for (const [k, v] of params)` 会抛错 |
| **建议** | 添加 `*entries()`, `keys()`/`values()` 改为生成器, `[Symbol.iterator]` 指向 `entries` |
| **修复规划** | 实现完整的 WHATWG 迭代协议 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 6. crypto — defaultRandomBytes 使用 Math.random()

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/crypto` |
| **位置** | `src/cipher.ts:10-16` |
| **问题** | `defaultRandomBytes` 用 `Math.random()` 生成 nonce/salt。QuickJS 的 MT19937 可预测，nonce 以明文前置在密文中，攻击者可重构 RNG 状态 |
| **建议** | 若 `rngChacha20` 可在 QuickJS 运行则替换，否则保留现状但加注释说明 |
| **修复规划** | 尝试用 `@noble/ciphers` 的 `rngChacha20` 替代；不可行则加 `console.warn` 备注 |
| **当前状态** | 待解决 |

**用户描述/补充：**
之所以使用 `Math.random()` 是因为 QuickJS 限制不支持 `crypto` `TextEncoder` `URL` 这些 API，如果 `rngChacha20` 可以在 QuickJS 中正常使用可以试一试。

---

### 7. crypto — HKDF 用于密码 KDF

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/crypto` |
| **位置** | `src/cipher.ts:34-41` |
| **问题** | `fromPassword` 用 HKDF（无迭代因子）做密码派生。HKDF 适合高熵输入，低熵密码可被暴力破解。`@noble/hashes` 提供 PBKDF2/scrypt 但未使用 |
| **建议** | 若 PBKDF2 在 QuickJS 可用则替换，否则保留现状 |
| **修复规划** | 尝试 PBKDF2（可配迭代次数）；若不可行则加文档说明 |
| **当前状态** | 待解决 |

**用户描述/补充：**
由于 QuickJS 限制，PBKDF 轮次过多导致 MCBE 脚本超时，并且可能使用了 QuickJS 不支持的函数。该加密用于 ScriptEvent 通信，不存在网络攻击破解的可能性。

---

### 8. ipc — #sentIds 无界增长

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/ipc` |
| **位置** | `src/ipc.ts:52,131-132` |
| **问题** | 每次 `send()` 向 `#sentIds` 添加 ID，只在收到 echo 时删除。如果 `system.sendScriptEvent` 静默失败，ID 永久泄漏 |
| **建议** | 加大小上限或定期清理 |
| **修复规划** | 添加 `MAX_INFLIGHT_IDS` 警戒线 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 9. rpc — invoke() 中 post() 先于 pending.set()

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/rpc` |
| **位置** | `src/rpc.ts:186-209` |
| **问题** | `#protocol.post()` 在 `#pending.set()` 之前执行。若执行模型变化，响应可能在 pending 注册前到达 |
| **建议** | 先 `#pending.set(id, { resolve, reject, timer: undefined })`，再 post，再设 timer |
| **修复规划** | 重构 `invoke()` 中顺序 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 10. root CI — 双构建

| 字段 | 内容 |
|------|------|
| **包** | root / CI |
| **位置** | `.github/workflows/ci.yml:52-53` |
| **问题** | CI 先 `nr build`（全局构建），再 `nr test`（每个包的 test 脚本又 `pnpm run build && vitest`），包被构建两次 |
| **建议** | 方案 B：包 test 脚本改为仅 `vitest`，CI 前置构建 |
| **修复规划** | 各子包 `package.json` 的 `test` 脚本改为 `vitest`（去掉 `pnpm run build &&`），CI 中 `nr build` 保持不变 |
| **当前状态** | 待解决 |

**用户描述/补充：**
使用 B 方案。

---

### 11. root CI — 不必要的 @antfu/ni

| 字段 | 内容 |
|------|------|
| **包** | root / CI |
| **位置** | `.github/workflows/ci.yml:25-26` |
| **问题** | CI 先 `pnpm i -g @antfu/ni` 再 `nci`，等价于多一步全局安装 |
| **建议** | `nci` → `pnpm install --frozen-lockfile`，`nr build` → `pnpm build`，`nr test` → `pnpm test`，去掉全局安装 |
| **修复规划** | 修改两个 workflow 文件，用原生 pnpm 命令替换 nci/nr |
| **当前状态** | 待解决 |

**用户描述/补充：**
如果不全局安装 `@antfu/ni`，后面的 `nci`/`nr` 命令就不可用了。用原生 pnpm 命令替换即可。

---

### 12. root CI/Release — 发布前无校验

| 字段 | 内容 |
|------|------|
| **包** | root / Release |
| **位置** | `.github/workflows/release.yml:58-62` |
| **问题** | release workflow 没有 lint/test 步骤，`--no-git-checks` 绕过 dirty tree 检查 |
| **建议** | 因 release 前 CI 已验证通过，无需重复 lint/test。`--no-git-checks` 建议保留注释说明 |
| **修复规划** | 不修改（保持现状） |
| **当前状态** | 已完成（不修复，CI 已前置验证） |

**用户描述/补充：**
检验已经由 ci.yml 进行了。只有 CI 全部通过后才会修改版本号、提交并打 tag 推送到远程仓库触发 release.yml，所以这里不需要再进行 lint/test。

---

### 13. root CI — Release 构建条件无效

| 字段 | 内容 |
|------|------|
| **包** | root / Release |
| **位置** | `.github/workflows/release.yml:43` |
| **问题** | `hashFiles('pnpm-lock.yaml') != ''` — 锁文件永远存在，条件永远为 true，无实际作用 |
| **建议** | `hashFiles` 是 GitHub Actions 内置函数，检查文件是否存在或变更。这里写成 `hashFiles('pnpm-lock.yaml') != ''` 本意可能是"锁文件变了才构建"，但实现无效。建议直接删掉条件 |
| **修复规划** | 删除该 `if` 条件 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

## 二、Important（建议修复）

### 14. ipc — maxPacketSize 检查在压缩前

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/ipc` |
| **位置** | `src/ipc.ts:220-224` |
| **问题** | 审查认为大 payload 压缩后可能变小但不通过检查。但这个限制是设计如此 |
| **建议** | maxPacketSize 是最大数据包大小限制（类似文件上传大小限制），与压缩无关。设计合理 |
| **修复规划** | 不修改（设计如此） |
| **当前状态** | 已完成（不修复，设计意图） |

**用户描述/补充：**
这个是最大数据包的支持，与压缩无关。

---

### 15. ipc — Chunker 按字符而非字节分割

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/ipc` |
| **位置** | `src/chunk.ts:37`, `src/types.ts:43-49` |
| **问题** | `String.slice()` 按 UTF-16 代码单元分割，文档说 chunkSize 是字节。非 ASCII 内容可能超出限制 |
| **建议** | QuickJS 不支持 `TextEncoder`，无法按字节分割。改为更新文档说明 |
| **修复规划** | 更新 `types.ts` JSDoc 中 chunkSize 单位说明为"UTF-16 代码单元（字符）"，非 ASCII 内容需自行编解码 |
| **当前状态** | 待解决 |

**用户描述/补充：**
QuickJS 引擎不支持 `TextEncoder`。

---

### 16. ipc — chunkSize 无输入校验

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/ipc` |
| **位置** | `src/chunk.ts:20-22` |
| **问题** | `chunkSize <= 0` 导致死循环 |
| **建议** | `if (chunkSize <= 0) throw new RangeError('chunkSize must be positive')` |
| **修复规划** | 构造函数加校验 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 17. discover — #sentIds 无界增长

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/discover` |
| **位置** | `src/discover.ts:99-104` |
| **问题** | 同 ipc，每次心跳 `#sentIds.add(nonce)`，echo 丢失时永久泄漏 |
| **建议** | 用 `Map<string, number>` 带时间戳，定期清理过期项 |
| **修复规划** | 改用时间戳 Map，每次 post 时清理超时项 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 18. discover — normalizeServiceType 破坏类型名

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/discover` |
| **位置** | `src/discover.ts:14` |
| **问题** | 正则会将 `my-svc-1` 和 `my-svc-1-2` 都归一化为 `my-svc` |
| **建议** | 在心跳中显式传输服务类型，不从 hostname 反向工程 |
| **修复规划** | 在 heartbeat URL 中加入 `t` 查询参数携带原始 serviceType |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 19. discover — register/query 无输入校验

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/discover` |
| **位置** | `src/discover.ts:88,127` |
| **问题** | 空字符串 `''` — `query('', cb)` 匹配所有服务（`endsWith('')` 总为 true） |
| **建议** | 拒绝空字符串、开头/结尾为 `.`、超长 type |
| **修复规划** | 在 `register`/`query` 入口加参数校验 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 20. log — 输出无级别标签

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/log` |
| **位置** | `src/log.ts:89-98` |
| **问题** | 格式化输出为 `[timestamp] [name]`，无日志级别 |
| **建议** | `[DEBUG] [INFO] [WARN] [ERROR] [FATAL]` 标签加到前缀 |
| **修复规划** | 修改 `#format()` 接受 level 参数，各方法传入级别 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 21. log — name 参数无校验

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/log` |
| **位置** | `src/log.ts:21` |
| **问题** | `new Log('')` / `new Log(null)` 输出 `[]` / `[null]` |
| **建议** | 空字符串/非字符串时抛 `TypeError` |
| **修复规划** | 构造函数加类型和空值校验 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 22. log — debug 惰性求值不捕获异常

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/log` |
| **位置** | `src/log.ts:38-45` |
| **问题** | `debug(() => { throw new Error() })` 未捕获，异常传播到调用方 |
| **建议** | 用 log 实例自身输出错误：`console.log(this.#format('error'), 'thunk threw:', e)` |
| **修复规划** | 包裹惰性求值在 try-catch 中，用 log 实例的 `console.log` + error 级别格式输出 |
| **当前状态** | 待解决 |

**用户描述/补充：**
不应用 `console.error`，用 log 包本身输出才对。

---

### 23. protocol — 测试 mock 不匹配真实 API

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/protocol` |
| **位置** | `test/setup.ts:3-8` |
| **问题** | mock 包含不存在的 `'Command'`，缺少真实的 `'NPCDialogue'` |
| **建议** | 直接使用 `ScriptEventSource` 枚举 |
| **修复规划** | 从 `@minecraft/server` 导入 `ScriptEventSource` 替换硬编码 mock |
| **当前状态** | 待解决 |

**用户描述/补充：**
直接使用 `ScriptEventSource` 枚举怎么样？—— 赞成。

---

### 24. ~~protocol — post() 无 payload 大小检查~~ 已撤销

| 字段 | 内容 |
|------|------|
| **决策** | 这是协议层面，不应该由 Protocol 层限制。后续突破 2048 限制后仍受限，体验不好。由调用者处理。 |

**用户描述/补充：**
不用，这是协议层面，不应这样做。应该由调用者处理。

---

### 25. rpc — 方法名无校验

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/rpc` |
| **位置** | `src/rpc.ts:181,221` |
| **问题** | 空字符串、含 `"/"`、`"?"` 的 method 产生错误 URL |
| **建议** | 拒绝空字符串、含 `/` 或 `?` 的 method |
| **修复规划** | 在 `invoke()`/`handle()` 入口加参数校验 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 26. ~~rpc — 未注册方法静默忽略~~ 已撤销

| 字段 | 内容 |
|------|------|
| **决策** | 没有 handler 就没有 response 的路由，超时是预期行为。保持现状。 |

**用户描述/补充：**
谁来发送错误响应？无 handler 不是应该超时吗？—— 合理，超时是预期行为。

---

### 27. ~~utils — addLevel 不重置 XP buffer~~ 已撤销

| 字段 | 内容 |
|------|------|
| **决策** | 等级和 XP 各管各的，不混淆。`setLevel` 也不应该重置 `#xp`。原 reviewer 建议不正确。 |

**用户描述/补充：**
等级是等级，XP 是经验，不应搞混。`setLevel` 不应 `this.#xp = 0`。

---

### 28. utils — ms2ticks 负数参数

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/utils` |
| **位置** | `src/ms2ticks.ts:13-14` |
| **问题** | `ms2ticks(-1000)` 返回 `-20`，负数 ticks 无意义。`millisecondsPerSecond` 为 0 时返回 `NaN` |
| **建议** | 三个参数都做 >0 校验 |
| **修复规划** | 函数入口加参数数值校验 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 29. runtime — 测试覆盖不完整

| 字段 | 内容 |
|------|------|
| **包** | `@mcbe-mods/runtime` |
| **位置** | `test/runtime.test.ts` |
| **问题** | 仅测试 7/15 个值导出；`Compressor` 被归类到 `ipc` 测试组 |
| **建议** | 为每个未测试的导出加 `expect(Export).toBeDefined()`；`Compressor` 独立为 `re-exports compress` |
| **修复规划** | 扩充测试覆盖 |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 30. ~~root — lint-staged 对所有文件运行~~ 已撤销

| 字段 | 内容 |
|------|------|
| **决策** | `@antfu/eslint-config` 默认跳过非支持文件，`"*"` 不会出问题。保留现状。 |

**用户描述/补充：**
ESLint 也有默认的匹配范围，无需修改。

---

### 31. root — 所有 package.json 缺 engines

| 字段 | 内容 |
|------|------|
| **包** | root + 所有子包 |
| **位置** | 所有 `package.json` |
| **问题** | 无 `"engines"` 字段 |
| **建议** | 加 `"engines": {"node": ">=18.0.0", "pnpm": ">=10.0.0"}` |
| **修复规划** | 根和各子包 package.json 加 engines |
| **当前状态** | 待解决 |

**用户描述/补充：**

---

### 32. ~~root — tsconfig skipLibCheck 掩盖类型错误~~ 已撤销

| 字段 | 内容 |
|------|------|
| **决策** | `@minecraft/server` 类型定义质量参差不齐，`skipLibCheck: false` 会报大量外部依赖类型错误。保持现状。 |

**用户描述/补充：**

---

### 33. root — vitest 无 coverage 配置

| 字段 | 内容 |
|------|------|
| **包** | root |
| **位置** | `vitest.config.ts` |
| **问题** | 没有 `test.coverage` 配置 |
| **建议** | vitest coverage 运行在 **Node.js**（vitest 的环境），不是 QuickJS。V8 provider 直接可用（零额外依赖），可以加 `text`/`lcov` reporter |
| **修复规划** | 可选添加。MCBE 不公开具体 QuickJS 版本（深度定制 fork），但 coverage 不依赖目标运行时。如果要加：`test.coverage.provider: 'v8'` + `reporter: ['text', 'lcov']` |
| **当前状态** | 已完成（不修复，意义不大） |

**用户描述/补充：**
我看 vitest 支持自定义 `'v8' | 'istanbul' | 'custom'` 所以是否可用使用 QuickJS？
—— coverage 运行在 Node.js（vitest 环境），不涉及 QuickJS。直接用 v8 provider 即可。

MCBE v1.21.80+ 的 QuickJS 版本？—— Mojang 不公开具体版本号，是深度定制 fork。已知限制：不支持 `TextEncoder` / `TextDecoder` / `crypto.getRandomValues` / `URL` / `atob` / `btoa` 等 Web API。

---

## 三、Minor（可优化，按包分组）

### bedrock-url

| # | 位置 | 问题 | 建议 | 当前状态 |
|---|------|------|------|----------|
| M1 | `src/bedrock-url.ts:108` | port 未校验范围 0-65535 | 加 `parseInt <= 65535` 检查 | 待解决 |
| M2 | `src/bedrock-url.ts:165-167` | `origin` 不包含 port | 非默认 port 时包含，或文档说明 | 待解决 |
| M3 | `src/url-search-params.ts:79-83` | `forEach` 缺少 `thisArg` | 加可选第二个参数 | 待解决 |
| M4 | `README.md` | `toScriptEventId()` 未在 API 表列出 | 加文档 | 待解决 |
| M5 | `package.json` | 确认发布包不含 `src/`/`test/` | `npm pack --dry-run` 验证 | 待解决 |
| M6 | `README.md` | 无 userinfo 限制说明 | 文档中说明 | 待解决 |
| M7 | `test/` | 缺少边界测试（空 query、port 边界、iteration 等） | 补充测试 | 待解决 |
| M8 | `test/` | 测试脚本含 `pnpm run build &&` 降低开发循环 | 改为仅 `vitest`（与 CI 双构建修复同步） | 待解决 |

### compress

| # | 位置 | 问题 | 建议 | 当前状态 |
|---|------|------|------|----------|
| M1 | `src/compress.ts:4-11` | 无状态类，可考虑静态方法 | 设计偏好，可不改 | 待确认 |
| M2 | `package.json:9` | description 含 "with threshold"（实际已委托给调用方） | 删除 "with threshold" | 待解决 |
| M3 | `src/compress.ts` | 无 `@throws` JSDoc | 补充文档 | 待解决 |
| M4 | `test/compress.test.ts:18` | 压缩率断言用 string length 而非 byte length | 改为 byte length 比较 | 待解决 |
| M5 | `test/compress.test.ts` | 缺少失败路径测试 | 补充测试 | 待解决 |

### crypto

| # | 位置 | 问题 | 建议 | 当前状态 |
|---|------|------|------|----------|
| M1 | `src/cipher.ts:27` | 死代码分支 `?? 24` 从不触发 | 简化 | 待解决 |
| M2 | `src/cipher.ts:27` | 不安全类型转换 `as unknown as TRet<Uint8Array>` | 精确类型化函数签名 | 待解决 |
| M3 | `src/cipher.ts:55-69` | 无输入 null/undefined 校验 | 加 TypeErrors | 待解决 |
| M4 | `src/cipher.ts:39` | HKDF `info` 为 `undefined`（无用域分离） | 用 `'mcbe-mods-crypto-v1'` | 待解决 |
| M5 | `src/cipher.ts:37-38` | fromPassword salt 缺省值为硬编码常量 | 自动生成或改为必须参数 | 待解决 |
| M6 | `test/crypto.test.ts` | 缺少关键安全测试 | 补充测试 | 待解决 |
| M7 | `src/cipher.ts:55-69` | 无 `Uint8Array` 二进制数据重载 | 加 `encryptBytes`/`decryptToBytes` | 待解决 |
| M8 | `src/cipher.ts:18-20` | 无 AAD（关联认证数据）支持 | 暴露 AAD 参数 | 待解决 |

### discover

| # | 位置 | 问题 | 建议 | 当前状态 |
|---|------|------|------|----------|
| M1 | `src/discover.ts:161` | TTL 比较用 `>` 而非 `>=`（边界差异 1 秒） | 改为 `>=` | 待解决 |
| M2 | `src/discover.ts:176` | `#notifyQueries` 错误用模板字符串丢失 stackTrace | 传 error 对象 | 待解决 |
| M3 | `src/discover.ts:142-155` | `dispose()` 不触发 `service-removed` | 触发清理事件 | 待解决 |
| M4 | `src/discover.ts:13` | `normalizeServiceType` 不导出 | 导出或文档说明语义 | 待解决 |
| M5 | `src/discover.ts` | 无 introspection API | 考虑暴露只读 Map | 待解决 |
| M6 | `test/setup.ts:5-9` | mock 同步触发 echo，掩盖时序 bug | 异步化 mock | 待解决 |
| M7 | `test/discover.test.ts` | 缺少多处测试 | 补充测试 | 待解决 |
| M8 | `src/discover.ts:34-38` | 无验证 heartbeatInterval/ttl 逻辑关系 | 加有效性校验 | 待解决 |

### ipc

| # | 位置 | 问题 | 建议 | 当前状态 |
|---|------|------|------|----------|
| M1 | `src/ipc.ts:80` | hostname 恰为 `.ipc` 时 namespace 为空字符串 | 加长度守卫 | 待解决 |
| M2 | `src/ipc.ts:270` | pathname 为 `""` 时 channel 为空 | guard 空 channel | 待解决 |
| M3 | `src/ipc.ts:282-285` | `c=1` 但未配置 compressor 时静默传原始数据 | emit error event | 待解决 |
| M4 | `src/ipc.ts:127-141` | dispose 后 send() 无守卫 | 在 send 开头检查 disposed | 待解决 |
| M5 | `README.md:50-52` | 引用不存在的 `EVENTS.INVALID_PACKET` | 删除或实现该事件 | 待解决 |
| M6 | `test/ipc.bench.ts:67,79,91` | benchmark 计算值可能被优化掉 | 加 sink | 待解决 |
| M7 | `test/ipc.test.ts` | chunk timeout 从未被测试 | 加 timeout 测试 | 待解决 |
| M8 | `test/ipc.test.ts` | 缺少 error event 测试 | 补充 | 待解决 |
| M9 | `test/ipc.test.ts` | 缺少 compression path 测试 | 补充 | 待解决 |

### log

| # | 位置 | 问题 | 建议 | 当前状态 |
|---|------|------|------|----------|
| M1 | `src/log.ts:28-30` | 无效 level 字符串静默放行所有消息 | 校验 level 值 | 待解决 |
| M2 | `src/log.ts:73-78` | `fatal` 与 `error` 共用 `console.error` | 加 `FATAL` 级别标签 | 待解决 |
| M3 | `src/globals.d.ts:1` | 全局 `console` 声明可能冲突 | 用 `declare global` 包裹 | 待解决 |
| M4 | `test/log.test.ts` | `info()`/`error()` 输出未被测试 | 补充断言 | 待解决 |
| M5 | `test/log.test.ts` | 无空/null name 测试 | 补充 | 待解决 |
| M6 | `README.md:35-36` | `.child()` 示例用了 `new Log()` | 修正示例 | 待解决 |
| M7 | `README.md:40` | 无可选颜色支持 | 考虑加 opt-in ANSI 颜色 | 待解决 |

### protocol

| # | 位置 | 问题 | 建议 | 当前状态 |
|---|------|------|------|----------|
| M1 | `src/protocol.ts:114-115` | `once()` handler 抛异常后已取消订阅 | 可考虑 try-catch | 待解决 |
| M2 | `src/protocol.ts:57` | `sourceType` truthy 检查，空字符串绕过 | 改为 `!== undefined` | 待解决 |
| M3 | `test/protocol.test.ts:169` | 注释 misleading | 重写注释 | 待解决 |
| M4 | `src/protocol.ts:15-19` | `BedrockReceiveEvent` JSDoc 不提示 query 参数 | 加 JSDoc | 待解决 |
| M5 | `src/protocol.ts:94,100,124` | 不必要的非 null 断言 | 可用 getter 消除 | 待解决 |

### rpc

| # | 位置 | 问题 | 建议 | 当前状态 |
|---|------|------|------|----------|
| M1 | `src/rpc.ts:48,228` | `unknown \| Promise<unknown>` 冗余 | 简化为 `unknown` | 待解决 |
| M2 | `src/rpc.ts:189` | `null` 数据序列化为 `"null"`，与 `undefined` 语义不同 | 文档说明或统一处理 | 待解决 |
| M3 | `src/rpc.ts:151` | `parsed.error as string` 无运行时检查 | 加 `typeof === 'string'` 守卫 | 待解决 |
| M4 | `src/rpc.ts:103,170` | hostname 切片无注释 | 加注释 | 待解决 |
| M5 | `src/rpc.ts:202` | `ms2ticks` 用 `floor` 导致超时缩短 | 可考虑 `ceil` | 待解决 |
| M6 | `src/rpc.ts:92-94` | 跨 namespace ID 碰撞误判循环（极低概率） | namespace 加入 ID 比较 | 待解决 |

### runtime

| # | 位置 | 问题 | 建议 | 当前状态 |
|---|------|------|------|----------|
| M1 | `README.md:21` | crypto 行 Type Exports 为空，缺 `CipherOptions` | 补全 | 待解决 |
| M2 | `README.md:27` | utils 行用 `…` 省略 | 展开或链接子包 README | 待解决 |
| M3 | `README.md:30` | import 示例不全 | 加备注"见上方表格" | 待解决 |
| M4 | `tsdown.config.ts:1-5` | 全部用 tsdown 默认值 | 显式声明 format/dts 等 | 待解决 |

### utils

| # | 位置 | 问题 | 建议 | 当前状态 |
|---|------|------|------|----------|
| M1 | `src/base64.ts:18` | `toBytes` 静默丢弃非法 base64 字符 | 可考虑严格模式 | 待解决 |
| M2 | `src/base64.ts:18` | 正则多余的 `i` 标志 | 改为 `[^A-Za-z0-9+/=]` | 待解决 |
| M3 | `src/Experience.ts:51,77` | `addXP(-100)` 产生负 XP | guard 或 clamp 到 0 | 待解决 |
| M4 | `src/Experience.ts:42` | `getNextLevelRequiredXP` 命名冗长 | 可考虑简化 | 待解决 |
| M5 | `src/splitGroups.ts:13` | 负 sum 静默返回空数组 | 可考虑抛错或取绝对值 | 待解决 |
| M6 | `src/ms2ticks.ts` | 参数名与 README 不一致 | 统一 | 待解决 |
| M7 | `src/unique.ts:6-12` | `unique(0)` / `unique(-1)` 返回空字符串 | 加 `size = Math.max(0, size)` | 待解决 |
| M8 | `src/color.ts:53` | 每次属性访问创建新 Proxy | 可考虑 memoize | 待解决 |
| M9 | `test` | 测试直接从 `../src/index` 导入 | 可选改进 | 待解决 |

### root

| # | 位置 | 问题 | 建议 | 当前状态 |
|---|------|------|------|----------|
| M1 | `package.json:21` | `typecheck` 脚本 `tsc --noEmit` 冗余（tsconfig 已有） | 简化为 `tsc` | 待解决 |
| M2 | `pnpm-workspace.yaml:2` | `ignoreWorkspaceRootCheck: true` 无注释 | 加注释 | 待解决 |
| M3 | `.github/workflows/ci.yml` | 各 job 无 `timeout-minutes` | 加 10 分钟超时 | 待解决 |
| M4 | `.github/workflows/ci.yml:22` | `node-version: lts/*` 随时间变化 | 考虑 pin 到 `22.x` | 待解决 |
| M5 | `eslint.config.ts:16` | `no-console` 允许列表缺 `'debug'` | 添加 `'debug'` | 待解决 |
| M6 | `vitest.config.ts` | 根和各子包各一份 config | 可用 `vitest.workspace.ts` 统一 | 待解决 |
| M7 | `.gitignore` | 缺 `.pnpm-debug.log`、`*.tsbuildinfo`、`.env` 等 | 补充 | 待解决 |
| M8 | `eslint.config.ts` | 无 QuickJS 特定 lint 规则 | 加 `no-restricted-globals` | 待解决 |
| M9 | `package.json:22` | `prepare` 脚本在每次 install 运行 | 改为 `npx simple-git-hooks` | 待解决 |
| M10 | `README.md:27-31` | 示例用 `npm install` 但项目用 pnpm | 改为 `pnpm add` | 待解决 |
| M11 | `.github/workflows/release.yml` | 发布前无 `--dry-run` | 加 dry-run | 待解决 |
| M12 | `.vscode/settings.json:31` | `eslint.validate` 含 `vue`（无 Vue 文件） | 移除 | 待解决 |
| M13 | `tsconfig.json:3-4` | ES2021 选择理由无注释 | 加注释说明 QuickJS 限制 | 待解决 |
| M14 | `.github/workflows/release.yml:59` | `--no-git-checks` 风险 | 保留（已验证 CI 前置） | 待解决 |
| M15 | `README.md` | `release` 流程未文档化 | 补充发布流程文档 | 待解决 |
| M16 | `tsdown.config.ts` | 根和各子包 config 不一致 | 考虑统一 | 待解决 |
| M17 | project root | 无 `.npmrc` | 创建，设 `auto-install-peers=true` | 待解决 |

---
