# Developer portfolio

A portfolio built as a stylized 3D mountain trail that leads to a bouldering
cave, where each climbing route is a project. See
[PORTFOLIO_PLAN.md](PORTFOLIO_PLAN.md) for the full concept.

The site currently shows a static teaser: the opening view of the trail,
closed off by a barrier and signpost while the rest is being built.

## Stack

- [Astro](https://astro.build) with TypeScript
- React with [React Three Fiber](https://r3f.docs.pmnd.rs/) and Drei for the 3D scene

## Commands

Requires Node 22.22 or newer and pnpm.

| Command | Action |
| --- | --- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start the dev server at `http://localhost:4321` |
| `pnpm check` | Type-check Astro and TypeScript files |
| `pnpm build` | Build the static site into `dist/` |
| `pnpm preview` | Serve the production build locally |

## Docker

The image builds the static site and serves it with an unprivileged nginx on
port 8080.

```sh
docker build -t dev-portfolio .
docker run --rm -p 8080:8080 dev-portfolio
```

To push an image for the cluster, build for the architectures your nodes run
(trim the list as needed):

```sh
docker buildx build --platform linux/amd64,linux/arm64 \
  -t <registry>/dev-portfolio:<tag> --push .
```

In Kubernetes, expose container port 8080 and point the liveness and readiness
probes at `/healthz`. The container runs as UID 101, so it works with
`runAsNonRoot: true`.

## Project structure

```text
public/fonts/            Sign font used by the 3D text (self-hosted)
src/config/site.ts       Name, tagline, contact links, and sign copy
src/layouts/             HTML shell, WebGL/JS detection
src/pages/index.astro    Teaser page: header, 3D scene, text fallback
src/components/scene/    Trail scene: terrain, trail, barrier, cave, lighting
src/styles/global.css    Palette, typography, CSS backdrop and fallback card
```

The closure sign text lives in `src/config/site.ts`. It is rendered in 3D and
as HTML, which is visually hidden while the scene renders and shown as a card
when JavaScript or WebGL is unavailable.
