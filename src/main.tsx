import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

// Limpa tokens de sessão antigos do Supabase que travam o login
try {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("sb-") || k.includes("supabase"))
    .forEach((k) => localStorage.removeItem(k));
} catch {
  /* localStorage indisponível (modo privado, etc.) */
}

const router = getRouter();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
