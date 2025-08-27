import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],

    pages: {
        error: "/api/auth/error", // ou "/auth/error" selon ta config
    },

    callbacks: {
        async signIn({ user }) {
            if (!user?.email) return false;

            try {
                // Assure-toi que le teacher-service tourne bien sur ce port
                const res = await fetch("http://localhost:5002/api/teachers");

                if (!res.ok) {
                    console.error("Erreur lors de la récupération des enseignants:", res.status);
                    return false;
                }

                const teachers = await res.json();
                const allowed = teachers.some(t => t.email === user.email);

                console.log(`Tentative de connexion Google pour ${user.email} → Autorisé ?`, allowed);

                return allowed;
            } catch (err) {
                console.error("Erreur interne lors de la vérification de l'utilisateur:", err);
                return false;
            }
        },

        async redirect({ url, baseUrl }) {
            return "/Teacher/Dashboard"; // Redirige toujours ici après login
        },
    },

    session: {
        strategy: "jwt",
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
