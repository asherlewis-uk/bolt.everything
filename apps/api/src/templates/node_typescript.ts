/**
 * Minimal Node.js + TypeScript starter template.
 * Keys are workspace-relative paths (always rooted at /).
 */
export const NODE_TYPESCRIPT_FILES: Record<string, string> = {
  "/package.json": JSON.stringify(
    {
      name: "my-node-app",
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "tsx watch src/index.ts",
        build: "tsc",
        start: "node dist/index.js",
      },
      dependencies: {},
      devDependencies: {
        "@types/node": "^22",
        tsx: "^4",
        typescript: "^5",
      },
    },
    null,
    2,
  ),

  "/tsconfig.json": JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        outDir: "dist",
        rootDir: "src",
        strict: true,
        skipLibCheck: true,
      },
      include: ["src"],
    },
    null,
    2,
  ),

  "/src/index.ts": `console.log("Hello from Node.js + TypeScript");
`,

  "/.gitignore": `node_modules
dist
.env
`,
};
