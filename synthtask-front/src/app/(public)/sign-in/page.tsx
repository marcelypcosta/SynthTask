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
    <main className="min-h-svh grid place-items-center px-4">
      <Card className="w-full max-w-[420px] md:max-w-[480px]">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta e continue automatizando suas reuniões.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
          <p className="mt-4 text-sm text-muted-foreground">
            Não possui conta?{" "}
            <Link
              href="/register"
              className="text-primary underline-offset-4 hover:underline"
            >
              Registre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
