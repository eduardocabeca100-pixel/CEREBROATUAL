import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

// Importa o aplicativo que criamos
import App from "./App";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement!);

// "Desenha" o App na tela
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
