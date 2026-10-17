// @lovable.dev/vite-tanstack-config already supplies React, TanStack, Tailwind,
// routing and error logging. Do not install duplicate framework plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * Lovable's preview annotates JSX with data-tsd-source for source navigation.
 * That is valid on DOM elements, but React Three Fiber interprets the dashed
 * prop as a nested property assignment and crashes the entire WebGL canvas:
 * "R3F: Cannot set data-tsd-source".
 *
 * Remove only this dev-only editor metadata from transformed town/home scene
 * modules. No gameplay props, SVG geometry or production assets are touched.
 */
function stripPreviewSourceMetadata(): Plugin {
  return {
    name: "strip-r3f-preview-source-metadata",
    enforce: "post",
    apply: "serve",
    transform: {
      order: "post",
      handler(source, id) {
      if (!id.includes("/src/") || !/\.(tsx|jsx)(\?|$)/.test(id) || !source.includes("data-tsd-source")) return null;
      const cleaned = source
        // JSX attribute, including its typical quoted source location.
        .replace(/\sdata-tsd-source\s*=\s*(?:\{\s*(?:"[^"]*"|'[^']*'|`[^`]*`)\s*\}|"[^"]*"|'[^']*')/g, "")
        // Compiled JSX props produced by preview transforms.
        .replace(/(?:["']data-tsd-source["']|data-tsd-source)\s*:\s*(?:"[^"]*"|'[^']*'|`[^`]*`),?/g, "");
      return cleaned === source ? null : { code: cleaned, map: null };
      },
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [stripPreviewSourceMetadata()],
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
