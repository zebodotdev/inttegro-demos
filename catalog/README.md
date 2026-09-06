# Inttegro demo catalogue

This dependency-free catalogue is the source for the
`demos.inttegro.dev` experience. It reads generated `demos.json` metadata and
never embeds an API key or calls Inttegro directly.

Build the generated metadata and copied story artwork from the repository root:

```sh
node scripts/build-catalog.mjs
```

Then serve `catalog/public` with any static server. Deploying with Wrangler uses
the checked-in static-assets configuration:

```sh
npx wrangler deploy --config catalog/wrangler.jsonc
```

The custom domain is intentionally absent from the reader-facing Wrangler
configuration. Inttegro release operations attach `demos.inttegro.dev` with
Wrangler's `--domain` option; a reader's clone remains host-neutral.
