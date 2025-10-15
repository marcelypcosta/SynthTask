"use client";

import Link from "next/link";
import useRegister from "../hooks/use-register";

export default function RegisterForm() {
  const { error, isLoading, formData, handleChange, handleSubmit } =
    useRegister();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl mb-4">Criar Conta</h2>

      <div className="flex flex-col">
        <label htmlFor="name">Nome Completo</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nome"
          required
          className="p-1 border border-black"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
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
          placeholder="Senha"
          required
          className="p-1 border border-black"
        />
      </div>

      <button type="submit" className="w-full bg-black text-white">
        {isLoading ? "Registrando..." : "Registrar"}
      </button>
      {error && <p className="text-red">{error}</p>}

      <p>
        Já possui conta?
        <Link href={"/sign-in"} className="ml-1 underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
