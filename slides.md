---
# You can also start simply with 'default'
theme: default
title: Web3Dライブラリを作ってVue Custom Rendererの仕組みを理解しよう
info: |
  Vue Fes Japan 2026でのLT登壇資料
  https://vuefes.jp/2026/speaker/drumath2237
author: にー兄さん@drumath2237
class: text-left
# https://sli.dev/custom/highlighters.html
highlighter: shiki
# https://sli.dev/guide/drawing
drawings:
  persist: false
# enable MDC Syntax: https://sli.dev/guide/syntax#mdc-syntax
mdc: true
fonts:
  sans: M PLUS 2
  mono: JetBrains Mono
layout: intro
hideInToc: true
download: true
export:
  dark: true
colorSchema: dark
exportFilename: vuefes2026-custom-renderer
transition: none
seoMeta:
  ogImage: auto
comark: true
---

<style>
.intro h1{
    font-size: 3.2rem;
    line-height: 1;
}

img.logo{
    position: absolute;
    top: 20px;
    right: 20px;
    width: 160px;
}
</style>

# Web3Dライブラリを作って
# [Vue Custom Renderer]{style="color:#33CCFF"} の
# 仕組みを理解しよう

### にー兄さん[@ninisan_drumath](https://twitter.com/ninisan_drumath)
### Vue Fes Japan 2026

---
layout: two-cols
hideInToc: true
---

## にー兄さん

ソフトウェアエンジニア@HoloLab inc.

- Babylon.js勉強会運営
- Iwaken Lab.
- Microsoft MVP for  
  Developer Technologies (2024~)

<br/>

### 好きな技術

Babylon.js / WebXR Device API /  
Android XR / 3D Gaussian Splatting

- <bi-twitter /> [@ninisan_drumath](https://x.com/ninisan_drumath)
- <bi-github /> [@drumath2237](https:github.com/drumath2237)
- <bi-bluesky /> [@drumath2237.bsky.social](https://bsky.app/profile/drumath2237.bsky.social)


::right::

<img src="https://pbs.twimg.com/profile_images/1113849253548269568/4uy_K_LA_400x400.png" class="rounded-lg h-60 ml-20"/>
<img src="/images/realavatar.jpg" class="rounded-lg h-60 ml-50"/>

---
hidenToc: true
layout: section
---

## 本日の資料は撮影・SNS共有OKです📸

<br/>

## （公開予定）

---
layout: center
hidenToc: true
---

## サンプルプロジェクト

<br/>

<img src="/images/sample.png" class="w-120" />

https://github.com/drumath2237/Unity-SystemWSServer-Playground

---
hideInToc: true
---

## アジェンダ

<br/>

<Toc maxDepth="1"/>

---
---

```ts
import { defineShikiSetup } from '@slidev/types'

export default defineShikiSetup(() => {
  return {
    themes: {
      dark: '',
      light: 'github-light',
    },
    transformers: [
      // ...
    ],
  }
})
```
