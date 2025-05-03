import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import generatePlayoffs from "../generation/playoffGenerator";

function PlayoffsMenu() {
    const [playoffs, setPlayoffs] = useState({});
    const [ligaSeleccionada, setLigaSeleccionada] = useState("");
    const [rondas, setRondas] = useState([]);
    const [rondaActiva, setRondaActiva] = useState(0);
    const navigate = useNavigate();
    const [ascendidos, setAscendidos] = useState({});

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("playoffs_brackets")) || {};
        setPlayoffs(stored);
        const storedAscendidos = JSON.parse(localStorage.getItem("ascendidos_playoffs")) || {};
        setAscendidos(storedAscendidos);
        const ligas = Object.keys(stored);
        if (ligas.length > 0) {
            setLigaSeleccionada(ligas[0]);
            const liga = stored[ligas[0]];
            setRondas(liga.rondas || liga.brackets || []);
        }
    }, []);

    useEffect(() => {
        if (ligaSeleccionada && playoffs[ligaSeleccionada]) {
            const liga = playoffs[ligaSeleccionada];
            setRondas(liga.rondas || liga.brackets || []);
            setRondaActiva(0);
        }
    }, [ligaSeleccionada]);

    const jugarPartido = (match, rondaIndex, partidoIndex, bracketIndex = null) => {
        const nuevasRondas = [...rondas];
        const partido = { ...match };
        const ligaData = playoffs[ligaSeleccionada];

        if (partido.golesLocalIda == null) {
            partido.golesLocalIda = Math.floor(Math.random() * 5);
            partido.golesVisitanteIda = Math.floor(Math.random() * 5);
        } else if (partido.golesLocalVuelta == null) {
            partido.golesLocalVuelta = Math.floor(Math.random() * 5);
            partido.golesVisitanteVuelta = Math.floor(Math.random() * 5);
            partido.jugado = true;
        }

                    // ✅ Guardar perdedores en descenso directo
            if (ligaData?.tipo === "descenso_directo" && partido.jugado) {
                const perdedor = getPerdedorDeCruce(partido);
                if (perdedor) {
                const descendidos = JSON.parse(localStorage.getItem("equipos_descendidos")) || [];
                if (!descendidos.includes(perdedor.nombre)) {
                    descendidos.push(perdedor.nombre);
                    localStorage.setItem("equipos_descendidos", JSON.stringify(descendidos));
                }
                }
            }

        if (ligaSeleccionada === "Segunda RFEF" || ligaData?.tipo === "tercera") {
            const bracket = nuevasRondas[bracketIndex];
            if (rondaIndex === "semifinales") {
                bracket.semifinales[partidoIndex] = partido;
            } else if (rondaIndex === "final") {
                bracket.final[partidoIndex] = partido;
            } else if (rondaIndex === "ascenso") {
                // finales globales de tercera
                playoffs[ligaSeleccionada].finales[partidoIndex] = partido;
            }
        } else if (ligaData?.tipo === "descenso_directo") {
            // No usamos nuevasRondas, sino actualizamos directamente los partidos
            const updated = { ...playoffs };
            updated[ligaSeleccionada].partidos[partidoIndex] = partido;
            setPlayoffs(updated);
            localStorage.setItem("playoffs_brackets", JSON.stringify(updated));
            return;
        }else {
            if (bracketIndex !== null) {
                nuevasRondas[rondaIndex][bracketIndex][partidoIndex] = partido;
            } else {
                nuevasRondas[rondaIndex][partidoIndex] = partido;
            }
        }
        

        const updated = { ...playoffs };
        if (updated[ligaSeleccionada].rondas) {
            updated[ligaSeleccionada].rondas = nuevasRondas;
        } else {
            updated[ligaSeleccionada].brackets = nuevasRondas;
        }

        setPlayoffs(updated);
        setRondas(nuevasRondas);
        localStorage.setItem("playoffs_brackets", JSON.stringify(updated));
        const isFinal =
    ligaSeleccionada === "Segunda RFEF"
        ? rondaIndex === "final"
        : rondaActiva === (playoffs[ligaSeleccionada]?.rondas?.length || 1) - 1;

        // Solo marcar ascenso si es una final real de ascenso, no autonómica
        const esTerceraFinalDeAscenso = ligaData?.tipo === "tercera" && rondaIndex === "ascenso";
        const esFinalDeAscensoNormal = ligaData?.tipo !== "tercera" && isFinal;

        if ((esFinalDeAscensoNormal || esTerceraFinalDeAscenso) && partido.jugado) {
            const ganador = getGanadorDeCruce(partido);
            if (ganador) {
                // Guardar en ascendidos visibles
                setAscendidos(prev => {
                    const ligaAscensos = prev[ligaSeleccionada] || [];
                    if (ligaAscensos.includes(ganador.nombre)) return prev;
                    const actualizados = {
                        ...prev,
                        [ligaSeleccionada]: [...ligaAscensos, ganador.nombre]
                    };
                    localStorage.setItem("ascendidos_playoffs", JSON.stringify(actualizados));
                    return actualizados;
                });
        
                // Guardar en claves específicas de ascensos por playoff
                const claveAscensoPlayoff = {
                    "Liga 2": "ascensoPlayoff_Liga2",
                    "Primera RFEF": "ascensoPlayoff_PrimeraRFEF",
                    "Segunda RFEF": "ascensoPlayoff_SegundaRFEF",
                    "Tercera RFEF": "ascensoPlayoff_TerceraRFEF"
                }[ligaSeleccionada];
        
                if (claveAscensoPlayoff) {
                    const actuales = JSON.parse(localStorage.getItem(claveAscensoPlayoff)) || [];
                    if (!actuales.includes(ganador.nombre)) {
                        actuales.push(ganador.nombre);
                        localStorage.setItem(claveAscensoPlayoff, JSON.stringify(actuales));
                    }
                }
            }
        }
    };

    const avanzarAFinal = (bracketIndex) => {
        const updated = { ...playoffs };
        const liga = updated[ligaSeleccionada];
    
        if (!liga || !liga.brackets) return;
    
        const bracket = liga.brackets[bracketIndex];
        if (!bracket.semifinales.every(p => p.jugado)) return;
    
        const ganadores = bracket.semifinales.map(getGanadorDeCruce);
        if (ganadores.some(g => !g)) return;
    
        bracket.final = [createIdaYVueltaMatch(ganadores[0], ganadores[1])];
        updated[ligaSeleccionada].brackets = liga.brackets;
    
        setPlayoffs(updated);
        setRondas(liga.brackets);
        localStorage.setItem("playoffs_brackets", JSON.stringify(updated));
    };
    const sortearFinalesTercera = () => {
        const updated = { ...playoffs };
        const ganadores = updated["Tercera RFEF"].brackets.map(b => getGanadorDeCruce(b.final[0]));
    
        // Sorteo aleatorio sin repetir
        const mezclados = [...ganadores].sort(() => Math.random() - 0.5);
        const finales = [];
    
        for (let i = 0; i < mezclados.length; i += 2) {
            if (mezclados[i + 1]) {
                finales.push(createIdaYVueltaMatch(mezclados[i], mezclados[i + 1]));
            }
        }
    
        updated["Tercera RFEF"].finales = finales;
        setPlayoffs(updated);
        localStorage.setItem("playoffs_brackets", JSON.stringify(updated));
    };
    const avanzarFinalGeneral = () => {
        const updated = { ...playoffs };
        const liga = updated[ligaSeleccionada];
        const rondaActual = liga.rondas[rondaActiva];

        if (!rondaActual) return;

        if (Array.isArray(rondaActual[0])) {
            // Primera RFEF: múltiples brackets
            const finales = rondaActual.map(bracket => {
                const g1 = getGanadorDeCruce(bracket[0]);
                const g2 = getGanadorDeCruce(bracket[1]);
                if (!g1 || !g2) return null;
                return createIdaYVueltaMatch(g1, g2);
            }).filter(Boolean);

            liga.rondas[rondaActiva + 1] = finales;
        } else {
            // Liga 2 u otras
            const g1 = getGanadorDeCruce(rondaActual[0]);
            const g2 = getGanadorDeCruce(rondaActual[1]);
            if (!g1 || !g2) return;

            liga.rondas[rondaActiva + 1] = [createIdaYVueltaMatch(g1, g2)];
        }

        liga.finalPendiente = false;
        setPlayoffs(updated);
        setRondas(liga.rondas);
        setRondaActiva(rondaActiva + 1);
        localStorage.setItem("playoffs_brackets", JSON.stringify(updated));
    };

    const renderMatch = (match, rondaIndex, partidoIndex, bracketIndex = null) => (
        <div key={`${rondaIndex}-${partidoIndex}`} style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {match.local?.imagen && (
                    <img 
                        src={match.local.imagen} 
                        alt="escudo local" 
                        style={{ height: "2em", width: "auto"}} 
                    />
                )}
                <strong>{match.local?.nombre}</strong>
                <span>vs</span>
                <strong>{match.visitante?.nombre}</strong>
                {match.visitante?.imagen && (
                    <img 
                        src={match.visitante.imagen} 
                        alt="escudo visitante" 
                        style={{ height: "2em", width: "auto" }} 
                    />
                )}
            </div>
            <div>
                Ida: {match.golesLocalIda ?? "-"} - {match.golesVisitanteIda ?? "-"} | 
                Vuelta: {match.golesLocalVuelta ?? "-"} - {match.golesVisitanteVuelta ?? "-"}
            </div>
            {!match.jugado && (
                <button onClick={() => jugarPartido(match, rondaIndex, partidoIndex, bracketIndex)}>
                    Jugar {match.golesLocalIda == null ? "Ida" : "Vuelta"}
                </button>
            )}
            {match.jugado && rondaIndex == 1 && (
                <p style={{ fontWeight: "bold", color: "#28a745" }}>
                    🏆 Asciende: {getGanadorDeCruce(match)?.nombre}
                </p>
            )}
        </div>
    );

    const renderContenido = () => {
        const ligaData = playoffs[ligaSeleccionada];

        if (ligaData?.tipo === "brackets" || ligaData?.tipo === "tercera") {
            return (
                <div>
                    {ligaData.brackets.map((bracket, bracketIndex) => (
                        <div key={bracketIndex} style={{ border: "1px solid #ccc", marginBottom: "20px", padding: "10px" }}>
                            <h3>{bracket.liga || `Bracket ${bracketIndex + 1}`}</h3>
                            <h4>Semifinales</h4>
                            {bracket.semifinales.map((match, i) =>
                                renderMatch(match, "semifinales", i, bracketIndex)
                            )}
                            <button
                                onClick={() => avanzarAFinal(bracketIndex)}
                                disabled={!bracket.semifinales.every(p => p.jugado)}
                                style={{
                                    margin: "10px 0",
                                    padding: "8px 12px",
                                    backgroundColor: bracket.semifinales.every(p => p.jugado) ? "#28a745" : "#ccc",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: bracket.semifinales.every(p => p.jugado) ? "pointer" : "not-allowed"
                                }}
                            >
                                Avanzar a Final
                            </button>
            
                            {bracket.final.length > 0 && (
                                <>
                                    <h4>Final</h4>
                                    {bracket.final.map((match, i) =>
                                        renderMatch(match, "final", i, bracketIndex)
                                    )}
                                </>
                            )}
                        </div>
                    ))}
            
                    {ligaData.tipo === "tercera" && ligaData.brackets.every(b => b.final.length > 0 && b.final[0].jugado) && (
                        <button
                            onClick={sortearFinalesTercera}
                            style={{
                                marginTop: "20px",
                                padding: "10px 20px",
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                fontWeight: "bold"
                            }}
                        >
                            Avanzar a Finales de Ascenso
                        </button>
                    )}
            
                    {ligaData.tipo === "tercera" && ligaData.finales?.length > 0 && (
                        <>
                            <h2>Finales de Ascenso</h2>
                            {ligaData.finales.map((match, i) => (
                                <div key={`ascenso-${i}`} style={{ borderTop: "1px solid #ccc", paddingTop: "10px" }}>
                                    {renderMatch(match, "ascenso", i)}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            );
        } else // 🔁 Mostrar partidos de descenso directo
        if (ligaData?.tipo === "descenso_directo" && Array.isArray(ligaData.partidos)) {
          return (
            <div>
              <h3 style={{ marginBottom: "10px" }}>⛔ Descenso directo — pierden y descienden</h3>
              {ligaData.partidos.map((match, i) => (
                <div key={i} style={{ marginBottom: "15px", padding: "10px", border: "1px solid #ccc" }}>
                  <div>
                    <strong>{match.local?.nombre}</strong> vs <strong>{match.visitante?.nombre}</strong>
                  </div>
                  <div>
                    Ida: {match.golesLocalIda ?? "-"} - {match.golesVisitanteIda ?? "-"} | 
                    Vuelta: {match.golesLocalVuelta ?? "-"} - {match.golesVisitanteVuelta ?? "-"}
                  </div>
                  {!match.jugado && (
                    <button onClick={() => jugarPartido(match, 0, i)}>
                    Jugar {match.golesLocalIda == null ? "Ida" : "Vuelta"}
                    </button>
                  )}
                  {match.jugado && (
                    <p style={{ fontWeight: "bold", color: "#dc3545" }}>
                      ❌ Desciende: {getPerdedorDeCruce(match)?.nombre}
                    </p>
                  )}
                </div>
              ))}
            </div>
          );
        }
         else {
            const rondaActual = Array.isArray(rondas) && rondas.length > rondaActiva ? rondas[rondaActiva] : null;
            const esFinalPendiente = ligaData?.finalPendiente;

            if (!rondaActual || !Array.isArray(rondaActual)) {
                return <p style={{ fontStyle: "italic", color: "#888" }}>No hay partidos para mostrar.</p>;
            }

            const completado = Array.isArray(rondaActual[0])
                ? rondaActual.every(bracket => bracket.every(p => p.jugado))
                : rondaActual.every(p => p.jugado);

            return (
                <>
                    {Array.isArray(rondaActual[0])
                        ? rondaActual.map((bracket, bIndex) => (
                            <div key={bIndex} style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc" }}>
                                <h3>Bracket {bIndex + 1}</h3>
                                {bracket.map((match, i) => renderMatch(match, rondaActiva, i, bIndex))}
                            </div>
                        ))
                        : rondaActual.map((match, i) => renderMatch(match, rondaActiva, i))
                    }

                    {esFinalPendiente && completado && (
                        <button
                            onClick={avanzarFinalGeneral}
                            style={{
                                marginTop: "15px",
                                padding: "10px 20px",
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "5px",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >
                            Avanzar a Final
                        </button>
                    )}
                </>
            );
        }
    };

    return (
        <div>
            <h2>Playoffs</h2>
            
            <select
                value={ligaSeleccionada}
                onChange={(e) => setLigaSeleccionada(e.target.value)}
            >
                {Object.keys(playoffs).map((liga, index) => (
                    <option key={index} value={liga}>{liga}</option>
                ))}
            </select>

            <div style={{ marginTop: "20px" }}>{renderContenido()}</div>
            <div style={{ display: "flex" }}>
                {/* Panel lateral izquierdo */}
                <div style={{ width: "250px", marginRight: "30px" }}>
                    <h3 style={{ borderBottom: "1px solid #ccc" }}>🏆 Ascendidos</h3>
                    {Object.entries(ascendidos).map(([liga, equipos]) => (
                    <div key={liga}>
                        <strong>{liga}:</strong>
                        <ul>
                        {equipos.map((nombre, i) => (
                            <li key={i}>{nombre}</li>
                        ))}
                        </ul>
                    </div>
                    ))}
                </div>

                {/* Contenido principal de playoffs */}
                </div>
                {/* Finalizar temporada */}
                <button
                    disabled={!playoffsCompletados(playoffs)}
                    onClick={() => {
                        localStorage.setItem("esLigaPrimera", JSON.stringify(false));
                        const nLIga = JSON.parse(localStorage.getItem("numLigas") || "[]");
                        localStorage.setItem("numLigas", JSON.stringify(nLIga+1));
                        window.location.href = "/league-generation";
                    }}
                    style={{
                        marginTop: "40px",
                        padding: "12px 20px",
                        backgroundColor: playoffsCompletados(playoffs) ? "#28a745" : "#ccc",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "bold",
                        fontSize: "16px",
                        cursor: playoffsCompletados(playoffs) ? "pointer" : "not-allowed"
                    }}
                >
                    Finalizar temporada y generar nuevas ligas
                </button>
        </div>
        
        
    );
}

export default PlayoffsMenu;

// Helpers
function playoffsCompletados(playoffs) {
    return Object.values(playoffs).every(liga => {
        if (liga.tipo === "brackets") {
            return liga.brackets.every(bracket => {
                const semisJugadas = bracket.semifinales.every(p => p.jugado);
                const finalJugadas = bracket.final.length === 0 || bracket.final.every(p => p.jugado);
                return semisJugadas && finalJugadas;
            });
        } else if (liga.rondas) {
            return liga.rondas.every(ronda => {
                if (Array.isArray(ronda[0])) {
                    // Múltiples brackets por ronda
                    return ronda.every(bracket => bracket.every(p => p.jugado));
                }
                return ronda.every(p => p.jugado);
            });
        }
        return true;
    });
}
function getGanadorDeCruce(p) {
    if (!p || !p.local || !p.visitante) return null;
    const totalLocal = (p.golesLocalIda ?? 0) + (p.golesLocalVuelta ?? 0);
    const totalVisitante = (p.golesVisitanteIda ?? 0) + (p.golesVisitanteVuelta ?? 0);
    if (totalLocal > totalVisitante) return p.local;
    if (totalVisitante > totalLocal) return p.visitante;
    return p.local.posicion < p.visitante.posicion ? p.local : p.visitante;
}

function createIdaYVueltaMatch(local, visitante) {
    if (!local || !visitante) return null;
    return {
        local,
        visitante,
        golesLocalIda: null,
        golesVisitanteIda: null,
        golesLocalVuelta: null,
        golesVisitanteVuelta: null,
        jugado: false,
        vueltaEnCasaDe: local.posicion < visitante.posicion ? local.nombre : visitante.nombre
    };
}

function getPerdedorDeCruce(p) {
    if (!p || !p.local || !p.visitante) return null;
    const totalLocal = (p.golesLocalIda ?? 0) + (p.golesLocalVuelta ?? 0);
    const totalVisitante = (p.golesVisitanteIda ?? 0) + (p.golesVisitanteVuelta ?? 0);
    if (totalLocal > totalVisitante) return p.visitante;
    if (totalVisitante > totalLocal) return p.local;
    return p.local.posicion > p.visitante.posicion ? p.local : p.visitante;
  }