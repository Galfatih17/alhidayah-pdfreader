<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The installable offline shell uses vite-plugin-pwa generateSW and a single guarded registration wrapper; preview/dev unregister app workers to avoid stale pages.
- PDF binaries live in IndexedDB and the reader opens local Blob URLs only after a full download; app-shell caching excludes private document URLs.
- The reader uses a full-viewport stage with an overlay header and collapsible bottom controls, so document space stays available when controls are closed.
