// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
// import path from 'path'
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), cssInjectedByJsPlugin()],
//   build:{
//     lib:{
//       entry:  path.resolve(__dirname, "src/index.jsx"),
//       name: 'ExpoVendorChat',
//       fileName: (format) => `expo-vendor-chat.${format}.js`,
//     },
//     rollupOptions: {
//       external: [],
//       output: {
//         globals:{
//           react: 'React',
//           "react-dom": 'ReactDOM',

//         }
//       }
//     }
//   },
//   define: {
//     "process.env.NODE_ENV": '"production"',
//   },
// })

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
