"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
        <svg
          viewBox="0 0 800 400"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {/* Sky gradient */}
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5C9A0" />
              <stop offset="100%" stopColor="#FDF6EC" />
            </linearGradient>
            <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4C5B8" />
              <stop offset="100%" stopColor="#C2B0A0" />
            </linearGradient>
          </defs>

          {/* Background sky */}
          <rect width="800" height="400" fill="url(#sky)" />

          {/* Sun */}
          <circle cx="680" cy="80" r="52" fill="#F5C9A0" opacity="0.6" />
          <circle cx="680" cy="80" r="38" fill="#E8A87C" opacity="0.5" />
          <circle cx="680" cy="80" r="26" fill="#E07B39" opacity="0.7" />

          {/* Clouds */}
          <ellipse cx="120" cy="90" rx="70" ry="28" fill="#fff" opacity="0.65" />
          <ellipse cx="170" cy="76" rx="50" ry="24" fill="#fff" opacity="0.65" />
          <ellipse cx="80"  cy="98" rx="45" ry="20" fill="#fff" opacity="0.55" />

          <ellipse cx="420" cy="60" rx="60" ry="22" fill="#fff" opacity="0.5" />
          <ellipse cx="460" cy="50" rx="40" ry="18" fill="#fff" opacity="0.5" />

          {/* Ground */}
          <rect x="0" y="300" width="800" height="100" fill="url(#ground)" />

          {/* House body */}
          <rect x="290" y="190" width="220" height="120" rx="4" fill="#D4A57A" />

          {/* Roof */}
          <polygon points="270,195 400,100 530,195" fill="#B5562A" />
          <polygon points="280,195 400,108 520,195" fill="#C86030" />

          {/* Chimney */}
          <rect x="440" y="120" width="22" height="50" fill="#A04820" />
          {/* Smoke puffs */}
          <circle cx="451" cy="112" r="9"  fill="#E8D8C8" opacity="0.6" />
          <circle cx="447" cy="100" r="7"  fill="#E8D8C8" opacity="0.4" />
          <circle cx="455" cy="90"  r="5"  fill="#E8D8C8" opacity="0.25" />

          {/* Door */}
          <rect x="370" y="260" width="60" height="50" rx="30 30 0 0" fill="#7A3B1E" />
          <circle cx="424" cy="288" r="4" fill="#E07B39" />

          {/* Windows */}
          <rect x="305" y="220" width="50" height="44" rx="6" fill="#A8D4E6" opacity="0.85" />
          <line x1="330" y1="220" x2="330" y2="264" stroke="#7AACCC" strokeWidth="1.5" />
          <line x1="305" y1="242" x2="355" y2="242" stroke="#7AACCC" strokeWidth="1.5" />

          <rect x="445" y="220" width="50" height="44" rx="6" fill="#A8D4E6" opacity="0.85" />
          <line x1="470" y1="220" x2="470" y2="264" stroke="#7AACCC" strokeWidth="1.5" />
          <line x1="445" y1="242" x2="495" y2="242" stroke="#7AACCC" strokeWidth="1.5" />

          {/* Left tree */}
          <rect x="195" y="270" width="12" height="50" fill="#8C6244" />
          <ellipse cx="201" cy="248" rx="34" ry="40" fill="#7A9E5C" />
          <ellipse cx="201" cy="238" rx="24" ry="30" fill="#8DB86A" />

          {/* Right tree */}
          <rect x="593" y="265" width="14" height="55" fill="#8C6244" />
          <ellipse cx="600" cy="240" rx="38" ry="44" fill="#7A9E5C" />
          <ellipse cx="600" cy="228" rx="26" ry="32" fill="#8DB86A" />

          {/* Path */}
          <ellipse cx="400" cy="330" rx="36" ry="10" fill="#C2A888" opacity="0.6" />
          <rect x="386" y="310" width="28" height="25" rx="4" fill="#C2A888" opacity="0.5" />

          {/* Flower bushes */}
          <circle cx="305" cy="302" r="8"  fill="#E07B39" opacity="0.8" />
          <circle cx="320" cy="298" r="6"  fill="#C86030" opacity="0.7" />
          <circle cx="480" cy="302" r="8"  fill="#E07B39" opacity="0.8" />
          <circle cx="465" cy="298" r="6"  fill="#C86030" opacity="0.7" />
        </svg>

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
