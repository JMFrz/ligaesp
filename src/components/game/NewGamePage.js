import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/game/NewGamePage.css";

const NewGamePage = () => {
  const [minute, setMinute] = useState(0);
  const [scoreLocal, setScoreLocal] = useState(0);
  const [scoreVisitante, setScoreVisitante] = useState(0);
  const [log, setLog] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [opportunity, setOpportunity] = useState(null); // Estado para manejar las oportunidades
  const navigate = useNavigate();
  const location = useLocation();
  const { local, visitante, equipoJugador } = location.state;

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setMinute((prev) => {
          if (prev < 90) return prev + 1;
          clearInterval(interval);
          setIsPlaying(false);
          return prev;
        });
        if (Math.random() < 0.05) {
          setIsPlaying(false); // Pausa el reloj
          generateOpportunity();
        }
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);
  const generateOpportunity = () => {
    const isAttack = Math.random() < 0.5; // 50% de probabilidad de ataque o defensa

    // Si el jugador controla el equipo local:
    // - Es ataque si `isAttack` es verdadero.
    // - Es defensa si `isAttack` es falso.
    // Si el jugador controla el equipo visitante:
    // - Es ataque si `isAttack` es falso.
    // - Es defensa si `isAttack` es verdadero.
    setOpportunity({
        type: isAttack ? "attack" : "defense",
        botDirection: getRandomDirection(), // Dirección elegida por el bot
    });
};
  const handleChoice = (playerDirection) => {
    const isAttack = opportunity.type === "attack";
    const botDirection = opportunity.botDirection;

    let result;
    if (isAttack) {
      // Si es ataque, el jugador chuta y el bot intenta detener
      result =
        playerDirection === botDirection
          ? "¡Fallaste! El portero adivinó tu disparo."
          : "¡Gol! El portero no pudo detenerlo.";
      if (playerDirection !== botDirection) {
        if(equipoJugador.id == local.id) {
          setScoreLocal((prev) => prev + 1); // Incrementa el marcador del equipo local
        }
        else {
          setScoreVisitante((prev) => prev + 1); // Incrementa el marcador del equipo visitante
        }
      }
    } else {
      // Si es defensa, el bot chuta y el jugador intenta detener
      result =
        playerDirection === botDirection
          ? "¡Paraste el tiro! Elegiste correctamente."
          : "¡Gol en contra! No lograste detenerlo.";
      if (playerDirection !== botDirection) {
        if(equipoJugador.id == local.id) {
          setScoreVisitante((prev) => prev + 1); // Incrementa el marcador del equipo local
        }
        else {
          setScoreLocal((prev) => prev + 1); // Incrementa el marcador del equipo visitante
        }      
      }
    }

    setLog((prev) => [
      ...prev,
      `Minuto ${minute}: ${
        isAttack
          ? `Atacaste por ${playerDirection}. El portero se lanzó a ${botDirection}.`
          : `El enemigo atacó por ${botDirection}. Elegiste ${playerDirection}.`
      } Resultado: ${result}`,
    ]);
    setOpportunity(null); // Resetea la oportunidad
    setIsPlaying(true); // Reanuda el reloj
  };

  const getRandomDirection = () => {
    const directions = ["izquierda", "medio", "derecha"];
    return directions[Math.floor(Math.random() * directions.length)];
  };

  const startGame = () => {
    setMinute(0);
    setLog([]);
    setIsPlaying(true);
    setOpportunity(null);
  };

  const finalizarPartido = () => {
    const partidoInfo = JSON.parse(localStorage.getItem("partido_en_juego"));

    if (partidoInfo?.tipo === "playoff") {
        localStorage.setItem("resultado_partido_playoff", JSON.stringify({
            golesLocal: scoreLocal,
            golesVisitante: scoreVisitante,
            ...partidoInfo,
            jugado: true
        }));
        localStorage.removeItem("partido_en_juego");
    }
    
    navigate("/main-menu", {
        state: {
            resultado: {
                local: local.nombre,
                visitante: visitante.nombre,
                golesLocal: scoreLocal,
                golesVisitante: scoreVisitante,
                jugado: true
            }
        },
        replace: true
    });
};

  return (
    <div>
      <h1>Partido en curso</h1>
      <div className="scoreboard">
        <p>
          <img
            src={local.imagen}
            alt={local.nombre}
            className="team-logo"
          />
          {local.nombre} {scoreLocal} - {scoreVisitante} { }
          {visitante.nombre}
          <img
            src={visitante.imagen}
            alt={visitante.nombre}
            className="team-logo"
          />
        </p>
        <p>Minuto: {minute}</p>
      </div>
      <button onClick={startGame} disabled={isPlaying || minute > 0}>
        {isPlaying ? "Jugando..." : "Iniciar Partido"}
      </button>
      <div>
        <h2>Registro del Partido</h2>
        <ul>
          {log.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ul>
      </div>
      {opportunity && (
        <div>
          <h2>
            {opportunity.type === "attack"
              ? "¡Oportunidad a favor! ¿Dónde quieres chutar?"
              : "¡Oportunidad en contra! ¿Dónde te lanzas?"}
          </h2>
          <div>
            <button onClick={() => handleChoice("izquierda")}>Izquierda</button>
            <button onClick={() => handleChoice("medio")}>Medio</button>
            <button onClick={() => handleChoice("derecha")}>Derecha</button>
          </div>
        </div>
      )}
      {minute === 90 && (
        <button onClick={finalizarPartido}>Finalizar Partido y Volver al Menú</button>
      )}
    </div>
  );
};

export default NewGamePage;