"use client";

import Link from "next/link";
import { Label } from "@/ui/label";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Loader2 } from "lucide-react";

import useSignIn from "../hooks/use-sign-in";

export default function SignInForm() {
  const { formData, error, isLoading, handleChange, handleSubmit } =
    useSignIn();

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium text-center">
          {error}
        </div>
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
          placeholder="nome@exemplo.com"
          required
          className="h-10 bg-white"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-primary"
          >
            Esqueceu a senha?
          </Link>
        </div>
        <Input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          placeholder="******"
          required
          className="h-10 bg-white"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-10 gap-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-medium"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
