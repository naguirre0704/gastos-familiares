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
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{
            borderColor: "var(--color-terracota)",
            borderTopColor: "transparent",
          }}
        />
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

  return (
    <div className="min-h-screen flex flex-col bg-ivory">
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
            background: "linear-gradient(to bottom, transparent, var(--color-ivory))",
          }}
        />
      </div>

      {/* Form area */}
      <div className="flex-1 flex flex-col px-6 pb-10" style={{ marginTop: "-2rem" }}>
        {/* Header */}
        <div className="text-center mb-7">
          <h1
            className="font-extrabold text-brown-dark"
            style={{ fontSize: "28px", letterSpacing: "-0.3px" }}
          >
            🏠 Gastos Familiares
          </h1>
          <p className="text-brown-mid" style={{ fontSize: "15px", marginTop: "4px" }}>
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
              <label className="block font-semibold mb-1.5 text-brown-mid" style={{ fontSize: "13px" }}>
                Tu usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="login-input"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1.5 text-brown-mid" style={{ fontSize: "13px" }}>
                Tu contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="login-input"
                required
              />
            </div>

            {error && (
              <p style={{ color: "var(--color-error)", fontSize: "13px" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-login"
            >
              {loading ? "Un momento…" : "Entrar a casa →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
