import {
  NextResponse,
  type MiddlewareConfig,
  type NextRequest,
} from "next/server";

const publicRoutes = [
  { path: "/sign-in", whenAuthenticated: "redirect" },
  { path: "/register", whenAuthenticated: "redirect" },
  { path: "/jira/callback", whenAuthenticated: "pass" },
  { path: "/trello/callback", whenAuthenticated: "pass" },
] as const;

const REDIRECT_WHEN_AUTHENTICATED_ROUTE = "/";
const REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE = "/sign-in";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicRoute = publicRoutes.find((route) => route.path === path);
  const authToken =
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  // Caso 1: Usuário NÃO autenticado acessando uma rota pública (ex: /sign-in)
  // Ação: Permitir o acesso.
  if (!authToken && publicRoute) {
    return NextResponse.next();
  }

  // Caso 2: Usuário NÃO autenticado acessando uma rota privada
  // Ação: Redirecionar para a página de sign-in.
  if (!authToken && !publicRoute) {
    // É mais seguro construir a URL a partir do request.url para garantir o host correto.
    const redirectUrl = new URL(REDIRECT_WHEN_NOT_AUTHENTICATED_ROUTE, request.url);
    return NextResponse.redirect(redirectUrl); 
  }

  // Caso 3: Usuário AUTENTICADO acessando uma rota pública que deve redirecionar (ex: /sign-in)
  // Ação: Redirecionar para a página principal.
  if (authToken && publicRoute && publicRoute.whenAuthenticated === "redirect") {
    const redirectUrl = new URL(REDIRECT_WHEN_AUTHENTICATED_ROUTE, request.url);
    return NextResponse.redirect(redirectUrl); 
  }

  // Caso 4: Usuário AUTENTICADO acessando uma rota privada ou uma rota pública normal
  // Ação: Permitir o acesso.
  if (authToken && publicRoute) { 
    // Aqui você pode adicionar a lógica para VERIFICAR a expiração do JWT.
    // Se expirado, você pode REMOVER o cookie e REDIRECIONAR.
    return NextResponse.next();
  }

  // Fallback: Se nenhuma das condições acima for atendida, apenas continue.
  return NextResponse.next();
}

export const config: MiddlewareConfig = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
