"use client";

import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";

import useSignIn from "../hooks/use-sign-in";

export default function SignInForm() {
  const { formData, error, isLoading, handleChange, handleSubmit } =
    useSignIn();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-destructive text-sm" aria-live="polite">
          {error}
        </p>
      )}

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
          autoComplete="current-password"
          placeholder="******"
          required
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Carregando..." : "Entrar"}
      </Button>
    </form>
  );
}
