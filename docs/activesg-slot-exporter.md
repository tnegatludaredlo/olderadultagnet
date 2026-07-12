# ActiveSG Slot Exporter

这个原型只做一件事：读取你已经确认好的 slot 接口，导出 CSV。

## 运行

```bash
node scripts/activesg_slot_export.mjs --config data/activesg_config.sample-local.json --out data/activesg_slots.sample.csv
```

接入真实接口后：

```bash
cp data/activesg_config.example.json data/activesg_config.json
node scripts/activesg_slot_export.mjs --config data/activesg_config.json --out data/activesg_slots.csv
```

## 配置思路

- `request.urlTemplate`
  填你在浏览器 Network 里看到的真实 slots API，请保留 `{{facilityId}}` 和 `{{date}}` 这样的占位。
- `request.headers.cookie`
  先从浏览器复制你自己的登录 cookie。这个值很敏感，不要提交到 Git。
- `extract.slotArrayPath`
  填返回 JSON 里 slots 数组所在路径，例如 `data.slots`。
- `extract.fieldMap`
  把 API 字段映射到 CSV 字段。如果接口字段名不同，改这里就行。
- `facilities`
  每个对象对应一个场馆/项目组合。

## 如何找真实接口

1. 登录 `MyActiveSG+`。
2. 打开某个场馆某一天的可预约页面。
3. 打开浏览器开发者工具的 Network。
4. 筛选 `fetch` / `xhr`。
5. 找返回 slot JSON 的请求。
6. 记录：
   - 请求 URL
   - 请求 method
   - 必要 headers
   - 响应 JSON 里 slots 数组路径
   - 场馆 ID 和日期参数名

## 当前限制

- 还没有自动登录。
- 还没有自动发现所有 facility ID。
- 如果 ActiveSG 接口需要签名、一次性 token 或更复杂的请求体，需要再加一层适配。
