import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore: Ignore missing type declarations for side-effect CSS import
import "./index.css";
import App from "./App";

import { Analytics } from "@vercel/analytics/react";

import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Analytics />
    </ThemeProvider>
  </StrictMode>
);
