import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

try {
  localStorage.removeItem("maya_dark_mode");
  document.documentElement.classList.remove("dark");
} catch {
  // localStorage may be unavailable in some environments
}

const router = getRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
