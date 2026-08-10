# Testkube Initializer

A frontend-only React wizard that helps customers generate a Helm `values.yaml`
to deploy **Testkube** (OSS or Enterprise). The UI mirrors the visual style of
[testkube.io](https://testkube.io) (Nunito typography, purple/pink/yellow brand
palette).

## Stack

- Vite + React + TypeScript
- Tailwind CSS (brand tokens extracted from testkube.io)
- `yaml` for serialization

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build (output in dist/)
npm run preview  # preview the production build
```

## Docker

Build and run the production image (nginx serving the static `dist/` build):

```bash
docker build -t testkube-initializer:latest .
docker run --rm -p 8080:80 testkube-initializer:latest
```

Open http://localhost:8080

npm shortcuts:

```bash
npm run docker:build
npm run docker:run
```

## What it does

The wizard walks through 8 steps:

1. **Initial Config** — company, admin email, Kubernetes type, env type (OSS / Enterprise Prod / Lab), license, orgs & environments
2. **Core Components** — Dashboard, API, Worker Service, AI
3. **Database** — MongoDB / PostgreSQL, external vs in-cluster, connection source, resources
4. **Artifacts Store** — SeaweedFS / AWS S3 / MinIO, credentials source, resources
5. **NATS** — embedded vs external, JetStream, persistence
6. **Authentication** — Dex identity broker + connector (Enterprise)
7. **Endpoints** — domain, subdomain prefixes, Kubernetes Service vs Ingress, cert-manager
8. **Overview & Review** — live preview + **Export** of `values.yaml`

The selected **Env type** decides whether the output targets the OSS chart
(`testkube/testkube`) or the Enterprise chart (`testkube/testkube-enterprise`).

> Note: the generated values target Testkube **2.12.1** charts
> (OSS `testkube/testkube` 2.12.x, Enterprise `testkube-enterprise` 2.335.x).
> Review against your chart version before applying to production.
