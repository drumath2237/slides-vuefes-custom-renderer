import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  if (mode === "development") {
    return {};
  }

  return {
    base: "/slides-vuefes-custom-renderer/",
  };
});
