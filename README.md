# Calculator App

A polished React/Vite calculator with mouse and keyboard input, chained operations, decimal math, sign toggle, percent, backspace, and safe divide-by-zero handling.

## Local Development

Install dependencies:

```bash
npm ci
```

Start the Vite dev server:

```bash
npm run dev
```

Run lint checks:

```bash
npm run lint
```

Build the production bundle:

```bash
npm run build
```

## GitHub Pages

The Vite base path is configured for the repository path:

```txt
/calculator-app/
```

The included GitHub Actions workflow builds and deploys `dist` to GitHub Pages on every push to `main`.

Expected Pages URL:

```txt
https://mir827.github.io/calculator-app/
```
