# TRMNL Rebigulator Daily

A TRMNL Recipe, powered by a Cloudflare Worker, for the
[Rebigulator](https://rebigulator.org) daily challenge.

The plugin shows:

- The first screenshot from today's daily challenge.
- The quote attached to that frame.
- A QR code containing the episode key and title.

The Worker reproduces Rebigulator's UTC daily selection algorithm, then retrieves the selected
episode and screencap through Rebigulator's public API endpoints.

Successful daily responses use Cloudflare Workers Cache and expire at the next UTC midnight.
Errors are not cached.

## Development

```bash
yarn dev
```

## Validation

```bash
yarn types:check
yarn typecheck
yarn test
yarn lint
yarn build
```

## Deployment

```bash
yarn deploy
```

## TRMNL setup

See [recipe/README.md](./recipe/README.md).
