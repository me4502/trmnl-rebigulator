# Setup in TRMNL dashboard

Use the Recipe **Polling** strategy.

## Polling URL

```txt
https://trmnl-rebigulator.maddy.tech/api/daily
```

If you are deploying this yourself, replace the hostname with your own Worker URL.

No polling headers are required. The endpoint follows the same UTC date and first-round selection
logic as the Rebigulator daily game.

## Returned JSON shape

```json
{
  "ok": true,
  "date": "2026-07-24",
  "imageUrl": "https://frinkiac.com/img/S11E16/123456.jpg",
  "quote": "A quote from the selected scene.",
  "answer": "S11E16 - Pygmoelian",
  "playUrl": "https://rebigulator.org/daily/game",
  "generatedAt": "2026-07-24T12:00:00.000Z"
}
```

The Liquid templates render `answer` only through TRMNL's `qr_code` filter, so the episode remains
hidden until someone scans it.
