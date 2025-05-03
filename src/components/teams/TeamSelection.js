import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import localforage from "localforage";

const TeamSelectionPage = () => {
  const [equipos, setEquipos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar los equipos desde el archivo JSON
    fetch("/data/equipos.json")
      .then((response) => response.json())
      .then((data) => setEquipos(data))
      .catch((error) => console.error("Error al cargar los equipos:", error));
  }, []);

  const togglePlayer = (id) => {
    setEquipos((prevEquipos) =>
      prevEquipos.map((equipo) =>
        equipo.id === id ? { ...equipo, player: !equipo.player } : equipo
      )
    );
  };

  const handleStartLeague = async () => {

    localStorage.setItem("equipos", JSON.stringify(equipos));
    console.log("1");
    localStorage.setItem("numLigas", JSON.stringify(0));

    navigate("/league-generation");
  };

  return (
    <div className="team-selection">
      <h1>Selecciona tus equipos</h1>
      <table className="equipos-table">
        <thead>
          <tr>
            <th>Logo</th>
            <th>Nombre</th>
            <th>Liga</th>
            <th>Seleccionar</th>
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
              <td>
                <input
                  type="checkbox"
                  checked={equipo.player || false}
                  onChange={() => togglePlayer(equipo.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleStartLeague}>Generar Liga</button>
    </div>
  );
};

export default TeamSelectionPage;