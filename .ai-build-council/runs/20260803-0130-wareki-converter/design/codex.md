Reading additional input from stdin...
OpenAI Codex v0.146.0
--------
workdir: /home/mokuo/projects/chrome-ext-wareki-converter
model: gpt-5.6-sol
provider: openai
approval: never
sandbox: read-only
reasoning effort: none
reasoning summaries: none
session id: 019fc34b-573a-74a3-a4f1-e86641533635
--------
user
あなたは ai-build-council の「独立設計」担当である。Chrome拡張機能の要件と設計を独立に立案せよ。

**制約：ファイルの作成・変更は一切するな。検討と回答のみ。**
あなたの回答がそのまま設計案として記録され、別の査読者に批判的にレビューされる。挨拶や作業報告ではなく成果物本体を返すこと。

# 読むべきファイル

Stage 0 の Intake（拘束要件・参考情報の判定・確認済み事実・実行計画）:
.ai-build-council/runs/20260803-0130-wareki-converter/inputs/intake.md

流用候補となる検証済みコード（**読み取りのみ。変更するな**）:
- /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/plain-date.ts
- /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/eras.ts
- /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/era.ts
- /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/parse-date.ts
- /home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md
- /home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md

# 拘束要件（必ず満たす）

1. **西暦から和暦を逆算する Chrome 拡張機能。これが主機能。**
2. **変換対象は日付全体（年月日）。**年だけではない（改元日をまたぐ年があるため）。
3. 既存の「年齢・年度計算」拡張とは別アプリ。
4. 今回は要件定義と設計まで（実装はしない。ただし実装可能な具体度まで書くこと）。

# 制約

- 個人開発、Manifest V3、Chrome Web Store 審査を通す前提
- リモートコード実行は不可。ライブラリ・データは同梱する
- 外部通信を行わない
- 最小権限・単一用途。**単一用途の説明が1文に収まる範囲に機能を保つこと**

# この設計で必ず答えるべき論点

## 論点A：既存の検証済みコードをどう扱うか

Intake 出典1 のとおり、`plain-date.ts`・`eras.ts`・`era.ts`・`parse-date.ts` は独立レビュー2席が手計算で検証済みであり、**本案の主機能（西暦⇄和暦）は既にこの4ファイルで成立している**。

以下のいずれを採るか、根拠を示して決めよ。

1. そのままコピーする（重複コードが2リポジトリに存在することになる。改元時に2箇所を直す必要が出る）
2. npm パッケージ等の共有ライブラリに切り出す（個人開発の運用コストに見合うか）
3. 本 run 用に作り直す（検証済みという資産を捨てることになる）

**改元は必ず起きる。**その時に何箇所を直す必要があるかを判断基準に含めること。

## 論点B：既存の競合4本に対して何が違うのか

Intake 出典5 のとおり、Chrome ウェブストアに和暦変換の拡張が少なくとも4本ある（和暦変換／和暦⇄西暦コンバータ／daisy WarekiConv／和暦アドオン for SalesForce）。

**「既存4本に対して何が違うのか」を1文で言えなければ、最小機能性ポリシーへの抵触リスクが高い。**差別化の候補を複数挙げ、それぞれの説得力を評価したうえで、どれを採るか決めよ。

差別化になり得るか検討する材料（これに限らない）：
- 既存の「和暦変換」は半角数字のみ対応。全角・元年表記・略号・先頭ラベル・曜日括弧まで受理できるか
- 改元日をまたぐ年の正確さ（`1989年1月7日→昭和64年` と `1989年1月8日→平成元年` を出し分けられるか）
- 元号の期間検証（`平成元年1月7日` のような存在しない和暦を明示エラーにできるか）
- 明治5年以前を旧暦のため受理しないという判断
- 誤った変換を無警告で返さないこと

## 論点C：年齢アプリとの重複コンテンツ判定リスクへの対処

Intake 出典3・4 のとおり、統合判定の3条件（起動導線・入力・出力の宛先）を当てはめると本アプリと年齢アプリは**3条件とも一致し「統合すべき」と判定される**。かつスパム／重複コンテンツ方針の制裁はアカウント単位で全拡張に及ぶ。

**次の3つの選択肢を評価し、推奨を示せ。**

1. 両方を Chrome Web Store に公開する（差別化を最大化して押し切る）
2. 和暦アプリのみ公開し、年齢アプリは手元利用にとどめる
3. 将来的に1本へ統合する前提で、和暦アプリを先に公開する

それぞれについて「Store 掲載時の単一用途の説明が両立するか」「ユーザーから見て別製品と認識されるか」を論じること。

## 論点D：出力の設計

- 双方向（西暦→和暦、和暦→西暦）にするか、西暦→和暦の一方向に絞るか
- 入力経路（ポップアップ手入力／ページ上の選択テキストの右クリック）をどうするか
- 変換結果をクリップボードへコピーできるべきか
- 元号をまたぐ「年だけの入力」（例：`1989年`）を受け付けるかどうか。受け付けるなら昭和64年と平成元年の両方を出す必要がある

## 論点E：改元への備え

元号データを1箇所に閉じ込めるのは当然として、**改元が起きてからユーザーの手元で更新が届くまでの間**、拡張は何を表示すべきか。未知の日付を「令和XX年」と機械的に延長して表示してよいか、それとも表示を止めるべきか。

# 既知の不具合パターン（該当し得るものは設計時点で対策を織り込むこと）

必ず /home/mokuo/.claude/skills/ai-build-council/references/known-bug-patterns.md を読むこと。特に以下。

- パターン2：schemaVersion 不整合時の無警告な空状態 coercion
- パターン3：fire-and-forget イベントリスナーの `.catch()` 欠如
- パターン9：連打・二重クリックへの防御が無い
- パターン10：同一固定位置に複数の一時UI要素が生成され重なる
- パターン12：`chrome.contextMenus.OnClickData.selectionText` が段落区切りの改行を保持しない

**加えて、姉妹拡張（年齢アプリ）の Stage 5 で新たに発見されたパターンを伝える。**

> **先頭ラベル除去が最後の区切り記号を採用し、複数候補から誤った方を選ぶ。**
> `lastIndexOf(":")` により `生年月日：1987年5月14日 登録日：2020年1月1日` が `2020年1月1日` として無警告で受理されていた。完全一致検証を後段に置いていても、前処理が先に情報を捨てるため防げない。
> 既知パターン4（貪欲な正規表現マッチ）の前処理側での変種である。

**運用ルール：同一アーキテクチャパターンを共有する拡張で1つ不具合が見つかった場合、同じパターンを使う他の拡張でも横断的に再確認する。**本案は年齢アプリと入力解析を共有するため、この不具合が本案にも該当しないか設計時点で確認せよ。

# その他の必須検討事項

- Service Worker 再起動耐性（`storage.session` と `storage.local`/`sync` の使い分け）
- 対応できないページ（`chrome://`、Chrome Web Store、`file:`、PDF、iframe、Shadow DOM）での振る舞い。黙って何も起きないのは不可
- シークレットモード
- アクセシビリティ（キーボードのみで完結するか、スクリーンリーダーで読めるか）

# テスト戦略について

実 Chrome スモークテストには共通ベースライン13項目が別途適用される。**再設計せず、本拡張機能固有の機能シナリオのみ**を追加すること。

実ブラウザAPI依存が強いため、**コア実装の見積もりとテストハーネス構築の見積もりを分離して提示すること**。

なお `chrome://extensions` はブラウザ自動化ツールから遮断されており実インストールを自動化できない。E2E の範囲は現実的に絞ること。

# 出力形式（この見出し構成を厳守）

```markdown
## 要約

## 要件（受入条件を含む）

## テスト戦略
- 単体テスト：
- 統合テスト：
- E2Eテスト（必要な場合）：
- 実環境依存が強い場合、コア実装とテストハーネス構築の見積もりを分離する：
  - コア実装の見積もり時間：
  - テストハーネス構築の見積もり時間：

## 技術選定・実装方針

## 不確実な点・前提
```
codex
指定資料と既知不具合パターンを読み、拘束要件を優先して独立設計案にまとめます。ファイルは変更しません。
exec
/bin/bash -lc "sed -n '1,260p' .ai-build-council/runs/20260803-0130-wareki-converter/inputs/intake.md && sed -n '1,300p' /home/mokuo/.claude/skills/ai-build-council/references/known-bug-patterns.md && for f in /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/plain-date.ts /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/eras.ts /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/era.ts /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/parse-date.ts /home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md /home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md; do echo \"FILE:"'$f"; sed -n '"'1,320p' \""'$f"; done' in /home/mokuo/projects/chrome-ext-wareki-converter
 succeeded in 0ms:
# Intake — 20260803-0130-wareki-converter

## user_requirements（拘束要件）

1. **西暦から和暦を逆算する（西暦 → 和暦）Chrome 拡張機能を作る。** これが主機能である。
2. **変換の対象は日付全体（年月日）。** 年だけではない。
   - 理由（ユーザーが選択時に確認した内容）：同じ 1989 年でも `1989年1月7日 → 昭和64年1月7日`、`1989年1月8日 → 平成元年1月8日` と改元日で元号が変わるため、日付全体を扱う方が正確である。
3. **既存の「年齢・年度計算」拡張（`chrome-ext-japanese-age-calculator`）とは別アプリとする。** 年齢アプリはそのまま残す。
4. 今回の作業範囲は**要件定義と設計まで**。実装は行わない。

## 経緯（なぜ別アプリになったか）

`chrome-ext-japanese-age-calculator` は、競合調査で「和暦変換には既存拡張が4本以上ある」と判明したことを受け、議長の判断で**年齢・年度を主機能、和暦を入力手段**に組み替えて実装した。しかしユーザーの要望は**和暦変換そのもの**であり、主従が逆だった。

年齢アプリは実装済みで動作しており、ユーザーが「これはこれで使える」と判断したため残す。本 run は和暦変換を主機能とする別アプリを設計する。

## reference_proposals（非拘束の参考提案）

### 出典1：`chrome-ext-japanese-age-calculator` の検証済みドメイン層

- **判定**：**accepted（ただし設計判断としては再検討を要する）**
- **内容**：以下4ファイル（計394行）が、Stage 5 の独立レビュー2席（Codex・Claude）によって**手計算で検証済み**である。両席とも「誤りを検出できなかった」と明記している。
  - `src/domain/plain-date.ts`（93行）— 年月日だけの値オブジェクト。JavaScript の `Date` を使わない。うるう年の100年/400年ルール、前日・翌日、比較
  - `src/domain/eras.ts`（30行）— 明治・大正・昭和・平成・令和の開始日。**唯一の定義箇所**。終了日は次の元号の開始日から導出する
  - `src/domain/era.ts`（70行）— **西暦→和暦（`formatWareki`）**、元年表記、元号年の計算（`西暦年 - 開始年 + 1`）、元号期間の検証（`isWithinEra`）
  - `src/domain/parse-date.ts`（201行）— **和暦→西暦**を含む入力解析。`昭和62年5月14日`・`S62.5.14`・`H元.1.8`・全角・先頭ラベル・曜日括弧・末尾補助語を受理。複数日付の検知
- **検証済みの境界**（レビュー2席が独立に手計算）：`1912-07-29→明治45年`、`1912-07-30→大正元年`、`1926-12-24→大正15年`、`1926-12-25→昭和元年`、`1989-01-07→昭和64年`、`1989-01-08→平成元年`、`2019-04-30→平成31年`、`2019-05-01→令和元年`
- **理由**：**本 run の主機能（西暦⇄和暦）は、この4ファイルで既に成立している。**ゼロから設計し直す理由がない。ただし後述の重複リスクがあるため、「そのままコピーする」か「共有パッケージにする」か「本 run 用に作り直す」かは設計で判断させる。

### 出典2：`chrome-ext-japanese-age-calculator/docs/要件定義.md` 6-3・6-6・6-7

- **判定**：**accepted**
- **内容**：元号の境界日一覧、受理する/しない入力形式、対応年範囲（下限 1873-01-01＝明治6年1月1日）、エラー文言
- **理由**：明治5年以前を受理しない判断（旧暦のため元号年→西暦の機械換算が成立せず、`明治元年2月1日` が無警告で約3週間ずれる）は本 run にもそのまま当てはまる。**ただし本 run は「和暦を表示する」ことが主機能なので、表示側の下限をどう扱うかは別途判断が要る**（年齢アプリでは入力の下限のみ 1873-01-01 とし、表示用の元号データは明治元年から保持していた）。

### 出典3：ai-council_v2 第3回会合 稟議書 7-2「統合判定の3条件」

- **判定**：**accepted（重大な論点として設計に持ち込む）**
- **内容**：起動導線・入力・出力の宛先の3条件がすべて一致するなら統合、1つでも異なるなら分離。例外は認めない。
- **理由**：**この基準を機械的に当てはめると、本アプリと年齢アプリは3条件とも一致し「統合すべき」と判定される。**

  | 条件 | 年齢アプリ | 本アプリ（想定） |
  |---|---|---|
  | 起動導線 | ポップアップ手入力＋右クリック | 同じ |
  | 入力 | ユーザーが指定した日付文字列 | 同じ |
  | 出力の宛先 | 拡張が持つ結果表示面 | 同じ |

  ユーザーは経緯を理解したうえで別アプリとする判断を下している。したがって本 run は分離を前提に進めるが、**設計には「両方を Chrome Web Store に公開する場合に何をもって差別化するか」を必ず含めること。**

### 出典4：第3回会合 稟議書 6節（スパム／重複コンテンツ方針のリスク）

- **判定**：**accepted**
- **内容**：同一デベロッパーアカウントから機能・コンテンツ・UX が高度に類似した複数の拡張を公開することは、Chrome Web Store のスパム／重複コンテンツ方針と最小機能性方針に抵触しうる。**制裁はアカウント単位で公開済みの全拡張に及ぶ。**
- **理由**：本 run の最大のリスク。ただし**顕在化するのは両方を公開した場合に限る**。年齢アプリを手元利用にとどめる、または公開を片方に絞れば問題にならない。設計はこの選択肢を明示的に扱うこと。

### 出典5：競合調査の結果（2026-08-02 実施）

- **判定**：**accepted**
- **内容**：Chrome ウェブストアに和暦変換の既存拡張が少なくとも4本ある。
  - 「和暦変換」— 右クリックで和暦→西暦。半角数字のみ対応
  - 「和暦⇄西暦コンバータ」— アイコンクリックで双方向。明治〜令和対応
  - 「daisy WarekiConv」— ページ上の和暦を自動検出して西暦を併記
  - 「和暦アドオン for SalesForce」— 特定サービス向け
- **理由**：**この領域は空白ではない。**設計には「既存4本に対して何が違うのか」を必ず含めること。含められないなら最小機能性ポリシーへの抵触リスクが高い。

### 出典6：`references/known-bug-patterns.md`

- **判定**：**accepted**
- **理由**：本案に該当し得るものを Stage 1 の課題文へ明示する。特にパターン2（schemaVersion）、3（`.catch()` 欠如）、9（連打）、10（一時UIの重なり）、12（`selectionText` の改行欠落）。
  加えて、年齢アプリの Stage 5 で**新たに発見されたパターン**を伝える：**「先頭ラベル除去が最後の区切り記号を採用し、複数候補から誤った方を選ぶ」**。`lastIndexOf(":")` により `生年月日：1987年5月14日 登録日：2020年1月1日` が `2020年1月1日` として無警告で受理されていた。完全一致検証を後段に置いていても、前処理が先に情報を捨てるため防げない。

## verified_repo_facts（確認済み事実）

- **対象リポジトリ**：`/home/mokuo/projects/chrome-ext-wareki-converter`（本 run のために新規作成）
- ブランチ `main`、base commit `d1adcb9`（README と .gitignore のみ）
- **既存のテスト構成は無い。`package.json` も無い。**
- リモート未設定。GitHub 上のリポジトリは未作成
- **流用元**：`/home/mokuo/projects/chrome-ext-japanese-age-calculator`（公開済み、commit `b5dc33a`）。ドメイン層4ファイル計394行、テスト152件が通過している
- Codex CLI `0.146.0`、`codex login status` → `Logged in using ChatGPT`
- `models.md` 最終確認日 2026-07-21（90日以内）

## 実行計画

- **対象リポジトリ・対象ディレクトリ**：`/home/mokuo/projects/chrome-ext-wareki-converter` 配下のみ
- **禁止操作**：`/home/mokuo/projects/chrome-ext-japanese-age-calculator/`（**読み取りのみ。既存アプリを壊さない**）、`/home/mokuo/projects/ai-council-output/`、スキル本体の各リポジトリ、`~/.claude/`
- **成果物**（今回の範囲）：`.ai-build-council/runs/20260803-0130-wareki-converter/` 配下の記録、`docs/要件定義.md`、`docs/設計.md`
- **テスト範囲**：今回は対象外（Stage 3 以降）。ただし Stage 1 でテスト戦略を設計させ Stage 2 で査読する
- **試行上限**：設計査読ラウンド上限 2
- **外部公開操作**：**許可する**（ユーザーが「費用が発生しない選択は yes」と明示。前 run でも public リポジトリ作成と push を承認済み）
# 既知の不具合パターン集

`manual-test-checklist-template.md`の共通ベースライン13項目を実チェック
した際（あるいはStage1設計・Stage5/6レビュー時）、以下のパターンに
実際に該当していないかを明示的に確認する。すべて、chrome API mockの
単体テストが全件パスした状態で実際に発見された不具合であり、
「テストが通っている」ことは「このクラスの不具合が無い」ことを
保証しない。新しい不具合パターンが見つかるたびにこのファイルへ追記する。

## 1. 時刻・日時のハードコード（テストのタイムボム）

テストの`NOW`定数を固定の未来日時としてハードコードすると、実行時刻が
その値を追い越した時点でテストが壊れる。実装側は`Date.now()`で判定する
ため、テスト側の固定値との乖離がステータス誤判定を引き起こす。

- **確認方法**：テストコード中に`new Date("20XX-...")`のような絶対日時
  リテラルが無いか確認する。あれば`Date.now()`基準の相対値、または
  `vi.useFakeTimers()`+`vi.setSystemTime()`で完全に時計を制御する。

## 2. schemaVersion不整合時の無警告な空状態coercion

`loadState()`/`loadStorage()`相当の関数が、未知のschemaVersionを検出した
際に「空として扱う」フォールバックを持つと、それ以降の書き込み系操作が
実際に保存されていた旧データを無警告で上書き・消去する。特に
reconcile系ロジック（孤児権限・孤児登録の削除）と組み合わさると、
「空＝何も期待されていない」と誤判定して実際に有効な権限・登録まで
削除してしまう。

- **確認方法**：`raw.schemaVersion !== 現在のバージョン`の分岐が
  「空として返す」以外に、例外を投げる／書き込みを拒否する等
  破壊的操作を止める設計になっているか確認する。

## 3. fire-and-forgetイベントリスナーの`.catch()`欠如

`chrome.tabs.onRemoved`・`onUpdated`・`alarms.onAlarm`等の生リスナーが
`ensureReconciled().then(...)`のように`.catch()`無しで非同期処理を
投げっぱなしにすると、失敗時に未処理rejectionとなり、その1回分の
イベント処理（タブ削除・URL変更・alarm発火等）が無言で失われる。

- **確認方法**：`void 何か().then(...)`の形を全リスナーからgrepし、
  チェーンの末尾に`.catch()`があるか確認する。

## 4. 貪欲な正規表現マッチ＋末尾除去だけを前提にした抽出ロジック

`\S+`等の貪欲マッチは空白文字までを候補として飲み込むため、区切り記号
（閉じ括弧等）の直後にスペース無しで地の文が続く実際によくある書き方
（日本語で特に頻出）では、地の文まで1つの候補として飲み込まれる。
末尾からの記号除去だけでは対応できない。

- **確認方法**：候補文字列の末尾だけでなく、区切り記号がマッチ内部の
  途中に出現するケース（閉じ括弧直後にスペース無しで文が続く等）の
  テストがあるか確認する。

## 5. 部分文字列一致による機密情報判定がURL構造を無視する

「fragment全体に"="が含まれるか」のような全体単位の判定は、SPAの
ハッシュルート（`#/path?query`のようにパスとクエリが混在する形）で
誤動作する。パス部分にたまたま機微語の部分文字列が含まれるだけで、
ルート全体を機密情報と誤判定して削除してしまう。

- **確認方法**：URL・フラグメント等の構造化データを扱う判定ロジックが、
  「実際にkey=valueとして解釈すべき範囲」を構造的に切り分けているか
  （全体を一括で正規表現・部分文字列判定にかけていないか）確認する。

## 6. 列挙可能なコレクション（Map/Set）の掃除漏れ（メモリリーク）

DOM要素・タブ等の外部リソースをキーにしたMap/Setへ追加する処理はあるが、
そのリソースが消滅した際に対応するエントリを削除する経路が無いと、
拡張機能の使用時間・使用範囲に比例して無期限にメモリが増加する。

- **確認方法**：Map/Setへの`.set()`/`.add()`呼び出し全てについて、
  対応する`.delete()`が「そのリソースが消滅するイベント」
  （`MutationObserver`での切断検知・`tabs.onRemoved`等）に
  紐づいているか確認する。

## 7. Chromeのmatch patternがポート番号を表現できないことの波及

`registerContentScripts`・host permissionのmatch patternはポート番号を
含められないため、あるオリジンを有効化すると同一ホスト名の別ポートにも
content scriptが注入され得る。データ保存側でorigin完全一致（ポート込み）
のガードがあっても、content script自体が「注入された＝有効」と
無条件に動作を開始する設計だと、無許可のポートでも監視・DOM操作
（scrollリスナー・MutationObserver等）が実行されてしまう。

- **確認方法**：opt-in-per-originアーキテクチャのcontent scriptが、
  自身の実行開始前に「今の自分の正確なオリジン（ポート込み）が
  本当に有効化されているか」をbackgroundへ問い合わせて自己チェック
  しているか確認する（登録時のmatch patternがポート非対応であることを
  前提に、実行時の自己ガードで補う）。

## 8. ビルド成果物のコンテンツハッシュ変化をreconcileが検知しない

CRXJSの`?script`インポートはビルド毎にコンテンツハッシュ付きファイル名
になる。動的登録済みcontent scriptの整合性チェックが`matches`パターンの
一致だけを見て「一致している」と判定すると、拡張機能の更新でファイル名
（ハッシュ）が変わった際に、旧ハッシュを指す登録が残ったまま放置され、
更新後は無言で機能が停止する。

- **確認方法**：`reconcileOrigins()`相当の整合性チェックが、
  `matches`だけでなく登録済みスクリプトの`js`パス（実ファイル名）も
  現在のビルドの値と一致しているか検証しているか確認する。

## 9. 連打・二重クリックへの防御が無い

ボタンのクリックハンドラが、非同期処理の完了を待たずに即座に再度
クリック可能な状態のままだと、素早い連打で同一操作が2回発火する。
TOCTOU検証がある場合、2回目は「状態が変わった」という実態と異なる
誤解を招くエラーメッセージになりがち。

- **確認方法**：クリックハンドラの先頭で該当ボタンを即座に
  `disabled = true`にしているか確認する（再有効化は次のrender()で
  自然に行われる設計が望ましい）。

## 10. 同一固定位置に複数の一時UI要素が生成され重なる

トースト通知等、`position: fixed`で固定座標に生成する一時UI要素を、
呼び出しごとに独立して生成・独立のタイマーで除去する設計だと、短時間に
複数回操作された場合に同じ座標へ複数の要素が重なって表示される。

- **確認方法**：一時UI要素の生成前に、同じ役割の既存要素（安定した
  id等で識別）を探して先に除去しているか確認する。

## 11. 通知後・完了後の記録が永続的に残り続ける

「発火済み」「完了」等の終端に近いステータスに遷移した後、ユーザーが
それ以上何も操作しなかった場合の記録の掃除経路が無いと、無期限に
storageへ残り続け、一覧に古い記録が出続ける。

- **確認方法**：終端ステータスのレコードに対し、一定時間（TTL）経過後に
  自動削除する整合性チェックのロジックがあるか確認する。

## 12. `chrome.contextMenus.OnClickData.selectionText`が段落区切りの改行を保持しない

`contexts: ["selection"]`の右クリックメニューで渡される`info.selectionText`
は、ページ自身の`window.getSelection().toString()`と異なり、複数の
ブロック要素（`<p>`等）にまたがる選択で段落区切り（連続する改行）を
保持しないことが実機検証で判明した。`window.getSelection().toString()`
では`\n\n`（段落区切り）が正しく入る同じ選択範囲でも、`info.selectionText`
経由では改行が失われ1行に連結される。選択テキストの改行構造（段落・
行）を保持・利用する整形ロジック（連続改行を段落として保持する、
改行をそのまま引用の行として使う等）は、この入力の時点で既に情報が
失われているため、ロジック自体が正しくても機能しない。

- **確認方法**：`info.selectionText`を直接整形ロジックへ渡していないか
  確認する。渡している場合、`chrome.scripting.executeScript`で
  `window.getSelection()?.toString()`をページから再取得し、そちらを
  優先して使う（`info.selectionText`は注入できない保護ページ等のための
  フォールバックとしてのみ使う）。

## 運用ルール：姉妹拡張への波及確認

同一アーキテクチャパターン（例：opt-in-per-originの動的content script
登録）を共有する複数の拡張機能で1つ不具合が見つかった場合、**同じ
パターンを使う他の全ての拡張機能を横断的に再監査する**。1つの実装で
見つかった不具合は、独立に実装された姉妹拡張でも高確率で再発している
（実際に本ファイルの7・8番はC-11とC-14の両方で、9番はB-8で、
3番はB-9とC-12の両方で、12番はA-5で発見された後A-4でも同一原因の
不具合として確認・修正されている）。
FILE:/home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/plain-date.ts
/**
 * 年月日だけを持つ値オブジェクト。
 * JavaScript の Date は使わない（タイムゾーンと時刻の概念が混入するため）。
 * このモジュールは chrome / DOM / 時計 / storage のいずれも参照しない。
 */

export type PlainDate = Readonly<{
  year: number;
  month: number; // 1-12
  day: number;
}>;

/** 対応年範囲。要件定義 6-7 */
export const MIN_SUPPORTED_DATE: PlainDate = { year: 1873, month: 1, day: 1 };
export const MAX_REFERENCE_DATE: PlainDate = { year: 2200, month: 12, day: 31 };

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return DAYS_IN_MONTH[month - 1] ?? 0;
}

/** グレゴリオ暦上で実在する日付かどうか。整数性も検査する。 */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= daysInMonth(year, month);
}

/** 実在しない日付では null を返す。例外は投げない。 */
export function makePlainDate(year: number, month: number, day: number): PlainDate | null {
  if (!isValidDate(year, month, day)) return null;
  return { year, month, day };
}

/** a < b なら負、a === b なら 0、a > b なら正 */
export function compare(a: PlainDate, b: PlainDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function isBefore(a: PlainDate, b: PlainDate): boolean {
  return compare(a, b) < 0;
}

export function isSameOrBefore(a: PlainDate, b: PlainDate): boolean {
  return compare(a, b) <= 0;
}

export function equals(a: PlainDate, b: PlainDate): boolean {
  return compare(a, b) === 0;
}

export function previousDay(d: PlainDate): PlainDate {
  if (d.day > 1) return { year: d.year, month: d.month, day: d.day - 1 };
  if (d.month > 1) {
    const month = d.month - 1;
    return { year: d.year, month, day: daysInMonth(d.year, month) };
  }
  return { year: d.year - 1, month: 12, day: 31 };
}

export function nextDay(d: PlainDate): PlainDate {
  if (d.day < daysInMonth(d.year, d.month)) {
    return { year: d.year, month: d.month, day: d.day + 1 };
  }
  if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 };
  return { year: d.year + 1, month: 1, day: 1 };
}

/** YYYY-MM-DD 形式へ。storage と <input type="date"> の受け渡しに使う。 */
export function toISO(d: PlainDate): string {
  const mm = String(d.month).padStart(2, "0");
  const dd = String(d.day).padStart(2, "0");
  return `${d.year}-${mm}-${dd}`;
}

/** YYYY-MM-DD 形式から。厳密一致のみ受理する。 */
export function fromISO(s: string): PlainDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return makePlainDate(Number(m[1]), Number(m[2]), Number(m[3]));
}
FILE:/home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/eras.ts
/**
 * 元号データ。**唯一の定義箇所。**
 *
 * 将来の改元では、このファイルへ 1 エントリ追加し、テストケースを更新するだけで
 * 対応できること。境界日を他の場所へ重複記述してはならない。
 * 終了日は「次の元号の開始日」から導出するため、ここには持たせない。
 */

import type { PlainDate } from "./plain-date.js";

export type EraId = "meiji" | "taisho" | "showa" | "heisei" | "reiwa";

export type EraDefinition = Readonly<{
  id: EraId;
  name: string;
  abbreviation: string; // 大文字で保持する
  start: PlainDate;
}>;

/** 開始日の昇順。境界日は新元号側に含める。 */
export const ERAS: readonly EraDefinition[] = [
  { id: "meiji", name: "明治", abbreviation: "M", start: { year: 1868, month: 1, day: 25 } },
  { id: "taisho", name: "大正", abbreviation: "T", start: { year: 1912, month: 7, day: 30 } },
  { id: "showa", name: "昭和", abbreviation: "S", start: { year: 1926, month: 12, day: 25 } },
  { id: "heisei", name: "平成", abbreviation: "H", start: { year: 1989, month: 1, day: 8 } },
  { id: "reiwa", name: "令和", abbreviation: "R", start: { year: 2019, month: 5, day: 1 } },
] as const;

/** 最新元号の開始年から何年先までなら和暦を表示してよいか（要件定義 6-7） */
export const WAREKI_DISPLAY_HORIZON_YEARS = 100;
FILE:/home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/era.ts
/** 元号の解決・表示・期間検証。境界日は eras.ts のみを参照する。 */

import { ERAS, WAREKI_DISPLAY_HORIZON_YEARS, type EraDefinition } from "./eras.js";
import { compare, isSameOrBefore, type PlainDate } from "./plain-date.js";

/** 対象日が属する元号。明治開始前は null。 */
export function eraForDate(date: PlainDate): EraDefinition | null {
  let found: EraDefinition | null = null;
  for (const era of ERAS) {
    if (isSameOrBefore(era.start, date)) found = era;
    else break; // ERAS は開始日昇順
  }
  return found;
}

export function findEraByName(name: string): EraDefinition | undefined {
  return ERAS.find((e) => e.name === name);
}

export function findEraByAbbreviation(abbr: string): EraDefinition | undefined {
  const upper = abbr.toUpperCase();
  return ERAS.find((e) => e.abbreviation === upper);
}

/** その元号の次の元号。最後の元号なら undefined。 */
export function nextEra(era: EraDefinition): EraDefinition | undefined {
  const i = ERAS.findIndex((e) => e.id === era.id);
  return i >= 0 ? ERAS[i + 1] : undefined;
}

/** date がその元号の期間内か。終了日は次の元号の開始日から導出する。 */
export function isWithinEra(era: EraDefinition, date: PlainDate): boolean {
  if (compare(date, era.start) < 0) return false;
  const next = nextEra(era);
  if (!next) return true;
  return compare(date, next.start) < 0;
}

/** 元号年（1 起算）。1 年目は「元年」と表記する。 */
export function eraYearOf(era: EraDefinition, date: PlainDate): number {
  return date.year - era.start.year + 1;
}

export function eraYearLabel(eraYear: number): string {
  return eraYear === 1 ? "元" : String(eraYear);
}

/** 元号年から西暦年を求める。期間内かどうかは呼び出し側で検証すること。 */
export function gregorianYearOf(era: EraDefinition, eraYear: number): number {
  return era.start.year + eraYear - 1;
}

/**
 * 和暦表示。表示できない場合は null を返す。
 * - 明治開始前
 * - 最新元号の開始年から WAREKI_DISPLAY_HORIZON_YEARS 年を超える遠未来
 *   （未改元を前提に「令和82年」のような表示を出さないため）
 */
export function formatWareki(date: PlainDate): string | null {
  const era = eraForDate(date);
  if (!era) return null;

  const latest = ERAS[ERAS.length - 1];
  if (latest && date.year - latest.start.year > WAREKI_DISPLAY_HORIZON_YEARS) {
    return null;
  }

  const label = eraYearLabel(eraYearOf(era, date));
  return `${era.name}${label}年${date.month}月${date.day}日`;
}
FILE:/home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/parse-date.ts
/**
 * 文字列 → PlainDate。
 *
 * 方針（凍結設計 3-5）：
 * - Date.parse() には依存しない（実装依存の解釈があるため）
 * - 除去処理を通した後の文字列**全体**が許可形式に完全一致することを要求する。
 *   部分一致で文章中の日付を拾わない。誤解釈より明示エラーを優先する。
 * - 除去処理は「日付以外の意味を持つ文字を新たに解釈する」ものではないため、
 *   誤解釈リスクを増やさずに受理率だけを上げる。
 */

import {
  err,
  ok,
  type Result,
} from "./errors.js";
import {
  findEraByAbbreviation,
  findEraByName,
  gregorianYearOf,
  isWithinEra,
  nextEra,
} from "./era.js";
import type { EraDefinition } from "./eras.js";
import {
  compare,
  isValidDate,
  makePlainDate,
  MIN_SUPPORTED_DATE,
  type PlainDate,
} from "./plain-date.js";

/** 選択テキストの長さ上限（Unicode コードポイント数） */
export const MAX_INPUT_CODE_POINTS = 64;

function codePointLength(s: string): number {
  return [...s].length;
}

/**
 * 正規化。順序が意味を持つ。
 * 1. NFKC（全角数字・英字・記号の半角化を含む）
 * 2. trim
 * 3. 先頭ラベル除去（「生年月日：」等。`：`/`:` までを捨てる）
 * 4. 曜日括弧除去
 * 5. 末尾補助語除去（生 / 生まれ / 出生）
 * 6. 末尾約物除去
 * 7. 内部空白の除去
 */
/** ラベルとみなす接頭部の最大長 */
const MAX_LABEL_LENGTH = 12;

/**
 * 日付らしき並びの検出。複数日付の混入を検知するためだけに使う粗い検査であり、
 * これ自体は受理の判定に使わない（受理は完全一致で行う）。
 */
const DATE_LIKE =
  /(?:明治|大正|昭和|平成|令和|[MTSHR])?(?:元|\d{1,4})[年/\-.]\d{1,2}[月/\-.]\d{1,2}/gu;

export function countDateLike(s: string): number {
  return (s.match(DATE_LIKE) ?? []).length;
}

export function normalizeInput(raw: string): string {
  // NFKC により全角コロン「：」は ASCII ":" へ変換済みになる
  let s = raw.normalize("NFKC").trim();

  // 先頭ラベルの除去は「最初のコロンより前が、数字を含まない短い語」の場合に限る。
  // 無条件に最後のコロン以降を採ると、「生年月日：… 登録日：…」のような
  // 複数日付を含む選択で、誤った日付を無警告で受理してしまう。
  const colon = s.indexOf(":");
  if (colon >= 0) {
    const label = s.slice(0, colon);
    if (label.length <= MAX_LABEL_LENGTH && !/\d/u.test(label)) {
      s = s.slice(colon + 1);
    }
  }

  s = s.replace(/[(（][日月火水木金土][)）]/g, "");

  // 末尾の補助語と約物は重なって現れる（例：「…日（木）生まれ。」）。
  // 1 回ずつでは剥がし残すため、変化しなくなるまで繰り返す。
  for (;;) {
    const before = s;
    s = s.trim();
    s = s.replace(/(生まれ|出生|生)$/u, "");
    s = s.replace(/[、。,.]+$/u, "");
    if (s === before) break;
  }

  s = s.replace(/\s+/gu, "");

  return s.trim();
}

/** 西暦形式：1987/5/14, 1987-5-14, 1987.5.14, 1987年5月14日 */
// 区切り記号は前後で同一であることを要求する（1987/5-14 のような混在を受理しない）
const GREGORIAN_SEPARATED = /^(\d{4})([/\-.])(\d{1,2})\2(\d{1,2})$/u;
const GREGORIAN_JP = /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/u;

/** 漢字元号：昭和62年5月14日 / 平成元年1月8日 */
const ERA_JP = /^(明治|大正|昭和|平成|令和)(元|\d{1,2})年(\d{1,2})月(\d{1,2})日?$/u;

/** 元号略号：S62.5.14 / S62/5/14 / H1-1-8 / H元.1.8 */
const ERA_ABBR = /^([A-Za-z])(元|\d{1,2})([/\-.])(\d{1,2})\3(\d{1,2})$/u;

function eraYearToNumber(token: string): number {
  return token === "元" ? 1 : Number(token);
}

function formatJapaneseDate(year: number, month: number, day: number): string {
  return `${year}年${month}月${day}日`;
}

function buildFromGregorian(year: number, month: number, day: number): Result<PlainDate> {
  if (!isValidDate(year, month, day)) {
    return err("NONEXISTENT_DATE", formatJapaneseDate(year, month, day));
  }
  const date = makePlainDate(year, month, day);
  if (!date) return err("NONEXISTENT_DATE", formatJapaneseDate(year, month, day));
  if (compare(date, MIN_SUPPORTED_DATE) < 0) return err("BELOW_MIN_DATE");
  return ok(date);
}

function buildFromEra(
  era: EraDefinition,
  eraYear: number,
  month: number,
  day: number,
): Result<PlainDate> {
  if (eraYear < 1) return err("UNPARSABLE");
  const year = gregorianYearOf(era, eraYear);

  if (!isValidDate(year, month, day)) {
    return err(
      "NONEXISTENT_DATE",
      `${era.name}${eraYear === 1 ? "元" : eraYear}年${month}月${day}日`,
    );
  }
  const date = makePlainDate(year, month, day);
  if (!date) return err("UNPARSABLE");

  // 旧暦に由来する範囲外は、元号期間の文言よりも「旧暦のため非対応」を優先して返す
  if (compare(date, MIN_SUPPORTED_DATE) < 0) return err("BELOW_MIN_DATE");

  // 元号年から西暦へ機械的に換算しただけでは受理しない。期間内かを必ず検証する。
  if (!isWithinEra(era, date)) {
    const next = nextEra(era);
    const label = `${era.name}${eraYear === 1 ? "元" : eraYear}年${month}月${day}日`;
    const startText = `${era.name}は${era.start.year}年${era.start.month}月${era.start.day}日開始`;
    const endText = next
      ? `、${next.name}は${next.start.year}年${next.start.month}月${next.start.day}日開始`
      : "";
    return err("ERA_OUT_OF_RANGE", `${label}は${era.name}の期間外です。${startText}${endText}です。`);
  }

  return ok(date);
}

/**
 * 日付文字列を解析する。
 * 受理しない形式（2桁西暦・月日年順・区切りなし8桁・漢数字・複数日付の連結など）は
 * 完全一致に失敗するため、自然に UNPARSABLE となる。
 */
export function parseDateInput(raw: string): Result<PlainDate> {
  const trimmed = raw.trim();
  if (trimmed === "") return err("EMPTY_INPUT");
  // 長さは trim 後で判定する（空白を巻き込んだ選択で誤って TOO_LONG にしない）
  if (codePointLength(trimmed) > MAX_INPUT_CODE_POINTS) return err("TOO_LONG");

  const s = normalizeInput(raw);
  if (s === "") return err("EMPTY_INPUT");

  // 完全一致の前に複数日付を検知し、専用の文言で返す
  if (countDateLike(s) >= 2) return err("MULTIPLE_DATES");

  let m = GREGORIAN_SEPARATED.exec(s);
  if (m) {
    return buildFromGregorian(Number(m[1]), Number(m[3]), Number(m[4]));
  }
  m = GREGORIAN_JP.exec(s);
  if (m) {
    return buildFromGregorian(Number(m[1]), Number(m[2]), Number(m[3]));
  }

  m = ERA_JP.exec(s);
  if (m) {
    const era = findEraByName(m[1] as string);
    if (!era) return err("UNPARSABLE");
    return buildFromEra(era, eraYearToNumber(m[2] as string), Number(m[3]), Number(m[4]));
  }

  m = ERA_ABBR.exec(s);
  if (m) {
    const era = findEraByAbbreviation(m[1] as string);
    if (!era) return err("UNPARSABLE");
    return buildFromEra(era, eraYearToNumber(m[2] as string), Number(m[4]), Number(m[5]));
  }

  return err("UNPARSABLE");
}
FILE:/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md
# 要件定義 — 日本の年齢・年度計算 Chrome 拡張機能

策定日: 2026-08-02
策定方法: ai-build-council（Stage 0 Intake → Stage 1 独立設計 Codex CLI → Stage 2 設計査読 Claude → 議長裁定）
run-id: `20260802-2350-japanese-age-calculator`
状態: **凍結（DESIGN_APPROVED）**。変更には記録と承認を要する。

---

## 1. これは何か

日付を与えると、その日付の**満年齢・数え年・和暦・年度・学年**をまとめて返す Chrome 拡張機能。

単一用途の説明（Chrome Web Store 審査で提出する文）：

> 入力された生年月日から、指定日の日本の満年齢・数え年・和暦・年度・学年を計算する拡張機能です。

## 2. なぜ作るか

競合調査（2026-08-02 実施）で以下が判明している。

- **和暦⇄西暦変換だけなら既存拡張が4本以上ある**（和暦変換／和暦⇄西暦コンバータ／daisy WarekiConv／和暦アドオン for SalesForce）
- **日付フォーマット統一（ISO形式へのコピー等）も既存拡張 Date Converter が押さえており、対応形式はより広い**
- **満年齢・数え年・年度・学年を扱う Chrome 拡張は発見できなかった**（Web ツールのみ）

したがって**年齢・年度・学年が主機能**であり、和暦と表記ゆれの解釈は「入力を受け取るための手段」である。日付フォーマット統一を主要な訴求に据えない。

差別化の実体は**日本固有のドメインロジックの正確さ**にある。年齢計算ニ関スル法律・民法143条・学校教育法17条に基づく計算が正しいかどうかが、そのまま製品価値になる。

## 3. 誰が使うか

- 履歴書・エントリーシート・各種申請書を書く人
- 他人の生年月日から年齢・年度を繰り返し計算する仕事の人（人事・学校事務・行政窓口）

## 4. 拘束要件

ユーザーが直接指定した、必ず満たすべき要件。

| # | 要件 |
|---|---|
| R1 | 日付を与えると、満年齢・数え年・和暦・年度・学年を出す |
| R2 | 入力経路を2つ持つ。①拡張のポップアップに手入力 ②ページ上の日付を選択して右クリック |
| R3 | 基準日を変更できる。既定は今日。「入社予定日の時点で何歳か」を出せること |

## 5. 対象外（やらないこと）

単一用途の説明を曖昧にしないため、以下は明示的に対象外とする。

- ページ内の日付の自動検出・自動置換
- 相対日時から絶対日時への変換（実装済み拡張「SNS・記事の相対時間を絶対日付に変換」の領域）
- 日付フォーマットの一括統一（既存拡張 Date Converter の領域）
- カレンダー、予定、リマインダー
- 学校・自治体ごとの個別制度判定、留年・飛び級・就学猶予の判定
- 海外の年齢・学年制度
- 時刻、タイムゾーン、期間の日数計算
- 外部サイト・外部APIとの連携

## 6. ドメイン要件と受入条件

### 6-1. 満年齢

**評価時点は「基準日の開始時点（0時）」とする。**

法的には、年齢計算ニ関スル法律により出生日から起算し、民法143条により**誕生日の前日の終了時**に加齢する。ただし表示上の満年齢は、日常慣行（誕生日当日に加齢）・年齢早見表・履歴書の記載慣行と一致させるため、基準日の開始時点で評価する。

**法的到達日は別の値として保持する。**学年判定がこれに依拠しているため（6-5参照）、捨ててはならない。

民法143条2項ただし書により、応当日が存在しない月は月末に期間が満了する（2月29日生まれの平年）。

受入条件：

| # | 生年月日 | 基準日 | 表示上の満年齢 | 法的到達日 |
|---|---|---|---|---|
| A1 | 2000-04-02 | 2006-04-01 | 満5歳 | 満6歳到達日は 2006-04-01 |
| A2 | 2000-04-02 | 2006-04-02 | 満6歳 | 同上 |
| A3 | 2000-04-01 | 2006-03-31 | 満5歳 | 満6歳到達日は 2006-03-31 |
| A4 | 2000-04-01 | 2006-04-01 | 満6歳 | 同上 |
| A5 | 2000-02-29 | 2001-02-28 | 満0歳 | 満1歳到達日は 2001-02-28 |
| A6 | 2000-02-29 | 2001-03-01 | 満1歳 | 同上 |
| A7 | 2000-02-29 | 2004-02-29 | 満4歳 | 満4歳到達日は 2004-02-28 |
| A8 | 2000-01-01 | 2006-01-01 | 満6歳 | 満6歳到達日は 2005-12-31 |
| A9 | 任意 | 生年月日より前 | 計算せずエラー | — |

### 6-2. 数え年

出生時を1歳とし、以後は毎年1月1日に1歳加える。

`数え年 = 基準日の年 - 生年月日の年 + 1`

受入条件：

| # | 生年月日 | 基準日 | 数え年 |
|---|---|---|---|
| K1 | 2025-12-31 | 2025-12-31 | 1歳 |
| K2 | 2025-12-31 | 2026-01-01 | 2歳 |
| K3 | 2025-01-01 | 2025-12-31 | 1歳 |

誕生日の月日によって数え年が変化しないこと。

### 6-3. 和暦

対象元号は明治・大正・昭和・平成・令和。**境界日は新元号側に含める。**

| 元号 | 開始日 |
|---|---|
| 明治 | 1868-01-25 |
| 大正 | 1912-07-30 |
| 昭和 | 1926-12-25 |
| 平成 | 1989-01-08 |
| 令和 | 2019-05-01 |

初年は「元年」と表記する。

受入条件：

| # | 西暦 | 和暦 |
|---|---|---|
| E1 | 1912-07-29 | 明治45年7月29日 |
| E2 | 1912-07-30 | 大正元年7月30日 |
| E3 | 1926-12-24 | 大正15年12月24日 |
| E4 | 1926-12-25 | 昭和元年12月25日 |
| E5 | 1989-01-07 | 昭和64年1月7日 |
| E6 | 1989-01-08 | 平成元年1月8日 |
| E7 | 2019-04-30 | 平成31年4月30日 |
| E8 | 2019-05-01 | 令和元年5月1日 |

**将来の改元に備え、元号名・略号・開始日を単一のデータ定義に集約する。**解析・妥当性検証・表示はすべてこの定義を参照し、境界日を各所に重複記述しない。改元時はこのデータ1か所の追加とテストケース更新だけで対応できること。

### 6-4. 年度

4月1日から翌年3月31日まで。開始年を年度名に使う。

| # | 日付 | 年度 |
|---|---|---|
| F1 | 2026-04-01 | 2026年度 |
| F2 | 2027-03-31 | 2026年度 |
| F3 | 2027-04-01 | 2027年度 |

生年月日については「生まれた年度」を、基準日については「基準日の年度」を表示する。

### 6-5. 学年

学校教育法17条「子の満六歳に達した日の翌日以後における最初の学年の初めから」に基づく**標準学齢区分**として扱う。実際の在籍を保証しない。

同一学年の出生範囲は4月2日〜翌年4月1日。

- 誕生日が4月2日以後：出生年を学年年度の基準年とする
- 誕生日が1月1日〜4月1日：出生年の前年を基準年とする
- **小学校入学年度 = 学年年度の基準年 + 7**

4月1日生まれが1つ上の学年になるのは、3月31日の終了時に満6歳へ達し（6-1の法的到達日）、その翌日である4月1日以後最初の学年の初めが同日になるためである。**この判定は表示上の満年齢ではなく法的到達日に依拠する。**

受入条件：

| # | 生年月日 | 小学校入学年度 |
|---|---|---|
| G1 | 2019-04-02 | 2026年度 |
| G2 | 2020-04-01 | 2026年度 |
| G3 | 2020-04-02 | 2027年度 |

基準日時点の標準学年は、小学校入学年度との年度差で表示する。

| 年度差 | 表示 |
|---|---|
| 負 | 就学前 |
| 0〜5 | 小学1年〜小学6年 |
| 6〜8 | 中学1年〜中学3年 |
| 9〜11 | 高校1年相当〜高校3年相当 |
| 12以上 | 高校卒業相当以降 |

義務教育外は実在の在籍を断定しないため「相当」を付ける。成人に対して大学学年は推測しない。

基準日側の年度境界についても検証すること（入学年度の3/31で「就学前」、4/1で「小学1年」）。

### 6-6. 入力形式

**受理範囲の下限は 1873-01-01（明治6年1月1日）。**明治5年以前は旧暦（天保暦）であり、元号年から西暦への機械的換算が成立しない。例えば `明治元年2月1日` は実際にはグレゴリオ暦 1868-02-23 だが機械的換算では 1868-02-01 となり、**無警告で約3週間ずれた結果を出す**。また明治5年は12月2日で終わるため、`明治5年12月31日` のような実在しない日を受理してしまう。誤った出力は明示エラーより悪いため、範囲を狭める。

実在する生年月日としての損失はゼロ（1873年より前に生まれた人は現存しない）。なお**和暦の表示**（西暦→和暦）は明治元年からのデータを保持したままとし、受理範囲の下限のみを 1873-01-01 とする。

受理する形式：

- 西暦スラッシュ：`1987/5/14`、`1987/05/14`
- 西暦ハイフン：`1987-5-14`、`1987-05-14`
- 西暦ドット：`1987.5.14`
- 西暦日本語：`1987年5月14日`
- 漢字元号：`昭和62年5月14日`、`平成元年1月8日`
- 元号略号（`M`/`T`/`S`/`H`/`R`、大文字小文字問わず）：`S62.5.14`、`S62/5/14`、`H1-1-8`、`H元.1.8`
- 上記の全角数字・全角記号
- 前後の空白
- **先頭ラベル付き**：`生年月日：1987年5月14日`（`：`/`:` までを除去）
- **末尾補助語**：`生`、`生まれ`、`出生`
- **末尾約物**：`、`、`。`、`,`、`.`
- **曜日括弧**：`1987年5月14日（木）`、`1987年5月14日(木)`

先頭ラベル・末尾約物・曜日括弧の受理は、右クリック経路の実用性に直結する（ドラッグ選択でほぼ確実に巻き込むため）。

受理しない形式：

- 2桁西暦（`87/5/14`）
- 月日年順（`5/14/1987`）
- 区切りなし8桁（`19870514`）
- 漢数字（`五月十四日`）
- 日付範囲、複数日付、日時付き文字列
- **区切り記号なしの連結**（`1987年5月14日1990年1月1日`）
- 明治6年より前
- 存在しない日付（`1987年2月30日`）
- 元号の実在期間と矛盾する日付（`H1.1.7` は平成開始前、`S64.1.8` は昭和終了後）

**元号年を西暦へ機械的に加算するだけで受理してはならない。**変換後の日付が当該元号の期間内にあることを必ず検証する。

エラー文言：

| 種別 | 文言 |
|---|---|
| 形式不明 | 日付を読み取れません。例：1987/5/14、昭和62年5月14日、S62.5.14 |
| 存在しない日 | 1987年2月30日は存在しません |
| 元号境界違反 | 平成元年1月7日は平成の期間外です。平成は1989年1月8日開始です |
| 範囲外（下限） | 明治5年以前は旧暦のため対応していません。1873年1月1日以降を入力してください |
| 複数候補 | 日付は1件だけ指定してください |
| 長すぎる入力 | 日付部分だけを入力または選択してください |
| 基準日が生年月日より前 | 基準日は生年月日以後の日付を指定してください |

**黙って失敗しない。**受理できない入力には必ず理由を表示する。

### 6-7. 対応年範囲

| 対象 | 下限 | 上限 |
|---|---|---|
| 生年月日 | 1873-01-01 | 基準日 |
| 基準日 | 1873-01-01 | 2200-12-31 |

基準日の上限を未来に取るのは拘束要件R3（入社予定日時点の年齢）のため。

**最新元号の開始年から100年を超える基準日には和暦を表示せず、西暦のみとして注記を出す。**未改元を前提に「令和82年」のような表示を出さないため。

## 7. 動作要件

### 7-1. ポップアップ（入力経路①）

- 生年月日入力欄、基準日入力欄、基準日の「今日／固定日」切替、計算ボタン、結果領域、結果コピーボタン、入力形式の説明、右クリックが使えないページの案内、設定異常時の警告と初期化操作
- 初回表示時は生年月日欄へフォーカス。Enter で計算、Esc で閉じる
- **「今日」はポップアップを開いた時点で1回だけ取得し、そのポップアップが閉じるまで同一値を使う**

受入条件：

- マウスなしで入力・計算・結果確認・コピーまで完結する
- 入力が妥当なら5種類の結果を一度の操作で表示する
- 入力エラー時に前回の結果を新しい結果として残さない
- **計算ボタンはハンドラ先頭で `disabled = true` にする**（視覚的フィードバックを伴う。同期計算では二重発火は起きないが、ユーザーへの応答として必要）
- 結果領域は `aria-live="polite"`、エラー領域は `role="alert"`
- 色だけで成功・失敗を区別しない

### 7-2. 右クリック（入力経路②）

- `runtime.onInstalled` で `removeAll()` → `create()` の順に、選択テキスト用メニュー「この日付の年齢・年度を計算」を1件登録する（`create` の重複IDは `runtime.lastError` を立てるため、順序を守る）
- `chrome.contextMenus.OnClickData.selectionText` をそのまま使う。`scripting.executeScript` による再取得は行わない
- 選択文字列は前後空白を除去し、**64 Unicode コードポイント**を上限とする
- 基準日は保存済み設定に従う。「今日」の場合はクリックイベント処理の開始時に1回だけ取得する
- 結果は Chrome 通知1件で表示する。**同一の通知IDを再利用して更新する**
- **非同期処理は必ず `.catch()` で終端する**（未処理 rejection にしない）

**通知の表示優先順位**（OS により2行程度で省略されるため）：

1. `満N歳（基準日：YYYY年M月D日）` ← **基準日を必ず含める**
2. `数えN歳・{和暦}`
3. `小学校入学 YYYY年度・{標準学年}`

**通知が使えない場合**：`chrome.notifications.create()` は OS 側で抑制・拒否されていても成功を返すため、これでは検知できない。`chrome.notifications.getPermissionLevel()` が `denied` を返す場合は通知を試みず、`action` のバッジ（権限不要）に `!` を表示してポップアップへ誘導する。

受入条件：

- 対応形式の日付を選択して実行すると、ページを書き換えずに通知で結果が得られる
- **固定基準日モードで実行したとき、結果に基準日が含まれる**
- 不正入力でも無反応にならず、通知で理由が示される
- 連続実行しても通知が重ならず、最後に受理した操作の結果が表示される
- Service Worker 再起動後も、保存済み基準日設定を読み直して正常に動く
- 通知が `denied` のとき、バッジで代替導線が示される

### 7-3. 出力とコピー

ポップアップと右クリックは**同じ計算モデル・同じ項目順**を使う。表示媒体に合わせて密度だけを変える。

ポップアップ表示例：

```text
生年月日：1987年5月14日（昭和62年5月14日）
基準日：2026年8月2日（令和8年8月2日・2026年度）

満年齢：39歳
数え年：40歳
生まれた年度：1987年度
小学校入学年度：1994年度
標準学年：高校卒業相当以降
```

コピーはポップアップにのみ置き、結果全体をプレーンテキストでコピーする。入力値ではなく検証済みの正規化済み日付・基準日・全計算結果を含める。まず `clipboardWrite` 権限なしで `navigator.clipboard.writeText()` を試み、失敗時は結果テキストを選択可能にして手動コピーを案内する。**権限を先回りして足さない。**

## 8. 非機能要件

### 8-1. 権限

| 権限 | いつ使うか | 目的 | それ以外に使わないこと |
|---|---|---|---|
| `contextMenus` | インストール時のメニュー登録と、選択文字列からの変換開始時 | 選択した日付を右クリックで変換するため | 閲覧履歴取得やページ内容収集には使わない |
| `storage` | 基準日設定の保存・読込時 | ポップアップと右クリックで同じ基準日を使うため | 生年月日・履歴・閲覧情報は保存しない |
| `notifications` | 右クリック変換の結果またはエラーを表示するとき | ページへコードを注入せず結果を提示するため | リマインダー・広告・バックグラウンド通知には使わない |

**要求しない権限**：`host_permissions`、`activeTab`、`scripting`、`tabs`、`clipboardWrite`、`webRequest`、外部通信に関する権限。

`contexts: ["selection"]` のコンテキストメニューは、ホスト権限も `activeTab` も `scripting` も無しで `info.selectionText` を受け取れる。ページへの注入をやめることで、この最小権限が成立する。

### 8-2. 保存

永続化するのは基準日設定だけ。**生年月日・計算履歴は保存しない**（個人情報に該当し得る入力を不要に永続化しないため）。`storage.local` を使い、`storage.sync` は使わない。

未知の `schemaVersion` は**空設定へ変換しない。**読み取り専用のエラー状態にし、ユーザーが明示的に初期化するまで書き戻さない。この状態で右クリックが実行された場合は**エラー通知**とする（「今日」への暗黙フォールバックはしない）。

### 8-3. Service Worker 再起動耐性

FILE:/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md
# 設計 — 日本の年齢・年度計算 Chrome 拡張機能

策定日: 2026-08-02
run-id: `20260802-2350-japanese-age-calculator`
状態: **凍結（DESIGN_APPROVED）**

要件は [要件定義.md](要件定義.md) を正とする。本書は「どう作るか」だけを扱う。

**凍結後の変更には記録と承認を要する。**実装中に本設計の問題を発見した場合、黙って逸脱せず設計査読へ戻って再承認を得ること。

---

## 1. 設計の中心にある判断

### 1-1. ページへコードを注入しない

右クリックの結果を**ページ上に表示せず Chrome 通知で返す**。これが本設計で最も影響の大きい判断であり、以下がすべてこの帰結である。

- `scripting`・`activeTab`・`host_permissions` が**すべて不要**になる（`contexts: ["selection"]` のコンテキストメニューは、これらなしで `info.selectionText` を受け取れる）
- 制限ページ・iframe・Shadow DOM に対する DOM 注入の失敗が起きない
- 既知不具合パターン10（固定位置トーストの重複）が構造的に発生しない
- 既知不具合パターン6（DOM要素を保持する Map/Set の掃除漏れ）も同様

代償は「ページ上での結果表示ができない」ことと「選択の再取得ができない」ことだが、拘束要件は「変換結果を出す」としか求めていないため要件は満たせる。

ただし出力経路が通知単独になるため、**通知の失敗検知**（3-4）と**通知への基準日の明示**（3-3）が要件の実現度に直結する。

### 1-2. ドメイン層を完全に隔離する

`src/domain/` は `chrome`・DOM・時計・ストレージのいずれも参照しない。純粋関数のみ。

これにより、製品価値の核であるドメインロジック（年齢・元号・学年）を、Chrome 環境なしで高速にテーブル駆動テストできる。

### 1-3. 時計を入口1点に閉じ込める

コア計算関数の中で `new Date()` / `Date.now()` を**呼ばない**。基準日は常に引数として渡す。

これは既知不具合パターン1（時刻ハードコードによるテストのタイムボム）への構造的対策である。「テストで固定日時を使わない」という規律ではなく、**そもそも計算関数が時計に触れられない API 設計**で守る。

## 2. ディレクトリ構成

```text
src/
  manifest.json
  background/
    service-worker.ts      エントリ。onInstalled・onClicked の登録のみ
    context-menu.ts        メニュー登録（removeAll → create）
    notifications.ts       通知の生成・更新・権限判定
  popup/
    popup.html
    popup.css
    popup.ts
  domain/                  ★ chrome / DOM / 時計 / storage を参照しない
    plain-date.ts          値オブジェクトと日付演算
    eras.ts                元号データ（唯一の定義箇所）
    era.ts                 元号の解決・表示・期間検証
    parse-date.ts          文字列 → PlainDate
    age.ts                 満年齢・法的到達日・数え年
    fiscal-year.ts         年度
    school-year.ts         学年・小学校入学年度
    calculate.ts           上記を束ねる calculate()
    errors.ts              エラーコードと文言辞書
  infrastructure/
    clock.ts               Clock インターフェースと実装
    settings.ts            storage.local の読み書きとマイグレーション
  presentation/
    format-result.ts       ポップアップ用・通知用の整形
tests/
  unit/
  integration/
  e2e/
docs/
  要件定義.md
  設計.md
```

## 3. 主要な設計

### 3-1. 日付モデル

Temporal API は Chrome バージョン依存とポリフィル容量を避けるため使わない。JavaScript の `Date` はコア処理で使わない（タイムゾーンと時刻の概念が混入するため）。

```ts
type PlainDate = Readonly<{
  year: number;
  month: number;  // 1-12
  day: number;
}>;
```

生成関数で保証すること：整数であること、月が1〜12、日が該当月の範囲内、グレゴリオ暦上で実在すること、対応年範囲内であること。

比較・うるう年判定・月末取得・前日取得・年度算出を小さな純粋関数として実装する。

`Date.parse()` には依存しない（実装依存の解釈があるため）。

### 3-2. 時計境界

```ts
interface Clock {
  todayInTokyo(): PlainDate;
}
```

呼び出しは以下の2箇所だけ。

- **ポップアップを開いた時点**で1回。そのポップアップが閉じるまで同一値を使う（計算のたびに呼ばない。開いたまま日付が変わっても結果を変えないため）
- **右クリックのクリックイベント処理の開始時**に1回

固定基準日モードの場合は時計を呼ばない。いずれの場合も `calculate()` は明示的な基準日を引数で受け取る。

`Date` を使ってよいのは `clock.ts` の実装内部だけ。ここで `Asia/Tokyo` の暦日へ変換する。

### 3-3. 満年齢と法的到達日の分離

**要件定義 6-1 の blocker 修正がここに現れる。**表示上の満年齢と法的到達日は別概念であり、別々の関数・別々のフィールドとして持つ。

```ts
/** 法的到達日：民法143条に基づき、満 n 歳に達する日を返す */
function legalAgeAttainmentDate(birth: PlainDate, n: number): PlainDate;

/** 表示上の満年齢：基準日の開始時点で成立している満年齢 */
function displayAge(birth: PlainDate, reference: PlainDate): number;
```

`legalAgeAttainmentDate` の規則：

1. 生年月日の n 年後の応当日を求める
2. その月に応当日が存在しない場合（2月29日生まれの平年）、民法143条2項ただし書により**その月の末日**を応当日とする
3. 応当日の**前日**を返す（民法143条：前日の終了時に満了）

`displayAge` は「`legalAgeAttainmentDate(birth, n) <= reference` を満たす最大の n」として実装する。前日の終了時に到達するので、その翌日（＝応当日＝誕生日当日）の開始時点で新しい年齢が成立する。これが日常慣行と一致する。

**単純な月日比較でこれを代用してはならない。**2月29日生まれと月初生まれで結果が食い違う。

`CalculationResult` には両方を持たせる。

```ts
type CalculationResult = {
  fullAge: number;                        // 表示上の満年齢
  fullAgeAttainmentDate: PlainDate;       // その年齢の法的到達日
  countedAge: number;                     // 数え年
  birthEraLabel: string;
  referenceEraLabel: string | null;       // 和暦を出せない遠未来では null
  birthFiscalYear: number;
  referenceFiscalYear: number;
  elementaryEntryFiscalYear: number;
  standardSchoolStage: SchoolStage;
};
```

**学年判定は `legalAgeAttainmentDate` に依拠する。**`displayAge` を使うと4月1日生まれの学年が1つずれる。

### 3-4. 元号データ

唯一の定義箇所。終了日は次の元号の開始日から導出し、重複管理しない。

```ts
type EraDefinition = Readonly<{
  id: "meiji" | "taisho" | "showa" | "heisei" | "reiwa";
  name: string;          // "明治"
  abbreviation: string;  // "M"
  start: PlainDate;
}>;
```

開始日の昇順で保持する。表示時は「対象日以前で最も新しい開始日」を選び、`元号年 = 西暦年 - 開始年 + 1` とする。1年目は「元年」と表記する。

入力時は元号年から西暦候補を求めたうえで、**その日が当該元号の期間内にあるかを必ず検証する**（`H1.1.7` は平成開始前なのでエラー）。

**改元時に触るのはこのファイルとテストケースだけ**になるよう、境界日を他の場所に書かない。

遠未来（最新元号の開始年 + 100 年超）の基準日には和暦を出さず `referenceEraLabel` を `null` にし、UI で注記する。

### 3-5. パーサー

処理順序：

1. 入力長確認（64 コードポイント上限）
2. NFKC 正規化（全角数字・英字・記号の半角化を含む）
3. trim
4. **先頭ラベル除去**（`：` または `:` があればそこまでを捨てる）
5. **末尾補助語除去**（`生`・`生まれ`・`出生`）
6. **末尾約物除去**（`、`・`。`・`,`・`.`）
7. **曜日括弧除去**（`（木）`・`(木)`）
8. 区切り記号の統一（`/`・`-`・`.` を同一視）
9. 西暦形式または元号形式との**完全一致**
10. 数値変換
11. 暦日妥当性検証
12. 元号期間検証
13. 対応年範囲検証（1873-01-01 以後）
14. `PlainDate` 生成

**部分一致で文章中の日付を拾わない。**除去処理（4〜7）を通した後の文字列全体が許可形式に一致することを要求する。誤解釈より明示エラーを優先する。

4〜7 の除去は、右クリック経路でドラッグ選択に巻き込まれる典型パターンへの対応であり、**日付以外の意味を持つ文字を新たに解釈するものではない**（誤解釈リスクを増やさない）。

`1987年5月14日1990年1月1日` のような**区切り記号なしの連結**は、完全一致に失敗するため自然にエラーになる。これが既知不具合パターン12（`selectionText` が改行を保持しない）に対する実質的な防御である。

### 3-6. 計算 API

```ts
type CalculationInput = {
  birthDate: PlainDate;
  referenceDate: PlainDate;
};

function calculate(input: CalculationInput): Result<CalculationResult, CalculationError>;
```

`calculate()` は**検証済みデータだけを受け取り、例外ではなく型付き結果を返す**。パースエラー・範囲外・基準日の前後関係は判別可能なエラーコードとし、ポップアップと通知が**同じ文言辞書**（`errors.ts`）を参照する。

### 3-7. 設定の保存

```ts
type SettingsV1 = {
  schemaVersion: 1;
  referenceDateMode: "today" | "fixed";
  fixedReferenceDate?: string;  // YYYY-MM-DD
};
```

`chrome.storage.local` を使う。`storage.sync` は使わない（単一用途に必須でない）。

**生年月日・計算結果は保存しない。**

未知の `schemaVersion` を検出した場合：

- **空設定へ変換しない**（既知不具合パターン2）
- 読み取り専用のエラー状態を返す
- ユーザーが明示的に初期化するまで `storage.local.set` を呼ばない
- **この状態で右クリックが実行された場合はエラー通知**とする（「今日」への暗黙フォールバックはしない）

既知バージョン間の移行は純粋なマイグレーション関数として実装する。

**ポップアップと右クリックで対応が非対称であることは意図した設計である。**（2026-08-03 追記。Stage 5 査読席の指摘 r-4 を受けて明文化）

| 経路 | 未知 schemaVersion のときの振る舞い |
|---|---|
| 右クリック | 計算せずエラー通知。無言で誤った基準日を使わせないため |
| ポップアップ | 警告バナーを出したうえで、既定（今日）で**計算は続行する**。ただし設定の書き戻しは一切しない |

理由：ポップアップは設定を初期化できる唯一の復旧経路である。ここで計算まで止めると、ユーザーは警告を見るだけで何もできなくなる。書き戻しを禁止していれば、保存済みデータが壊れる危険はない。

**ポップアップは設定の読み込みが完了するまでフォーム全体を無効化する。**（同追記。Stage 5 指摘 M-1〜M-3）読み込み前に操作できると、未知 schemaVersion のデータを既定値で上書きする TOCTOU が成立するため。`storage.local.get` 自体が失敗した場合も、未知バージョンと同じ「読み取り不能」状態として扱い、書き戻さない。

### 3-8. コンテキストメニュー

`runtime.onInstalled` で登録する。

```ts
chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "この日付の年齢・年度を計算",
    contexts: ["selection"],
  });
});
```

**`removeAll()` → `create()` の順を守る。**同一 ID で `create` を再実行すると `Cannot create item with duplicate id` が `runtime.lastError` に立つ。

「メニューが登録済みである」ことを Service Worker のメモリに保持しない。

### 3-9. 通知

同一の通知 ID を再利用して更新する（連打時に積み上がらないため）。

**送信前に `chrome.notifications.getPermissionLevel()` を確認する。**`chrome.notifications.create()` は OS 側で通知が抑制・拒否されていても成功を返すため、コールバックの成否では検知できない。

```ts
const level = await chrome.notifications.getPermissionLevel();
if (level === "denied") {
  await chrome.action.setBadgeText({ text: "!" });
  await chrome.action.setTitle({ title: "通知が無効です。ここをクリックして結果を確認してください" });
  return;
}
```

`chrome.action` のバッジは権限不要で使える。

**表示優先順位**（OS により2行程度で省略されるため、重要な情報を先頭に置く）：

| 行 | 内容 |
|---|---|
| 1 | `満N歳（基準日：YYYY年M月D日）` |
| 2 | `数えN歳・{生年月日の和暦}` |
| 3 | `小学校入学 YYYY年度・{標準学年}` |

**基準日を1行目に含めることは必須。**固定基準日モードで過去に設定した日を忘れたまま結果を読むと確実に誤読するため。

### 3-10. 非同期処理の終端

Chrome のイベントリスナーから起動する Promise には**必ず `.catch()` を付ける**（既知不具合パターン3）。

```ts
chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleClick(info)
    .catch((e) => {
      console.error(e);
      void notifyError("変換中にエラーが発生しました。ポップアップから再試行してください");
    });
});
```

`.catch()` 無しの `void 何か().then(...)` を作らない。

### 3-11. ポップアップ

- 初回表示時に生年月日欄へフォーカス
- Enter で計算、Esc で閉じる
- **計算ボタンはハンドラ先頭で `disabled = true`** にする（既知不具合パターン9）。同期計算では二重発火は起きないが、ユーザーへの視覚的応答として必要。再有効化は次の描画で行う
- 結果領域は `aria-live="polite"`、エラー領域は `role="alert"`
- 表示は `textContent` のみ。`innerHTML` を使わない
- 色だけで成功・失敗を区別しない

コピーは `navigator.clipboard.writeText()` を**権限なしで**試み、失敗したら結果テキストを選択可能にして案内する。`clipboardWrite` を先回りで足さない。

## 4. 技術選定


exec
/bin/bash -lc 'for f in /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/plain-date.ts /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/eras.ts /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/era.ts /home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/parse-date.ts; do echo "FILE:$f"; sed -n '"'1,260p' \""'$f"; done
rg -n "''^(##|###)|明治5|1873|入力形式|対応形式|シークレット|file:|PDF|iframe|Shadow|Service Worker|storage.session|見積|テスト" /home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md /home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md' in /home/mokuo/projects/chrome-ext-wareki-converter
 succeeded in 0ms:
FILE:/home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/plain-date.ts
/**
 * 年月日だけを持つ値オブジェクト。
 * JavaScript の Date は使わない（タイムゾーンと時刻の概念が混入するため）。
 * このモジュールは chrome / DOM / 時計 / storage のいずれも参照しない。
 */

export type PlainDate = Readonly<{
  year: number;
  month: number; // 1-12
  day: number;
}>;

/** 対応年範囲。要件定義 6-7 */
export const MIN_SUPPORTED_DATE: PlainDate = { year: 1873, month: 1, day: 1 };
export const MAX_REFERENCE_DATE: PlainDate = { year: 2200, month: 12, day: 31 };

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return DAYS_IN_MONTH[month - 1] ?? 0;
}

/** グレゴリオ暦上で実在する日付かどうか。整数性も検査する。 */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= daysInMonth(year, month);
}

/** 実在しない日付では null を返す。例外は投げない。 */
export function makePlainDate(year: number, month: number, day: number): PlainDate | null {
  if (!isValidDate(year, month, day)) return null;
  return { year, month, day };
}

/** a < b なら負、a === b なら 0、a > b なら正 */
export function compare(a: PlainDate, b: PlainDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function isBefore(a: PlainDate, b: PlainDate): boolean {
  return compare(a, b) < 0;
}

export function isSameOrBefore(a: PlainDate, b: PlainDate): boolean {
  return compare(a, b) <= 0;
}

export function equals(a: PlainDate, b: PlainDate): boolean {
  return compare(a, b) === 0;
}

export function previousDay(d: PlainDate): PlainDate {
  if (d.day > 1) return { year: d.year, month: d.month, day: d.day - 1 };
  if (d.month > 1) {
    const month = d.month - 1;
    return { year: d.year, month, day: daysInMonth(d.year, month) };
  }
  return { year: d.year - 1, month: 12, day: 31 };
}

export function nextDay(d: PlainDate): PlainDate {
  if (d.day < daysInMonth(d.year, d.month)) {
    return { year: d.year, month: d.month, day: d.day + 1 };
  }
  if (d.month < 12) return { year: d.year, month: d.month + 1, day: 1 };
  return { year: d.year + 1, month: 1, day: 1 };
}

/** YYYY-MM-DD 形式へ。storage と <input type="date"> の受け渡しに使う。 */
export function toISO(d: PlainDate): string {
  const mm = String(d.month).padStart(2, "0");
  const dd = String(d.day).padStart(2, "0");
  return `${d.year}-${mm}-${dd}`;
}

/** YYYY-MM-DD 形式から。厳密一致のみ受理する。 */
export function fromISO(s: string): PlainDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return makePlainDate(Number(m[1]), Number(m[2]), Number(m[3]));
}
FILE:/home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/eras.ts
/**
 * 元号データ。**唯一の定義箇所。**
 *
 * 将来の改元では、このファイルへ 1 エントリ追加し、テストケースを更新するだけで
 * 対応できること。境界日を他の場所へ重複記述してはならない。
 * 終了日は「次の元号の開始日」から導出するため、ここには持たせない。
 */

import type { PlainDate } from "./plain-date.js";

export type EraId = "meiji" | "taisho" | "showa" | "heisei" | "reiwa";

export type EraDefinition = Readonly<{
  id: EraId;
  name: string;
  abbreviation: string; // 大文字で保持する
  start: PlainDate;
}>;

/** 開始日の昇順。境界日は新元号側に含める。 */
export const ERAS: readonly EraDefinition[] = [
  { id: "meiji", name: "明治", abbreviation: "M", start: { year: 1868, month: 1, day: 25 } },
  { id: "taisho", name: "大正", abbreviation: "T", start: { year: 1912, month: 7, day: 30 } },
  { id: "showa", name: "昭和", abbreviation: "S", start: { year: 1926, month: 12, day: 25 } },
  { id: "heisei", name: "平成", abbreviation: "H", start: { year: 1989, month: 1, day: 8 } },
  { id: "reiwa", name: "令和", abbreviation: "R", start: { year: 2019, month: 5, day: 1 } },
] as const;

/** 最新元号の開始年から何年先までなら和暦を表示してよいか（要件定義 6-7） */
export const WAREKI_DISPLAY_HORIZON_YEARS = 100;
FILE:/home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/era.ts
/** 元号の解決・表示・期間検証。境界日は eras.ts のみを参照する。 */

import { ERAS, WAREKI_DISPLAY_HORIZON_YEARS, type EraDefinition } from "./eras.js";
import { compare, isSameOrBefore, type PlainDate } from "./plain-date.js";

/** 対象日が属する元号。明治開始前は null。 */
export function eraForDate(date: PlainDate): EraDefinition | null {
  let found: EraDefinition | null = null;
  for (const era of ERAS) {
    if (isSameOrBefore(era.start, date)) found = era;
    else break; // ERAS は開始日昇順
  }
  return found;
}

export function findEraByName(name: string): EraDefinition | undefined {
  return ERAS.find((e) => e.name === name);
}

export function findEraByAbbreviation(abbr: string): EraDefinition | undefined {
  const upper = abbr.toUpperCase();
  return ERAS.find((e) => e.abbreviation === upper);
}

/** その元号の次の元号。最後の元号なら undefined。 */
export function nextEra(era: EraDefinition): EraDefinition | undefined {
  const i = ERAS.findIndex((e) => e.id === era.id);
  return i >= 0 ? ERAS[i + 1] : undefined;
}

/** date がその元号の期間内か。終了日は次の元号の開始日から導出する。 */
export function isWithinEra(era: EraDefinition, date: PlainDate): boolean {
  if (compare(date, era.start) < 0) return false;
  const next = nextEra(era);
  if (!next) return true;
  return compare(date, next.start) < 0;
}

/** 元号年（1 起算）。1 年目は「元年」と表記する。 */
export function eraYearOf(era: EraDefinition, date: PlainDate): number {
  return date.year - era.start.year + 1;
}

export function eraYearLabel(eraYear: number): string {
  return eraYear === 1 ? "元" : String(eraYear);
}

/** 元号年から西暦年を求める。期間内かどうかは呼び出し側で検証すること。 */
export function gregorianYearOf(era: EraDefinition, eraYear: number): number {
  return era.start.year + eraYear - 1;
}

/**
 * 和暦表示。表示できない場合は null を返す。
 * - 明治開始前
 * - 最新元号の開始年から WAREKI_DISPLAY_HORIZON_YEARS 年を超える遠未来
 *   （未改元を前提に「令和82年」のような表示を出さないため）
 */
export function formatWareki(date: PlainDate): string | null {
  const era = eraForDate(date);
  if (!era) return null;

  const latest = ERAS[ERAS.length - 1];
  if (latest && date.year - latest.start.year > WAREKI_DISPLAY_HORIZON_YEARS) {
    return null;
  }

  const label = eraYearLabel(eraYearOf(era, date));
  return `${era.name}${label}年${date.month}月${date.day}日`;
}
FILE:/home/mokuo/projects/chrome-ext-japanese-age-calculator/src/domain/parse-date.ts
/**
 * 文字列 → PlainDate。
 *
 * 方針（凍結設計 3-5）：
 * - Date.parse() には依存しない（実装依存の解釈があるため）
 * - 除去処理を通した後の文字列**全体**が許可形式に完全一致することを要求する。
 *   部分一致で文章中の日付を拾わない。誤解釈より明示エラーを優先する。
 * - 除去処理は「日付以外の意味を持つ文字を新たに解釈する」ものではないため、
 *   誤解釈リスクを増やさずに受理率だけを上げる。
 */

import {
  err,
  ok,
  type Result,
} from "./errors.js";
import {
  findEraByAbbreviation,
  findEraByName,
  gregorianYearOf,
  isWithinEra,
  nextEra,
} from "./era.js";
import type { EraDefinition } from "./eras.js";
import {
  compare,
  isValidDate,
  makePlainDate,
  MIN_SUPPORTED_DATE,
  type PlainDate,
} from "./plain-date.js";

/** 選択テキストの長さ上限（Unicode コードポイント数） */
export const MAX_INPUT_CODE_POINTS = 64;

function codePointLength(s: string): number {
  return [...s].length;
}

/**
 * 正規化。順序が意味を持つ。
 * 1. NFKC（全角数字・英字・記号の半角化を含む）
 * 2. trim
 * 3. 先頭ラベル除去（「生年月日：」等。`：`/`:` までを捨てる）
 * 4. 曜日括弧除去
 * 5. 末尾補助語除去（生 / 生まれ / 出生）
 * 6. 末尾約物除去
 * 7. 内部空白の除去
 */
/** ラベルとみなす接頭部の最大長 */
const MAX_LABEL_LENGTH = 12;

/**
 * 日付らしき並びの検出。複数日付の混入を検知するためだけに使う粗い検査であり、
 * これ自体は受理の判定に使わない（受理は完全一致で行う）。
 */
const DATE_LIKE =
  /(?:明治|大正|昭和|平成|令和|[MTSHR])?(?:元|\d{1,4})[年/\-.]\d{1,2}[月/\-.]\d{1,2}/gu;

export function countDateLike(s: string): number {
  return (s.match(DATE_LIKE) ?? []).length;
}

export function normalizeInput(raw: string): string {
  // NFKC により全角コロン「：」は ASCII ":" へ変換済みになる
  let s = raw.normalize("NFKC").trim();

  // 先頭ラベルの除去は「最初のコロンより前が、数字を含まない短い語」の場合に限る。
  // 無条件に最後のコロン以降を採ると、「生年月日：… 登録日：…」のような
  // 複数日付を含む選択で、誤った日付を無警告で受理してしまう。
  const colon = s.indexOf(":");
  if (colon >= 0) {
    const label = s.slice(0, colon);
    if (label.length <= MAX_LABEL_LENGTH && !/\d/u.test(label)) {
      s = s.slice(colon + 1);
    }
  }

  s = s.replace(/[(（][日月火水木金土][)）]/g, "");

  // 末尾の補助語と約物は重なって現れる（例：「…日（木）生まれ。」）。
  // 1 回ずつでは剥がし残すため、変化しなくなるまで繰り返す。
  for (;;) {
    const before = s;
    s = s.trim();
    s = s.replace(/(生まれ|出生|生)$/u, "");
    s = s.replace(/[、。,.]+$/u, "");
    if (s === before) break;
  }

  s = s.replace(/\s+/gu, "");

  return s.trim();
}

/** 西暦形式：1987/5/14, 1987-5-14, 1987.5.14, 1987年5月14日 */
// 区切り記号は前後で同一であることを要求する（1987/5-14 のような混在を受理しない）
const GREGORIAN_SEPARATED = /^(\d{4})([/\-.])(\d{1,2})\2(\d{1,2})$/u;
const GREGORIAN_JP = /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/u;

/** 漢字元号：昭和62年5月14日 / 平成元年1月8日 */
const ERA_JP = /^(明治|大正|昭和|平成|令和)(元|\d{1,2})年(\d{1,2})月(\d{1,2})日?$/u;

/** 元号略号：S62.5.14 / S62/5/14 / H1-1-8 / H元.1.8 */
const ERA_ABBR = /^([A-Za-z])(元|\d{1,2})([/\-.])(\d{1,2})\3(\d{1,2})$/u;

function eraYearToNumber(token: string): number {
  return token === "元" ? 1 : Number(token);
}

function formatJapaneseDate(year: number, month: number, day: number): string {
  return `${year}年${month}月${day}日`;
}

function buildFromGregorian(year: number, month: number, day: number): Result<PlainDate> {
  if (!isValidDate(year, month, day)) {
    return err("NONEXISTENT_DATE", formatJapaneseDate(year, month, day));
  }
  const date = makePlainDate(year, month, day);
  if (!date) return err("NONEXISTENT_DATE", formatJapaneseDate(year, month, day));
  if (compare(date, MIN_SUPPORTED_DATE) < 0) return err("BELOW_MIN_DATE");
  return ok(date);
}

function buildFromEra(
  era: EraDefinition,
  eraYear: number,
  month: number,
  day: number,
): Result<PlainDate> {
  if (eraYear < 1) return err("UNPARSABLE");
  const year = gregorianYearOf(era, eraYear);

  if (!isValidDate(year, month, day)) {
    return err(
      "NONEXISTENT_DATE",
      `${era.name}${eraYear === 1 ? "元" : eraYear}年${month}月${day}日`,
    );
  }
  const date = makePlainDate(year, month, day);
  if (!date) return err("UNPARSABLE");

  // 旧暦に由来する範囲外は、元号期間の文言よりも「旧暦のため非対応」を優先して返す
  if (compare(date, MIN_SUPPORTED_DATE) < 0) return err("BELOW_MIN_DATE");

  // 元号年から西暦へ機械的に換算しただけでは受理しない。期間内かを必ず検証する。
  if (!isWithinEra(era, date)) {
    const next = nextEra(era);
    const label = `${era.name}${eraYear === 1 ? "元" : eraYear}年${month}月${day}日`;
    const startText = `${era.name}は${era.start.year}年${era.start.month}月${era.start.day}日開始`;
    const endText = next
      ? `、${next.name}は${next.start.year}年${next.start.month}月${next.start.day}日開始`
      : "";
    return err("ERA_OUT_OF_RANGE", `${label}は${era.name}の期間外です。${startText}${endText}です。`);
  }

  return ok(date);
}

/**
 * 日付文字列を解析する。
 * 受理しない形式（2桁西暦・月日年順・区切りなし8桁・漢数字・複数日付の連結など）は
 * 完全一致に失敗するため、自然に UNPARSABLE となる。
 */
export function parseDateInput(raw: string): Result<PlainDate> {
  const trimmed = raw.trim();
  if (trimmed === "") return err("EMPTY_INPUT");
  // 長さは trim 後で判定する（空白を巻き込んだ選択で誤って TOO_LONG にしない）
  if (codePointLength(trimmed) > MAX_INPUT_CODE_POINTS) return err("TOO_LONG");

  const s = normalizeInput(raw);
  if (s === "") return err("EMPTY_INPUT");

  // 完全一致の前に複数日付を検知し、専用の文言で返す
  if (countDateLike(s) >= 2) return err("MULTIPLE_DATES");

  let m = GREGORIAN_SEPARATED.exec(s);
  if (m) {
    return buildFromGregorian(Number(m[1]), Number(m[3]), Number(m[4]));
  }
  m = GREGORIAN_JP.exec(s);
  if (m) {
    return buildFromGregorian(Number(m[1]), Number(m[2]), Number(m[3]));
  }

  m = ERA_JP.exec(s);
  if (m) {
    const era = findEraByName(m[1] as string);
    if (!era) return err("UNPARSABLE");
    return buildFromEra(era, eraYearToNumber(m[2] as string), Number(m[3]), Number(m[4]));
  }

  m = ERA_ABBR.exec(s);
  if (m) {
    const era = findEraByAbbreviation(m[1] as string);
    if (!era) return err("UNPARSABLE");
    return buildFromEra(era, eraYearToNumber(m[2] as string), Number(m[4]), Number(m[5]));
  }

  return err("UNPARSABLE");
}
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:10:## 1. これは何か
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:18:## 2. なぜ作るか
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:23:- **日付フォーマット統一（ISO形式へのコピー等）も既存拡張 Date Converter が押さえており、対応形式はより広い**
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:30:## 3. 誰が使うか
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:35:## 4. 拘束要件
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:45:## 5. 対象外（やらないこと）
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:58:## 6. ドメイン要件と受入条件
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:60:### 6-1. 満年齢
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:84:### 6-2. 数え年
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:100:### 6-3. 和暦
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:127:**将来の改元に備え、元号名・略号・開始日を単一のデータ定義に集約する。**解析・妥当性検証・表示はすべてこの定義を参照し、境界日を各所に重複記述しない。改元時はこのデータ1か所の追加とテストケース更新だけで対応できること。
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:129:### 6-4. 年度
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:141:### 6-5. 学年
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:175:### 6-6. 入力形式
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:177:**受理範囲の下限は 1873-01-01（明治6年1月1日）。**明治5年以前は旧暦（天保暦）であり、元号年から西暦への機械的換算が成立しない。例えば `明治元年2月1日` は実際にはグレゴリオ暦 1868-02-23 だが機械的換算では 1868-02-01 となり、**無警告で約3週間ずれた結果を出す**。また明治5年は12月2日で終わるため、`明治5年12月31日` のような実在しない日を受理してしまう。誤った出力は明示エラーより悪いため、範囲を狭める。
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:179:実在する生年月日としての損失はゼロ（1873年より前に生まれた人は現存しない）。なお**和暦の表示**（西暦→和暦）は明治元年からのデータを保持したままとし、受理範囲の下限のみを 1873-01-01 とする。
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:219:| 範囲外（下限） | 明治5年以前は旧暦のため対応していません。1873年1月1日以降を入力してください |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:226:### 6-7. 対応年範囲
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:230:| 生年月日 | 1873-01-01 | 基準日 |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:231:| 基準日 | 1873-01-01 | 2200-12-31 |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:237:## 7. 動作要件
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:239:### 7-1. ポップアップ（入力経路①）
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:241:- 生年月日入力欄、基準日入力欄、基準日の「今日／固定日」切替、計算ボタン、結果領域、結果コピーボタン、入力形式の説明、右クリックが使えないページの案内、設定異常時の警告と初期化操作
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:254:### 7-2. 右クリック（入力経路②）
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:273:- 対応形式の日付を選択して実行すると、ページを書き換えずに通知で結果が得られる
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:277:- Service Worker 再起動後も、保存済み基準日設定を読み直して正常に動く
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:280:### 7-3. 出力とコピー
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:299:## 8. 非機能要件
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:301:### 8-1. 権限
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:313:### 8-2. 保存
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:319:### 8-3. Service Worker 再起動耐性
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:321:以下を Service Worker のメモリに保持しない。
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:330:### 8-4. 対応できないページ
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:337:| iframe 内 | Chrome が選択テキストを渡す場合は対応（実測で確認） |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:338:| Shadow DOM 内 | 同上 |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:339:| ブラウザ内 PDF ビューア | 同上 |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:340:| `file:` | Chrome 側でメニューイベントが提供される範囲で動作。ホストアクセス許可は要求しない |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:348:### 8-5. シークレットモード
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:350:既定で無効。ユーザーが Chrome の拡張機能設定で明示的に許可した場合のみ動作する。シークレットで入力した生年月日は保存しない。
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:352:### 8-6. セキュリティ
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:359:### 8-7. リモートコード不使用
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:363:## 9. 単一用途の説明が成立する根拠
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:370:## 10. 参考情報の出自と改変点
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:377:## 11. 本要件の限界
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/要件定義.md:382:- `file:`・PDF・iframe・Shadow DOM における `selectionText` の提供可否は Chrome バージョン依存であり、実測で確定する必要がある
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:13:## 1. 設計の中心にある判断
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:15:### 1-1. ページへコードを注入しない
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:20:- 制限ページ・iframe・Shadow DOM に対する DOM 注入の失敗が起きない
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:28:### 1-2. ドメイン層を完全に隔離する
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:32:これにより、製品価値の核であるドメインロジック（年齢・元号・学年）を、Chrome 環境なしで高速にテーブル駆動テストできる。
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:34:### 1-3. 時計を入口1点に閉じ込める
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:38:これは既知不具合パターン1（時刻ハードコードによるテストのタイムボム）への構造的対策である。「テストで固定日時を使わない」という規律ではなく、**そもそも計算関数が時計に触れられない API 設計**で守る。
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:40:## 2. ディレクトリ構成
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:77:## 3. 主要な設計
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:79:### 3-1. 日付モデル
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:97:### 3-2. 時計境界
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:114:### 3-3. 満年齢と法的到達日の分離
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:154:### 3-4. 元号データ
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:171:**改元時に触るのはこのファイルとテストケースだけ**になるよう、境界日を他の場所に書かない。
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:175:### 3-5. パーサー
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:191:13. 対応年範囲検証（1873-01-01 以後）
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:200:### 3-6. 計算 API
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:213:### 3-7. 設定の保存
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:247:### 3-8. コンテキストメニュー
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:263:「メニューが登録済みである」ことを Service Worker のメモリに保持しない。
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:265:### 3-9. 通知
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:292:### 3-10. 非同期処理の終端
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:308:### 3-11. ポップアップ
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:319:## 4. 技術選定
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:326:| 単体テスト | Vitest | fake timers による時計制御が必要 |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:327:| DOMテスト | Testing Library + jsdom | — |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:328:| E2E | Playwright | 未パック拡張のロードと Service Worker 制御 |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:333:### ビルド後の自動検査
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:339:- Service Worker・popup・アイコンなど manifest の参照先が実在する
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:340:- ZIP に `node_modules`・テスト・開発設定を含めない
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:345:## 5. テスト戦略
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:347:### 5-1. 単体テスト（Vitest、Chrome API 非依存）
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:355:- パーサー異常系：2桁年・月日年順・区切りなし8桁・漢数字・複数日付・**区切り記号なしの連結**・存在しない日・元号期間外・1873-01-01 未満・64コードポイント超
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:367:**時計の扱い**：「今日」に関わるテストでは `vi.useFakeTimers()` + `vi.setSystemTime()` を必ず使い、終了時に `vi.useRealTimers()` へ戻す。**未来日時を通常の定数として固定し実時間と比較するテストを作らない**（既知不具合パターン1）。
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:373:### 5-2. 統合テスト（型付き Chrome API モック）
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:380:- Service Worker のモジュール状態を破棄して再ロードし、`storage.local` から基準日設定を復元できること
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:386:### 5-3. E2E（Playwright）— v1 では4本に限定
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:395:4. Service Worker を停止・再起動した後も右クリック変換できる
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:399:- iframe・open Shadow DOM・ブラウザ内 PDF での `selectionText` 実機挙動
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:400:- `chrome://`・Chrome Web Store・`file:` でのメニュー表示可否の記録
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:404:降格の理由：これらは CI 環境差が大きく、Playwright で安定して自動化するコストが v1 の価値に見合わない。ただし**確認自体は必須**であり、手動テスト票の項目として残す。
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:406:## 6. 見積もり
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:415:| | Service Worker・保存・通知・manifest | 4〜5h |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:418:| **テストハーネス** | Vitest・TypeScript・DOMテスト基盤 | 4〜6h |
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:425:## 7. 既知不具合パターンへの対応の対照表
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:437:## 8. 実装フェーズへの引き継ぎ事項
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:441:- **対応 Chrome 最小バージョン**。通知 API・MV3 Service Worker・テスト対象環境を踏まえて固定し、manifest の `minimum_chrome_version` とストア説明を一致させる
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:444:- `file:`・PDF・iframe・Shadow DOM の `selectionText` 提供可否を実測し、対応表へ反映する
/home/mokuo/projects/chrome-ext-japanese-age-calculator/docs/設計.md:447:## 9. 将来の改善候補（v1 では実施しない）

codex
## 要約

本拡張の単一用途は、**「入力またはページ上で選択した日本の暦日を、西暦と和暦の間で改元日まで検証して正確に変換する」**とする。主画面・初期状態・主要CTAは西暦→和暦であり、和暦→西暦は同じ単一用途に属する補助方向として提供する。

既存4本との差別化を次の1文で表す。

> **全角・元年・元号略号・曜日付きの日付を受理し、改元日の境界と元号期間を検証して、存在しない和暦や未確認の改元後日付を推測変換しない和暦変換拡張。**

採用判断は以下のとおり。

- 検証済み4ファイルは、現時点では**同一内容をコピーして流用**する。2製品だけのために npm パッケージを運用する費用は見合わず、作り直しは検証資産を失う。
- コピー後は本拡張側でもテストを保持する。改元時は2リポジトリの `eras.ts` と対応テストを更新し、両拡張を再公開する。更新箇所が2系統になることを明示的な運用負債として受け入れる。
- Store 公開は、**和暦アプリのみを公開し、年齢アプリは手元利用にとどめる選択肢2を推奨**する。両方を同一アカウントで公開することは、機能差があっても起動導線・入力・出力先が一致し、アカウント単位の重複コンテンツ制裁リスクに見合わない。
- 年だけの入力は受理しない。必ず年月日を要求する。
- 改元情報の確認期限を超える日付は、最新元号を機械的に延長せず変換を停止し、データ更新が必要だと表示する。

## 要件（受入条件を含む）

### 1. 製品目的と対象範囲

主機能は西暦の年月日から和暦の年月日を得ることである。和暦から西暦への変換も提供するが、年齢、年度、学年、祝日、旧暦変換、ページ全体の自動書換え、変換履歴、クラウド同期は扱わない。

受入条件：

- ポップアップを開くと西暦→和暦が既定モードになっている。
- `1989年1月7日` は `昭和64年1月7日`、`1989年1月8日` は `平成元年1月8日` になる。
- 入力・結果・設定を外部へ送信しない。
- バンドル済みコードとデータだけで動作する。
- Store 説明、UI、コンテキストメニューのいずれにも年齢・年度等の別用途を追加しない。

### 2. 変換方向

双方向を採用する。

- 主方向：西暦→和暦
- 補助方向：和暦→西暦
- ポップアップでは方向を明示的に切り替える。自動推定だけに依存しない。
- 右クリックでは入力形式から方向を判定する。西暦・和暦のどちらにも完全一致しない場合は推測しない。

双方向化の理由は、検証済みドメイン層ですでに成立しており、追加する権限や外部機能がなく、「暦日の相互変換」という1文の単一用途を維持できるためである。

受入条件：

- `平成元年1月8日` および `H元.1.8` は `1989年1月8日` になる。
- `平成元年1月7日` は変換せず、「平成の期間外」と境界日を示す。
- 方向を切り替えても、同じ暦日を往復変換した結果が一致する。

### 3. 入力形式

次を受理する。

- 西暦：`1989年1月8日`、`1989/1/8`、`1989-1-8`、`1989.1.8`
- 和暦：`平成元年1月8日`、`平成1年1月8日`
- 略号：`H1.1.8`、`H元/1/8`
- NFKCで正規化可能な全角数字・全角英字・全角記号
- 単一の短い先頭ラベル：`生年月日：1987年5月14日`
- 曜日括弧：`1987年5月14日（木）`
- 定義済みの末尾補助語・約物

次は受理しない。

- `1989年` のような年のみ
- 年月、月日のみ
- 複数の日付を含む選択
- 2桁西暦、漢数字、8桁区切りなし、月日年順
- 区切り記号が混在した形式
- 実在しない日付
- 元号期間外の日付
- 明治5年以前
- 上限を超える長文

年のみを受理しない理由は、`1989年` の正解が昭和64年と平成元年の2つになり、主機能である「日付全体の正確な変換」と矛盾するためである。エラーには「改元年は元号を一意に決められないため、月日まで入力してください」と表示する。

受入条件：

- `１９８９年１月８日` を受理できる。
- `1989年` を一方の元号へ暗黙変換しない。
- `2019年4月30日` と `2019年5月1日` をそれぞれ平成31年、令和元年に分ける。
- `2019/4-30` を受理しない。
- `1900年2月29日` は存在しない日付、`2000年2月29日` は有効と判定する。

### 4. 先頭ラベルと複数日付への対策

年齢アプリで発見された `lastIndexOf(":")` 型の不具合は本案にも該当し得るため、同じ前処理を無条件には流用しない。

正規化は次の規則にする。

1. 入力長を検査する。
2. NFKC正規化と前後空白除去を行う。
3. 正規化前後の文字列について日付候補数を検査する。
4. 先頭ラベルは、**最初のコロン**より前が数字・元号・日付区切りを含まない許可長以内の文字列であり、コロン以後に日付候補がちょうど1件の場合だけ除去する。
5. 2個以上の日付候補または2個以上のラベル区切りがあれば、除去せず `MULTIPLE_DATES` とする。
6. 曜日等の限定的な付加要素を除去する。
7. 最終文字列全体を許可形式に完全一致させる。

`生年月日：1987年5月14日 登録日：2020年1月1日` は、2020年の日付として受理せず「複数の日付が含まれています」とする。前処理が情報を捨てる前と後の両方で候補数を確認する。

### 5. 対応期間

グレゴリオ暦による入力・変換の下限は `1873-01-01` とする。明治5年以前は旧暦との対応が単純な年月日換算にならないため受理しない。

受入条件：

- `明治6年1月1日` を受理する。
- `明治5年12月31日` や `1872年12月31日` を変換しない。
- エラーに旧暦が理由であることと、`1873年1月1日以降` という下限を示す。

### 6. 入力経路と出力

#### ポップアップ

- テキスト入力、変換方向、変換ボタン、結果、コピー、入力例、エラー領域を置く。
- 初回フォーカスは入力欄。
- Enterで変換、方向切替はキーボード操作可能、Escで閉じられる。
- 結果は選択可能なプレーンテキストとして表示する。
- コピー対象は正規化済みの変換結果だけとし、入力の余分なラベル等を含めない。

#### 選択テキストの右クリック

- メニュー名は「選択した日付を和暦・西暦変換」。
- ページを書き換えず、Chrome通知で結果または具体的なエラーを返す。
- 同一通知IDを再利用し、通知を積み上げない。
- 通知が拒否されている場合、結果を `storage.session` に一時保存してアクションバッジを `!` にし、ポップアップで確認するよう案内する。
- ページ上へのトーストや常駐content scriptは使用しない。

`navigator.clipboard.writeText()` はポップアップ上のユーザー操作から、追加権限なしで試す。失敗した場合は結果を選択状態にし、手動コピーを案内する。`clipboardWrite` は要求しない。

受入条件：

- コピーの成功・失敗を `aria-live` で通知する。
- コピー連打時も操作を並行実行せず、ボタンを処理開始時に無効化する。
- 通知は同時に複数表示されない。
- 通知拒否時も無反応にならず、バッジとポップアップに結果またはエラーが残る。

### 7. `selectionText` の改行欠落

本機能は段落構造を結果生成に使用しない。`info.selectionText` の改行が失われても、連結された複数日付を単一日付として解釈しないよう、次を必須とする。

- 正規化前後に複数日付候補を検出する。
- 空白や改行を消す前に完全一致可能性を評価する。
- 日付断片の連結を許可しない。
- `1989年1月7日` と `1989年1月8日` が段落をまたいで選択された場合は `MULTIPLE_DATES` とする。

`window.getSelection()` の再取得は採用しない。これには `scripting` またはページ注入が必要となり、制限ページで失敗し、最小権限を損なうためである。段落構造を必要としない仕様と、曖昧入力を拒否する解析によって対処する。

### 8. 対応できないページ

ページへの注入を行わないため、右クリックイベントで `selectionText` が提供されるページでは、iframe、open/closed Shadow DOM、PDF、`file:` を含めて同じ処理を試みる。ただし提供可否はChrome側の挙動に依存する。

- `chrome://`、Chrome Web Store等でメニューが表示されない場合：ポップアップは利用可能であり、入力欄付近に「このページでは右クリック変換を利用できません。選択内容をコピーして入力してください」と常時案内する。
- `file:`：追加のホストアクセスを要求せず、Chromeが選択イベントを渡す場合だけ動作する。
- PDF、iframe、Shadow DOM：選択文字列が渡された場合だけ動作する。取得できない場合にページ注入へフォールバックしない。
- クリックイベントを受けたのに選択文字列が空なら、エラー通知またはバッジを必ず出す。

Chromeがコンテキストメニュー自体を表示しない状況では拡張から通知できないため、ポップアップ内の事前案内をもって無反応対策とする。

### 9. シークレットモード

既定では無効とする。ユーザーがChromeの拡張設定で明示的に許可した場合のみ動作する。

- 入力・結果・履歴を `storage.local` または `storage.sync` に保存しない。
- 通知拒否時の一時結果だけを `storage.session` に保持する。
- シークレットの一時結果が通常プロファイルへ見えるかは実機確認し、分離を保証できなければシークレットでは一時保存せず、通知失敗をバッジだけで示す。

### 10. アクセシビリティ

- マウスなしで入力、方向選択、変換、結果選択、コピーまで完結する。
- 入力欄と方向切替に可視ラベルを付ける。
- 結果領域は `aria-live="polite"`、エラーは `role="alert"`。
- コピー完了は色だけで示さない。
- フォーカスリングを消さない。
- 読み上げ順を入力、方向、実行、エラー、結果、コピーの順にする。
- 処理中のボタンには `aria-disabled` またはネイティブの `disabled` を反映する。

### 11. 競合との差別化評価

| 候補 | 評価 | 採否 |
|---|---|---|
| 全角・元年・略号・ラベル・曜日への対応 | 「半角数字のみ」の競合との差は明確。ただし入力形式の多さだけでは模倣容易 | 採用 |
| 改元日の境界判定 | 変換精度の本質であり、年単位変換との違いが明確 | 中核として採用 |
| 元号期間外を明示エラー | 誤変換防止として強い。競合説明でも具体例を示せる | 中核として採用 |
| 明治5年以前を旧暦理由で拒否 | 正確性の根拠になるが利用者層は限定的 | 採用 |
| 未知の改元を推測しない | オフライン変換の弱点を明示的に安全側へ倒すため説得力が高い | 中核として採用 |
| 双方向であること | 既存にも双方向製品があり、単独では差別化にならない | 補助機能 |
| Salesforce特化 | 単一用途が別方向になり、本案の対象外 | 不採用 |
| ページ上の全日付自動変換 | 権限・誤検出・ページ改変が増え、daisyと競合する | 不採用 |

### 12. 年齢アプリとの公開方針

#### 選択肢1：両方をStoreに公開

- 単一用途の説明は、和暦アプリを「暦日変換」、年齢アプリを「年齢・年度計算」とすれば文章上は両立する。
- 一方、起動導線、日付入力、拡張内への結果表示が一致し、和暦変換コードとUIも相当程度重複する。
- ユーザーからは「同じ日付ツールを分割した製品」と認識される可能性が高い。
- 差別化を最大化しても審査結果を制御できず、アカウント全体への制裁リスクが残る。

結論：非推奨。

#### 選択肢2：和暦アプリのみStore公開

- Store上で単一用途の衝突が発生しない。
- ユーザーに提示される製品が1本なので別製品性を証明する必要がない。
- 今回の拘束要件である和暦変換を正面から公開できる。
- 年齢アプリはローカル利用を継続できる。

結論：**推奨**。

#### 選択肢3：将来統合を前提に和暦アプリを先行公開

- 先行期間は選択肢2と同程度に安全。
- 統合後に「暦日変換」と「年齢・年度計算」を併存させると、Storeの単一用途説明が長くなり、主用途がぼやける。
- 既存ユーザーには機能追加と認識され得るが、和暦だけを求めるユーザーには過剰機能となる。
- 将来の統合方針が確定していない段階で、データモデルやUIを統合向けに複雑化すべきではない。

結論：次善策だが、現時点の前提にはしない。

### 13. 改元への備え

元号定義は名前、略号、開始日を1ファイルだけに置き、終了日は次の元号の開始日から導出する。

さらに、元号データに次を持たせる。

```ts
type EraDatasetMetadata = Readonly<{
  schemaVersion: 1;
  verifiedThrough: PlainDate;
}>;
```

`verifiedThrough` を超える日付については最新元号を延長表示しない。結果の代わりに次を表示する。

> この日付は同梱された元号データの確認期限後です。改元情報を含む最新版へ更新してください。

外部通信をしない以上、未更新の拡張が改元発生を自動検知することは不可能である。そのため、無警告で `令和XX年` を返す設計は採らない。これは将来日付の利便性を下げるが、「誤った変換を無警告で返さない」という製品上の差別化を優先した判断である。

運用上は、改元の公表時に以下を行う。

1. 両リポジトリの `eras.ts` に新元号を追加する。
2. `EraId`、入力許可名・略号、境界テストを更新する。
3. `verifiedThrough` を更新する。
4. 両拡張をビルドする。
5. 和暦アプリをStoreへ公開する。
6. 年齢アプリを将来Store公開している場合は同時に更新する。

ソース上の元号定義修正は、コピー方式のため**2リポジトリ各1か所、計2か所**である。Store配布物はどの方式でも製品ごとの再ビルド・再審査が必要であり、共有npm化しても2製品のリリース作業は減らない。

## テスト戦略

- 単体テスト：
  - `PlainDate` の整数性、月末、うるう年100年・400年規則。
  - 明治・大正・昭和・平成・令和の全開始日前日／開始日。
  - `1989-01-07`、`1989-01-08`、`2019-04-30`、`2019-05-01`。
  - 元年表記と2年目への遷移。
  - 和暦→西暦→和暦の往復不変性。
  - `平成元年1月7日` 等の元号期間外。
  - 1873-01-01の前後。
  - 全角、略号、小文字略号、曜日、許可されたラベル・末尾語。
  - 年のみ、混在区切り、複数日付、連結日付、長文、存在しない日付。
  - `生年月日：1987年5月14日 登録日：2020年1月1日` が `MULTIPLE_DATES` になること。
  - コロンが複数ある場合や、ラベル内に数字がある場合に情報を捨てないこと。
  - 改行欠落を模した2日付の連結が単一日付として受理されないこと。
  - `verifiedThrough` 当日と翌日。翌日は令和を延長表示しないこと。
  - 元号配列の開始日昇順、名前・略号・IDの一意性、開始日重複なし。
  - `Date`、DOM、Chrome APIをドメイン層から参照していないこと。

- 統合テスト：
  - ポップアップ入力から結果表示、方向切替、エラー、コピー失敗時の案内までをDOM環境で検証する。
  - コンテキストメニュー登録の `removeAll → create` 順序を検証する。
  - 右クリック入力とポップアップ入力が同じパーサー・エラー辞書・変換関数を使うことを検証する。
  - 通知IDが固定で、連続操作時に既存通知を更新することを検証する。
  - イベントリスナーから開始したすべてのPromiseが `.catch()` で終端され、失敗が通知またはバッジへ変換されることを検証する。
  - 変換・コピー各ボタンをハンドラ冒頭で無効化し、二重実行しないことを検証する。
  - `storage.session` に置く一時結果のService Worker再起動後の復元と、ブラウザセッション終了相当での消失を検証する。
  - 未知の `schemaVersion` を空状態へ変換せず、既存値を上書きしないことを検証する。読み取り不能時も同様とする。
  - `storage.local`、`storage.sync` に入力・結果が書かれないことを検証する。
  - 通知権限が `denied` の場合にバッジと一時結果へフォールバックすることを検証する。
  - 一時UIはポップアップ内で単一のステータス領域を更新し、固定位置要素を追加生成しないことを検証する。

- E2Eテスト（必要な場合）：
  - 共通ベースライン13項目は再定義せず、以下の本機能固有シナリオだけを追加する。
  - 手動で未パック拡張を読み込んだテストプロファイルを事前準備し、ポップアップで `1989年1月7日` と `1989年1月8日` の境界結果を確認する。
  - 全角入力、`H元.1.8`、元号期間外、複数ラベル入力を確認する。
  - 通常ページで選択した西暦日付を右クリックし、通知結果を確認する。
  - 段落をまたぐ2日付選択が単一日付として変換されないことを確認する。
  - Service Workerを停止・再起動した後、右クリック変換と通知拒否時の一時結果復元を確認する。
  - `chrome://`、Chrome Web Store、`file:`、ブラウザ内PDF、iframe、Shadow DOMについて、メニュー表示と `selectionText` 提供可否を手動実測し、対応表へ記録する。
  - `chrome://extensions` からのインストール自動化は対象外とする。Playwrightは既にロード済みの拡張のポップアップと通常ページに限定し、Chrome内部ページ、OS通知、右クリックメニュー自体は手動確認とする。

- 実環境依存が強い場合、コア実装とテストハーネス構築の見積もりを分離する：
  - コア実装の見積もり時間：**14〜19時間**
    - 検証済みドメイン層の移植・本用途向け調整：2〜3時間
    - パーサーの複数ラベル対策・確認期限：3〜4時間
    - ポップアップ・アクセシビリティ・コピー：4〜5時間
    - Service Worker・メニュー・通知・sessionフォールバック：4〜5時間
    - manifest・ビルド・Store向け整理：1〜2時間
  - テストハーネス構築の見積もり時間：**8〜12時間**
    - TypeScript・Vitest・DOMテスト基盤：3〜4時間
    - Chrome APIモックとService Worker再起動ハーネス：3〜5時間
    - Playwright用の事前ロード済みプロファイルと手動試験票：2〜3時間

## 技術選定・実装方針

### 1. 検証済みコードの扱い

選択肢1「そのままコピー」を採用する。ただし無検討なフォークではなく、コピー元コミットを記録し、4ファイルと対応テストを移植した直後に差分ゼロを確認する。

| 選択肢 | 評価 |
|---|---|
| コピー | 検証済み実装を保ち、依存公開やパッケージ更新を不要にできる。改元時は2リポジトリを更新する必要がある |
| npm等へ共有化 | 元号定義のソースは1か所になるが、パッケージの公開、互換性、依存更新、供給元管理が増える。両拡張の再ビルド・再公開は依然必要 |
| 作り直し | 394行と152テストの検証資産を捨て、同じ境界不具合を再導入する可能性がある |

2製品だけの個人開発では、改元頻度に対して常設パッケージの運用費が大きい。したがってコピーを選ぶ。ただし、3製品目が同じ元号ドメインを使用する時点、または通常改修の横断反映漏れが1回発生した時点で共有パッケージ化を再検討する。

既存 `parse-date.ts` には報告された先頭ラベル問題への修正コメントが既に見えるが、本案ではテストを含めて独立に再確認する。特に「最初のコロン」を使うだけでは十分ではなく、除去前の複数候補検査を契約に加える。

### 2. アーキテクチャ

```text
src/
  manifest.json
  domain/
    plain-date.ts
    eras.ts
    era.ts
    parse-date.ts
    errors.ts
    convert.ts
  popup/
    popup.html
    popup.css
    popup.ts
  background/
    service-worker.ts
    context-menu.ts
    notifications.ts
  infrastructure/
    session-result.ts
  presentation/
    format-result.ts
    error-messages.ts
```

- `domain/` はChrome API、DOM、時計、ストレージに依存しない。
- `Date` と `Date.parse()` を暦日計算に使用しない。
- `convert()` は方向と入力を受け、型付きの成功・失敗を返す。
- ポップアップと右クリックは同じ `parseDateInput()`、`formatWareki()`、エラー辞書を使用する。
- HTML出力は `textContent` だけで行い、入力を `innerHTML` に渡さない。

### 3. Manifest V3と権限

要求する権限は次に限定する。

- `contextMenus`：選択テキストから変換を開始する。
- `notifications`：右クリック結果またはエラーを表示する。
- `storage`：通知拒否時の一時結果を `storage.session` に保持する。

要求しないもの：

- `host_permissions`
- `activeTab`
- `scripting`
- `tabs`
- `clipboardWrite`
- `webRequest`

content script、リモートコード、外部通信、動的コード評価は使用しない。依存ライブラリを使う場合もビルド成果物へ同梱する。

### 4. Service Worker再起動耐性と保存

Service Workerのメモリには次を保持しない。

- メニュー登録済みフラグ
- 最新結果
- 通知拒否状態
- 処理中ロックの永続状態

メニューは `runtime.onInstalled` で `removeAll()` 完了後に登録する。イベントリスナーはモジュール評価時に同期登録する。

`storage.session` は通知拒否時の最新結果1件だけに使用する。ブラウザ再起動後に残す必要がなく、個人情報になり得る入力を永続化しないためである。`storage.local` と `storage.sync` は使用しない。

一時結果には `schemaVersion`、状態種別、表示用結果またはエラーだけを保存する。未知のバージョンを検出した場合は空データに変換せず、書き込みを停止してポップアップに「一時データの形式が対応外」と表示する。ユーザーの「一時データを消去」操作またはブラウザセッション終了だけを復旧経路とする。

### 5. 非同期・連打・一時UI

- Chromeイベントから開始する非同期処理はすべて末尾に `.catch()` を持つ。
- `.catch()` 自体の通知失敗もログとバッジへ縮退させ、未処理rejectionを残さない。
- ポップアップの変換・コピーはハンドラ冒頭でボタンを無効化する。
- 右クリック処理には単調増加する要求IDをService Worker内で割り当て、同一Worker内では最後に開始された要求だけが通知を更新する。
- Worker再起動後も通知IDを固定することで通知の積み上がりを防ぐ。
- ポップアップの成功、エラー、コピー状態はそれぞれ既存の単一領域を更新し、DOMへ一時トーストを追加しない。

### 6. ビルド

TypeScriptと小規模なバンドラーを使用し、MV3で許可される静的JavaScriptへ出力する。ビルド後に次を機械検査する。

- リモートURLおよび動的コード評価がない。
- manifestで参照する全ファイルが存在する。
- 未使用権限、host permission、content scriptがない。
- ZIPにソースマップ、テスト、開発設定、`node_modules` を含めない。
- CSPを緩和していない。
- コピー元4ファイルの移植差分と、意図した変更点が記録されている。

## 不確実な点・前提

- 競合4本の具体的な境界日検証、元号期間検証、現在の更新状況はIntake記載以上には確認されていない。Store説明では「他製品は誤っている」と断定せず、本製品が保証する動作だけを具体例で示す。
- `verifiedThrough` 方式は正確性を最大化する一方、期限後の利用を止める。確認期限と更新頻度は実装前に運用可能な値へ決定する必要がある。外部通信禁止のまま、未知の改元発生だけを自動検知する方法はない。
- 明治元年の開始日データを保持していても、変換受付は一律 `1873-01-01` 以後とする前提である。歴史資料向け旧暦変換は別用途なので追加しない。
- `storage.session` のシークレット分離挙動、PDF・iframe・Shadow DOM・`file:` における `selectionText` 提供可否、通知権限拒否時のOS別挙動は実機確認が必要である。
- Chrome内部ページでコンテキストメニューが生成されない場合、クリック後のエラー通知は技術的に不可能である。常時表示されるポップアップ案内を代替とする。
- 最低対応Chromeバージョンは、`storage.session`、MV3 Service Worker、採用ビルド方式の対応状況を実装開始時に固定し、manifestとStore説明を一致させる。
- 年齢アプリをすでにStore公開済みのまま維持することが不可避である場合、推奨選択肢2は実行できない。その場合は、和暦アプリの公開前にデベロッパーアカウント単位の重複リスクを改めて判断し、公開延期または既存アプリの非公開化を選ぶべきである。
tokens used
53,472
## 要約

本拡張の単一用途は、**「入力またはページ上で選択した日本の暦日を、西暦と和暦の間で改元日まで検証して正確に変換する」**とする。主画面・初期状態・主要CTAは西暦→和暦であり、和暦→西暦は同じ単一用途に属する補助方向として提供する。

既存4本との差別化を次の1文で表す。

> **全角・元年・元号略号・曜日付きの日付を受理し、改元日の境界と元号期間を検証して、存在しない和暦や未確認の改元後日付を推測変換しない和暦変換拡張。**

採用判断は以下のとおり。

- 検証済み4ファイルは、現時点では**同一内容をコピーして流用**する。2製品だけのために npm パッケージを運用する費用は見合わず、作り直しは検証資産を失う。
- コピー後は本拡張側でもテストを保持する。改元時は2リポジトリの `eras.ts` と対応テストを更新し、両拡張を再公開する。更新箇所が2系統になることを明示的な運用負債として受け入れる。
- Store 公開は、**和暦アプリのみを公開し、年齢アプリは手元利用にとどめる選択肢2を推奨**する。両方を同一アカウントで公開することは、機能差があっても起動導線・入力・出力先が一致し、アカウント単位の重複コンテンツ制裁リスクに見合わない。
- 年だけの入力は受理しない。必ず年月日を要求する。
- 改元情報の確認期限を超える日付は、最新元号を機械的に延長せず変換を停止し、データ更新が必要だと表示する。

## 要件（受入条件を含む）

### 1. 製品目的と対象範囲

主機能は西暦の年月日から和暦の年月日を得ることである。和暦から西暦への変換も提供するが、年齢、年度、学年、祝日、旧暦変換、ページ全体の自動書換え、変換履歴、クラウド同期は扱わない。

受入条件：

- ポップアップを開くと西暦→和暦が既定モードになっている。
- `1989年1月7日` は `昭和64年1月7日`、`1989年1月8日` は `平成元年1月8日` になる。
- 入力・結果・設定を外部へ送信しない。
- バンドル済みコードとデータだけで動作する。
- Store 説明、UI、コンテキストメニューのいずれにも年齢・年度等の別用途を追加しない。

### 2. 変換方向

双方向を採用する。

- 主方向：西暦→和暦
- 補助方向：和暦→西暦
- ポップアップでは方向を明示的に切り替える。自動推定だけに依存しない。
- 右クリックでは入力形式から方向を判定する。西暦・和暦のどちらにも完全一致しない場合は推測しない。

双方向化の理由は、検証済みドメイン層ですでに成立しており、追加する権限や外部機能がなく、「暦日の相互変換」という1文の単一用途を維持できるためである。

受入条件：

- `平成元年1月8日` および `H元.1.8` は `1989年1月8日` になる。
- `平成元年1月7日` は変換せず、「平成の期間外」と境界日を示す。
- 方向を切り替えても、同じ暦日を往復変換した結果が一致する。

### 3. 入力形式

次を受理する。

- 西暦：`1989年1月8日`、`1989/1/8`、`1989-1-8`、`1989.1.8`
- 和暦：`平成元年1月8日`、`平成1年1月8日`
- 略号：`H1.1.8`、`H元/1/8`
- NFKCで正規化可能な全角数字・全角英字・全角記号
- 単一の短い先頭ラベル：`生年月日：1987年5月14日`
- 曜日括弧：`1987年5月14日（木）`
- 定義済みの末尾補助語・約物

次は受理しない。

- `1989年` のような年のみ
- 年月、月日のみ
- 複数の日付を含む選択
- 2桁西暦、漢数字、8桁区切りなし、月日年順
- 区切り記号が混在した形式
- 実在しない日付
- 元号期間外の日付
- 明治5年以前
- 上限を超える長文

年のみを受理しない理由は、`1989年` の正解が昭和64年と平成元年の2つになり、主機能である「日付全体の正確な変換」と矛盾するためである。エラーには「改元年は元号を一意に決められないため、月日まで入力してください」と表示する。

受入条件：

- `１９８９年１月８日` を受理できる。
- `1989年` を一方の元号へ暗黙変換しない。
- `2019年4月30日` と `2019年5月1日` をそれぞれ平成31年、令和元年に分ける。
- `2019/4-30` を受理しない。
- `1900年2月29日` は存在しない日付、`2000年2月29日` は有効と判定する。

### 4. 先頭ラベルと複数日付への対策

年齢アプリで発見された `lastIndexOf(":")` 型の不具合は本案にも該当し得るため、同じ前処理を無条件には流用しない。

正規化は次の規則にする。

1. 入力長を検査する。
2. NFKC正規化と前後空白除去を行う。
3. 正規化前後の文字列について日付候補数を検査する。
4. 先頭ラベルは、**最初のコロン**より前が数字・元号・日付区切りを含まない許可長以内の文字列であり、コロン以後に日付候補がちょうど1件の場合だけ除去する。
5. 2個以上の日付候補または2個以上のラベル区切りがあれば、除去せず `MULTIPLE_DATES` とする。
6. 曜日等の限定的な付加要素を除去する。
7. 最終文字列全体を許可形式に完全一致させる。

`生年月日：1987年5月14日 登録日：2020年1月1日` は、2020年の日付として受理せず「複数の日付が含まれています」とする。前処理が情報を捨てる前と後の両方で候補数を確認する。

### 5. 対応期間

グレゴリオ暦による入力・変換の下限は `1873-01-01` とする。明治5年以前は旧暦との対応が単純な年月日換算にならないため受理しない。

受入条件：

- `明治6年1月1日` を受理する。
- `明治5年12月31日` や `1872年12月31日` を変換しない。
- エラーに旧暦が理由であることと、`1873年1月1日以降` という下限を示す。

### 6. 入力経路と出力

#### ポップアップ

- テキスト入力、変換方向、変換ボタン、結果、コピー、入力例、エラー領域を置く。
- 初回フォーカスは入力欄。
- Enterで変換、方向切替はキーボード操作可能、Escで閉じられる。
- 結果は選択可能なプレーンテキストとして表示する。
- コピー対象は正規化済みの変換結果だけとし、入力の余分なラベル等を含めない。

#### 選択テキストの右クリック

- メニュー名は「選択した日付を和暦・西暦変換」。
- ページを書き換えず、Chrome通知で結果または具体的なエラーを返す。
- 同一通知IDを再利用し、通知を積み上げない。
- 通知が拒否されている場合、結果を `storage.session` に一時保存してアクションバッジを `!` にし、ポップアップで確認するよう案内する。
- ページ上へのトーストや常駐content scriptは使用しない。

`navigator.clipboard.writeText()` はポップアップ上のユーザー操作から、追加権限なしで試す。失敗した場合は結果を選択状態にし、手動コピーを案内する。`clipboardWrite` は要求しない。

受入条件：

- コピーの成功・失敗を `aria-live` で通知する。
- コピー連打時も操作を並行実行せず、ボタンを処理開始時に無効化する。
- 通知は同時に複数表示されない。
- 通知拒否時も無反応にならず、バッジとポップアップに結果またはエラーが残る。

### 7. `selectionText` の改行欠落

本機能は段落構造を結果生成に使用しない。`info.selectionText` の改行が失われても、連結された複数日付を単一日付として解釈しないよう、次を必須とする。

- 正規化前後に複数日付候補を検出する。
- 空白や改行を消す前に完全一致可能性を評価する。
- 日付断片の連結を許可しない。
- `1989年1月7日` と `1989年1月8日` が段落をまたいで選択された場合は `MULTIPLE_DATES` とする。

`window.getSelection()` の再取得は採用しない。これには `scripting` またはページ注入が必要となり、制限ページで失敗し、最小権限を損なうためである。段落構造を必要としない仕様と、曖昧入力を拒否する解析によって対処する。

### 8. 対応できないページ

ページへの注入を行わないため、右クリックイベントで `selectionText` が提供されるページでは、iframe、open/closed Shadow DOM、PDF、`file:` を含めて同じ処理を試みる。ただし提供可否はChrome側の挙動に依存する。

- `chrome://`、Chrome Web Store等でメニューが表示されない場合：ポップアップは利用可能であり、入力欄付近に「このページでは右クリック変換を利用できません。選択内容をコピーして入力してください」と常時案内する。
- `file:`：追加のホストアクセスを要求せず、Chromeが選択イベントを渡す場合だけ動作する。
- PDF、iframe、Shadow DOM：選択文字列が渡された場合だけ動作する。取得できない場合にページ注入へフォールバックしない。
- クリックイベントを受けたのに選択文字列が空なら、エラー通知またはバッジを必ず出す。

Chromeがコンテキストメニュー自体を表示しない状況では拡張から通知できないため、ポップアップ内の事前案内をもって無反応対策とする。

### 9. シークレットモード

既定では無効とする。ユーザーがChromeの拡張設定で明示的に許可した場合のみ動作する。

- 入力・結果・履歴を `storage.local` または `storage.sync` に保存しない。
- 通知拒否時の一時結果だけを `storage.session` に保持する。
- シークレットの一時結果が通常プロファイルへ見えるかは実機確認し、分離を保証できなければシークレットでは一時保存せず、通知失敗をバッジだけで示す。

### 10. アクセシビリティ

- マウスなしで入力、方向選択、変換、結果選択、コピーまで完結する。
- 入力欄と方向切替に可視ラベルを付ける。
- 結果領域は `aria-live="polite"`、エラーは `role="alert"`。
- コピー完了は色だけで示さない。
- フォーカスリングを消さない。
- 読み上げ順を入力、方向、実行、エラー、結果、コピーの順にする。
- 処理中のボタンには `aria-disabled` またはネイティブの `disabled` を反映する。

### 11. 競合との差別化評価

| 候補 | 評価 | 採否 |
|---|---|---|
| 全角・元年・略号・ラベル・曜日への対応 | 「半角数字のみ」の競合との差は明確。ただし入力形式の多さだけでは模倣容易 | 採用 |
| 改元日の境界判定 | 変換精度の本質であり、年単位変換との違いが明確 | 中核として採用 |
| 元号期間外を明示エラー | 誤変換防止として強い。競合説明でも具体例を示せる | 中核として採用 |
| 明治5年以前を旧暦理由で拒否 | 正確性の根拠になるが利用者層は限定的 | 採用 |
| 未知の改元を推測しない | オフライン変換の弱点を明示的に安全側へ倒すため説得力が高い | 中核として採用 |
| 双方向であること | 既存にも双方向製品があり、単独では差別化にならない | 補助機能 |
| Salesforce特化 | 単一用途が別方向になり、本案の対象外 | 不採用 |
| ページ上の全日付自動変換 | 権限・誤検出・ページ改変が増え、daisyと競合する | 不採用 |

### 12. 年齢アプリとの公開方針

#### 選択肢1：両方をStoreに公開

- 単一用途の説明は、和暦アプリを「暦日変換」、年齢アプリを「年齢・年度計算」とすれば文章上は両立する。
- 一方、起動導線、日付入力、拡張内への結果表示が一致し、和暦変換コードとUIも相当程度重複する。
- ユーザーからは「同じ日付ツールを分割した製品」と認識される可能性が高い。
- 差別化を最大化しても審査結果を制御できず、アカウント全体への制裁リスクが残る。

結論：非推奨。

#### 選択肢2：和暦アプリのみStore公開

- Store上で単一用途の衝突が発生しない。
- ユーザーに提示される製品が1本なので別製品性を証明する必要がない。
- 今回の拘束要件である和暦変換を正面から公開できる。
- 年齢アプリはローカル利用を継続できる。

結論：**推奨**。

#### 選択肢3：将来統合を前提に和暦アプリを先行公開

- 先行期間は選択肢2と同程度に安全。
- 統合後に「暦日変換」と「年齢・年度計算」を併存させると、Storeの単一用途説明が長くなり、主用途がぼやける。
- 既存ユーザーには機能追加と認識され得るが、和暦だけを求めるユーザーには過剰機能となる。
- 将来の統合方針が確定していない段階で、データモデルやUIを統合向けに複雑化すべきではない。

結論：次善策だが、現時点の前提にはしない。

### 13. 改元への備え

元号定義は名前、略号、開始日を1ファイルだけに置き、終了日は次の元号の開始日から導出する。

さらに、元号データに次を持たせる。

```ts
type EraDatasetMetadata = Readonly<{
  schemaVersion: 1;
  verifiedThrough: PlainDate;
}>;
```

`verifiedThrough` を超える日付については最新元号を延長表示しない。結果の代わりに次を表示する。

> この日付は同梱された元号データの確認期限後です。改元情報を含む最新版へ更新してください。

外部通信をしない以上、未更新の拡張が改元発生を自動検知することは不可能である。そのため、無警告で `令和XX年` を返す設計は採らない。これは将来日付の利便性を下げるが、「誤った変換を無警告で返さない」という製品上の差別化を優先した判断である。

運用上は、改元の公表時に以下を行う。

1. 両リポジトリの `eras.ts` に新元号を追加する。
2. `EraId`、入力許可名・略号、境界テストを更新する。
3. `verifiedThrough` を更新する。
4. 両拡張をビルドする。
5. 和暦アプリをStoreへ公開する。
6. 年齢アプリを将来Store公開している場合は同時に更新する。

ソース上の元号定義修正は、コピー方式のため**2リポジトリ各1か所、計2か所**である。Store配布物はどの方式でも製品ごとの再ビルド・再審査が必要であり、共有npm化しても2製品のリリース作業は減らない。

## テスト戦略

- 単体テスト：
  - `PlainDate` の整数性、月末、うるう年100年・400年規則。
  - 明治・大正・昭和・平成・令和の全開始日前日／開始日。
  - `1989-01-07`、`1989-01-08`、`2019-04-30`、`2019-05-01`。
  - 元年表記と2年目への遷移。
  - 和暦→西暦→和暦の往復不変性。
  - `平成元年1月7日` 等の元号期間外。
  - 1873-01-01の前後。
  - 全角、略号、小文字略号、曜日、許可されたラベル・末尾語。
  - 年のみ、混在区切り、複数日付、連結日付、長文、存在しない日付。
  - `生年月日：1987年5月14日 登録日：2020年1月1日` が `MULTIPLE_DATES` になること。
  - コロンが複数ある場合や、ラベル内に数字がある場合に情報を捨てないこと。
  - 改行欠落を模した2日付の連結が単一日付として受理されないこと。
  - `verifiedThrough` 当日と翌日。翌日は令和を延長表示しないこと。
  - 元号配列の開始日昇順、名前・略号・IDの一意性、開始日重複なし。
  - `Date`、DOM、Chrome APIをドメイン層から参照していないこと。

- 統合テスト：
  - ポップアップ入力から結果表示、方向切替、エラー、コピー失敗時の案内までをDOM環境で検証する。
  - コンテキストメニュー登録の `removeAll → create` 順序を検証する。
  - 右クリック入力とポップアップ入力が同じパーサー・エラー辞書・変換関数を使うことを検証する。
  - 通知IDが固定で、連続操作時に既存通知を更新することを検証する。
  - イベントリスナーから開始したすべてのPromiseが `.catch()` で終端され、失敗が通知またはバッジへ変換されることを検証する。
  - 変換・コピー各ボタンをハンドラ冒頭で無効化し、二重実行しないことを検証する。
  - `storage.session` に置く一時結果のService Worker再起動後の復元と、ブラウザセッション終了相当での消失を検証する。
  - 未知の `schemaVersion` を空状態へ変換せず、既存値を上書きしないことを検証する。読み取り不能時も同様とする。
  - `storage.local`、`storage.sync` に入力・結果が書かれないことを検証する。
  - 通知権限が `denied` の場合にバッジと一時結果へフォールバックすることを検証する。
  - 一時UIはポップアップ内で単一のステータス領域を更新し、固定位置要素を追加生成しないことを検証する。

- E2Eテスト（必要な場合）：
  - 共通ベースライン13項目は再定義せず、以下の本機能固有シナリオだけを追加する。
  - 手動で未パック拡張を読み込んだテストプロファイルを事前準備し、ポップアップで `1989年1月7日` と `1989年1月8日` の境界結果を確認する。
  - 全角入力、`H元.1.8`、元号期間外、複数ラベル入力を確認する。
  - 通常ページで選択した西暦日付を右クリックし、通知結果を確認する。
  - 段落をまたぐ2日付選択が単一日付として変換されないことを確認する。
  - Service Workerを停止・再起動した後、右クリック変換と通知拒否時の一時結果復元を確認する。
  - `chrome://`、Chrome Web Store、`file:`、ブラウザ内PDF、iframe、Shadow DOMについて、メニュー表示と `selectionText` 提供可否を手動実測し、対応表へ記録する。
  - `chrome://extensions` からのインストール自動化は対象外とする。Playwrightは既にロード済みの拡張のポップアップと通常ページに限定し、Chrome内部ページ、OS通知、右クリックメニュー自体は手動確認とする。

- 実環境依存が強い場合、コア実装とテストハーネス構築の見積もりを分離する：
  - コア実装の見積もり時間：**14〜19時間**
    - 検証済みドメイン層の移植・本用途向け調整：2〜3時間
    - パーサーの複数ラベル対策・確認期限：3〜4時間
    - ポップアップ・アクセシビリティ・コピー：4〜5時間
    - Service Worker・メニュー・通知・sessionフォールバック：4〜5時間
    - manifest・ビルド・Store向け整理：1〜2時間
  - テストハーネス構築の見積もり時間：**8〜12時間**
    - TypeScript・Vitest・DOMテスト基盤：3〜4時間
    - Chrome APIモックとService Worker再起動ハーネス：3〜5時間
    - Playwright用の事前ロード済みプロファイルと手動試験票：2〜3時間

## 技術選定・実装方針

### 1. 検証済みコードの扱い

選択肢1「そのままコピー」を採用する。ただし無検討なフォークではなく、コピー元コミットを記録し、4ファイルと対応テストを移植した直後に差分ゼロを確認する。

| 選択肢 | 評価 |
|---|---|
| コピー | 検証済み実装を保ち、依存公開やパッケージ更新を不要にできる。改元時は2リポジトリを更新する必要がある |
| npm等へ共有化 | 元号定義のソースは1か所になるが、パッケージの公開、互換性、依存更新、供給元管理が増える。両拡張の再ビルド・再公開は依然必要 |
| 作り直し | 394行と152テストの検証資産を捨て、同じ境界不具合を再導入する可能性がある |

2製品だけの個人開発では、改元頻度に対して常設パッケージの運用費が大きい。したがってコピーを選ぶ。ただし、3製品目が同じ元号ドメインを使用する時点、または通常改修の横断反映漏れが1回発生した時点で共有パッケージ化を再検討する。

既存 `parse-date.ts` には報告された先頭ラベル問題への修正コメントが既に見えるが、本案ではテストを含めて独立に再確認する。特に「最初のコロン」を使うだけでは十分ではなく、除去前の複数候補検査を契約に加える。

### 2. アーキテクチャ

```text
src/
  manifest.json
  domain/
    plain-date.ts
    eras.ts
    era.ts
    parse-date.ts
    errors.ts
    convert.ts
  popup/
    popup.html
    popup.css
    popup.ts
  background/
    service-worker.ts
    context-menu.ts
    notifications.ts
  infrastructure/
    session-result.ts
  presentation/
    format-result.ts
    error-messages.ts
```

- `domain/` はChrome API、DOM、時計、ストレージに依存しない。
- `Date` と `Date.parse()` を暦日計算に使用しない。
- `convert()` は方向と入力を受け、型付きの成功・失敗を返す。
- ポップアップと右クリックは同じ `parseDateInput()`、`formatWareki()`、エラー辞書を使用する。
- HTML出力は `textContent` だけで行い、入力を `innerHTML` に渡さない。

### 3. Manifest V3と権限

要求する権限は次に限定する。

- `contextMenus`：選択テキストから変換を開始する。
- `notifications`：右クリック結果またはエラーを表示する。
- `storage`：通知拒否時の一時結果を `storage.session` に保持する。

要求しないもの：

- `host_permissions`
- `activeTab`
- `scripting`
- `tabs`
- `clipboardWrite`
- `webRequest`

content script、リモートコード、外部通信、動的コード評価は使用しない。依存ライブラリを使う場合もビルド成果物へ同梱する。

### 4. Service Worker再起動耐性と保存

Service Workerのメモリには次を保持しない。

- メニュー登録済みフラグ
- 最新結果
- 通知拒否状態
- 処理中ロックの永続状態

メニューは `runtime.onInstalled` で `removeAll()` 完了後に登録する。イベントリスナーはモジュール評価時に同期登録する。

`storage.session` は通知拒否時の最新結果1件だけに使用する。ブラウザ再起動後に残す必要がなく、個人情報になり得る入力を永続化しないためである。`storage.local` と `storage.sync` は使用しない。

一時結果には `schemaVersion`、状態種別、表示用結果またはエラーだけを保存する。未知のバージョンを検出した場合は空データに変換せず、書き込みを停止してポップアップに「一時データの形式が対応外」と表示する。ユーザーの「一時データを消去」操作またはブラウザセッション終了だけを復旧経路とする。

### 5. 非同期・連打・一時UI

- Chromeイベントから開始する非同期処理はすべて末尾に `.catch()` を持つ。
- `.catch()` 自体の通知失敗もログとバッジへ縮退させ、未処理rejectionを残さない。
- ポップアップの変換・コピーはハンドラ冒頭でボタンを無効化する。
- 右クリック処理には単調増加する要求IDをService Worker内で割り当て、同一Worker内では最後に開始された要求だけが通知を更新する。
- Worker再起動後も通知IDを固定することで通知の積み上がりを防ぐ。
- ポップアップの成功、エラー、コピー状態はそれぞれ既存の単一領域を更新し、DOMへ一時トーストを追加しない。

### 6. ビルド

TypeScriptと小規模なバンドラーを使用し、MV3で許可される静的JavaScriptへ出力する。ビルド後に次を機械検査する。

- リモートURLおよび動的コード評価がない。
- manifestで参照する全ファイルが存在する。
- 未使用権限、host permission、content scriptがない。
- ZIPにソースマップ、テスト、開発設定、`node_modules` を含めない。
- CSPを緩和していない。
- コピー元4ファイルの移植差分と、意図した変更点が記録されている。

## 不確実な点・前提

- 競合4本の具体的な境界日検証、元号期間検証、現在の更新状況はIntake記載以上には確認されていない。Store説明では「他製品は誤っている」と断定せず、本製品が保証する動作だけを具体例で示す。
- `verifiedThrough` 方式は正確性を最大化する一方、期限後の利用を止める。確認期限と更新頻度は実装前に運用可能な値へ決定する必要がある。外部通信禁止のまま、未知の改元発生だけを自動検知する方法はない。
- 明治元年の開始日データを保持していても、変換受付は一律 `1873-01-01` 以後とする前提である。歴史資料向け旧暦変換は別用途なので追加しない。
- `storage.session` のシークレット分離挙動、PDF・iframe・Shadow DOM・`file:` における `selectionText` 提供可否、通知権限拒否時のOS別挙動は実機確認が必要である。
- Chrome内部ページでコンテキストメニューが生成されない場合、クリック後のエラー通知は技術的に不可能である。常時表示されるポップアップ案内を代替とする。
- 最低対応Chromeバージョンは、`storage.session`、MV3 Service Worker、採用ビルド方式の対応状況を実装開始時に固定し、manifestとStore説明を一致させる。
- 年齢アプリをすでにStore公開済みのまま維持することが不可避である場合、推奨選択肢2は実行できない。その場合は、和暦アプリの公開前にデベロッパーアカウント単位の重複リスクを改めて判断し、公開延期または既存アプリの非公開化を選ぶべきである。
