import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/game/NewGamePage.css";

const HINT_MESSAGES = {
  attack: [
    (dir) => `El portero parece proteger más el lado ${dir}... quizás convenga el contrario.`,
    (dir) => `Tu delantero está mirando hacia ${dir}.`,
    (dir) => `El portero se ha adelantado ligeramente hacia ${dir}.`,
  ],
  defense: [
    (dir) => `El delantero lleva el peso del cuerpo hacia ${dir}.`,
    (dir) => `Has visto este jugador chutar siempre por ${dir}.`,
    (dir) => `El delantero mira fijamente hacia ${dir} antes de chutar.`,
  ],
};

const getHintDirection = (realDirection) => {
  const directions = ["izquierda", "medio", "derecha"];
  if (Math.random() < 0.7) return realDirection;
  const others = directions.filter((d) => d !== realDirection);
  return others[Math.floor(Math.random() * others.length)];
};

const TACKLE_CHANCE = 0.65;
const FOUL_CHANCE   = 0.65;
const CARD_CHANCE   = 0.50;
const YELLOW_CHANCE = 0.80;

const NewGamePage = () => {
  const [minute, setMinute]                 = useState(0);
  const [scoreLocal, setScoreLocal]         = useState(0);
  const [scoreVisitante, setScoreVisitante] = useState(0);
  const [log, setLog]                       = useState([]);
  const [isPlaying, setIsPlaying]           = useState(false);
  const [opportunity, setOpportunity]       = useState(null);

  // Pistas
  const [hintsLeft, setHintsLeft]           = useState(3);
  const [revealedHints, setRevealedHints]   = useState([]);
  const [hintIndex, setHintIndex]           = useState(0);

  // Tarjetas
  const [cardsPlayer, setCardsPlayer] = useState({ yellows: 0, reds: 0 });
  const [cardsBot, setCardsBot]       = useState({ yellows: 0, reds: 0 });

  // Mensaje de evento especial (entrada/falta/tarjeta)
  const [eventMessage, setEventMessage] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { local, visitante, equipoJugador, ligaSeleccionada } = location.state;

  const isPlayerLocal = equipoJugador.id === local.id;

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
          setIsPlaying(false);
          generateOpportunity();
        }
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const getRedPenalty = (reds) => reds * 0.1;

  const generateOpportunity = (forcedType = null) => {
    const equipoJugadorRating = equipoJugador.rating;
    const equipoRivalRating   = isPlayerLocal ? visitante.rating : local.rating;
    const factorLocal         = isPlayerLocal ? 7.5 : -7.5;
    const diferenciaRating    = equipoJugadorRating - equipoRivalRating;
    const redPenaltyPlayer    = getRedPenalty(cardsPlayer.reds);

    let isAttack;
    if (forcedType !== null) {
      isAttack = forcedType === "attack";
    } else {
      const probBase  = 0.5 + (diferenciaRating / 100) * 4 + factorLocal / 100;
      const probFinal = Math.min(Math.max(probBase - redPenaltyPlayer, 0.15), 0.8);
      isAttack = Math.random() < probFinal;
    }

    const isFreeKick      = forcedType !== null; // viene de una falta → no hay entradas
    const botDirection    = getRandomDirection();
    const botTackles      = isAttack  && !isFreeKick ? Math.random() < TACKLE_CHANCE : false;
    const canPlayerTackle = !isAttack && !isFreeKick ? Math.random() < TACKLE_CHANCE : false;

    setOpportunity({ type: isAttack ? "attack" : "defense", botDirection, botTackles, canPlayerTackle, isFreeKick });
    setRevealedHints([]);
    setHintIndex(0);
    setEventMessage(null);
  };

  // Devuelve { foul, message } y actualiza tarjetas si procede
  // beneficiary: "player" | "bot"  → quién se beneficia de la falta (el que atacaba)
  // tackler:     "player" | "bot"  → quién hizo la entrada
  const resolveTackle = (tackler, beneficiary, currentCardsPlayer, currentCardsBot) => {
    const isFoul = Math.random() < FOUL_CHANCE;

    if (!isFoul) {
      return { foul: false, message: "Entrada limpia, el árbitro deja jugar." };
    }

    // Hay falta → el equipo beneficiado repetirá la oportunidad (lo gestiona el caller)
    const isCard   = Math.random() < CARD_CHANCE;
    let cardMsg    = "";

    if (isCard) {
      const isYellow = Math.random() < YELLOW_CHANCE;

      if (tackler === "bot") {
        const newCards = { ...currentCardsBot };
        if (isYellow) {
          newCards.yellows += 1;
          if (newCards.yellows >= 2) {
            newCards.yellows = 0;
            newCards.reds   += 1;
            cardMsg = " 🟡→🔴 Segunda amarilla para el rival. ¡Expulsado!";
          } else {
            cardMsg = " 🟡 Amarilla para el rival.";
          }
        } else {
          newCards.reds += 1;
          cardMsg = " 🔴 Roja directa para el rival. ¡Expulsado!";
        }
        setCardsBot(newCards);
      } else {
        const newCards = { ...currentCardsPlayer };
        if (isYellow) {
          newCards.yellows += 1;
          if (newCards.yellows >= 2) {
            newCards.yellows = 0;
            newCards.reds   += 1;
            cardMsg = " 🟡→🔴 Segunda amarilla tuya. ¡Expulsado!";
          } else {
            cardMsg = " 🟡 Amarilla para ti.";
          }
        } else {
          newCards.reds += 1;
          cardMsg = " 🔴 Roja directa para ti. ¡Expulsado!";
        }
        setCardsPlayer(newCards);
      }
    }

    const whoFouled = tackler === "bot" ? "¡Falta del rival!" : "¡Falta tuya!";
    const freeKickMsg = beneficiary === "player"
      ? " Se señala tiro libre a favor. ¡Nueva oportunidad de ataque!"
      : " Se señala tiro libre para el rival. ¡Prepárate para defender!";

    return {
      foul: true,
      beneficiary,
      message: `${whoFouled}${cardMsg}${freeKickMsg}`,
    };
  };

  const handleHint = () => {
    if (hintsLeft <= 0 || !opportunity) return;
    const { type, botDirection } = opportunity;
    const hintDir  = getHintDirection(botDirection);
    const messages = HINT_MESSAGES[type];
    setRevealedHints((prev) => [...prev, messages[hintIndex % messages.length](hintDir)]);
    setHintsLeft((prev)  => prev - 1);
    setHintIndex((prev)  => prev + 1);
  };

  // ── ATAQUE: jugador chuta (el bot puede haber hecho entrada silenciosa) ──
  const handleShoot = (playerDirection) => {
    const { botDirection, botTackles } = opportunity;

    if (botTackles) {
      // tackler=bot, beneficiary=player (el jugador atacaba)
      const result = resolveTackle("bot", "player", cardsPlayer, cardsBot);
      const logEntry = `Minuto ${minute}: Intentaste chutar por ${playerDirection}. El rival hizo una entrada. ${result.message}`;
      setLog((prev) => [...prev, logEntry]);
      setOpportunity(null);
      setRevealedHints([]);

      if (result.foul) {
        // Tiro libre: el jugador vuelve a atacar
        setEventMessage(result.message);
        generateOpportunity("attack");
      } else {
        setEventMessage(result.message);
        setIsPlaying(true);
      }
      return;
    }

    // Disparo normal
    const scored = playerDirection !== botDirection;
    const result = scored
      ? "¡Gol! El portero no pudo detenerlo."
      : "¡Fallaste! El portero adivinó tu disparo.";

    if (scored) {
      if (isPlayerLocal) setScoreLocal((prev) => prev + 1);
      else               setScoreVisitante((prev) => prev + 1);
    }
    setLog((prev) => [
      ...prev,
      `Minuto ${minute}: Atacaste por ${playerDirection}. El portero se lanzó a ${botDirection}. ${result}`,
    ]);
    setOpportunity(null);
    setRevealedHints([]);
    setIsPlaying(true);
  };

  // ── DEFENSA: jugador elige dirección para parar ──
  const handleSave = (playerDirection) => {
    const { botDirection } = opportunity;
    const saved = playerDirection === botDirection;
    const result = saved
      ? "¡Paraste el tiro! Elegiste correctamente."
      : "¡Gol en contra! No lograste detenerlo.";

    if (!saved) {
      if (isPlayerLocal) setScoreVisitante((prev) => prev + 1);
      else               setScoreLocal((prev) => prev + 1);
    }
    setLog((prev) => [
      ...prev,
      `Minuto ${minute}: El rival atacó por ${botDirection}. Elegiste ${playerDirection}. ${result}`,
    ]);
    setOpportunity(null);
    setRevealedHints([]);
    setIsPlaying(true);
  };

  // ── DEFENSA: jugador hace entrada ──
  const handleTackle = () => {
    // tackler=player, beneficiary=bot (el bot atacaba)
    const result = resolveTackle("player", "bot", cardsPlayer, cardsBot);
    const logEntry = `Minuto ${minute}: Hiciste una entrada. ${result.message}`;
    setLog((prev) => [...prev, logEntry]);
    setOpportunity(null);
    setRevealedHints([]);

    if (result.foul) {
      // Tiro libre: el bot vuelve a atacar → el jugador defiende
      setEventMessage(result.message);
      generateOpportunity("defense");
    } else {
      setEventMessage(result.message);
      setIsPlaying(true);
    }
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
    setHintsLeft(1);
    setRevealedHints([]);
    setHintIndex(0);
    setCardsPlayer({ yellows: 0, reds: 0 });
    setCardsBot({ yellows: 0, reds: 0 });
    setEventMessage(null);
  };

  const finalizarPartido = () => {
    const partidoInfo = JSON.parse(localStorage.getItem("partido_en_juego"));
    if (partidoInfo?.tipo === "playoff") {
      localStorage.setItem(
        "resultado_partido_playoff",
        JSON.stringify({
          golesLocal: scoreLocal,
          golesVisitante: scoreVisitante,
          ...partidoInfo,
          jugado: true,
        })
      );
      localStorage.removeItem("partido_en_juego");
    }
    navigate("/main-menu", {
      state: {
        resultado: {
          local: local.nombre,
          visitante: visitante.nombre,
          golesLocal: scoreLocal,
          golesVisitante: scoreVisitante,
          jugado: true,
        },
      },
      replace: true,
    });
  };

  const getLigaLogo = (ligaName) => {
    if (!ligaName)                        return "laliga";
    if (ligaName === "La Liga")           return "laliga";
    if (ligaName === "Liga 2")            return "laliga2";
    if (ligaName.startsWith("Primera"))   return "primera";
    if (ligaName.startsWith("Segunda"))   return "segunda";
    if (ligaName.startsWith("Tercera"))   return "tercera";
    return "laliga";
  };

  const renderCards = (cards, label) => (
    <div className="card-display">
      <span className="card-label">{label}</span>
      <span>
        {Array.from({ length: cards.yellows }).map((_, i) => (
          <span key={`y${i}`} className="card-icon">🟡</span>
        ))}
        {Array.from({ length: cards.reds }).map((_, i) => (
          <span key={`r${i}`} className="card-icon">🔴</span>
        ))}
        {cards.yellows === 0 && cards.reds === 0 && (
          <span className="no-cards">Sin tarjetas</span>
        )}
      </span>
    </div>
  );

  const playerName = isPlayerLocal ? local.nombre    : visitante.nombre;
  const rivalName  = isPlayerLocal ? visitante.nombre : local.nombre;

  return (
    <div className="new-game-page">
      <img
        src={"/assets/images/" + getLigaLogo(ligaSeleccionada) + ".png"}
        className="league-logo"
        alt="Liga logo"
      />

      {/* Marcador */}
      <div className="scoreboard">
        <div className="match-info">
          <p>
            <img src={local.imagen} alt={local.nombre} className="team-logo" />{" "}
            {local.nombre} {scoreLocal} - {scoreVisitante} {visitante.nombre}{" "}
            <img src={visitante.imagen} alt={visitante.nombre} className="team-logo" />
          </p>
        </div>
        <p>Minuto: {minute}</p>
      </div>

      {/* Panel de tarjetas */}
      <div className="cards-panel">
        <h3>Tarjetas</h3>
        <div className="cards-row">
          {renderCards(cardsPlayer, `${playerName} (tú)`)}
          {renderCards(cardsBot, rivalName)}
        </div>
        {cardsPlayer.reds > 0 && (
          <p className="red-card-warning">
            ⚠️ Tienes {cardsPlayer.reds} tarjeta(s) roja. Tu capacidad de ataque está penalizada.
          </p>
        )}
        {cardsBot.reds > 0 && (
          <p className="red-card-warning rival">
            ⚠️ El rival tiene {cardsBot.reds} tarjeta(s) roja.
          </p>
        )}
      </div>

      <button onClick={startGame} disabled={isPlaying || minute > 0}>
        {isPlaying ? "Jugando..." : "Iniciar Partido"}
      </button>

      {/* Evento especial reciente */}
      {eventMessage && !opportunity && (
        <div className="event-message">📢 {eventMessage}</div>
      )}

      <div className="events-log">
        <h2>Registro del Partido</h2>
        <ul>
          {log.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ul>

        {opportunity && (
          <div className="opportunity-panel">
            {/* Distingue tiro libre de oportunidad normal en el título */}
            <h2>
              {opportunity.type === "attack"
                ? eventMessage
                  ? "⚽ Tiro libre a favor. ¿Dónde chutas?"
                  : "¡Oportunidad a favor! ¿Dónde quieres chutar?"
                : eventMessage
                ? "🛡️ Tiro libre en contra. ¿Dónde te lanzas?"
                : "¡Oportunidad en contra! ¿Dónde te lanzas?"}
            </h2>

            {/* Pistas */}
            <div className="hints-section">
              <div className="hints-header">
                <span>🔍 Pistas disponibles: {hintsLeft}</span>
                {hintsLeft > 0 && revealedHints.length < 3 && (
                  <button className="hint-btn" onClick={handleHint}>
                    Pedir pista
                  </button>
                )}
                {hintsLeft === 0 && revealedHints.length === 0 && (
                  <span className="no-hints">Sin pistas restantes</span>
                )}
              </div>
              {revealedHints.length > 0 && (
                <ul className="hints-list">
                  {revealedHints.map((hint, i) => (
                    <li key={i} className="hint-item">💡 {hint}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Botones */}
            {opportunity.type === "attack" ? (
              <div className="direction-buttons">
                <button onClick={() => handleShoot("izquierda")}>⬅ Izquierda</button>
                <button onClick={() => handleShoot("medio")}>⬆ Medio</button>
                <button onClick={() => handleShoot("derecha")}>➡ Derecha</button>
              </div>
            ) : (
              <>
                <div className="direction-buttons">
                  <button onClick={() => handleSave("izquierda")}>⬅ Izquierda</button>
                  <button onClick={() => handleSave("medio")}>⬆ Medio</button>
                  <button onClick={() => handleSave("derecha")}>➡ Derecha</button>
                </div>
                {/* En tiro libre no hay entradas; fuera de tiro libre, solo si canPlayerTackle */}
                {!opportunity.isFreeKick && opportunity.canPlayerTackle && (
                  <div className="tackle-section">
                    <button className="tackle-btn" onClick={handleTackle}>
                      🦵 Hacer entrada
                    </button>
                    <span className="tackle-hint">
                      Cancela el ataque rival, pero puedes cometer falta o llevarte tarjeta.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {minute === 90 && (
        <button onClick={finalizarPartido}>
          Finalizar Partido y Volver al Menú
        </button>
      )}
    </div>
  );
};

export default NewGamePage;
