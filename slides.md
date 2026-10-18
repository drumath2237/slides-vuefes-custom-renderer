---
# You can also start simply with 'default'
theme: default
title: UnityでSystem.Net.WebSocketsなWebSocketサーバが動かないのでUnity Monoのコードを覗いてみた
info: |
  C# Kaigi 2026の登壇資料
  https://csharpkaigi.net/talks/lt-unity-websocket
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
exportFilename: csharpkaigi26-unity-websocket
transition: none
seoMeta:
  ogImage: auto
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

<img src="/images/csharpkaigi.svg" class="logo" />

# Unityで
# <span style="color:#33CCFF;">System.Net.WebSockets</span> な
# WebSocketサーバが動かないので
# Unity Monoのコードを覗いてみた

### にー兄さん[@ninisan_drumath](https://twitter.com/ninisan_drumath)
### C# Kaigi 2026


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

- <uim-twitter-alt /> [@ninisan_drumath](https://x.com/ninisan_drumath)
- <uim-github-alt /> [@drumath2237](https:github.com/drumath2237)

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
layout: section
level: 1
---

## Unity/WSサーバにおける<br/>技術選定の背景

---
level: 2
---

## UnityでWebSocketサーバを動かす選択肢

<!--<br/>-->

検索して出てくるのは

- **Fleck**
  - [statianzo/Fleck](https://github.com/statianzo/Fleck)
  - NuGetで配布されているC#のWebSocket実装
  - 最終更新は5年前
- **websocket-sharp**
  - [sta/websocket-sharp](https://github.com/sta/websocket-sharp)
  - 老舗のWebSocket実装ライブラリ
  - NuGetへの最終リリースは10年前だけどリポジトリはちょくちょく更新かかってるっぽい
- **NativeWebSocket**
  - [endel/NativeWebSocket](https://github.com/endel/NativeWebSocket)
  - 一番モダンな選択肢になりそうだけどあんまり記事で見ない
  - Unity以外にも色んなプラットフォームに対応

---
level: 2
layout: center
---

WSサーバって
## 標準ライブラリだけで実装できないっけ……？

<br/>

## <v-click> _→ HttpListenerとWebSocketが使える_ </v-click>

---
level: 2
layout: two-cols-header
---

## 実装のイメージ

::left::

`HttpListener`で接続リクエストを`WebsoketContext`にUpgrade

```cs
var _listener = new HttpListener();

// ...

var context = await _listener.GetContextAsync();

if (!context.Request.IsWebSocketRequest)
{
    context.Response.StatusCode = 400;
    context.Response.Close();
    return;
}

var wsContext = await context.AcceptWebSocketAsync(null);

var socket = wsContext.WebSocket;
_ = HandleClientAsync(socket, token);
```

::right::

<div class="ml-5">

`HandleClientAsync()`内でWebSocketの受信・送信

```cs
while (socket.State == WebSocketState.Open)
{
    var result = await socket.ReceiveAsync(
        buffer, token
    );

    var message = Encoding.UTF8.GetString(
        buffer, 0, result.Count
    );

    // オウム返しするだけ
    var response = Encoding.UTF8.GetBytes(
        $"Echo: {message}"
    );
    await socket.SendAsync(
        response,
        WebSocketMessageType.Text,
        true, token
    );
}
```

</div>

---
level: 2
---

### これらは.NET Standard 2.0/2.1でサポート
### Unityでも動きそうな気がする

<br/>

```cs {all|3-8|10-11}
var context = await _listener.GetContextAsync();

if (!context.Request.IsWebSocketRequest) // なぜか上手く判定されない
{
    context.Response.StatusCode = 400;
    context.Response.Close();
    continue;
}

// ここでNotImplementedException
var wsContext = await context.AcceptWebSocketAsync(null);

var socket = wsContext.WebSocket;
_ = HandleClientAsync(socket, token);
```

<v-click>

`HttpListenerContext`が上手く動いてくれない

</v-click>

---
layout: center
level: 2
---

## (動作画面)

<br/>

<img src="/images/errorwin.webp" class="h-100" />
    
---
layout: section
level: 1
---

## Unity Monoのコードを見てみよう

---
level: 2
layout: two-cols-header
---

## Unity-Technologies/mono

<br/>

::left::

Unity Technologiesのリポジトリに  
Monoのフォークがある

ディレクトリ構成

```{all|7}
mono
├─ mono/  <------------------- Mono Runtimeのコア実装
├─ mcs/
│    ├─ mcs/   <-------------  Mono C#コンパイラの実装
│    ├─ class/
│    │    ├─ referencesource/  参考用の.NET Coreのコードがあるらしい
│    │    ├─ System/           よく見るC#クラスライブラリのコード
│    │    └─ ...
│    └─ ...
└─ ...
```

::right::

<img src="/images/unity-mono.png" class="mt-15 ml-7" />

---
level: 2
layout: two-cols-header
---

## 実際のコードを見てみる

::left::

<br/>

うまく動作しなかった部分を見ると、  
`[MonoTODO]`というアトリビュートがついていた

実装が不十分なコードになっているっぽい？

実際のコードを確認することで  
Unity Monoで動作しない裏付けが取れた

::right::

<div class="ml-5 mr--10">

`mcs/class/System/System.Net/HttpListenerRequest.cs`

```cs
[MonoTODO]
public bool IsWebSocketRequest {
	get {
		return false;
	}
}
```

`mcs/class/System/System.Net/HttpListenerContext.cs`

```cs
[MonoTODO]
public Task<HttpListenerWebSocketContext>
  AcceptWebSocketAsync (string subProtocol)
{
	throw new NotImplementedException ();
}
```

</div>

---
layout: section
level: 1
---

## おまけ：CoreCLRでも試してみる

---
level: 2
layout: two-cols-header
---

## Unity 6.7とCoreCLR

<br/>

::left::

Unity 6.7（現時点ではα版）から  
ビルドモジュールからCoreCLRビルドサポートを  
追加できるように

まだExperimental

6.8からエディタ・デスクトップPlayerの  
正式リリース予定

::right::

<img src="/images/module.png" class="ml-5 w-85" />
<img src="/images/sb.png" class="ml-5 mt-5"/>

---
level: 2
---

## 動いた！

<br/>

<img src="/images/run.png">

---
level: 2
---

## まとめ

<br/>

- Unity×WSサーバ実装の選択肢でやたらサードパーティが挙がることに疑問を持った
- 最新の正式リリース（6.6）の状態で  
  System.NetスタックなWebSocketサーバ実装は一筋縄ではいかない
- Unity Monoのコードを見てみると、  
  `[MonoTODO]`属性がついている未実装部分だということが分かった
- CoreCLR (experimental)なscripting backendでビルドすると  
  HttpListenerとWebSocketによるWSサーバが動いた

---
level: 2
---

## 関連・参考

<br/>

- HttpListener and Websockets(Unity Discussion)  
  https://discussions.unity.com/t/httplistener-and-websockets/820948
- Websocket Server in Standalone build(Unity Discussion)  
  https://discussions.unity.com/t/websocket-server-in-standalone-build/832108
- Unity で System.Net.WebSockets を使ったゲームサーバー書こうとしたらうまくいかない(noir_neo’s blog)  
  https://noir-neo.hatenablog.com/entry/2018/03/17/001718
- Path to CoreCLR, 2026: Upgrade Guide(Unity Discussion)  
  https://discussions.unity.com/t/path-to-coreclr-2026-upgrade-guide/1714279
