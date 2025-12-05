import { Fetcher } from "./Fetcher";
import { chromium } from "playwright";

jest.mock("playwright", () => ({ chromium: { launch: jest.fn() } }));
jest.mock("private-ip", () => jest.fn(() => false));

describe("Fetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = { url: "https://example.com" };

  

  describe("rendered_html", () => {
    it("should return rendered HTML content", async () => {
      const pageContent = "<html><body><div id=app>Rendered</div></body></html>";
      (chromium.launch as jest.Mock).mockResolvedValueOnce({
        newContext: jest.fn().mockResolvedValueOnce({
          newPage: jest.fn().mockResolvedValueOnce({
            goto: jest.fn().mockResolvedValueOnce(undefined),
            waitForTimeout: jest.fn().mockResolvedValueOnce(undefined),
            content: jest.fn().mockResolvedValueOnce(pageContent),
          }),
        }),
        close: jest.fn().mockResolvedValueOnce(undefined),
      });

      const result = await Fetcher.rendered_html({ url: "https://example.com" });
      expect(result).toEqual({
        content: [{ type: "text", text: pageContent }],
        isError: false,
      });
    });

    it("should handle errors from playwright", async () => {
      (chromium.launch as jest.Mock).mockRejectedValueOnce(new Error("Browser error"));
      const result = await Fetcher.rendered_html({ url: "https://example.com" });
      expect(result).toEqual({
        content: [{ type: "text", text: "Browser error" }],
        isError: true,
      });
    });
  });

});
