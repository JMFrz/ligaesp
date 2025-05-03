import React from "react";
import ReactDOM from "react-dom/client"; // Cambia a 'react-dom/client'
import App from "./App";
import "./index.css"; // Asegúrate de que este archivo exista

const root = ReactDOM.createRoot(document.getElementById("root")); // Usa createRoot
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);