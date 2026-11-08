# Kua SDKs

Official Node.js/TypeScript and Python clients for the Kua company API.

- [Developer documentation](https://docs.kuahr.com)
- [Node.js setup](node/README.md) — source package `@kua/node`
- [Python setup](python/README.md) — distribution `kuahr`, import `kua`
- [Report a client issue](https://github.com/kuahr/kua-sdk/issues)

## Start with sandbox

Choose the sandbox host explicitly and use a sandbox-issued Test key with the
task's least-privilege scopes. Begin with [your first read-only request](https://docs.kuahr.com/quickstart).
Test mode does not mirror every Live resource. Payroll approval/payment, salary
setup and general wallet execution are outside this public client contract.

## Source availability

Source version 0.3.0 is available here. Registry publication is pending; follow
each client's source-install guide. This repository contains public client code,
synthetic tests and examples only. No private product source or prior internal
repository history is included.

## Contributing

Open a focused SDK issue or pull request. Never include API keys, signing secrets,
bearer tokens, personal records or payment credentials. Report security concerns
privately to engineering@kuahr.com. Run the relevant client tests before submitting.

## Licence

MIT. See [LICENSE](LICENSE).
