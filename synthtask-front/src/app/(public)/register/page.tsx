"use client";

import Link from "next/link";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/ui/card";
import RegisterForm from "@/feature/auth/components/register-form";

export default function RegisterPage() {
  return (
    <>
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Criar conta</CardTitle>
          <CardDescription>
            Comece agora e otimize a gestão do seu time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Já possui uma conta?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-[#3B82F6] underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="px-8 text-center text-xs text-muted-foreground mt-6">
        Ao se registrar, você concorda com nossos{" "}
        <Link
          href="#"
          className="underline underline-offset-4 hover:text-primary"
        >
          Termos de Serviço
        </Link>{" "}
        e{" "}
        <Link
          href="#"
          className="underline underline-offset-4 hover:text-primary"
        >
          Política de Privacidade
        </Link>
        .
      </p>
    </>
  );
}
