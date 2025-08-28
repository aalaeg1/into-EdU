import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const TEACHER_SERVICE = process.env.TEACHER_SERVICE || "http://localhost:5002";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Forces the account chooser on every login
            authorization: { params: { prompt: "select_account" } },
        }),
    ],

    // ✅ MUST point to a PAGE route, not /api/...
    pages: {
        error: "/auth/error",
    },

    callbacks: {
        async signIn({ user }) {
            if (!user?.email) return false;

            const res = await fetch(`${TEACHER_SERVICE}/api/teachers`, { cache: "no-store" });
            if (!res.ok) return false;

            const teachers = await res.json();
            const allowed = teachers.some(
                (t) => (t.email || "").toLowerCase() === user.email.toLowerCase()
            );
            return allowed;
        },

        // Respect callbackUrl like "/auth/google-after"
        async redirect({ url, baseUrl }) {
            if (url?.startsWith("/")) return `${baseUrl}${url}`;
            try {
                const u = new URL(url);
                if (u.origin === baseUrl) return u.toString();
            } catch {}
            return baseUrl;
        },
    },

    session: { strategy: "jwt" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
