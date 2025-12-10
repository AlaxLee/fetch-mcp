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
      const { url, headers, max_length, start_index, wait_ms, simplify } = requestPayload;
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
      if (simplify) {
        await page.evaluate(() => {
          const SUFFIX = "...后续已忽略";
          // Truncate inline script content to 100 characters
          document.querySelectorAll("script").forEach((el) => {
            const t = el.textContent || "";
            if (t.length > 100) {
              el.textContent = t.slice(0, 100) + SUFFIX;
            }
          });
          // Truncate attribute values longer than 1000 characters to 100 characters
          document.querySelectorAll("*").forEach((el) => {
            const attrs = (el as Element).attributes;
            for (let i = 0; i < attrs.length; i++) {
              const a = attrs[i];
              const v = a.value || "";
              if (v.length > 1000) {
                (el as Element).setAttribute(a.name, v.slice(0, 100) + SUFFIX);
              }
            }
          });
        });
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
