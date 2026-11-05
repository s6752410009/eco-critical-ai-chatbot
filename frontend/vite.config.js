import { defineConfig } from "vite"
import { fileURLToPath, URL } from "url"
import postcss from "./postcss.config.js"
import react from "@vitejs/plugin-react"
import svgr from "vite-plugin-svgr"
import dns from "dns"
import { visualizer } from "rollup-plugin-visualizer"

dns.setDefaultResultOrder("verbatim")

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  assetsInclude: [
    "./public/piper/ort-wasm-simd-threaded.wasm",
    "./public/piper/piper_phonemize.wasm",
    "./public/piper/piper_phonemize.data"
  ],
  worker: {
    format: "es"
  },
  server: {
    port: 3000,
    host: "localhost",
    proxy: {
      "/api/school": {target:"http://127.0.0.1:3416",changeOrigin:false},
      "/api/discussions": {target:"http://127.0.0.1:3416",changeOrigin:false},
      "/api": { target: "http://127.0.0.1:3001", changeOrigin: true, ws: true }
    }
  },
  define: {
    "process.env": {
      NODE_ENV: mode === "production" ? "production" : "development"
    }
  },
  css: {
    postcss
  },
  plugins: [
    react(),
    svgr(),
    visualizer({
      template: "treemap", // or sunburst
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: "bundleinspector.html" // will be saved in project's root
    })
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: /^~\/api\/queries\/useCourses$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/queries.jsx", import.meta.url)) },
      { find: /^~\/api\/queries\/useCategories$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/queries.jsx", import.meta.url)) },
      { find: /^~\/api\/queries\/useCompanyInformation$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/queries.jsx", import.meta.url)) },

      { find: /^@remix\-run\/react$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/router.jsx", import.meta.url)) },
      { find: /^@repo\/shared$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/shared.ts", import.meta.url)) },
      { find: /^\~\/api\/queries$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/queries.jsx", import.meta.url)) },
      { find: /^\~\/api\/queries\/useCourse$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/queries.jsx", import.meta.url)) },
      { find: /^\~\/api\/queries\/useTopCourses$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/queries.jsx", import.meta.url)) },
      { find: /^\~\/api\/queries\/useGlobalSettings$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/queries.jsx", import.meta.url)) },
      { find: /^\~\/api\/queryClient$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/queryClient.js", import.meta.url)) },
      { find: /^\~\/api\/mutations$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/mutations.jsx", import.meta.url)) },
      { find: /^\~\/api\/mutations\/useMarkCourseOpened$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/mutations.jsx", import.meta.url)) },
      { find: /^\~\/api\/mutations\/useRepeatCourse$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/mutations.jsx", import.meta.url)) },
      { find: /^\~\/hooks\/usePermissions$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/permissions.js", import.meta.url)) },
      { find: /^\~\/hooks\/useLearningTimeTracker$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/hooks.js", import.meta.url)) },
      { find: /^\~\/hooks\/useLessonsSequence$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/hooks.js", import.meta.url)) },
      { find: /^\~\/modules\/Dashboard\/Settings\/Language\/LanguageStore$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/language.js", import.meta.url)) },
      { find: /^\~\/components\/VideoPlayer\/Video$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/optional.jsx", import.meta.url)) },
      { find: /^\~\/modules\/ContentMarketplace\/components\/ContentMarketplaceCoursesRow$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/optional.jsx", import.meta.url)) },
      { find: /^\.\/admin\/AddCategoryRow$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/optional.jsx", import.meta.url)) },
      { find: /^\.\/admin\/AddCourseToCategoryButton$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/optional.jsx", import.meta.url)) },
      { find: /^\.\/admin\/FeaturedCourseDialog$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/optional.jsx", import.meta.url)) },
      { find: /^\.\/HeroTrailerVideo$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/optional.jsx", import.meta.url)) },
      { find: /^\.\/RequiredVideoLeaveGuard$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/optional.jsx", import.meta.url)) },
      { find: /^\.\/LessonContentRenderer$/, replacement: fileURLToPath(new URL("./src/mentingo-bridge/LessonContentRenderer.jsx", import.meta.url)) },
      { find: /^~\//, replacement: fileURLToPath(new URL("./src/mentingo/", import.meta.url)) },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url))
      },
      {
        find: /^~/,
        replacement: ""
      }
    ]
  },
  build: {
    rolldownOptions: {
      output: {
        // These settings ensure the primary JS and CSS file references are always index.{js,css}
        // so we can SSR the index.html as text response from server/index.js without breaking references each build.
        entryFileNames: "index.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "index.css") return `index.css`
          return assetInfo.name
        }
      },
      external: [
        // Reduces transformation time by 50% and we don't even use this variant, so we can ignore.
        /@phosphor-icons\/react\/dist\/ssr/
      ]
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    entries: ["index.html"],
    include: ["@mintplex-labs/piper-tts-web"],
    rolldownOptions: {
      transform: { define: { global: "globalThis" } }
    }
  }
}))
