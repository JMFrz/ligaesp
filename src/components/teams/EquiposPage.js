import React, { useState, useEffect } from "react";
import "../styles/teams/EquiposPage.css"; // Archivo CSS para estilos

const EquiposPage = () => {
  const [equipos, setEquipos] = useState([]); // Estado para almacenar los equipos
  const [loading, setLoading] = useState(true); // Estado para manejar la carga

  useEffect(() => {
    // Cargar los datos del archivo JSON
    fetch("/data/equipos.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al cargar los datos");
        }
        return response.json();
      })
      .then((data) => {
        setEquipos(data); // Guardar los datos en el estado
        setLoading(false); // Finalizar la carga
      })
      .catch((error) => {
        console.error("Error al cargar los equipos:", error);
        setLoading(false); // Finalizar la carga incluso si hay error
      });
  }, []);

  if (loading) {
    return <p>Cargando equipos...</p>; // Mostrar un mensaje mientras se cargan los datos
  }

  return (
    <div className="equipos-container">
      <h1>Lista de Equipos</h1>
      <table className="equipos-table">
        <thead>
          <tr>
            <th>Logo</th>
            <th>Nombre</th>
            <th>Liga</th>
            <th>Partidos Jugados</th>
            <th>Victorias</th>
            <th>Empates</th>
            <th>Derrotas</th>
            <th>Goles a Favor</th>
            <th>Goles en Contra</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((equipo) => (
            <tr key={equipo.id}>
              <td>
                <img src={equipo.imagen} alt={equipo.nombre} className="equipo-imagen" />
              </td>
              <td>{equipo.nombre}</td>
              <td>{equipo.liga}</td>
              <td>{equipo.estadisticas.partidosJugados}</td>
              <td>{equipo.estadisticas.victorias}</td>
              <td>{equipo.estadisticas.empates}</td>
              <td>{equipo.estadisticas.derrotas}</td>
              <td>{equipo.estadisticas.golesFavor}</td>
              <td>{equipo.estadisticas.golesContra}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EquiposPage;