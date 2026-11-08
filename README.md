<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/kuahr/.github/main/profile/dark.svg">
  <img src="https://raw.githubusercontent.com/kuahr/.github/main/profile/light.svg" alt="Kua" width="150">
</picture>

# Kua SDKs

[![SDK checks](https://github.com/kuahr/kua-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/kuahr/kua-sdk/actions/workflows/ci.yml)

Official Node.js/TypeScript and Python clients for the Kua company API.

- [Developer documentation](https://docs.kuahr.com)
- [Node.js setup](node/README.md) — npm package `@kuahr/node`
- [Python setup](python/README.md) — distribution `kuahr`, import `kua`
- [Report a client issue](https://github.com/kuahr/kua-sdk/issues)

## Start with sandbox

Choose the sandbox host explicitly and use a sandbox-issued Test key with the
task's least-privilege scopes. Begin with [your first read-only request](https://docs.kuahr.com/quickstart).
Test mode does not mirror every Live resource. Payroll approval/payment, salary
setup and general wallet execution are outside this public client contract.

## Install the SDKs

```bash
npm install @kuahr/node
python -m pip install kuahr
```

Python applications continue to use `import kua`. Both clients default to the
production host; select sandbox explicitly during integration.

This repository contains public client code, synthetic tests and examples only.

## Contributing

Open a focused SDK issue or pull request. Never include API keys, signing secrets,
bearer tokens, personal records or payment credentials. Report security concerns
privately to engineering@kuahr.com. Run the relevant client tests before submitting.

## Licence

MIT. See [LICENSE](LICENSE).
