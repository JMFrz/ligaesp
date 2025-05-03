import { useState, useEffect } from "react";
import "../styles/mainmenu/LeagueMenu.css";
import { useNavigate } from "react-router-dom";
import { useLocation } from 'react-router-dom';

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
    const [ligasAgrupadas, setLigasAgrupadas] = useState({});
    const [clasificacionPorGrupo, setClasificacionPorGrupo] = useState({});
    const [jornadasPorGrupo, setJornadasPorGrupo] = useState({});

    useEffect(() => {
        const calendarioObj = JSON.parse(localStorage.getItem("calendario")) || {};
        const clasificacionObj = JSON.parse(localStorage.getItem("clasificacion")) || {};
        const equipos = JSON.parse(localStorage.getItem("equipos")) || [];
        const ascensosObj = JSON.parse(localStorage.getItem("ascensos")) || {};
        const playoffsObj = JSON.parse(localStorage.getItem("playoffs")) || {};
        const descensosObj = JSON.parse(localStorage.getItem("descensos")) || {};
    
        // Agrupar ligas
        const agrupadas = {};
        Object.keys(calendarioObj).forEach((ligaCompleta) => {
            const base = ligaCompleta.split(" - ")[0];
            if (!agrupadas[base]) agrupadas[base] = [];
            agrupadas[base].push(ligaCompleta);
        });
        setLigasAgrupadas(agrupadas);
    
        const bases = Object.keys(agrupadas);
        setLigasDisponibles(bases);
    
        const liga = ligaSeleccionada || bases[0];
        if (!ligaSeleccionada) setLigaSeleccionada(liga);
    
        const grupos = agrupadas[liga] || [liga];
    
        const jornadasTotales = [];
        const clasificacionTotal = [];
    
        grupos.forEach((grupo) => {
            const jornadasGrupo = calendarioObj[grupo] || [];
            const clasificacionGrupo = clasificacionObj[grupo] || [];
    
            jornadasTotales.push(...jornadasGrupo);
            clasificacionTotal.push(...clasificacionGrupo);
        });
    
        const seleccionados = equipos.filter(
            (equipo) => equipo.player && grupos.includes(equipo.liga)
        );
    
        const primerGrupo = grupos[0];
        setNumAscenso(ascensosObj[primerGrupo] || 0);
        setNumPlayoff(playoffsObj[primerGrupo] || 0);
        setNumDescenso(descensosObj[primerGrupo] || 3);
    
        setEquiposSeleccionados(seleccionados);

        const clasificaciones = {};
        const calendarios = {};
        // Buscar partidos pendientes entre todos los grupos
        let pendientes = [];

        Object.entries(calendarios).forEach(([grupo, jornadasGrupo]) => {
            jornadasGrupo.forEach((jornada) => {
                jornada.forEach((partido) => {
                    if (!partido.jugado) {
                        const esDelJugador = seleccionados.some(
                            (e) => e.id === partido.local.id || e.id === partido.visitante.id
                        );
                        if (esDelJugador) {
                            pendientes.push({ ...partido, grupo });
                        }
                    }
                });
            });
        });

        setPartidosPendientes(pendientes);
        grupos.forEach((grupo) => {
            clasificaciones[grupo] = clasificacionObj[grupo] || [];
            calendarios[grupo] = calendarioObj[grupo] || [];
        });

        setClasificacionPorGrupo(clasificaciones);
        setJornadasPorGrupo(calendarios);
        const clasificacionFusionada = Object.values(clasificaciones).flat();
        const jornadasFusionadas = combinarJornadasPorIndice(Object.values(calendarios));
        
        setClasificacion(clasificacionFusionada);
        setJornadas(jornadasFusionadas);
        if (state.resultado && Array.isArray(jornadasTotales[jornadaActiva])) {
            const nuevaJornada = [...jornadasTotales[jornadaActiva]];
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
    
                jornadasTotales[jornadaActiva] = nuevaJornada;
    
                grupos.forEach((grupo) => {
                    calendarioObj[grupo] = calendarioObj[grupo] || [];
                });
                localStorage.setItem("calendario", JSON.stringify(calendarioObj));
                setJornadas(jornadasTotales);
            }
        }
    
        const primeraJornadaNoCompletada = jornadasTotales.findIndex((jornada) =>
            jornada.some((partido) => !partido.jugado)
        );
    
        if (primeraJornadaNoCompletada !== -1) {
            setJornadaActiva(primeraJornadaNoCompletada);
            const jornadaPendiente = jornadasTotales[primeraJornadaNoCompletada].filter(
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

        
    }, [ligaSeleccionada, state.resultado, jornadaActiva]);
    
    

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
        }
    });

    setJornadas((prev) => {
        const nuevasJornadas = [...prev];
        nuevasJornadas[jornadaActiva] = nuevaJornada;
    
        // Recuperamos el calendario actual completo desde localStorage
        const calendarioGuardado = JSON.parse(localStorage.getItem("calendario")) || {};
        calendarioGuardado[ligaSeleccionada] = nuevasJornadas; // ✅ Solo actualizamos la liga activa
    
        localStorage.setItem("calendario", JSON.stringify(calendarioGuardado));
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
                localStorage.setItem("calendario", JSON.stringify(nuevasJornadas));
                return nuevasJornadas;
            });

            actualizarClasificacion(nuevaJornada);
        }
    }
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

    function combinarJornadasPorIndice(jornadasPorGrupo) {
        const maxLength = Math.max(...jornadasPorGrupo.map(j => j.length));
        const fusionadas = [];
      
        for (let i = 0; i < maxLength; i++) {
          const jornadaFusionada = [];
          jornadasPorGrupo.forEach(grupoJornadas => {
            if (grupoJornadas[i]) {
              jornadaFusionada.push(...grupoJornadas[i]);
            }
          });
          fusionadas.push(jornadaFusionada);
        }
      
        return fusionadas;
      }

    return (
        <div className="league-menu">
            <h1>League Menu</h1>
            <select value={ligaSeleccionada} onChange={(e) => setLigaSeleccionada(e.target.value)}>
                {ligasDisponibles.map((base) => (
                    <option key={base} value={base}>{base}</option>
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
            {(() => {
                const grupos = Object.keys(clasificacionPorGrupo);
                const primerGrupo = grupos[0];
                const clasificacionPreview = clasificacionPorGrupo[primerGrupo] || [];

                return clasificacionPreview
                    .slice()
                    .sort((a, b) => {
                    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
                    return (b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra);
                    })
                    .slice(0, 5)
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
                    ));
                })()}
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
                                {Object.entries(clasificacionPorGrupo).map(([grupo, clasificacion]) => (
                                <div key={grupo} style={{ marginBottom: "40px" }}>
                                    <h3>{grupo}</h3>
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
                                        .slice()
                                        .sort((a, b) => {
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
                                                : index >= clasificacion.length - numDescenso
                                                ? "descenso"
                                                : ""
                                            }
                                            >                                            <td>{index + 1}</td>
                                            <td className="equipo-nombre">
                                                <img src={equipo.imagen || "/assets/images/default.png"} alt={equipo.nombre} className="escudo" />
                                                {equipo.nombre}
                                            </td>
                                            <td>{equipo.partidosJugados || 0}</td>
                                            <td>{equipo.victorias || 0}</td>
                                            <td>{equipo.empates || 0}</td>
                                            <td>{equipo.derrotas || 0}</td>
                                            <td>{equipo.golesFavor || 0}</td>
                                            <td>{equipo.golesContra || 0}</td>
                                            <td>{(equipo.golesFavor - equipo.golesContra) || 0}</td>
                                            <td>{equipo.puntos || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    </table>
                                </div>
                                ))}
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
        style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
        }}
    >
        Simular Resto de Partidos
    </button>
)}
        </div>
    );
}

export default LeagueMenu;