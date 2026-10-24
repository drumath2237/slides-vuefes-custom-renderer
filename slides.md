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
layout: two-cols-header
hidenToc: true
---

## サンプルプロジェクト

::left::

<div class="mr-5">

<br/>

<img src="/images/sample.png" class="w-100" />

https://github.com/drumath2237/vue-custom-3d-renderer-sandbox
</div>


::right::

<div class="ml-5">
<br/>

<img src="/images/sample2.png" class="w-100"/>

https://github.com/drumath2237/vue-custom-renderer-playground

</div>

---
hideInToc: true
---

# アジェンダ

<br/>

<Toc maxDepth="1"/>

---
layout: section
---

# Custom Rendererと<br/>Web3Dライブラリについて

---
level: 2
---

# Vue Custom Rendererとは

<br/>

- Vue SFCで構造的なデータを作成・表現できる仕組み
- `@vue/runtime-core`で提供されている機能
- 実際に`@vue/runtime-dom`ではDOMに対するRendererを実装
- DOM以外のデータに対しても自作のRendererが作れる
- 例）
  - PDF文書
  - TUI
  - Webメール
  - 設定データ

---
layout: two-cols-header
level: 2
---

# 3Dのシーンもヒエラルキ構造を成す

<br/>

::left::

- 3Dのシーンにはカメラやライト、<br/>メッシュやエフェクトなどが存在
- オブジェクト同士は親子関係を構築できる
- （Web）3Dライブラリは<br/>手続き的な処理によってこれを実現
- Custom Rendererでラップすれば<br/>宣言的に記述可能になりそう

::right::

Babylon Liteによるシーン実装例

```ts
const engine = await createEngine(renderCanvas)
const scene = createSceneContext(engine)
const camera = createDefaultCamera(scene)
attachControl(camera, renderCanvas, scene)

const light = createDirectionalLight([1, -1, 1])
addToScene(scene, light)

const box = createBox(engine, 1)
const material = createStandardMaterial()
box.material = material
addToScene(scene, box)

const sphere = createSphere(engine)
sphere.parent = box

await registerScene(scene)
await startEngine(engine)
```

---
layout: section
---

# Custom Rendererによる<br/>3Dシーンの実装

---
<!--layout: two-cols-header-->
level: 2
---

# createRenderer()でRendererの作成

<br/>

`createRenderer`関数の型定義

```ts
createRenderer<HostNode, HostElement>(options: RendererOptions<HostNode, HostElement>): Renderer<HostElement>;
```

Rendererを作成してレンダー処理を開始

```ts
const renderer = createRenderer(nodeOps)

// アプリ全体でCustom Rendererを使う場合
const app = renderer.createApp(rootComponent)
createApp(app).mount('#app')

// or 特定コンポーネントのslotsをCustom Rendererとして扱う場合
renderer.render(rootComponent, rootContainer)
```

---
layout: two-cols-header
level: 2
---

# RendererOptionsの実装

<br/>

::left::

- `createRenderer()`が引数に<br />取るオプション
- 独自定義のElement/Nodeの動作を定義するメインの部分
- 慣習的に`nodeOps`という名前で定義される事が多い

::right::

<div class="ml-10">


RendererOptionsの定義必須の関数たち

```ts{all|2,5,6,7,8,9}
const nodeOps: RendererOptions = {
  createElement(type, namespace, isCustomizedBuiltin, props) {...},
  createComment(text) {...},
  createText(text) {...},
  insert(element, parentNode) {...},
  nextSibling(node) {...},
  parentNode(node) {...},
  patchProp(element, key, prevValue, nextValue) {...},
  remove(node) {...},
  setElementText(node, text) {...},
  setText(node, text) {...},
}
```
</div>

---
layout: two-cols-header
level: 2
---

# 要素の作成フローと親子関係の構築(1/3)

<br/>

::left::

```ts
<SceneVue>
  <DirectionalLight :direction="vec3(-0.5, -1, 1)" />
  <Box :position="vec3(0, 0.5, 0)" :size="0.5">
    <Material :color="{ r: 1, g: 0, b: 0 }" />
    <Sphere :diameter="0.3" :position="vec3(0.5, 0, 0)">
      <Material :color="{ r: 1, g: 1, b: 1 }" />
    </Sphere>
    <Box :position="vec3(0, -0.5, 0)" :size="0.5">
      <Material :color="{ r: 0, g: 0, b: 1 }" />
    </Box>
  </Box>
</SceneVue>
```

- 右のようなElementの構造になる

::right::

<img src="/images/tree.png" class="mt--5">
    
---
layout: two-cols-header
level: 2
---

# 要素の作成フローと親子関係の構築(2/3)

<br/>

::left::

```ts
<SceneVue>
  <DirectionalLight :direction="vec3(-0.5, -1, 1)" />
  <Box :position="vec3(0, 0.5, 0)" :size="0.5">
    <Material :color="{ r: 1, g: 0, b: 0 }" />
    <Sphere :diameter="0.3" :position="vec3(0.5, 0, 0)">
      <Material :color="{ r: 1, g: 1, b: 1 }" />
    </Sphere>
    <Box :position="vec3(0, -0.5, 0)" :size="0.5">
      <Material :color="{ r: 0, g: 0, b: 1 }" />
    </Box>
  </Box>
</SceneVue>
```

- 最初に`createElement`が呼ばれて<br/>Elementを作成しておく
- この時に親子関係などはいったん置いておき、オブジェクト単体を作成
- ツリーが走査される過程で行きがけ順に呼ばれる

::right::

<img src="/images/tree2.png" class="mt--5">

---
layout: two-cols-header
level: 2
---

# 要素の作成フローと親子関係の構築(3/3)

<br/>

::left::

```ts
<SceneVue>
  <DirectionalLight :direction="vec3(-0.5, -1, 1)" />
  <Box :position="vec3(0, 0.5, 0)" :size="0.5">
    <Material :color="{ r: 1, g: 0, b: 0 }" />
    <Sphere :diameter="0.3" :position="vec3(0.5, 0, 0)">
      <Material :color="{ r: 1, g: 1, b: 1 }" />
    </Sphere>
    <Box :position="vec3(0, -0.5, 0)" :size="0.5">
      <Material :color="{ r: 0, g: 0, b: 1 }" />
    </Box>
  </Box>
</SceneVue>
```

- 並行して`insert`が呼ばれる
- parentのElementがわかるので親子関係を構築
- ツリーが走査される過程で帰りがけ順に呼ばれる


::right::

<img src="/images/tree3.png" class="mt--5">

---
layout: two-cols-header
level: 2
---

# 実際のレンダリング結果

<br/>

::left::

```ts
<SceneVue>
  <DirectionalLight :direction="vec3(-0.5, -1, 1)" />
  <Box :position="vec3(0, 0.5, 0)" :size="0.5">
    <Material :color="{ r: 1, g: 0, b: 0 }" />
    <Sphere :diameter="0.3" :position="vec3(0.5, 0, 0)">
      <Material :color="{ r: 1, g: 1, b: 1 }" />
    </Sphere>
    <Box :position="vec3(0, -0.5, 0)" :size="0.5">
      <Material :color="{ r: 0, g: 0, b: 1 }" />
    </Box>
  </Box>
</SceneVue>
```


::right::


---
layout: section
---

# おわりに

---
level: 2
---

# 参考文献
