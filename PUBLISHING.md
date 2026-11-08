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

Initial publication requires an authenticated npm owner of the package scope.
GitHub organisation ownership does not grant npm scope ownership. Confirm the
scope before changing the package name or any installation example.

Run `npm ci`, `npm run typecheck`, `npm run build`, `npm test`, `npm audit`, and
`npm pack --dry-run` in `node/`. Inspect the archive before publishing it with
`npm publish --access public`. Complete npm login/2FA in the owner's session;
never put credentials in Git or release evidence. After first publication,
configure a package-specific GitHub trusted publisher before enabling an npm
OIDC workflow. Verify a clean registry install and ESM, CommonJS and types.

Registry publication remains pending until actual package metadata and clean
registry installation have been verified. The source package version is 0.3.0.
