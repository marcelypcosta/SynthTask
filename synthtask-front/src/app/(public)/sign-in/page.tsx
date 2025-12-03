"use client";

import Link from "next/link";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/ui/card";
import SignInForm from "@/feature/auth/components/sign-in-form";

export default function SignInPage() {
  return (
    <>
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            Bem-vindo de volta
          </CardTitle>
          <CardDescription>
            Acesse sua conta para gerenciar suas reuniões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Não possui conta?{" "}
            <Link
              href="/register"
              className="font-medium text-[#3B82F6] underline-offset-4 hover:underline"
            >
              Cadastre-se agora
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="px-8 text-center text-xs text-muted-foreground mt-6">
        Ao clicar em entrar, você concorda com nossos{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          Termos de Serviço
        </Link>{" "}
        e{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          Política de Privacidade
        </Link>
        .
      </p>
    </>
  );
}
