import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Github, QrCode, Webhook, Image as ImageIcon, Activity, KeyRound, MessageSquare, Shield, Zap, Server, Code2, Check } from "lucide-react";
import CodeBlock from "@/components/landing/CodeBlock";
import Section from "@/components/landing/Section";

/* ---------- Code samples ---------- */

const HeroNode = (
  <CodeBlock
    language="node"
    filename="send.js"
    code={`import axios from "axios";

await axios.post(
  "https://api.whatsbridge.dev/v1/send-message",
  {
    session_id: "ses_8f3a21",
    to: "+14155551234",
    type: "text",
    text: "Your order #A1029 has shipped."
  },
  { headers: { Authorization: "Bearer wb_live_8f3a..." } }
);`}
  >
    <span className="tok-key">import</span> axios <span className="tok-key">from</span> <span className="tok-str">"axios"</span>;{"\n\n"}
    <span className="tok-key">await</span> axios.<span className="tok-fn">post</span>({"\n"}
    {"  "}<span className="tok-str">"https://api.whatsbridge.dev/v1/send-message"</span>,{"\n"}
    {"  "}{"{"}{"\n"}
    {"    "}session_id: <span className="tok-str">"ses_8f3a21"</span>,{"\n"}
    {"    "}to: <span className="tok-str">"+14155551234"</span>,{"\n"}
    {"    "}type: <span className="tok-str">"text"</span>,{"\n"}
    {"    "}text: <span className="tok-str">"Your order #A1029 has shipped."</span>{"\n"}
    {"  "}{"}"},{"\n"}
    {"  "}{"{"} headers: {"{"} Authorization: <span className="tok-str">"Bearer wb_live_8f3a..."</span> {"}"} {"}"}{"\n"}
    );
  </CodeBlock>
);

const PythonExample = (
  <CodeBlock
    language="python"
    filename="send.py"
    code={`import requests

requests.post(
    "https://api.whatsbridge.dev/v1/send-message",
    headers={"Authorization": "Bearer wb_live_8f3a..."},
    json={
        "session_id": "ses_8f3a21",
        "to": "+14155551234",
        "type": "text",
        "text": "Hello from Python."
    },
)`}
  >
    <span className="tok-key">import</span> requests{"\n\n"}
    requests.<span className="tok-fn">post</span>({"\n"}
    {"    "}<span className="tok-str">"https://api.whatsbridge.dev/v1/send-message"</span>,{"\n"}
    {"    "}headers={"{"}<span className="tok-str">"Authorization"</span>: <span className="tok-str">"Bearer wb_live_8f3a..."</span>{"}"},{"\n"}
    {"    "}json={"{"}{"\n"}
    {"        "}<span className="tok-str">"session_id"</span>: <span className="tok-str">"ses_8f3a21"</span>,{"\n"}
    {"        "}<span className="tok-str">"to"</span>: <span className="tok-str">"+14155551234"</span>,{"\n"}
    {"        "}<span className="tok-str">"type"</span>: <span className="tok-str">"text"</span>,{"\n"}
    {"        "}<span className="tok-str">"text"</span>: <span className="tok-str">"Hello from Python."</span>,{"\n"}
    {"    "}{"}"},{"\n"}
    )
  </CodeBlock>
);

const CurlExample = (
  <CodeBlock
    language="bash"
    filename="send.sh"
    code={`curl -X POST https://api.whatsbridge.dev/v1/send-message \\
  -H "Authorization: Bearer wb_live_8f3a..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "ses_8f3a21",
    "to": "+14155551234",
    "type": "text",
    "text": "Hello from cURL."
  }'`}
  >
    <span className="tok-fn">curl</span> -X POST https://api.whatsbridge.dev/v1/send-message \{"\n"}
    {"  "}-H <span className="tok-str">"Authorization: Bearer wb_live_8f3a..."</span> \{"\n"}
    {"  "}-H <span className="tok-str">"Content-Type: application/json"</span> \{"\n"}
    {"  "}-d <span className="tok-str">{`'{`}</span>{"\n"}
    <span className="tok-str">{`    "session_id": "ses_8f3a21",`}</span>{"\n"}
    <span className="tok-str">{`    "to": "+14155551234",`}</span>{"\n"}
    <span className="tok-str">{`    "type": "text",`}</span>{"\n"}
    <span className="tok-str">{`    "text": "Hello from cURL."`}</span>{"\n"}
    <span className="tok-str">{`  }'`}</span>
  </CodeBlock>
);

const NodeExample = (
  <CodeBlock
    language="node"
    filename="send.mjs"
    code={`const res = await fetch("https://api.whatsbridge.dev/v1/send-message", {
  method: "POST",
  headers: {
    "Authorization": "Bearer wb_live_8f3a...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    session_id: "ses_8f3a21",
    to: "+14155551234",
    type: "text",
    text: "Hello from fetch."
  })
});

const data = await res.json();
console.log(data.id);`}
  >
    <span className="tok-key">const</span> res = <span className="tok-key">await</span> <span className="tok-fn">fetch</span>(<span className="tok-str">"https://api.whatsbridge.dev/v1/send-message"</span>, {"{"}{"\n"}
    {"  "}method: <span className="tok-str">"POST"</span>,{"\n"}
    {"  "}headers: {"{"}{"\n"}
    {"    "}<span className="tok-str">"Authorization"</span>: <span className="tok-str">"Bearer wb_live_8f3a..."</span>,{"\n"}
    {"    "}<span className="tok-str">"Content-Type"</span>: <span className="tok-str">"application/json"</span>{"\n"}
    {"  "}{"}"},{"\n"}
    {"  "}body: JSON.<span className="tok-fn">stringify</span>({"{"}{"\n"}
    {"    "}session_id: <span className="tok-str">"ses_8f3a21"</span>,{"\n"}
    {"    "}to: <span className="tok-str">"+14155551234"</span>,{"\n"}
    {"    "}type: <span className="tok-str">"text"</span>,{"\n"}
    {"    "}text: <span className="tok-str">"Hello from fetch."</span>{"\n"}
    {"  "}{"}"}){"\n"}
    {"}"});{"\n\n"}
    <span className="tok-key">const</span> data = <span className="tok-key">await</span> res.<span className="tok-fn">json</span>();{"\n"}
    console.<span className="tok-fn">log</span>(data.id);
  </CodeBlock>
);

const ResponseExample = (
  <CodeBlock
    language="json"
    filename="200 OK"
    code={`{
  "id": "msg_01HZ7K8X2P3QF9V4WJ6N1Y0RBE",
  "session_id": "ses_8f3a21",
  "to": "+14155551234",
  "type": "text",
  "status": "queued",
  "created_at": "2025-04-27T10:24:11Z"
}`}
  >
    {"{"}{"\n"}
    {"  "}<span className="tok-str">"id"</span>: <span className="tok-str">"msg_01HZ7K8X2P3QF9V4WJ6N1Y0RBE"</span>,{"\n"}
    {"  "}<span className="tok-str">"session_id"</span>: <span className="tok-str">"ses_8f3a21"</span>,{"\n"}
    {"  "}<span className="tok-str">"to"</span>: <span className="tok-str">"+14155551234"</span>,{"\n"}
    {"  "}<span className="tok-str">"type"</span>: <span className="tok-str">"text"</span>,{"\n"}
    {"  "}<span className="tok-str">"status"</span>: <span className="tok-str">"queued"</span>,{"\n"}
    {"  "}<span className="tok-str">"created_at"</span>: <span className="tok-str">"2025-04-27T10:24:11Z"</span>{"\n"}
    {"}"}
  </CodeBlock>
);

const MessagesResponse = (
  <CodeBlock
    language="json"
    filename="GET /v1/messages"
    code={`{
  "data": [
    {
      "id": "msg_01HZ7K8X2P3QF9V4WJ6N1Y0RBE",
      "session_id": "ses_8f3a21",
      "from": "+14155551234",
      "type": "text",
      "text": "Order received, thanks!",
      "received_at": "2025-04-27T10:25:02Z"
    }
  ],
  "next_cursor": null
}`}
  >
    {"{"}{"\n"}
    {"  "}<span className="tok-str">"data"</span>: [{"\n"}
    {"    "}{"{"}{"\n"}
    {"      "}<span className="tok-str">"id"</span>: <span className="tok-str">"msg_01HZ7K8X2P3QF9V4WJ6N1Y0RBE"</span>,{"\n"}
    {"      "}<span className="tok-str">"session_id"</span>: <span className="tok-str">"ses_8f3a21"</span>,{"\n"}
    {"      "}<span className="tok-str">"from"</span>: <span className="tok-str">"+14155551234"</span>,{"\n"}
    {"      "}<span className="tok-str">"type"</span>: <span className="tok-str">"text"</span>,{"\n"}
    {"      "}<span className="tok-str">"text"</span>: <span className="tok-str">"Order received, thanks!"</span>,{"\n"}
    {"      "}<span className="tok-str">"received_at"</span>: <span className="tok-str">"2025-04-27T10:25:02Z"</span>{"\n"}
    {"    "}{"}"}{"\n"}
    {"  "}],{"\n"}
    {"  "}<span className="tok-str">"next_cursor"</span>: <span className="tok-key">null</span>{"\n"}
    {"}"}
  </CodeBlock>
);

const QuickstartCode = (
  <CodeBlock
    language="bash"
    filename="first-request.sh"
    code={`curl https://api.whatsbridge.dev/v1/send-message \\
  -H "Authorization: Bearer $WB_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "session_id": "ses_8f3a21", "to": "+14155551234", "type": "text", "text": "It works." }'`}
  >
    <span className="tok-fn">curl</span> https://api.whatsbridge.dev/v1/send-message \{"\n"}
    {"  "}-H <span className="tok-str">"Authorization: Bearer $WB_API_KEY"</span> \{"\n"}
    {"  "}-H <span className="tok-str">"Content-Type: application/json"</span> \{"\n"}
    {"  "}-d <span className="tok-str">{`'{ "session_id": "ses_8f3a21", "to": "+14155551234", "type": "text", "text": "It works." }'`}</span>
  </CodeBlock>
);

const WebhookEvent = (
  <CodeBlock
    language="json"
    filename="POST https://your-app.com/hooks/whatsbridge"
    code={`{
  "event": "message.received",
  "id": "evt_01HZ7M2D9KQX4F8N",
  "session_id": "ses_8f3a21",
  "message": {
    "id": "msg_01HZ7K8X2P3QF9V4WJ6N1Y0RBE",
    "from": "+14155551234",
    "type": "text",
    "text": "Order received, thanks!",
    "received_at": "2025-04-27T10:25:02Z"
  },
  "signature": "sha256=8b2f3a..."
}`}
  >
    {"{"}{"\n"}
    {"  "}<span className="tok-str">"event"</span>: <span className="tok-str">"message.received"</span>,{"\n"}
    {"  "}<span className="tok-str">"id"</span>: <span className="tok-str">"evt_01HZ7M2D9KQX4F8N"</span>,{"\n"}
    {"  "}<span className="tok-str">"session_id"</span>: <span className="tok-str">"ses_8f3a21"</span>,{"\n"}
    {"  "}<span className="tok-str">"message"</span>: {"{"}{"\n"}
    {"    "}<span className="tok-str">"id"</span>: <span className="tok-str">"msg_01HZ7K8X2P3QF9V4WJ6N1Y0RBE"</span>,{"\n"}
    {"    "}<span className="tok-str">"from"</span>: <span className="tok-str">"+14155551234"</span>,{"\n"}
    {"    "}<span className="tok-str">"type"</span>: <span className="tok-str">"text"</span>,{"\n"}
    {"    "}<span className="tok-str">"text"</span>: <span className="tok-str">"Order received, thanks!"</span>,{"\n"}
    {"    "}<span className="tok-str">"received_at"</span>: <span className="tok-str">"2025-04-27T10:25:02Z"</span>{"\n"}
    {"  "}{"}"},{"\n"}
    {"  "}<span className="tok-str">"signature"</span>: <span className="tok-str">"sha256=8b2f3a..."</span>{"\n"}
    {"}"}
  </CodeBlock>
);

/* ---------- Tabs ---------- */

const tabs = [
  { id: "node", label: "Node.js", content: NodeExample },
  { id: "python", label: "Python", content: PythonExample },
  { id: "curl", label: "cURL", content: CurlExample },
] as const;

/* ---------- Page ---------- */

const Index = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("node");
  const active = tabs.find((t) => t.id === activeTab)!;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://whatsbridge.dev/#org",
        name: "WhatsBridge",
        url: "https://whatsbridge.dev/",
        logo: "https://whatsbridge.dev/logo.png",
        sameAs: ["https://github.com/whatsbridge"],
      },
      {
        "@type": "WebSite",
        "@id": "https://whatsbridge.dev/#website",
        url: "https://whatsbridge.dev/",
        name: "WhatsBridge",
        publisher: { "@id": "https://whatsbridge.dev/#org" },
      },
      {
        "@type": "SoftwareApplication",
        name: "WhatsBridge",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web, Linux, macOS, Windows",
        description:
          "REST API that turns your phone into a WhatsApp messaging endpoint. Send and receive messages, register webhooks, handle media.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "126",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Do I need to keep my phone online?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. The session is bridged through your linked device, so the phone needs network and battery. Most teams use a dedicated low-cost handset.",
            },
          },
          {
            "@type": "Question",
            name: "What happens if the device disconnects?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "We emit a session.disconnected webhook and queue outbound messages for up to 30 minutes. Reconnect and queued messages are flushed in order.",
            },
          },
          {
            "@type": "Question",
            name: "Is this an official WhatsApp integration?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. WhatsBridge is an unofficial bridge built for developers. For high-volume regulated traffic you should evaluate an official Business API provider.",
            },
          },
          {
            "@type": "Question",
            name: "Where is data stored?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Message metadata is stored in EU (Frankfurt) by default. Message bodies are retained for 7 days unless you opt into longer retention.",
            },
          },
          {
            "@type": "Question",
            name: "Can I self-host WhatsBridge?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Business plans include a self-hosted runtime distributed as a Docker image. Contact sales for the license.",
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>WhatsBridge — WhatsApp Messaging API for Developers</title>
        <meta
          name="description"
          content="Turn your phone into a WhatsApp messaging REST API. Scan a QR, get an API key, send and receive messages with webhooks. Free developer tier."
        />
        <link rel="canonical" href="https://whatsbridge.dev/" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <a href="#" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
            </span>
            WhatsBridge
            <span className="ml-1 rounded-lg border border-border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              v1
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#examples" className="hover:text-foreground transition-colors">Examples</a>
            <a href="#api" className="hover:text-foreground transition-colors">API</a>
            <a href="#quickstart" className="hover:text-foreground transition-colors">Quickstart</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-foreground transition-colors">Docs</a>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="hidden h-8 items-center rounded-lg border border-border px-3 text-sm text-foreground hover:bg-secondary transition-colors sm:inline-flex"
            >
              Sign in
            </a>
            <a
              href="#quickstart"
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get API Access
            </a>
          </div>
        </div>
      </header>

      <main>
      {/* HERO */}
      <section className="border-b border-border" aria-labelledby="hero-heading">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              REST API · v1.4 · 99.97% uptime
            </div>
            <h1 id="hero-heading" className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl lg:leading-[1.05]">
              Turn your phone into a WhatsApp messaging API.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Scan a QR code to link your device, then send and receive messages over a stable
              REST API. No SDK required. No third-party gateway.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#quickstart"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Get API Access
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#docs"
                className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                View Docs
              </a>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6 text-sm">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Latency</dt>
                <dd className="mt-1 font-medium text-foreground">~120 ms p50</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Endpoints</dt>
                <dd className="mt-1 font-medium text-foreground">12 stable</dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Webhooks</dt>
                <dd className="mt-1 font-medium text-foreground">Signed, retried</dd>
              </div>
            </dl>
          </div>
          <div className="lg:col-span-6">{HeroNode}</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Section
        id="how"
        eyebrow="01 · How it works"
        title="Three steps to a working session."
        description="Connection is local to your account. Sessions persist across restarts."
      >
        <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {[
            {
              icon: <QrCode className="h-4 w-4" />,
              n: "01",
              t: "Scan the QR",
              d: "Open the dashboard, scan the QR with your phone’s linked-devices screen.",
            },
            {
              icon: <Activity className="h-4 w-4" />,
              n: "02",
              t: "Session established",
              d: "Your device pairs to a persistent server session in under five seconds.",
            },
            {
              icon: <KeyRound className="h-4 w-4" />,
              n: "03",
              t: "Use your API key",
              d: "Send and receive messages over HTTPS using a Bearer token.",
            },
          ].map((s) => (
            <li key={s.n} className="bg-background p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-foreground">
                  {s.icon}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* CODE EXAMPLES */}
      <Section
        id="examples"
        eyebrow="02 · Code examples"
        title="Send a message in any language."
        description="Same endpoint, same Bearer token. Use whatever HTTP client you already have."
      >
        <div className="rounded-lg border border-border">
          <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium font-mono transition-colors ${
                  activeTab === t.id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-3">{active.content}</div>
        </div>
        <div className="mt-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Response
          </div>
          {ResponseExample}
        </div>
      </Section>

      {/* FEATURES */}
      <Section
        id="features"
        eyebrow="03 · Features"
        title="What’s in the box."
      >
        <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {[
            { icon: <Activity className="h-4 w-4" />, t: "Persistent session", d: "Pair once. Sessions survive restarts and reconnects." },
            { icon: <MessageSquare className="h-4 w-4" />, t: "Real-time messages", d: "Inbound events delivered as they arrive, in order." },
            { icon: <Webhook className="h-4 w-4" />, t: "Signed webhooks", d: "HMAC signatures, automatic retries with backoff." },
            { icon: <ImageIcon className="h-4 w-4" />, t: "Media support", d: "Send images, audio, video, and documents up to 100 MB." },
            { icon: <KeyRound className="h-4 w-4" />, t: "Predictable responses", d: "Stable JSON schema, typed errors, machine-readable codes." },
            { icon: <QrCode className="h-4 w-4" />, t: "Local pairing", d: "QR pairing happens between your dashboard and your device." },
          ].map((f) => (
            <li key={f.t} className="bg-background p-5">
              <div className="flex items-center gap-2 text-foreground">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-border">
                  {f.icon}
                </span>
                <h3 className="text-sm font-semibold">{f.t}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* API OVERVIEW */}
      <Section
        id="api"
        eyebrow="04 · API"
        title="A small, predictable surface."
        description="Twelve endpoints. JSON in, JSON out. Authenticated with a Bearer token."
      >
        <div className="space-y-3">
          {[
            { method: "POST", path: "/v1/send-message", desc: "Send a text or media message." },
            { method: "GET",  path: "/v1/messages",     desc: "List inbound messages, paginated." },
            { method: "POST", path: "/v1/webhook",      desc: "Register or update a webhook URL." },
          ].map((e) => (
            <div
              key={e.path}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3"
            >
              <div className="flex items-center gap-3 font-mono text-sm">
                <span
                  className={`inline-flex h-6 items-center rounded-lg px-2 text-[11px] font-semibold ${
                    e.method === "POST"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-foreground"
                  }`}
                >
                  {e.method}
                </span>
                <span className="text-foreground">{e.path}</span>
              </div>
              <span className="hidden text-sm text-muted-foreground sm:block">{e.desc}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Request
            </div>
            {CurlExample}
          </div>
          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              GET /v1/messages
            </div>
            {MessagesResponse}
          </div>
        </div>
      </Section>

      {/* WEBHOOKS */}
      <Section
        id="webhooks"
        eyebrow="05 · Webhooks"
        title="Inbound events, signed and retried."
        description="Register a URL once. We POST every inbound message and status change with an HMAC signature. Failures retry with exponential backoff for up to 24 hours."
      >
        {WebhookEvent}
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            "message.received",
            "message.delivered",
            "message.read",
            "session.disconnected",
          ].map((evt) => (
            <li
              key={evt}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {evt}
            </li>
          ))}
        </ul>
      </Section>

      {/* SDKs */}
      <Section
        id="sdks"
        eyebrow="06 · SDKs"
        title="Use a client, or don’t."
        description="Official clients are thin wrappers over the REST API. The HTTP surface is small enough that a fetch call is fine."
      >
        <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {[
            { lang: "Node.js", install: "npm i @whatsbridge/node", v: "1.4.0" },
            { lang: "Python",  install: "pip install whatsbridge",  v: "1.3.2" },
            { lang: "Go",      install: "go get github.com/whatsbridge/go", v: "0.9.1" },
            { lang: "Ruby",    install: "gem install whatsbridge",  v: "0.7.0" },
          ].map((s) => (
            <li key={s.lang} className="bg-background p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground">
                  <Code2 className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">{s.lang}</h3>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">v{s.v}</span>
              </div>
              <code className="mt-3 block rounded-lg bg-secondary px-2.5 py-1.5 font-mono text-xs text-foreground">
                {s.install}
              </code>
            </li>
          ))}
        </ul>
      </Section>

      {/* USE CASES */}
      <Section
        id="use-cases"
        eyebrow="07 · Use cases"
        title="Built for real workloads."
      >
        <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {[
            { t: "Customer support automation", d: "Route inbound messages to agents or LLMs and reply from your stack." },
            { t: "OTP & transactional alerts",  d: "Deliver one-time codes, order updates, and system notifications." },
            { t: "Chatbots",                    d: "Wire any LLM or rules engine to a real, two-way messaging channel." },
            { t: "CRM integrations",            d: "Sync conversations into HubSpot, Salesforce, or your own database." },
          ].map((u) => (
            <li key={u.t} className="bg-background p-5">
              <h3 className="text-sm font-semibold text-foreground">{u.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{u.d}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* RELIABILITY */}
      <Section
        id="reliability"
        eyebrow="08 · Reliability"
        title="Boring infrastructure, on purpose."
        description="No magic. Just well-monitored servers, signed webhooks, and predictable failure modes."
      >
        <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {[
            { icon: <Server className="h-4 w-4" />, t: "99.97% uptime", d: "Tracked publicly on the status page over the last 90 days." },
            { icon: <Zap className="h-4 w-4" />,    t: "~120 ms p50",   d: "Median round-trip from API ingress to device dispatch." },
            { icon: <Shield className="h-4 w-4" />, t: "HMAC + TLS 1.3", d: "Every webhook signed. Every connection encrypted in transit." },
          ].map((r) => (
            <li key={r.t} className="bg-background p-5">
              <div className="flex items-center gap-2 text-foreground">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-border">
                  {r.icon}
                </span>
                <h3 className="text-sm font-semibold">{r.t}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.d}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* QUICKSTART */}
      <Section
        id="quickstart"
        eyebrow="09 · Quickstart"
        title="From zero to first message."
        description="Four steps. About two minutes if your phone is nearby."
      >
        <ol className="space-y-4">
          {[
            { n: "01", t: "Sign up",      d: "Create an account. No credit card required for the dev tier." },
            { n: "02", t: "Scan the QR",  d: "Pair your device from the dashboard. Pairing is one-shot." },
            { n: "03", t: "Copy your key", d: "Generate an API key and store it as WB_API_KEY in your env." },
            { n: "04", t: "Send a request", d: "Hit /v1/send-message. You should see a 200 with a message id." },
          ].map((s) => (
            <li
              key={s.n}
              className="flex gap-4 rounded-lg border border-border bg-background p-4"
            >
              <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{s.t}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6">{QuickstartCode}</div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="#"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Create an account
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#docs"
            className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Read the full reference
          </a>
        </div>
      </Section>

      {/* PRICING */}
      <Section
        id="pricing"
        eyebrow="10 · Pricing"
        title="Simple, usage-based."
        description="Start free. Scale linearly. No seat fees, no per-feature add-ons."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: "Developer",
              price: "$0",
              tag: "Free forever",
              feats: ["1 connected device", "1,000 messages / mo", "Community support", "All endpoints"],
              cta: "Start building",
              featured: false,
            },
            {
              name: "Team",
              price: "$29",
              tag: "per month",
              feats: ["5 connected devices", "50,000 messages / mo", "Webhook retries", "Email support"],
              cta: "Start 14-day trial",
              featured: true,
            },
            {
              name: "Business",
              price: "Custom",
              tag: "Annual",
              feats: ["Unlimited devices", "Volume pricing", "SLA & DPA", "Dedicated support"],
              cta: "Talk to sales",
              featured: false,
            },
          ].map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-lg border bg-background p-6 ${
                p.featured ? "border-foreground" : "border-border"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                {p.featured && (
                  <span className="rounded-lg bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-foreground">
                    Popular
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tracking-tight text-foreground">{p.price}</span>
                <span className="text-xs text-muted-foreground">{p.tag}</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {p.feats.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#quickstart"
                className={`mt-6 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors ${
                  p.featured
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border text-foreground hover:bg-secondary"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section
        id="faq"
        eyebrow="11 · FAQ"
        title="Things developers ask first."
      >
        <dl className="divide-y divide-border rounded-lg border border-border bg-background">
          {[
            {
              q: "Do I need to keep my phone online?",
              a: "Yes. The session is bridged through your linked device, so the phone needs network and battery. Most teams use a dedicated low-cost handset.",
            },
            {
              q: "What happens if the device disconnects?",
              a: "We emit a session.disconnected webhook and queue outbound messages for up to 30 minutes. Reconnect and queued messages are flushed in order.",
            },
            {
              q: "Is this an official integration?",
              a: "No. WhatsBridge is an unofficial bridge built for developers. For high-volume regulated traffic you should evaluate an official Business API provider.",
            },
            {
              q: "Where is data stored?",
              a: "Message metadata is stored in EU (Frankfurt) by default. Message bodies are retained for 7 days unless you opt into longer retention.",
            },
            {
              q: "Can I self-host?",
              a: "Business plans include a self-hosted runtime distributed as a Docker image. Contact sales for the license.",
            },
          ].map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-foreground">
                {item.q}
                <span className="font-mono text-xs text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </dl>
      </Section>

      {/* CTA */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
              Ship your first message tonight.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Free dev tier. No credit card. Pair a device, copy the key, hit the endpoint.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#quickstart"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get API access
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#docs"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-background/70 transition-colors"
            >
              Read the docs
            </a>
          </div>
        </div>
      </section>
      </main>

      {/* FOOTER */}
      <footer id="docs" className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageSquare className="h-3 w-3" />
            </span>
            <span className="font-medium text-foreground">WhatsBridge</span>
            <span>· © {new Date().getFullYear()}</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
            <a href="#api" className="hover:text-foreground transition-colors">API Reference</a>
            <a href="#" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Github className="h-4 w-4" /> GitHub
            </a>
            <a href="#" className="hover:text-foreground transition-colors">Status</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Index;
