# Fetch MCP Server

![fetch mcp logo](logo.jpg)

一个精简版 MCP 服务器，仅提供经无头浏览器渲染后的页面 HTML 抓取能力。

本工程参考并致敬原项目 zcaceres/fetch（作者 Zach Caceres），并感谢贡献者 Piotr Wilkin；在其基础上进行精简与改造，仅保留渲染后 HTML 抓取工具。

[NPM](https://www.npmjs.com/package/@alaxlee/mcp-rendered-fetch-server)

<a href="https://glama.ai/mcp/servers/nu09wf23ao">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/nu09wf23ao/badge" alt="Fetch Server MCP server" />
</a>

## 工具

- `fetch_rendered_html`
  - 功能：使用 Playwright 的 Chromium 渲染页面并返回当前 DOM 的完整 HTML（类似浏览器看到的页面）
  - 输入参数：
    - `url`（string，必填）：要抓取的页面 URL
    - `headers`（object，可选）：请求时附加的自定义 headers
    - `max_length`（number，可选）：返回内容最大字符数，默认从环境变量控制（默认 5000，`0` 表示不限制）
    - `start_index`（number，可选）：从该字符索引开始返回内容，默认 `0`
    - `wait_ms`（number，可选）：页面加载完成后额外等待的毫秒数，用于等待客户端渲染，默认 `2000`
    - `simplify`（boolean，可选）：是否启用精简模式，默认 `false`
    - `include_iframes`（boolean，可选）：是否将子 frame 的 HTML 内联到对应 `<iframe>` 元素（通过 `srcdoc`），并移除其 `src`；私网 frame 内容会阻断并打标
  - 返回：`{ content: [{ type: "text", text: "<html>...</html>" }], isError: false }`

## 安全

- 自动阻止访问私有 IP（如 `127.0.0.1`、`10.x.x.x`、`192.168.x.x` 等），防止本地数据被外泄
- 统一设置桌面浏览器 `User-Agent`，可通过 `headers` 叠加自定义头

## 快速开始

1. 克隆仓库
2. 安装依赖：`npm install`
3. 构建：`npm run build`
4. 运行：`npm start`

服务器通过 stdio 提供 MCP 能力。

### 示例调用（工具入参）

客户端调用工具 `fetch_rendered_html` 时，传参示例：

```json
{
  "name": "fetch_rendered_html",
  "arguments": {
    "url": "https://example.com",
    "simplify": true,
    "include_iframes": true,
    "wait_ms": 2000,
    "max_length": 50000,
    "start_index": 0
  }
}
```

## 环境变量

- `DEFAULT_LIMIT`：默认内容长度限制（字符数），设置为 `0` 表示不限制，默认 `5000`

## 在桌面应用中使用

将以下配置加入你的应用（示例）：

```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["@alaxlee/mcp-rendered-fetch-server"],
      "env": {
        "DEFAULT_LIMIT": "50000"
      }
    }
  }
}
```

客户端调用工具名为 `fetch_rendered_html`。

## 功能特性

- 使用 Playwright 的 Chromium 渲染并返回页面 HTML
- 支持自定义请求头、长度与起始位置控制、渲染后额外等待（`wait_ms`）
- 可选精简模式：截断脚本、样式与超长属性值，降低返回体大小
- 可选 iframe 内联：为每个子 frame 设置 `srcdoc` 并移除 `src`
- 阻止私有 IP 访问，提升安全性

## 精简模式说明（`simplify: true`）

启用后在浏览器端对当前 DOM 进行以下精简，再返回 HTML：

- `<script>` 内联内容仅保留前 100 个字符，后面追加 `...后续已忽略`
- `<script>` 与 `<style>` 的内联内容仅保留前 100 个字符，后面追加 `...后续已忽略`
- 所有元素的属性值长度超过 1000 时，仅保留前 100 个字符，后面追加 `...后续已忽略`

精简在渲染完成与额外等待（`wait_ms`）之后执行，随后再获取页面内容并应用 `max_length` 与 `start_index` 截断。

## iframe 内容内联说明（`include_iframes: true`）

- 遍历所有子 frame，获取其 HTML 并将内容写入对应 `<iframe>` 的 `srcdoc`，同时移除 `src`
- 私网地址的 frame 不会内联其真实内容，改为设置 `srcdoc="[Blocked private IP content]"`，并在元素上标记 `data-private-src-blocked="true"`
- 若启用精简模式，子 frame 内也会进行脚本、样式与长属性值的截断

## 依赖与浏览器安装提示

- 依赖：`@modelcontextprotocol/sdk`、`playwright`、`zod`、`private-ip`
- 若首次运行遇到浏览器缺失错误，可执行：`npx playwright install`

## 开发

- `npm run dev`：启动 TypeScript 编译器 watch 模式
- `npm test`：运行测试用例

## 许可证

MIT

## 致谢

- 参考项目：zcaceres/fetch
- 原作者：Zach Caceres（zach.dev）
- 贡献者：Piotr Wilkin（ilintar@gmail.com）
