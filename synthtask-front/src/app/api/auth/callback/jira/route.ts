import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { api } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: "Código de autorização ausente" }, { status: 400 });
    }

    // Recupera JWT do NextAuth para autenticar chamada ao backend
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = (token as any)?.accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    }

    // Usa o redirect_uri configurado (deve casar com o valor de authorize)
    const redirect_uri =
      process.env.NEXT_PUBLIC_JIRA_REDIRECT_URI || `${url.origin}/jira/callback`;

    await api.post(
      "/api/integrations/jira/oauth/exchange",
      { code, redirect_uri },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return NextResponse.redirect(new URL("/connections", url.origin));
  } catch (e: any) {
    const message = e?.message || "Falha ao processar callback do Jira";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
