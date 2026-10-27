# Hush Landing Page v2 Swap Procedure

> [!IMPORTANT]
> DO NOT perform this swap until v2 has received final approval. Follow this exact runbook to transition v2 into the primary root landing page (`index.html`) while preserving v1 as `classic.html`.

---

## 1. Pre-Swap Checks
1. Ensure your git working tree on `landing-v2` is clean:
   ```bash
   git status --porcelain
   ```
2. Verify that `main` is up to date:
   ```bash
   git fetch origin main
   ```

---

## 2. Step-by-Step Swap Commands

### Step 2.1: Archive Current v1 to `classic.html`
```bash
# Rename root index.html to classic.html
git mv index.html classic.html
```

### Step 2.2: Promote `v2.html` to `index.html`
```bash
# Rename root v2.html to index.html
git mv v2.html index.html
```

### Step 2.3: Update `vite.config.ts` Rollup Inputs
Update `build.rollupOptions.input` in `vite.config.ts` so `index.html` references the new landing page and `classic.html` preserves the old page:
```typescript
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        classic: path.resolve(import.meta.dirname, 'classic.html'),
      },
    },
  },
  // ...
});
```

### Step 2.4: Update Internal Navigation Links & Relative Assets
1. In `src/v2/data/copy.v2.ts` and `src/v2/features/footer/Footer.tsx`:
   - Add a link to `classic.html` under "QUICK LINKS" or footer:
     `{ label: 'Classic Version', href: './classic.html' }`
2. In `index.html` (formerly `v2.html`):
   - Update Open Graph and Twitter canonical meta tags from `/v2.html` to `/`.
   - Update script src tag: `<script type="module" src="/src/v2/main.tsx"></script>` is already correct.

---

## 3. Build & Pages Path Verification
1. Run local build and typecheck:
   ```bash
   npm run build
   npx tsc --noEmit
   ```
2. Verify production build output in `dist/`:
   - `dist/index.html` (new v2 experience)
   - `dist/classic.html` (original v1 experience)
   - `dist/assets/*`
3. Run local preview to test all anchor links, replays, and video assets:
   ```bash
   npm run preview
   ```
   Open:
   - `http://localhost:4173/` -> renders v2
   - `http://localhost:4173/classic.html` -> renders v1

---

## 4. Single-Commit Release
Commit the swap in a single atomic commit:
```bash
git add index.html classic.html vite.config.ts src/v2/
git commit -m "Promote landing v2 to index.html and archive v1 to classic.html"
```

---

## 5. One-Commit Rollback Strategy
If any unforeseen issue occurs in production, revert the swap commit instantly with git:
```bash
# Revert the swap commit cleanly
git revert HEAD --no-edit
npm run build
git push origin <branch>
```
This restores `index.html` to v1 and `v2.html` to v2 within seconds without data loss or manual edits.
