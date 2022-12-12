# Cloudflare Workers Manifest Template

Cloudflare Workers のマニフェストを管理するテンプレート

## setup project

- 必要ツール
  - nodejs 環境
  - yarn

## .env の設定

`CLOUDFLAER_API_TOKEN` キーに API トークンを設定します。

## Worker の生成

### Worker テンプレートの生成

以下のコマンドで `./manifests/my-worker` 内にテンプレートが生成されます。

```zsh
❯ yarn generate --name my-worker
```

`./manifests/my-worker/src` を適宜実装してください。

### デプロイ

以下のコマンドで `./manifests/my-worker` 内のマニフェストがデプロイされます。

```zsh
❯ yarn deploy --name my-worker
```
