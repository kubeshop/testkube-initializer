export interface HelpLink {
  label: string;
  href: string;
}

export interface StepMeta {
  id: string;
  title: string;
  panelTitle: string;
  help: string[];
  links: HelpLink[];
}

const DOCS = "https://docs.testkube.io";

export const STEPS: StepMeta[] = [
  {
    id: "initial",
    title: "Initial Config",
    panelTitle: "Configuration Panel — Initial Config",
    help: [
      "Identify your installation and pick the deployment flavor.",
      "OSS runs the open-source chart; Enterprise (Prod/Lab) runs the control plane with licensing, SSO and multi-environment support.",
      "For online licenses Testkube validates the key against the licensing service; offline licenses are mounted from a Kubernetes secret.",
    ],
    links: [
      { label: "OSS vs Commercial", href: "https://testkube.io/open-source-vs-commercial" },
      { label: "Installation overview", href: `${DOCS}/articles/install/overview` },
    ],
  },
  {
    id: "core",
    title: "Core Components",
    panelTitle: "Configuration Panel — Core Components",
    help: [
      "Toggle which platform services get deployed.",
      "Dashboard is the web UI, API is the control-plane backend, Worker Service runs scheduled work, and AI enables failure analysis.",
    ],
    links: [{ label: "Architecture", href: `${DOCS}/articles/architecture` }],
  },
  {
    id: "database",
    title: "Database",
    panelTitle: "Configuration Panel — Database",
    help: [
      "Testkube stores results in MongoDB (default) or PostgreSQL.",
      "Use an external managed database in production, or let the chart deploy an in-cluster instance for labs.",
      "Connection strings can be auto-generated, set manually, or pulled from Vault.",
    ],
    links: [{ label: "Database configuration", href: `${DOCS}/articles/install/advanced-install` }],
  },
  {
    id: "artifacts",
    title: "Artifacts Store",
    panelTitle: "Configuration Panel — Artifacts Store",
    help: [
      "Logs and test artifacts are stored in S3-compatible object storage.",
      "Pick SeaweedFS or MinIO for in-cluster storage, or AWS S3 / external endpoint for managed storage.",
    ],
    links: [{ label: "Artifact storage", href: `${DOCS}/articles/artifacts` }],
  },
  {
    id: "nats",
    title: "NATS",
    panelTitle: "Configuration Panel — NATS",
    help: [
      "NATS is the messaging backbone used for event distribution between components.",
      "Run the bundled NATS (with JetStream persistence) or point Testkube to an external NATS cluster.",
    ],
    links: [{ label: "NATS / messaging", href: `${DOCS}/articles/architecture` }],
  },
  {
    id: "auth",
    title: "Authentication",
    panelTitle: "Configuration Panel — Authentication",
    help: [
      "Enterprise uses Dex as an identity broker in front of your IdP.",
      "Configure an OIDC / Google / GitHub / GitLab / LDAP connector and list the admin emails that get elevated access.",
    ],
    links: [{ label: "Authentication & SSO", href: `${DOCS}/articles/auth` }],
  },
  {
    id: "endpoints",
    title: "Endpoints",
    panelTitle: "Configuration Panel — Endpoints",
    help: [
      "Define the base domain and the subdomain prefixes used for each public endpoint.",
      "Use Kubernetes Services for in-cluster integration instead of Ingress, and enable cert-manager to automate TLS.",
    ],
    links: [
      { label: "Ingress & domains", href: `${DOCS}/articles/install/advanced-install` },
      { label: "cert-manager", href: "https://cert-manager.io/docs/" },
    ],
  },
  {
    id: "overview",
    title: "Overview & review",
    panelTitle: "Configuration Panel — Overview & Review",
    help: [
      "Review the generated values.yaml before exporting.",
      "Export downloads a ready-to-use file you can pass to `helm upgrade --install -f values.yaml`.",
    ],
    links: [{ label: "Helm install guide", href: `${DOCS}/articles/install/overview` }],
  },
];
