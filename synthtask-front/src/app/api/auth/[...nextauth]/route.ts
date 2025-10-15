import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { api } from "@/lib/http";

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
          const { data } = await api.post("/api/auth/login", {
            email: credentials?.email,
            password: credentials?.password,
          });

          const apiUser = data?.user;
          const apiToken = data?.token;

          if (!apiUser) {
            return null;
          }

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
      (session as any).user = {
        id: (token as any).id,
        name: (token as any).name,
        email: (token as any).email,
      };
      (session as any).accessToken = (token as any).accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});

export { handler as GET, handler as POST };
