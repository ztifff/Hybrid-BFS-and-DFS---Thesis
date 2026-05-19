import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore: Ignore missing type declarations for side-effect CSS import
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
