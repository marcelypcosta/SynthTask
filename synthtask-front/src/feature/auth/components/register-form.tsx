"use client";

import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Loader2 } from "lucide-react";

import useRegister from "../hooks/use-register";

export default function RegisterForm() {
  const { error, isLoading, formData, handleChange, handleSubmit } =
    useRegister();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-destructive text-sm" aria-live="polite">
          {error}
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          autoComplete="name"
          placeholder="Seu nome"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          placeholder="seu@email.com"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          placeholder="Crie uma senha"
          required
        />
      </div>

      <Button type="submit" className="w-full gap-2" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isLoading ? "Registrando..." : "Registrar"}
      </Button>
    </form>
  );
}
