import { useState, useEffect } from "react";
import "../styles/mainmenu/LeagueMenu.css";
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import generatePlayoffs from "../generation/playoffGenerator";

function LeagueMenu() {
    const [jornadas, setJornadas] = useState([]);
    const [clasificacion, setClasificacion] = useState([]);
    const [jornadaActual, setJornadaActual] = useState(0);
    const [jornadaActiva, setJornadaActiva] = useState(0);
    const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
    const [partidosPendientes, setPartidosPendientes] = useState([]);
    const [modalType, setModalType] = useState(null);
    const [ligaSeleccionada, setLigaSeleccionada] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const navigate = useNavigate(); // Hook para redirigir
    const location = useLocation();
    const state = location.state || {};
    const { local, visitante, golesLocal, golesVisitante } = state;
    const [ligasDisponibles, setLigasDisponibles] = useState([]);
    const [numDescenso, setNumDescenso] = useState(3); // Valor por defecto
    const [numAscenso, setNumAscenso] = useState(0);
    const [numPlayoff, setNumPlayoff] = useState(0);
    const [numPlayoffDescenso, setNumPlayOffDescenso] = useState(0);
    const [ligaFinalizada, setLigaFinalizada] = useState(false);

    useEffect(() => {
        const calendarioObj = JSON.parse(sessionStorage.getItem("calendario")) || {};
        const clasificacionObj = JSON.parse(localStorage.getItem("clasificacion")) || {};
        const equipos = JSON.parse(localStorage.getItem("equipos")) || [];
        const ascensosObj = JSON.parse(localStorage.getItem("ascensos")) || {};
        const playoffsObj = JSON.parse(localStorage.getItem("playoffs")) || {};
        const desPlayoffsObj = JSON.parse(localStorage.getItem("playoffsDescenso"));
        const ligas = Object.keys(calendarioObj);
        setLigasDisponibles(ligas);
    
        const liga = ligaSeleccionada || ligas[0];
        if (!ligaSeleccionada) setLigaSeleccionada(liga); // solo la primera vez
    
        const calendario = calendarioObj[liga] || [];
        const clasificacionData = clasificacionObj[liga] || [];
    
        const seleccionados = equipos.filter((equipo) => equipo.player && equipo.liga === liga);
        const descensosObj = JSON.parse(localStorage.getItem("descensos")) || {};
        setNumAscenso(ascensosObj[liga] || 0);
        setNumPlayoff(playoffsObj[liga] || 0);
        setNumPlayOffDescenso()
        setNumDescenso(descensosObj[liga] || 3);        setEquiposSeleccionados(seleccionados);
        setJornadas(calendario);
        setClasificacion(clasificacionData);
        

        
        if (state.resultado && Array.isArray(calendario[jornadaActiva])) {
            const nuevaJornada = [...calendario[jornadaActiva]];
            const index = nuevaJornada.findIndex(
                (p) =>
                    p.local.nombre === state.resultado.local &&
                    p.visitante.nombre === state.resultado.visitante
            );
            if (index !== -1) {
                nuevaJornada[index] = {
                    ...nuevaJornada[index],
                    golesLocal: state.resultado.golesLocal,
                    golesVisitante: state.resultado.golesVisitante,
                    jugado: true
                };
    
                calendario[jornadaActiva] = nuevaJornada;
                calendarioObj[liga] = calendario;
                sessionStorage.setItem("calendario", JSON.stringify(calendarioObj));
                setJornadas(calendario);
            }
        }
    
        const primeraJornadaNoCompletada = calendario.findIndex((jornada) =>
            jornada.some((partido) => !partido.jugado)
        );
    
        if (primeraJornadaNoCompletada !== -1) {
            setJornadaActiva(primeraJornadaNoCompletada);
            const jornadaPendiente = calendario[primeraJornadaNoCompletada].filter(
                (partido) =>
                    !partido.jugado &&
                    seleccionados.some(
                        (e) => e.id === partido.local.id || e.id === partido.visitante.id
                    )
            );
            setPartidosPendientes(jornadaPendiente);
        } else {
            setPartidosPendientes([]);
        }
        const todasFinalizadas = ligas.every(liga => {
            const calendarioLiga = calendarioObj[liga];
            return calendarioLiga?.every(jornada =>
                jornada.every(partido => partido.jugado)
            );
        });
        
        if (todasFinalizadas) {
            const clasificacion = JSON.parse(localStorage.getItem("clasificacion")) || {};

             // 🟩 Cálculo de ascensos y descensos con ordenación inline
             const ascensoDirecto_Liga2 = (clasificacion["Liga 2"] || [])
             .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))
             .slice(0, 2)
             .map(e => e.nombre);
 
             const ascensoDirecto_PrimeraRFEF = [
             (clasificacion["Primera RFEF - Grupo 1"] || [])
                 .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))[0]?.nombre,
             (clasificacion["Primera RFEF - Grupo 2"] || [])
                 .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))[0]?.nombre
             ].filter(Boolean);
 
             const ascensoDirecto_SegundaRFEF = Array.from({ length: 5 }, (_, i) =>
             (clasificacion[`Segunda RFEF - Grupo ${i + 1}`] || [])
                 .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))[0]?.nombre
             ).filter(Boolean);
 
             const ascensoDirecto_TerceraRFEF = Array.from({ length: 18 }, (_, i) =>
             (clasificacion[`Tercera RFEF - Grupo ${i + 1}`] || [])
                 .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))[0]?.nombre
             ).filter(Boolean);
 
             // Descensos
             const descenso_LaLiga = (clasificacion["La Liga"] || [])
             .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))
             .slice(-3)
             .map(e => e.nombre);
 
             const descenso_Liga2 = (clasificacion["Liga 2"] || [])
             .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))
             .slice(-4)
             .map(e => e.nombre);
 
             const descenso_PrimeraRFEF = Array.from({ length: 2 }, (_, i) =>
             (clasificacion[`Primera RFEF - Grupo ${i + 1}`] || [])
                 .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))
                 .slice(-5)
                 .map(e => e.nombre)
             ).flat().filter(Boolean);
 
             const descenso_SegundaRFEF = Array.from({ length: 5 }, (_, i) =>
             (clasificacion[`Segunda RFEF - Grupo ${i + 1}`] || [])
                 .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))
                 .slice(-5)
                 .map(e => e.nombre)
             ).flat().filter(Boolean);            
            const playoffs = generatePlayoffs(clasificacion);
            localStorage.setItem("ascensoDirecto_Liga2", JSON.stringify(ascensoDirecto_Liga2));
            localStorage.setItem("ascensoDirecto_PrimeraRFEF", JSON.stringify(ascensoDirecto_PrimeraRFEF));
            localStorage.setItem("ascensoDirecto_SegundaRFEF", JSON.stringify(ascensoDirecto_SegundaRFEF));
            localStorage.setItem("ascensoDirecto_TerceraRFEF", JSON.stringify(ascensoDirecto_TerceraRFEF));
            localStorage.setItem("descenso_LaLiga", JSON.stringify(descenso_LaLiga));
            localStorage.setItem("descenso_Liga2", JSON.stringify(descenso_Liga2));
            localStorage.setItem("descenso_PrimeraRFEF", JSON.stringify(descenso_PrimeraRFEF));
            localStorage.setItem("descenso_SegundaRFEF", JSON.stringify(descenso_SegundaRFEF));
            localStorage.setItem("playoffs_brackets", JSON.stringify(playoffs));
            navigate("/playoffs-menu");
        }
    }, [ligaSeleccionada, state.resultado, jornadaActiva]);
        
    useEffect(() => {
            if (jornadas.length > 0) {
                const finalizada = jornadas.every(jornada =>
                    jornada.every(partido => partido.jugado)
                );
                setLigaFinalizada(finalizada);
            }
        }, [jornadas]);
        const simularTodasLasLigas = () => {
            const calendario = JSON.parse(sessionStorage.getItem("calendario")) || {};
            const clasificacion = JSON.parse(localStorage.getItem("clasificacion")) || {};
            const ligas = Object.keys(calendario);
        
            ligas.forEach(liga => {
                calendario[liga] = calendario[liga].map(jornada =>
                    jornada.map(partido => {
                        if (!partido.jugado) {
                            const golesLocal = Math.floor(Math.random() * 5);
                            const golesVisitante = Math.floor(Math.random() * 5);
                            return {
                                ...partido,
                                golesLocal,
                                golesVisitante,
                                jugado: true
                            };
                        }
                        return partido;
                    })
                );
        
                // Recalcular clasificación
                const equipos = clasificacion[liga] || [];
                const nuevos = equipos.map(e => ({ ...e, puntos: 0, partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, golesFavor: 0, golesContra: 0 }));
                calendario[liga].flat().forEach(p => {
                    const local = nuevos.find(e => e.id === p.local.id);
                    const visitante = nuevos.find(e => e.id === p.visitante.id);
                    if (!local || !visitante) return;
        
                    local.partidosJugados += 1;
                    visitante.partidosJugados += 1;
                    local.golesFavor += p.golesLocal;
                    local.golesContra += p.golesVisitante;
                    visitante.golesFavor += p.golesVisitante;
                    visitante.golesContra += p.golesLocal;
        
                    if (p.golesLocal > p.golesVisitante) {
                        local.victorias += 1;
                        local.puntos += 3;
                        visitante.derrotas += 1;
                    } else if (p.golesLocal < p.golesVisitante) {
                        visitante.victorias += 1;
                        visitante.puntos += 3;
                        local.derrotas += 1;
                    } else {
                        local.empates += 1;
                        visitante.empates += 1;
                        local.puntos += 1;
                        visitante.puntos += 1;
                    }
                });
        
                clasificacion[liga] = nuevos;
            });
        
            sessionStorage.setItem("calendario", JSON.stringify(calendario));
            localStorage.setItem("clasificacion", JSON.stringify(clasificacion));
        
            // 🟩 Cálculo de ascensos y descensos con ordenación inline
            const ascensoDirecto_Liga2 = (clasificacion["Liga 2"] || [])
            .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))
            .slice(0, 2)
            .map(e => e.nombre);

            const ascensoDirecto_PrimeraRFEF = [
            (clasificacion["Primera RFEF - Grupo 1"] || [])
                .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))[0]?.nombre,
            (clasificacion["Primera RFEF - Grupo 2"] || [])
                .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))[0]?.nombre
            ].filter(Boolean);

            const ascensoDirecto_SegundaRFEF = Array.from({ length: 5 }, (_, i) =>
            (clasificacion[`Segunda RFEF - Grupo ${i + 1}`] || [])
                .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))[0]?.nombre
            ).filter(Boolean);

            const ascensoDirecto_TerceraRFEF = Array.from({ length: 18 }, (_, i) =>
            (clasificacion[`Tercera RFEF - Grupo ${i + 1}`] || [])
                .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))[0]?.nombre
            ).filter(Boolean);

            // Descensos
            const descenso_LaLiga = (clasificacion["La Liga"] || [])
            .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))
            .slice(-3)
            .map(e => e.nombre);

            const descenso_Liga2 = (clasificacion["Liga 2"] || [])
            .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))
            .slice(-4)
            .map(e => e.nombre);

            const descenso_PrimeraRFEF = Array.from({ length: 2 }, (_, i) =>
            (clasificacion[`Primera RFEF - Grupo ${i + 1}`] || [])
                .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))
                .slice(-5)
                .map(e => e.nombre)
            ).flat().filter(Boolean);

            const descenso_SegundaRFEF = Array.from({ length: 5 }, (_, i) =>
            (clasificacion[`Segunda RFEF - Grupo ${i + 1}`] || [])
                .sort((a, b) => b.puntos - a.puntos || ((b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra)))
                .slice(-5)
                .map(e => e.nombre)
            ).flat().filter(Boolean);
            // Guardar en localStorage
            localStorage.setItem("ascensoDirecto_Liga2", JSON.stringify(ascensoDirecto_Liga2));
            localStorage.setItem("ascensoDirecto_PrimeraRFEF", JSON.stringify(ascensoDirecto_PrimeraRFEF));
            localStorage.setItem("ascensoDirecto_SegundaRFEF", JSON.stringify(ascensoDirecto_SegundaRFEF));
            localStorage.setItem("ascensoDirecto_TerceraRFEF", JSON.stringify(ascensoDirecto_TerceraRFEF));
            localStorage.setItem("descenso_LaLiga", JSON.stringify(descenso_LaLiga));
            localStorage.setItem("descenso_Liga2", JSON.stringify(descenso_Liga2));
            localStorage.setItem("descenso_PrimeraRFEF", JSON.stringify(descenso_PrimeraRFEF));
            localStorage.setItem("descenso_SegundaRFEF", JSON.stringify(descenso_SegundaRFEF));
        
            // Playoffs
            const playoffs = generatePlayoffs(clasificacion);
            localStorage.setItem("playoffs_brackets", JSON.stringify(playoffs));
        
            // 🔁 Redirigir al menú de playoffs
            navigate("/playoffs-menu");
        };
        
    const jugarPartido = (local, visitante) => {
        const esControlado = local.player || visitante.player;
    
        if (esControlado) {
            const equipoJugador = local.player ? local : visitante;
            // En lugar de navegar aquí, indicamos que es un partido controlado
            return { 
                esControlado: true,
                equipoJugador,
                local,
                visitante
            };
        } else {
            // Para partidos simulados, retornamos el resultado directamente
            let golesLocal = Math.floor(Math.random() * 5);
            let golesVisitante = Math.floor(Math.random() * 5);
            return { 
                esControlado: false,
                golesLocal, 
                golesVisitante 
            };
        }
    };

    const actualizarClasificacion = (jornada) => {
        const nuevaClasificacion = clasificacion.map(equipo => ({ ...equipo })); // ✅ copia profunda
    
        jornada.forEach((partido) => {
            const { local, visitante, golesLocal, golesVisitante } = partido;
    
            const equipoLocal = nuevaClasificacion.find((e) => e.id === local.id);
            const equipoVisitante = nuevaClasificacion.find((e) => e.id === visitante.id);
    
            if (!equipoLocal || !equipoVisitante) return;
    
            equipoLocal.partidosJugados += 1;
            equipoVisitante.partidosJugados += 1;
    
            equipoLocal.golesFavor += golesLocal;
            equipoLocal.golesContra += golesVisitante;
            equipoVisitante.golesFavor += golesVisitante;
            equipoVisitante.golesContra += golesLocal;
    
            if (golesLocal > golesVisitante) {
                equipoLocal.victorias += 1;
                equipoLocal.puntos += 3;
                equipoVisitante.derrotas += 1;
            } else if (golesLocal < golesVisitante) {
                equipoVisitante.victorias += 1;
                equipoVisitante.puntos += 3;
                equipoLocal.derrotas += 1;
            } else {
                equipoLocal.empates += 1;
                equipoVisitante.empates += 1;
                equipoLocal.puntos += 1;
                equipoVisitante.puntos += 1;
            }
        });
    
        setClasificacion(nuevaClasificacion);

        const clasificacionGuardada = JSON.parse(localStorage.getItem("clasificacion")) || {};
        clasificacionGuardada[ligaSeleccionada] = nuevaClasificacion;
        localStorage.setItem("clasificacion", JSON.stringify(clasificacionGuardada));
    };

const jugarRestoPartidos = () => {
    const nuevaJornada = Array.isArray(jornadas[jornadaActiva])
    ? [...jornadas[jornadaActiva]]
    : [];
    nuevaJornada.forEach((partido, index) => {
        if (!partido.jugado) {
            const resultado = jugarPartido(partido.local, partido.visitante);
            nuevaJornada[index] = { ...partido, ...resultado, jugado: true }; // <-- Debe ser true
            partido.jugado = true;
        }
    });

    setJornadas((prev) => {
        const nuevasJornadas = [...prev];
        nuevasJornadas[jornadaActiva] = nuevaJornada;
    
        // Recuperamos el calendario actual completo desde localStorage
        const calendarioGuardado = JSON.parse(sessionStorage.getItem("calendario")) || {};
        calendarioGuardado[ligaSeleccionada] = nuevasJornadas; // ✅ Solo actualizamos la liga activa
    
        sessionStorage.setItem("calendario", JSON.stringify(calendarioGuardado));
        return nuevasJornadas;
    });
    const nuevosPendientes = nuevaJornada.filter(
        (p) =>
            !p.jugado &&
            equiposSeleccionados.some(
                (e) => e.id === p.local.id || e.id === p.visitante.id
            )
    );
    setPartidosPendientes(nuevosPendientes);
    actualizarClasificacion(nuevaJornada);
    avanzarJornada();
};


const jugarPartidoJugador = (partido) => {
    if (partido.jugado) {
        console.log("Este partido ya ha sido jugado");
        return;
    }
    const resultado = jugarPartido(partido.local, partido.visitante);
    
    if (resultado.esControlado) {
        navigate("/new-game", {
            state: { 
                local: resultado.local, 
                visitante: resultado.visitante, 
                equipoJugador: resultado.equipoJugador,
                jornadaActiva: jornadaActiva
            }
        });
    } else {
        // Si es un partido simulado, actualizamos el resultado normalmente
        const nuevaJornada = [...jornadas[jornadaActiva]];
        const index = nuevaJornada.findIndex(
            (p) => p.local.id === partido.local.id && p.visitante.id === partido.visitante.id
        );

        if (index !== -1) {
            nuevaJornada[index] = {
                ...nuevaJornada[index],
                golesLocal: resultado.golesLocal,
                golesVisitante: resultado.golesVisitante,
                jugado: true
            };

            setJornadas(prev => {
                const nuevasJornadas = [...prev];
                nuevasJornadas[jornadaActiva] = nuevaJornada;
                sessionStorage.setItem("calendario", JSON.stringify(nuevasJornadas));
                return nuevasJornadas;
            });

            actualizarClasificacion(nuevaJornada);
        }
    }
};
    const guardarPartidaComoArchivo = () => {
    const equipo = JSON.parse(localStorage.getItem('equipos'));
    const calendario = JSON.parse(sessionStorage.getItem('calendario'));
    const numLigas = JSON.parse(localStorage.getItem('numLigas'));
    const clasificacion = JSON.parse(localStorage.getItem('clasificacion'));
    const partida = { equipo, calendario, numLigas, clasificacion };
  
    const blob = new Blob([JSON.stringify(partida, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mi_partida.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    const abrirModal = (type) => {
        setModalType(type);
        setModalVisible(true);
    };

    const cerrarModal = () => {
        setModalVisible(false);
    };

    const siguienteJornada = () => {
        if (jornadaActual < jornadas.length - 1) {
            setJornadaActual(jornadaActual + 1);
        }
    };

    const avanzarJornada = () => {
        if (jornadaActiva < jornadas.length - 1) {
            setJornadaActiva((prev) => prev + 1);
            const nuevaJornadaPendiente = jornadas[jornadaActiva + 1].filter(
                (partido) =>
                    equiposSeleccionados.some(
                        (e) => e.id === partido.local.id || e.id === partido.visitante.id
                    )
            );
            setPartidosPendientes(nuevaJornadaPendiente);
        }
    };

    const anteriorJornada = () => {
        if (jornadaActual > 0) {
            setJornadaActual(jornadaActual - 1);
        }
    };

    return (
        
        <div className="league-menu">
            <h1>League Menu</h1>
            <button
                onClick={simularTodasLasLigas}
                style={{
                    marginTop: "10px",
                    padding: "8px 16px",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    cursor: "pointer"
                }}
            >
                Simular Todas las Ligas
            </button>
            <>
            <button onClick={guardarPartidaComoArchivo}>Guardar partida (descargar)</button>
            </>
            <select
                value={ligaSeleccionada}
                onChange={(e) => setLigaSeleccionada(e.target.value)}
            >
                {ligasDisponibles.map((liga) => (
                    <option key={liga} value={liga}>
                        {liga}
                    </option>
                ))}
            </select>
            <div className="previews-container">
            {/* Preview de la Jornada */}
            <div className="jornada-preview-container" onClick={() => abrirModal("jornada")}>
                <h2>Jornada {jornadaActual + 1}</h2>
                <div className="jornada-preview">
                    {jornadas[jornadaActual]?.slice(0, 3).map((partido, index) => (
                        <div key={index} className="partido-preview">
                            <div className="equipo">
                                <img
                                    src={partido.local?.imagen || "/assets/images/default.png"}
                                    alt={partido.local?.nombre || "Equipo Local"}
                                    className="escudo"
                                />
                                <span>{partido.local?.nombre || "Equipo Local"}</span>
                            </div>
                            <span className="vs">
                                {partido.golesLocal !== undefined && partido.golesVisitante !== undefined
                                    ? `${partido.golesLocal} - ${partido.golesVisitante}`
                                    : "vs"}
                            </span>
                            <div className="equipo">
                                <img
                                    src={partido.visitante?.imagen || "/assets/images/default.png"}
                                    alt={partido.visitante?.nombre || "Equipo Visitante"}
                                    className="escudo"
                                />
                                <span>{partido.visitante?.nombre || "Equipo Visitante"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Preview de la Clasificación */}
            <div className="clasificacion-preview-container" onClick={() => abrirModal("clasificacion")}>
            <h2>Clasificación</h2>
            <div className="clasificacion-preview">
                {clasificacion
                    .slice() // Crear una copia para no mutar el estado original
                    .sort((a, b) => {
                        // Ordenar por puntos y luego por diferencia de goles
                        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
                        return (b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra);
                    })
                    .slice(0, 5) // Mostrar solo los primeros 5 equipos
                    .map((equipo, index) => (
                        <div key={index} className="equipo-clasificacion-preview">
                            <span>{index + 1}.</span>
                            <img
                                src={equipo.imagen || "/assets/images/default.png"}
                                alt={equipo.nombre || "Equipo"}
                                className="escudo"
                            />
                            <span>{equipo.nombre || "Equipo"}</span>
                            <span>{equipo.puntos || 0} pts</span>
                        </div>
                    ))}
            </div>
        </div>
        </div>
            {/* Modal */}
            {modalVisible && (
                <div className="modal-overlay" onClick={cerrarModal}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()} // Evitar cerrar al hacer clic dentro del modal
                    >
                        {modalType === "jornada" && (
                            <>
                                <h2>Jornada {jornadaActual + 1} de {jornadas.length}</h2>
                                <div className="jornada-detalle">
                                    {jornadas[jornadaActual]?.map((partido, index) => (
                                        <div key={index} className="partido">
                                            <div className="equipo">
                                                <img
                                                    src={partido.local?.imagen || "/assets/images/default.png"}
                                                    alt={partido.local?.nombre || "Equipo Local"}
                                                    className="escudo"
                                                />
                                                <span>{partido.local?.nombre || "Equipo Local"}</span>
                                            </div>
                                            <span className="vs">
                                                {partido.golesLocal !== undefined && partido.golesVisitante !== undefined
                                                    ? `${partido.golesLocal} - ${partido.golesVisitante}`
                                                    : "vs"}
                                            </span>
                                            <div className="equipo">
                                                <img
                                                    src={partido.visitante?.imagen || "/assets/images/default.png"}
                                                    alt={partido.visitante?.nombre || "Equipo Visitante"}
                                                    className="escudo"
                                                />
                                                <span>{partido.visitante?.nombre || "Equipo Visitante"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="navegacion-jornadas">
                                    <button onClick={anteriorJornada} disabled={jornadaActual === 0}>
                                        ⬅ Anterior
                                    </button>
                                    <button
                                        onClick={siguienteJornada}
                                        disabled={jornadaActual === jornadas.length - 1}
                                    >
                                        Siguiente ➡
                                    </button>
                                </div>
                            </>
                        )}

                        {modalType === "clasificacion" && (
                            <>
                                <h2>Clasificación</h2>
                                <table className="clasificacion-detalle">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Equipo</th>
                                            <th>PJ</th>
                                            <th>V</th>
                                            <th>E</th>
                                            <th>D</th>
                                            <th>GF</th>
                                            <th>GC</th>
                                            <th>DG</th>
                                            <th>Puntos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clasificacion
                                            .slice() // Crear una copia para no mutar el estado original
                                            .sort((a, b) => {
                                                // Ordenar por puntos y luego por diferencia de goles
                                                if (b.puntos !== a.puntos) return b.puntos - a.puntos;
                                                return (b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra);
                                            })
                                            .map((equipo, index) => (
                                                <tr
                                                    key={equipo.id}
                                                    className={
                                                        index < numAscenso
                                                        ? "ascenso"
                                                        : index < numAscenso + numPlayoff
                                                        ? "playoff"
                                                        : index == 12 && ligaSeleccionada.startsWith("Segunda")
                                                        ? "playoffDes"
                                                        : index >= clasificacion.length - numDescenso
                                                        ? "descenso"
                                                        : ""
                                                    }
                                                >
                                                    <td>{index + 1}</td>
                                                    <td className="equipo-nombre">
                                                        <img
                                                            src={equipo.imagen || "/assets/images/default.png"}
                                                            alt={equipo.nombre || "Equipo"}
                                                            className="escudo"
                                                        />
                                                        {equipo.nombre || "Equipo"}
                                                    </td>
                                                    <td>{equipo.partidosJugados || 0}</td>
                                                    <td>{equipo.victorias || 0}</td>
                                                    <td>{equipo.empates || 0}</td>
                                                    <td>{equipo.derrotas || 0}</td>
                                                    <td>{equipo.golesFavor || 0}</td>
                                                    <td>{equipo.golesContra || 0}</td>
                                                    <td>{equipo.golesFavor - equipo.golesContra || 0}</td>
                                                    <td>{equipo.puntos || 0}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </div>
            )}
{partidosPendientes.length > 0 ? (
    <div>
        <h2>Partidos Pendientes</h2>
        {partidosPendientes.map((partido, index) => (
            <div
                key={index}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#f8f9fa", // Fondo claro
                    borderRadius: "8px",
                    padding: "10px 20px",
                    marginBottom: "10px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Sombra ligera
                }}
            >
                {/* Equipo Local */}
                <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <img
                        src={partido.local.imagen || "/assets/images/default.png"}
                        alt={partido.local.nombre || "Equipo Local"}
                        style={{
                            width: "40px", // Tamaño fijo
                            height: "40px", // Tamaño fijo
                            marginRight: "10px",
                            objectFit: "contain", // Ajustar sin deformar
                        }}
                    />
                    <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                        {partido.local.nombre || "Equipo Local"}
                    </span>
                </div>

                {/* VS */}
                <span
                    style={{
                        fontWeight: "bold",
                        fontSize: "18px",
                        flex: "0 0 auto", // Evitar que se estire
                        textAlign: "center",
                    }}
                >
                    vs
                </span>

                {/* Equipo Visitante */}
                <div style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "16px", fontWeight: "bold", marginRight: "10px" }}>
                        {partido.visitante.nombre || "Equipo Visitante"}
                    </span>
                    <img
                        src={partido.visitante.imagen || "/assets/images/default.png"}
                        alt={partido.visitante.nombre || "Equipo Visitante"}
                        style={{
                            width: "40px", // Tamaño fijo
                            height: "40px", // Tamaño fijo
                            objectFit: "contain", // Ajustar sin deformar
                        }}
                    />
                </div>

                {/* Botón para jugar */}
                <button
                    onClick={() => jugarPartidoJugador(partido)}
                    style={{
                        marginLeft: "20px",
                        padding: "5px 15px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                    }}
                >
                    Jugar
                </button>
            </div>
        ))}
    </div>
) : (
<button
    onClick={jugarRestoPartidos}
    disabled={ligaFinalizada}
    style={{
        padding: "10px 20px",
        backgroundColor: ligaFinalizada ? "#6c757d" : "#28a745",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: ligaFinalizada ? "not-allowed" : "pointer",
        opacity: ligaFinalizada ? 0.6 : 1,
    }}
>
    Simular Resto de Partidos
</button>
)}
        </div>
    );
}

export default LeagueMenu;