"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      setError("Usuario o contraseña incorrectos. Intentá de nuevo.");
    } else {
      router.replace("/");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Foto familiar */}
      <div className="relative w-full shrink-0 h-[52vh] min-h-70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/familia.PNG"
          alt="Nuestra familia"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 15%" }}
        />
        {/* Degradado hacia gris claro */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "55%",
            background: "linear-gradient(to bottom, transparent, #F9FAFB)",
          }}
        />
      </div>

      {/* Área del formulario */}
      <div className="flex-1 flex flex-col items-center px-6 pb-10 -mt-8">
        {/* Título */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gastos Familiares</h1>
          <p className="text-gray-500 text-sm mt-1">Tu hogar, tus finanzas.</p>
        </div>

        <Card className="w-full max-w-sm" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu usuario"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu contraseña"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full mt-2" size="lg">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Ingresando…
                </span>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
