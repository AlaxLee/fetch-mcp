#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { RequestPayloadSchema } from "./types.js";
import { Fetcher } from "./Fetcher.js";
import process from "process";
import { downloadLimit } from "./types.js";

const server = new Server(
  {
    name: "zcaceres/fetch",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "fetch_rendered_html",
        description: "Fetch a website with JS rendering and return the rendered HTML",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL of the website to fetch",
            },
            headers: {
              type: "object",
              description: "Optional headers to include in the request",
            },
            max_length: {
              type: "number",
              description: `Maximum number of characters to return (default: ${downloadLimit})`,
            },
            start_index: {
              type: "number",
              description: "Start content from this character index (default: 0)",
            },
            wait_ms: {
              type: "number",
              description: "Extra wait after load in milliseconds (default: 2000)",
            },
            simplify: {
              type: "boolean",
              description:
                "Enable simplification: truncate inline <script> content to 100 chars and any attribute value longer than 1000 chars to 100 chars, appending '...后续已忽略'",
            },
            include_iframes: {
              type: "boolean",
              description:
                "Embed child frame HTML directly into the corresponding <iframe> element content (no attribute changes). Cross-origin frames are supported; frames from private IPs are replaced with placeholder content.",
            },
          },
          required: ["url"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const validatedArgs = RequestPayloadSchema.parse(args);

  if (request.params.name === "fetch_rendered_html") {
    const fetchResult = await Fetcher.rendered_html(validatedArgs);
    return fetchResult;
  }
  throw new Error("Tool not found");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
