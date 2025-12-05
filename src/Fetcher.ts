import { chromium } from "playwright";
import is_ip_private from "private-ip";
import { RequestPayload } from "./types.js";

export class Fetcher {
  private static readonly UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  private static applyLengthLimits(text: string, maxLength: number, startIndex: number): string {
    if (startIndex >= text.length) {
      return "";
    }
    const end = maxLength > 0 ? Math.min(startIndex + maxLength, text.length) : text.length;
    return text.substring(startIndex, end);
  }

  static async rendered_html(requestPayload: RequestPayload) {
    try {
      const { url, headers, max_length, start_index, wait_ms } = requestPayload;
      if (is_ip_private(url)) {
        throw new Error(
          `Fetcher blocked an attempt to fetch a private IP ${url}. This is to prevent a security vulnerability where a local MCP could fetch privileged local IPs and exfiltrate data.`,
        );
      }

      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: Fetcher.UA,
        extraHTTPHeaders: headers ?? {},
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "networkidle" });
      const extraWait = typeof wait_ms === "number" ? wait_ms : 2000;
      if (extraWait > 0) {
        await page.waitForTimeout(extraWait);
      }
      let html = await page.content();
      await browser.close();

      html = this.applyLengthLimits(
        html,
        max_length ?? 5000,
        start_index ?? 0,
      );

      return { content: [{ type: "text", text: html }], isError: false };
    } catch (error) {
      return {
        content: [{ type: "text", text: (error as Error).message }],
        isError: true,
      };
    }
  }
}
