"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[NovaNest] root error:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          background:
            "radial-gradient(120% 120% at 50% 0%, #0B1226 0%, #070B1A 55%, #05070F 100%)",
          color: "#F8FAFC",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "30rem" }}>
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#A1A1AA",
              marginBottom: "0.5rem",
            }}
          >
            NovaNest AI
          </p>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 1rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#A1A1AA", lineHeight: 1.6 }}>
            An unexpected error occurred while loading NovaNest. You can try
            again, or head back to safety.
          </p>
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                height: "2.75rem",
                padding: "0 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                background:
                  "linear-gradient(135deg, hsl(258 90% 66%), hsl(280 85% 62%))",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                height: "2.75rem",
                alignItems: "center",
                padding: "0 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.04)",
                color: "#F8FAFC",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}