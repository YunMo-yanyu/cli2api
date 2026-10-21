### English

- Add a **Token usage** console page that totals the DeepSeek tokens relayed through cli2api and converts them into what the same volume would cost at the official DeepSeek API list price. It shows an equivalent-cost card, a stacked cost-over-time chart, a per-model breakdown (requests, cache-hit / cache-miss input, output, tokens, peak vs off-peak cost), and the official price table. Prices live in one Go catalog (`internal/accounts/model_cost.go`) and bill peak hours (Beijing time weekdays 09:00–12:00 and 14:00–18:00) at the official double rate, off-peak at half. Data comes from the existing request logs, so it covers only the retained ~7 days.

### 中文

- 新增控制台「Token 用量」页面：统计经 cli2api 转发的 DeepSeek token 总量，并折算成这些用量按 DeepSeek 官方 API 列表价要花多少钱。页面包含折合费用卡片、按模型堆叠的费用趋势图、按模型明细（请求数、缓存命中/未命中的输入、输出、token 总量、高峰与闲时费用）以及官方价格表。价格集中在 Go 目录 `internal/accounts/model_cost.go`，高峰时段（北京时间工作日 09:00–12:00、14:00–18:00）按官方两倍价、闲时按半价折算。数据取自现有请求日志，因此只覆盖约 7 天的留存。
