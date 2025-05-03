import { Link } from "react-router-dom";
import { useRef } from "react";
import "../styles/mainmenu/MainMenu.css";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";

function StartPage() {
    const [clasificacion, setClasificacion] = useState({});
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const cargarPartidaDesdeArchivo = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const partida = JSON.parse(e.target.result);
                const { equipo, calendario, numLigas, clasificacion } = partida;
                localStorage.clear();
                localStorage.setItem('equipos', JSON.stringify(equipo));
                sessionStorage.setItem('calendario', JSON.stringify(calendario));
                localStorage.setItem('numLigas', JSON.stringify(numLigas));
                localStorage.setItem('clasificacion', JSON.stringify(clasificacion));
                localStorage.setItem("esLigaPrimera", JSON.stringify(false));

                const equipos = JSON.parse(localStorage.getItem("equipos")) || [];


                const ligas = agruparEquiposPorLiga(equipos);
                const descensosPorLigaTemp = {};
                const ascensosPorLigaTemp = {};
                const playoffsDescensoSegundaRFEF = {};
                const playoffsPorLigaTemp = {};

                Object.entries(ligas).forEach(([liga]) => {
        
                    if (liga.includes("Primera RFEF")) {
                        descensosPorLigaTemp[liga] = 5;
                        ascensosPorLigaTemp[liga] = 1;
                        playoffsPorLigaTemp[liga] = 4;
                    } else if (liga.includes("Segunda RFEF")) {
                        playoffsDescensoSegundaRFEF[liga] = 12;
                        descensosPorLigaTemp[liga] = 5;
                        ascensosPorLigaTemp[liga] = 1;
                        playoffsPorLigaTemp[liga] = 4;
                    } else if (liga.includes("Tercera RFEF")) {
                        descensosPorLigaTemp[liga] = 3;
                        ascensosPorLigaTemp[liga] = 1;
                        playoffsPorLigaTemp[liga] = 4;
                    } else if (liga === "La Liga") {
                        descensosPorLigaTemp[liga] = 3;
                    } else if (liga === "Liga 2") {
                        descensosPorLigaTemp[liga] = 4;
                        ascensosPorLigaTemp[liga] = 2;
                        playoffsPorLigaTemp[liga] = 4;
                    }
                });
    
    
                localStorage.setItem("descensos", JSON.stringify(descensosPorLigaTemp));
                localStorage.setItem("ascensos", JSON.stringify(ascensosPorLigaTemp));
                localStorage.setItem("playoffs", JSON.stringify(playoffsPorLigaTemp));
                localStorage.setItem("playoffsDescenso", JSON.stringify(playoffsPorLigaTemp));
 
                console.log("✅ Ligas cargadas con ascensos aplicados.");

                navigate("/main-menu");

                alert('Partida cargada con éxito.');
                window.location.reload(); // Recarga para reflejar cambios
            } catch (err) {
                alert('El archivo no es válido.');
            }
        };
        reader.readAsText(file);
    };

    const handleLoadClick = () => {
        fileInputRef.current.click();
    };
    const mezclarEquipos = (equipos) => {
        const copia = [...equipos];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    };
    return (
        <div className="main-menu">
            <div className="menu-options">
                <Link to="/team-selection" className="menu-link">
                    <button className="menu-button">
                        New Game
                    </button>
                </Link>
                <button className="menu-button" onClick={handleLoadClick}>
                    Load Game
                </button>
                <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={cargarPartidaDesdeArchivo}
                />
            </div>
        </div>
    );
}

const crearClasificacion = (equipos) => {
    return equipos.map((equipo) => ({
        id: equipo.id,
        imagen: equipo.imagen,
        nombre: equipo.nombre,
        puntos: equipo.victorias*3+equipo.empates*1,
        partidosJugados: equipo.partidosJugados,
        victorias: equipo.victorias,
        empates: equipo.empates,
        derrotas: equipo.derrotas,
        golesFavor: equipo.golesFavor,
        golesContra: equipo.golesContra,
        diferenciaGoles: equipo.golesFavor-equipo.golesContra,
    }));
};

const agruparEquiposPorLiga = (equipos) => {
    return equipos.reduce((ligas, equipo) => {
        // Si la liga es "Regionales", no hacer nada
        if (equipo.liga.toLowerCase().includes("regionales")) {
            return ligas;
        }

        if (!ligas[equipo.liga]) ligas[equipo.liga] = [];
        ligas[equipo.liga].push(equipo);
        return ligas;
    }, {});
};

export default StartPage;