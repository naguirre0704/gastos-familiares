"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FDF6EC" }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#E07B39", borderTopColor: "transparent" }} />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Hmm, algo no cuadra. ¿Revisamos?");
    } else {
      router.replace("/");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "14px",
    border: "1.5px solid #D4C5B8",
    background: "#FEFAF5",
    color: "#2E1F0F",
    fontSize: "15px",
    fontFamily: "Nunito, system-ui, sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#FDF6EC", fontFamily: "Nunito, system-ui, sans-serif" }}
    >
      {/* Illustration */}
      <div className="relative w-full flex-shrink-0" style={{ height: "52vh", minHeight: 280 }}>
        <Image
          src="/familia.jpg"
          alt="Nuestra familia"
          fill
          className="object-cover object-top"
          priority
        />
        {/* Gradient fade to form */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "55%",
            background: "linear-gradient(to bottom, transparent, #FDF6EC)",
          }}
        />
      </div>

      {/* Form area */}
      <div className="flex-1 flex flex-col px-6 pb-10" style={{ marginTop: "-2rem" }}>
        {/* Header */}
        <div className="text-center mb-7">
          <h1
            className="font-extrabold"
            style={{ fontSize: "28px", color: "#2E1F0F", letterSpacing: "-0.3px" }}
          >
            🏠 Gastos Familiares
          </h1>
          <p style={{ color: "#8C7A6B", fontSize: "15px", marginTop: "4px" }}>
            Tu hogar, tus finanzas.
          </p>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-sm mx-auto"
          style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "28px 24px",
            boxShadow: "0 8px 40px rgba(46,31,15,0.10)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block font-semibold mb-1.5"
                style={{ fontSize: "13px", color: "#8C7A6B" }}
              >
                Tu usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#E07B39")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#D4C5B8")}
                required
              />
            </div>

            <div>
              <label
                className="block font-semibold mb-1.5"
                style={{ fontSize: "13px", color: "#8C7A6B" }}
              >
                Tu contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#E07B39")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#D4C5B8")}
                required
              />
            </div>

            {error && (
              <p style={{ color: "#C0392B", fontSize: "13px" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                background: loading ? "#C89070" : "#E07B39",
                color: "#fff",
                fontWeight: 700,
                fontSize: "16px",
                fontFamily: "Nunito, system-ui, sans-serif",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                marginTop: "4px",
              }}
            >
              {loading ? "Un momento…" : "Entrar a casa →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
