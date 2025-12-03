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
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium text-center">
          {error}
        </div>
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
          className="h-10 bg-white"
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
          placeholder="nome@exemplo.com"
          required
          className="h-10 bg-white"
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
          placeholder="Crie uma senha forte"
          required
          className="h-10"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-10 gap-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-medium"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isLoading ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
