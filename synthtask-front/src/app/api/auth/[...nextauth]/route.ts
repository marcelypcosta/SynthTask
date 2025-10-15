import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          const response = await fetch(
            `${process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
            {
              method: "POST",
              body: JSON.stringify({
                email: credentials?.email,
                password: credentials?.password,
              }),
              headers: { "Content-Type": "application/json" },
            }
          );

          const authResponse = await response.json();

          if (!response.ok) {
            return null;
          }

          // A API retorna { token, user: { id, name, email, ... } }
          const apiUser = authResponse?.user;
          const apiToken = authResponse?.token;

          if (!apiUser) {
            return null;
          }

          // Retorne no formato esperado pelo NextAuth
          return {
            id: apiUser.id,
            name: apiUser.name,
            email: apiUser.email,
            accessToken: apiToken,
          } as any;
        } catch (error) {
          console.error("Erro ao autenticar:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // Na autenticação inicial, propague os dados do usuário para o token JWT
      if (user) {
        const u: any = user;
        token.id = u.id;
        token.name = u.name;
        token.email = u.email;
        (token as any).accessToken = u.accessToken;
      }
      return token;
    },
    session: async ({ session, token }) => {
      // Garanta que session.user contenha id, name e email
      (session as any).user = {
        id: (token as any).id,
        name: (token as any).name,
        email: (token as any).email,
      };
      // Opcional: anexar o accessToken na sessão para chamadas autenticadas do cliente
      (session as any).accessToken = (token as any).accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});

export { handler as GET, handler as POST };
