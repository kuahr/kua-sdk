# SDK releases

The public release source is `kuahr/kua-sdk`, branch `main`. Never attach
internal source, database backups, customer records or credentials to releases.

## Python

Create a PyPI account with a verified email and 2FA. In account Publishing,
register a pending GitHub publisher with project `kuahr`, owner `kuahr`,
repository `kua-sdk`, workflow `publish-python.yml`, environment `pypi`.
This binding permits that GitHub environment to publish the project without a
long-lived PyPI token. The GitHub environment is limited to `main`.

Dispatch **Publish Python SDK** on `main` with the exact pyproject version.
The build job tests and checks the wheel and source archive; the publish job
uploads that immutable artifact. A pre-existing version is an error; never
replace or delete published releases to retry. Verify registry metadata and a
fresh `pip install kuahr==VERSION`, followed by `import kua`.

## Node

The published package is `@kuahr/node`; the owner is npm account `kuahr`.
The initial 0.3.1 release used the owner's authenticated CLI and 2FA.

The npm package's approved GitHub trusted publisher is configured with owner `kuahr`,
repository `kua-sdk`, workflow `publish-node.yml`, environment `npm` and direct
publishing permission. The GitHub environment is restricted to branch `main`.
Dispatch **Publish Node SDK** with the exact package version for future releases.
The workflow checks the name/version, builds, tests, audits and packs before
publishing that archive with OIDC provenance. No npm token is stored on GitHub.
Do not dispatch an already published version or rewrite release tags.

Verify registry integrity against the inspected archive, a clean registry
installation, ESM/CommonJS exports and TypeScript declarations. Python uses
`kuahr` with `import kua`. Both registries have verified 0.3.1 releases. Version 0.3.2 adds product links/contact branding and validates the npm OIDC connection with a real release.
Manual npm publishing requires 2FA without bypass tokens.
