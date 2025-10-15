"use client";

import Link from "next/link";
import useSignIn from "../hooks/use-sign-in";

export default function SignInForm() {
  const { formData, error, isLoading, handleChange, handleSubmit } =
    useSignIn();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl mb-4">Login</h2>

      {error && <p className="text-red">{error}</p>}

      <div className="flex flex-col">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="p-1 border border-black"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="password">Senha</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="p-1 border border-black"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-black text-white"
      >
        {isLoading ? "Carregando..." : "Entrar"}
      </button>

      <p>
        Não possui conta?
        <Link href={"/register"} className="ml-1 underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
