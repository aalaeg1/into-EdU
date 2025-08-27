"use client";
import React from "react";
import { useTeacherFirstName } from "@/hooks/useTeacherFirstName"; // adapte le chemin si besoin

export const WelcomeBanner: React.FC = () => {
  const firstName = useTeacherFirstName();

  // Date du jour formatée en FR
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).toUpperCase();

  return (
      <div className="w-full rounded-2xl bg-[#4B3DFE] flex items-start justify-between px-10 pt-4 pb-12 relative overflow-hidden min-h-[140px] shadow-xl backdrop-blur-md border border-[#e0e7ff]">
        {/* Overlay glassmorphism */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] z-0" />
        {/* Texte de bienvenue */}
        <div className="flex flex-col gap-2 z-10">
        <span className="text-sm font-extrabold tracking-wide text-white">
          {firstName
              ? `WELCOME BACK, ${firstName.toUpperCase()}!`
              : "WELCOME BACK!"}
        </span>
          <span className="text-lg md:text-xl font-semibold text-white/90 tracking-wide">
          {dateStr}
        </span>
        </div>
        {/* Image graduation */}
        <div className="absolute right-2 -top-2 z-10">
          <img
              src="/graduation-cap.png"
              alt="Graduation Cap"
              className="w-36 h-36 object-contain"
          />
        </div>
        {/* Sparkles (inchangés, copie/colle depuis ta version) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* ... Colle ici tous tes <img src="/spark.png" ... /> */}
        </div>
      </div>
  );
};
