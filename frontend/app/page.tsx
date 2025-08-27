'use client';
import LoginForm from "./Login/Components/LoginForm";

export default function HomePage() {
  const handleLogin = (role: string) => {
    console.log('Connecté en tant que :', role);
      window.location.href = "/Teacher/Dashboard";

    // Exemple : redirection
    // if (role === 'admin') window.location.href = '/admin';
    // else window.location.href = '/teacher';
  };

  return <LoginForm onLogin={handleLogin} />;
}
