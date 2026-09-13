# src/styles

`app-kit.css` is the kit's stylesheet: the design tokens (`:root` light,
`.dark` dark), the font, the `html` defaults and the motion keyframes. It is
copied into `dist/` by tsup's `publicDir` and exported as
`@robomotion/app-kit/styles.css`, which the app template imports first from
`src/index.css`.

`tokens.generated.ts` is generated from it by `scripts/gen-tokens.ts` (run by
`bun run build`) and holds everything between the `@tokens` markers, minus
the `@font-face`. `ensureTokens()` injects that string at run time when the
page has no `--rm-kit`, so an app scaffolded before 0.5 (whose `index.css`
never imports this file) still paints under the new kit. A test asserts the
two are in step; never edit the generated file by hand.

## fonts/

`InterVariable-latin-ext.woff2` is Inter 4.1 (`InterVariable.woff2` from the
release zip, `opsz` and `wght` axes kept), subset with `pyftsubset` to Latin,
Latin Extended and the punctuation and currency ranges an app in Turkish,
German, Polish or Portuguese needs; 224 KB. Licence: SIL Open Font License
1.1, in `LICENSE-Inter.txt`. The `@font-face` uses a relative `url()`, so
Vite hashes the file under `assets/` and serves it from the app's own origin,
which is what keeps it working air-gapped and behind a cross-origin preview.

To rebuild the subset:

```bash
uv venv .venv-fonts && . .venv-fonts/bin/activate && uv pip install fonttools brotli
pyftsubset InterVariable.woff2 --unicodes="U+0000-00FF,U+0100-024F,U+0259,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" --layout-features='*' --flavor=woff2 --output-file=InterVariable-latin-ext.woff2
```
