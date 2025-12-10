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

    it("should run simplification when simplify is true", async () => {
      const pageContent = "<html><body><script>var a='x'.repeat(5000)</script><div data-long='x'.repeat(5001)>Rendered</div></body></html>";
      const evaluate = jest.fn().mockResolvedValueOnce(undefined);
      (chromium.launch as jest.Mock).mockResolvedValueOnce({
        newContext: jest.fn().mockResolvedValueOnce({
          newPage: jest.fn().mockResolvedValueOnce({
            goto: jest.fn().mockResolvedValueOnce(undefined),
            waitForTimeout: jest.fn().mockResolvedValueOnce(undefined),
            evaluate,
            content: jest.fn().mockResolvedValueOnce(pageContent),
            frames: jest.fn().mockReturnValue([]),
          }),
        }),
        close: jest.fn().mockResolvedValueOnce(undefined),
      });

      await Fetcher.rendered_html({ url: "https://example.com", simplify: true });
      expect(evaluate).toHaveBeenCalledTimes(1);
      const fnArg = evaluate.mock.calls[0][0];
      expect(typeof fnArg).toBe("function");
      expect(fnArg.toString()).toContain("querySelectorAll(\"style\")");
    });

    it("should inline iframe content with srcdoc when include_iframes is true", async () => {
      const pageContent = "<html><body><iframe src=\"https://frame.example\"></iframe></body></html>";
      const frameElementEvaluate = jest.fn().mockResolvedValueOnce(undefined);
      const frameMock = {
        url: jest.fn().mockReturnValue("https://frame.example"),
        content: jest.fn().mockResolvedValueOnce("<html><body>Frame</body></html>"),
        frameElement: jest.fn().mockResolvedValueOnce({ evaluate: frameElementEvaluate }),
        evaluate: jest.fn().mockResolvedValue(undefined),
      };
      (chromium.launch as jest.Mock).mockResolvedValueOnce({
        newContext: jest.fn().mockResolvedValueOnce({
          newPage: jest.fn().mockResolvedValueOnce({
            goto: jest.fn().mockResolvedValueOnce(undefined),
            waitForTimeout: jest.fn().mockResolvedValueOnce(undefined),
            evaluate: jest.fn().mockResolvedValueOnce(undefined),
            content: jest.fn().mockResolvedValueOnce(pageContent),
            frames: jest.fn().mockReturnValue([frameMock]),
            mainFrame: jest.fn().mockReturnValue({}),
          }),
        }),
        close: jest.fn().mockResolvedValueOnce(undefined),
      });

      await Fetcher.rendered_html({ url: "https://example.com", include_iframes: true });
      expect(frameElementEvaluate).toHaveBeenCalledTimes(1);
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
