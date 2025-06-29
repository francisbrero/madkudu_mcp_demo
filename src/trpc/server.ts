import "server-only";

import { createTRPCProxyClient, httpBatchLink, loggerLink } from "@trpc/client";
import { headers } from "next/headers";
import { type AppRouter } from "~/server/api/root";
import { transformer } from "./shared";

export const api = createTRPCProxyClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    httpBatchLink({
      transformer,
      url: `${getBaseUrl()}/api/trpc`,
      async headers() {
        const h = new Headers();
        const requestHeaders = await headers();
        requestHeaders.forEach((value, key) => h.set(key, value));
        return h;
      },
    }),
  ],
});

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}