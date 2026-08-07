"use client";

import { useEffect, useRef, useState } from "react";
import { FileJson, LoaderCircle } from "lucide-react";
import "swagger-ui-dist/swagger-ui.css";
import "./docs.css";

type SwaggerUIBundle = (options: {
  domNode: HTMLElement;
  spec: object;
  docExpansion?: string;
  defaultModelsExpandDepth?: number;
}) => void;

/**
 * Interactive OpenAPI explorer for judges / integrators.
 *
 * Uses swagger-ui-dist's imperative mount (separate React root) instead of
 * swagger-ui-react, so React 19 Strict Mode does not warn about swagger-ui's
 * legacy UNSAFE_componentWillReceiveProps (ModelCollapse, etc.).
 */
export default function DocsPage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;

    void (async () => {
      try {
        const res = await fetch("/api/swagger", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Failed to load OpenAPI spec (${res.status})`);
        }
        const spec = (await res.json()) as object;
        if (cancelled || !hostRef.current) return;

        const mod = (await import(
          "swagger-ui-dist/swagger-ui-es-bundle.js"
        )) as { default?: SwaggerUIBundle } & SwaggerUIBundle;
        const SwaggerUIBundle = (mod.default ?? mod) as SwaggerUIBundle;

        if (cancelled || !hostRef.current) return;
        hostRef.current.innerHTML = "";
        SwaggerUIBundle({
          domNode: hostRef.current,
          spec,
          docExpansion: "list",
          defaultModelsExpandDepth: 1,
        });
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load docs");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (host) host.innerHTML = "";
    };
  }, []);

  return (
    <div className="min-h-full bg-[#070b14] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-6 space-y-2">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400/80">
            <FileJson className="size-3.5" aria-hidden />
            OpenAPI 3.0
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            API Docs
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
            Explore the composable HTTP surface behind ArbiYield AI — market
            metadata, health diagnostics, and strategy chat — then Try it out
            against the live deployment.
          </p>
        </header>

        <div
          data-testid="swagger-container"
          className="swagger-dark relative min-h-[40vh] overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0b1220] p-2 shadow-[0_0_40px_rgba(34,211,238,0.08)] sm:p-4"
        >
          {error ? (
            <p className="p-6 text-sm font-semibold text-rose-300">{error}</p>
          ) : (
            <>
              {!ready ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[#0b1220]/80 text-sm text-slate-400">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Loading Swagger UI…
                </div>
              ) : null}
              <div ref={hostRef} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
