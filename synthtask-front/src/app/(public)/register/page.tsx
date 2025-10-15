"use client";
import Link from "next/link";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import RegisterForm from "@/feature/auth/components/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-svh grid place-items-center px-4">
      <Card className="w-full max-w-[420px] md:max-w-[480px]">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Crie sua conta e otimize a gestão do seu time.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-4 text-sm text-muted-foreground">
            Já possui conta?{" "}
            <Link
              href="/sign-in"
              className="text-primary underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
