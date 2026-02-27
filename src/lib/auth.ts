import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: [
                        "openid",
                        "email",
                        "profile",
                        "https://www.googleapis.com/auth/calendar",
                        "https://www.googleapis.com/auth/calendar.events",
                        "https://www.googleapis.com/auth/meetings.space.created",
                        "https://www.googleapis.com/auth/drive.readonly",
                    ].join(" "),
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.access_token = account.access_token;
                token.refresh_token = account.refresh_token;
                token.expires_at = account.expires_at;
            }
            return token;
        },
        async session({ session, token }) {
            session.access_token = token.access_token as string;
            session.refresh_token = token.refresh_token as string;
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
});
