import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Production: strip debug logging (it leaked user/role details to the console).
  // console.error / console.warn are kept so real problems still reach Sentry.
  esbuild: mode === 'production' ? { pure: ['console.log', 'console.debug', 'console.info'], drop: ['debugger'] } : undefined,
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: change rarely, so returning visitors keep them cached.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          radix: [
            '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select',
            '@radix-ui/react-tabs', '@radix-ui/react-tooltip', '@radix-ui/react-popover',
          ],
        },
      },
    },
  },
}));
