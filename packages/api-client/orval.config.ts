import { defineConfig } from "orval";

export default defineConfig({
  odyssey: {
    input: "./openapi.json",
    output: {
      mode: "tags-split",
      target: "./src/generated/endpoints.ts",
      schemas: "./src/generated/models",
      client: "react-query",
      httpClient: "fetch",
      baseUrl: "http://localhost:8787",
      clean: true,
    },
  },
});