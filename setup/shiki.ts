// https://sli.dev/custom/config-highlighter
import { defineShikiSetup } from '@slidev/types'

export default defineShikiSetup(() => {
  return {
    themes: {
      // https://shiki.style/themes
      dark: 'one-dark-pro',
      light: 'github-light',
    },
    transformers: [
      // ...
    ],
  }
})
