### English

- Add a **Token usage** console page reporting the tokens and subscription quota consumed through cli2api, per model. Quota applies to every provider, so the breakdown covers WorkBuddy, Qoder, Trae, and the other adapters even when a model has no official list price. DeepSeek usage is additionally converted into an equivalent cost at the official list price, split into peak and off-peak hours (Beijing time weekdays 09:00–12:00 and 14:00–18:00 bill at double the off-peak rate). The page shows a quota card, the equivalent cost card, a stacked cost-over-time chart, a per-model table (requests, cache-hit / cache-miss input, output, tokens, peak vs off-peak cost, quota), and the official price table. Data comes from the existing request logs, so it covers only the retained ~7 days.

### 中文

- 新增控制台「Token 用量」页面，按模型统计经 cli2api 消耗的 token 与订阅额度。额度对所有 provider 都成立，因此即使某个模型没有官方列表价，明细里依然会列出 WorkBuddy、Qoder、Trae 等各适配器的用量。DeepSeek 的用量还会按官方列表价折算出等效费用，并区分高峰与闲时（北京时间工作日 09:00–12:00、14:00–18:00 按闲时的两倍计价）。页面包含额度卡片、折合费用卡片、按模型堆叠的费用趋势图、按模型明细（请求数、缓存命中/未命中的输入、输出、token 总量、高峰与闲时费用、额度）以及官方价格表。数据取自现有请求日志，因此只覆盖约 7 天的留存。
