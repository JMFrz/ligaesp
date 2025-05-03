import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LeagueGeneration = () => {
    const [clasificacion, setClasificacion] = useState({});
    const [calendario, setCalendario] = useState({});
    const [equiposParaAsignar, setEquiposParaAsignar] = useState([]);
    const [asignaciones, setAsignaciones] = useState({});
    const [equiposOriginales, setEquiposOriginales] = useState([]);

    const navigate = useNavigate();
    const clavesAscenso = [
        "ascensoDirecto_Liga2",
        "ascensoPlayoff_Liga2",
        "ascensoDirecto_PrimeraRFEF",
        "ascensoPlayoff_PrimeraRFEF",
        "ascensoDirecto_SegundaRFEF",
        "ascensoPlayoff_SegundaRFEF",
        "ascensoDirecto_TerceraRFEF",
        "ascensoPlayoff_TerceraRFEF"
      ];
      const clavesDescenso = [
        "descenso_LaLiga",
        "descenso_Liga2",
        "descenso_PrimeraRFEF",
        "descenso_SegundaRFEF"
      ];
      const [equiposPendientes, setEquiposPendientes] = useState([]);
      const [grupos, setGrupos] = useState({
        "La Liga": [],
        "Liga 2": [],
        "Primera RFEF - Grupo 1": [],
        "Primera RFEF - Grupo 2": [],
        "Segunda RFEF - Grupo 1": [],
        "Segunda RFEF - Grupo 2": [],
        "Segunda RFEF - Grupo 3": [],
        "Segunda RFEF - Grupo 4": [],
        "Segunda RFEF - Grupo 5": [],
        "Tercera RFEF - Grupo 1": [],
        "Tercera RFEF - Grupo 2": [],
        "Tercera RFEF - Grupo 3": [],
        "Tercera RFEF - Grupo 4": [],
        "Tercera RFEF - Grupo 5": [],
        "Tercera RFEF - Grupo 6": [],
        "Tercera RFEF - Grupo 7": [],
        "Tercera RFEF - Grupo 8": [],
        "Tercera RFEF - Grupo 9": [],
        "Tercera RFEF - Grupo 10": [],
        "Tercera RFEF - Grupo 11": [],
        "Tercera RFEF - Grupo 12": [],
        "Tercera RFEF - Grupo 13": [],
        "Tercera RFEF - Grupo 14": [],
        "Tercera RFEF - Grupo 15": [],
        "Tercera RFEF - Grupo 16": [],
        "Tercera RFEF - Grupo 17": [],
        "Tercera RFEF - Grupo 18": []
    });
    const mezclarEquipos = (equipos) => {
        const copia = [...equipos];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
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
    useEffect(() => {
        fetch("/data/equipos.json")
            .then(res => res.json())
            .then(data => {
                setEquiposOriginales(data);
            })
            .catch(err => {
                console.error("❌ Error al cargar /data/equipos.json:", err);
            });
    }, []);
    useEffect(() => {
        const generarLigas = (esLigaPrimera) => {
            if (esLigaPrimera === true) {
                const equipos = JSON.parse(localStorage.getItem("equipos")) || [];
                const nLiga = JSON.parse(localStorage.getItem("numLigas")) || [];

                localStorage.clear();
                sessionStorage.clear();
                localStorage.setItem("equipos", JSON.stringify(equipos));
                localStorage.setItem("esLigaPrimera", JSON.stringify(false));
                localStorage.setItem("numLigas", JSON.stringify(nLiga));
                console.log("Se ha entrado");
                const ligas = agruparEquiposPorLiga(equipos);
                const clasificacionesPorLiga = {};
                const calendariosPorLiga = {};
                const descensosPorLigaTemp = {};
                const ascensosPorLigaTemp = {};
                const playoffsDescensoSegundaRFEF = {};
                const playoffsPorLigaTemp = {};
                
                Object.entries(ligas).forEach(([liga, equiposLiga]) => {
                    const equiposAleatorios = mezclarEquipos(equiposLiga);
    
                    clasificacionesPorLiga[liga] = crearClasificacion(equiposAleatorios);
                    calendariosPorLiga[liga] = generarJornadasLiga(equiposAleatorios);
    
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
    
                setClasificacion(clasificacionesPorLiga);
                setCalendario(calendariosPorLiga);
    
                localStorage.setItem("clasificacion", JSON.stringify(clasificacionesPorLiga));
                sessionStorage.setItem("calendario", JSON.stringify(calendariosPorLiga));
                localStorage.setItem("descensos", JSON.stringify(descensosPorLigaTemp));
                localStorage.setItem("ascensos", JSON.stringify(ascensosPorLigaTemp));
                localStorage.setItem("playoffs", JSON.stringify(playoffsPorLigaTemp));
                localStorage.setItem("playoffsDescenso", JSON.stringify(playoffsPorLigaTemp));
 
                console.log("✅ Ligas generadas con ascensos aplicados.");
            }
            else {
                const nLiga = JSON.parse(localStorage.getItem("numLigas") || "[]");
            // Cargar equipos pendientes (si los hay)
            if(nLiga >= 1) {
                console.log("Se ha entrado también");
                try {
                    console.log("1");
    
                    const ascensosDirectos_Liga2 = JSON.parse(localStorage.getItem("ascensoDirecto_Liga2") || "[]");
                    const descensos_LaLiga = JSON.parse(localStorage.getItem("descenso_LaLiga") || "[]");
                    const ascensoPlayoff_Liga2 = JSON.parse(localStorage.getItem("ascensoPlayoff_Liga2") || "[]");
                    const ascensoDirecto_PrimeraRFEF = JSON.parse(localStorage.getItem("ascensoDirecto_PrimeraRFEF") || "[]");
                    const ascensoPlayoff_PrimeraRFEF = JSON.parse(localStorage.getItem("ascensoPlayoff_PrimeraRFEF") || "[]");
    
                    ascensosDirectos_Liga2.forEach((equipo) => {
                          cambiarLiga(equipo, "La Liga");
                    });
    
                    descensos_LaLiga.forEach((equipo) => {
                          cambiarLiga(equipo, "Liga 2");
                    });
    
                    ascensoPlayoff_Liga2.forEach((equipo) => {
                        cambiarLiga(equipo, "La Liga");
                    });
    
                    ascensoDirecto_PrimeraRFEF.forEach((equipo) => {
                        cambiarLiga(equipo, "Liga 2");
                    });
    
                    ascensoPlayoff_PrimeraRFEF.forEach((equipo) => {
                        cambiarLiga(equipo, "Liga 2");
                    });
                    
                    //Ahora, lo que involucra por comunidades
    
                    const descenso_Liga2 = JSON.parse(localStorage.getItem("descenso_Liga2") || "[]");
                    const ascensoDirecto_SegundaRFEF = JSON.parse(localStorage.getItem("ascensoDirecto_SegundaRFEF") || "[]");
                    const ascensoPlayoff_SegundaRFEF = JSON.parse(localStorage.getItem("ascensoPlayoff_SegundaRFEF") || "[]");
                    const descenso_PrimeraRFEF = JSON.parse(localStorage.getItem("descenso_PrimeraRFEF") || "[]");
                    const ascensoDirecto_TerceraRFEF = JSON.parse(localStorage.getItem("ascensoDirecto_TerceraRFEF") || "[]");
                    const ascensoPlayoff_TerceraRFEF = JSON.parse(localStorage.getItem("ascensoPlayoff_TerceraRFEF") || "[]");
                    const descenso_SegundaRFEF = JSON.parse(localStorage.getItem("descenso_SegundaRFEF") || "[]");
    
                    const equipos = JSON.parse(localStorage.getItem("equipos")) || [];
                    const clasificacion = JSON.parse(localStorage.getItem("clasificacion")) || {};
                    
                    descenso_SegundaRFEF.forEach((equipo) => {
                        const equipoC = equipos.find(e => e.nombre === equipo);
                        if(equipoC.comunidad == "Galicia") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 1");
                        } else if(equipoC.comunidad == "Asturias") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 2");
                        } else if(equipoC.comunidad == "Cantabria") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 3");
                        } else if(equipoC.comunidad == "País Vasco") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 4");
                        } else if(equipoC.comunidad == "Cataluña") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 5");
                        } else if(equipoC.comunidad == "Comunidad Valenciana") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 6");
                        } else if(equipoC.comunidad == "Madrid") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 7");
                        } else if(equipoC.comunidad == "Castilla y León") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 8");
                        } else if(equipoC.comunidad == "Andalucía y Melilla") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 9");
                        } else if(equipoC.comunidad == "Andalucía y Ceuta") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 10");
                        } else if(equipoC.comunidad == "Islas Baleares") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 11");
                        } else if(equipoC.comunidad == "Canarias") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 12");
                        } else if(equipoC.comunidad == "Región de Murcia") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 13");
                        } else if(equipoC.comunidad == "Extremadura") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 14");
                        } else if(equipoC.comunidad == "Navarra") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 15");
                        } else if(equipoC.comunidad == "La Rioja") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 16");
                        } else if(equipoC.comunidad == "Aragón") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 17")
                        } else {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 18");
                        }
                    });
    
                    const descenso_playoffSegundaRFEF = JSON.parse(localStorage.getItem("equipos_descendidos") || "[]");
    
                    descenso_playoffSegundaRFEF.forEach((equipo) => {
                        const equipoC = equipos.find(e => e.nombre === equipo);
                        if(equipoC.comunidad == "Galicia") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 1");
                        } else if(equipoC.comunidad == "Asturias") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 2");
                        } else if(equipoC.comunidad == "Cantabria") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 3");
                        } else if(equipoC.comunidad == "País Vasco") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 4");
                        } else if(equipoC.comunidad == "Cataluña") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 5");
                        } else if(equipoC.comunidad == "Comunidad Valenciana") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 6");
                        } else if(equipoC.comunidad == "Madrid") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 7");
                        } else if(equipoC.comunidad == "Castilla y León") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 8");
                        } else if(equipoC.comunidad == "Andalucía y Melilla") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 9");
                        } else if(equipoC.comunidad == "Andalucía y Ceuta") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 10");
                        } else if(equipoC.comunidad == "Islas Baleares") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 11");
                        } else if(equipoC.comunidad == "Canarias") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 12");
                        } else if(equipoC.comunidad == "Región de Murcia") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 13");
                        } else if(equipoC.comunidad == "Extremadura") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 14");
                        } else if(equipoC.comunidad == "Navarra") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 15");
                        } else if(equipoC.comunidad == "La Rioja") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 16");
                        } else if(equipoC.comunidad == "Aragón") {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 17")
                        } else {
                            cambiarLiga(equipo, "Tercera RFEF - Grupo 18");
                        }                });
    

                    descenso_PrimeraRFEF.forEach((equipo) => {
                        const equipoC = equipos.find(e => e.nombre === equipo);
                        if(equipoC.comunidad == "Galicia" || equipoC.comunidad == "Castilla y León" || equipoC.comunidad == "Asturias" || equipoC.comunidad == "Cantabria") {
                            cambiarLiga(equipo, "Segunda RFEF - Grupo 1");
                        } else if(equipoC.comunidad == "País Vasco" || equipoC.comunidad == "Navarra" || equipoC.comunidad == "La Rioja" || equipoC.comunidad == "Aragón") {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 2");
                        } else if(equipoC.comunidad == "Cataluña" || equipoC.comunidad == "Comunidad Valenciana" || equipoC.comunidad == "Islas Baleares") {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 3");
                        } else if(equipoC.comunidad == "Andalucía y Ceuta" || equipoC.comunidad == "Andalucía y Melilla" || equipoC.comunidad == "Región de Murcia") {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 4");
                        } else {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 5");
                        }
                    });
                    descenso_Liga2.forEach((equipo) => {
                        const equipoC = equipos.find(e => e.nombre === equipo);
                        if(equipoC.comunidad == "Cataluña" || equipoC.comunidad == "Galicia" || equipoC.comunidad == "Aragón" || equipoC.comunidad == "Asturias" || equipoC.comunidad == "Castilla y León" || equipoC.comunidad == "Cantabria" || equipoC.comunidad == "País Vasco" || equipoC.comunidad == "Navarra" || equipoC.comunidad == "La Rioja") {
                            cambiarLiga(equipoC.nombre, "Primera RFEF - Grupo 1");
                        } else {
                            cambiarLiga(equipoC.nombre, "Primera RFEF - Grupo 2");
                        }
                    });
                    ascensoDirecto_SegundaRFEF.forEach((equipo) => {
                        const equipoC = equipos.find(e => e.nombre === equipo);
                        if(equipoC.comunidad == "Cataluña" || equipoC.comunidad == "Galicia" || equipoC.comunidad == "Aragón" || equipoC.comunidad == "Asturias" || equipoC.comunidad == "Castilla y León" || equipoC.comunidad == "Cantabria" || equipoC.comunidad == "País Vasco" || equipoC.comunidad == "Navarra" || equipoC.comunidad == "La Rioja") {
                            cambiarLiga(equipoC.nombre, "Primera RFEF - Grupo 1");
                        } else {
                            cambiarLiga(equipoC.nombre, "Primera RFEF - Grupo 2");
                        }
                    });
                    ascensoPlayoff_SegundaRFEF.forEach((equipo) => {
                        const equipoC = equipos.find(e => e.nombre === equipo);
                        if(equipoC.comunidad == "Cataluña" || equipoC.comunidad == "Galicia" || equipoC.comunidad == "Aragón" || equipoC.comunidad == "Asturias" || equipoC.comunidad == "Castilla y León" || equipoC.comunidad == "Cantabria" || equipoC.comunidad == "País Vasco" || equipoC.comunidad == "Navarra" || equipoC.comunidad == "La Rioja") {
                            cambiarLiga(equipoC.nombre, "Primera RFEF - Grupo 1");
                        } else {
                            cambiarLiga(equipoC.nombre, "Primera RFEF - Grupo 2");
                        }
                    });
                    console.log("Ascenso Tercera RFEF")
                    ascensoDirecto_TerceraRFEF.forEach((equipo) => {
                        const equipoC = equipos.find(e => e.nombre === equipo);
                        if(equipoC.comunidad == "Galicia" || equipoC.comunidad == "Castilla y León" || equipoC.comunidad == "Asturias" || equipoC.comunidad == "Cantabria") {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 1");
                        } else if(equipoC.comunidad == "País Vasco" || equipoC.comunidad == "Navarra" || equipoC.comunidad == "La Rioja" || equipoC.comunidad == "Aragón") {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 2");
                        } else if(equipoC.comunidad == "Cataluña" || equipoC.comunidad == "Comunidad Valenciana" || equipoC.comunidad == "Islas Baleares") {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 3");
                        } else if(equipoC.comunidad == "Andalucía y Ceuta" || equipoC.comunidad == "Andalucía y Melilla" || equipoC.comunidad == "Región de Murcia") {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 4");
                        } else {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 5");
                        }
                    });
                    ascensoPlayoff_TerceraRFEF.forEach((equipo) => {
                        const equipoC = equipos.find(e => e.nombre === equipo);
                        if(equipoC.comunidad == "Galicia" || equipoC.comunidad == "Castilla y León" || equipoC.comunidad == "Asturias" || equipoC.comunidad == "Cantabria") {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 1");
                        } else if(equipoC.comunidad == "País Vasco" || equipoC.comunidad == "Navarra" || equipoC.comunidad == "La Rioja" || equipoC.comunidad == "Aragón") {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 2");
                        } else if(equipoC.comunidad == "Cataluña" || equipoC.comunidad == "Comunidad Valenciana" || equipoC.comunidad == "Islas Baleares") {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 3");
                        } else if(equipoC.comunidad == "Andalucía y Ceuta" || equipoC.comunidad == "Andalucía y Melilla" || equipoC.comunidad == "Región de Murcia") {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 4");
                        } else {
                            cambiarLiga(equipoC.nombre, "Segunda RFEF - Grupo 5");
                        }
                    });
    
                    localStorage.setItem("seguarda2", JSON.stringify(true));
    
                    const terceraRFEF = Object.keys(clasificacion)
                    .filter(key => key.startsWith("Tercera"))
                    .reduce((obj, key) => {
                        obj[key] = [...clasificacion[key]].sort((a, b) => {
                        // Orden por puntos
                        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
                        // Si empatan en puntos, ordenar por gol average
                        const diffA = a.golesFavor - a.golesContra;
                        const diffB = b.golesFavor - b.golesContra;
                        return diffB - diffA;
                        });
                        return obj;
                    }, {});
    
                    localStorage.setItem("seguarda", JSON.stringify(true));
                    localStorage.setItem("terceraRFEF", JSON.stringify(terceraRFEF));
    
                    
                    //Ahora, comprobando los tamaños
                    console.log("2");

                    //Primera RFEF
                    
                    let numPrimeraRFEFGrupo1 = obtenerNumeroEquiposLiga("Primera RFEF - Grupo 1");
                    let numPrimeraRFEFGrupo2 = obtenerNumeroEquiposLiga("Primera RFEF - Grupo 2");
    
                    let equiposGrupo1PrimeraRFEF = obtenerEquiposLiga("Primera RFEF - Grupo 1");
                    let equiposGrupo2PrimeraRFEF = obtenerEquiposLiga("Primera RFEF - Grupo 2");
                    console.log("3");

                    while(numPrimeraRFEFGrupo1 > 20) {
                        console.log(numPrimeraRFEFGrupo1);
                        console.log(numPrimeraRFEFGrupo2);
                        let i = Math.floor(Math.random() * numPrimeraRFEFGrupo1);
                        cambiarLiga(equiposGrupo1PrimeraRFEF[i].nombre, "Primera RFEF - Grupo 2");
                        numPrimeraRFEFGrupo1 = obtenerNumeroEquiposLiga("Primera RFEF - Grupo 1");
                        equiposGrupo1PrimeraRFEF = obtenerEquiposLiga("Primera RFEF - Grupo 1");
                        numPrimeraRFEFGrupo2 = obtenerNumeroEquiposLiga("Primera RFEF - Grupo 2");
                        equiposGrupo2PrimeraRFEF = obtenerEquiposLiga("Primera RFEF - Grupo 2");

                    }
    
                    while(numPrimeraRFEFGrupo1 < 20) { 
                        console.log(numPrimeraRFEFGrupo1);
                        console.log(numPrimeraRFEFGrupo2);
                        let i = Math.floor(Math.random() * numPrimeraRFEFGrupo2);
                        cambiarLiga(equiposGrupo2PrimeraRFEF[i].nombre, "Primera RFEF - Grupo 1");
                        numPrimeraRFEFGrupo2 = obtenerNumeroEquiposLiga("Primera RFEF - Grupo 1");
                        equiposGrupo2PrimeraRFEF = obtenerEquiposLiga("Primera RFEF - Grupo 1");
                        numPrimeraRFEFGrupo1 = obtenerNumeroEquiposLiga("Primera RFEF - Grupo 1");
                        equiposGrupo1PrimeraRFEF = obtenerEquiposLiga("Primera RFEF - Grupo 1");
                        numPrimeraRFEFGrupo2 = obtenerNumeroEquiposLiga("Primera RFEF - Grupo 2");
                        equiposGrupo2PrimeraRFEF = obtenerEquiposLiga("Primera RFEF - Grupo 2");
                    }
                    console.log("4");

                    //Segunda RFEF
                    let numSegundaRFEFGrupo1 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 1");
                    let numSegundaRFEFGrupo2 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 2");
                    let numSegundaRFEFGrupo3 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 3");
                    let numSegundaRFEFGrupo4 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 4");
                    let numSegundaRFEFGrupo5 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 5");
                    let equiposGrupo1SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 1");
                    let equiposGrupo2SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 2");
                    let equiposGrupo3SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 3");
                    let equiposGrupo4SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 4");
                    let equiposGrupo5SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 5");
                    console.log("Se ejecutan playoffs")
                    console.log("5");

                    while(numSegundaRFEFGrupo1 > 18) {
                        console.log(numSegundaRFEFGrupo1);
                        console.log(numSegundaRFEFGrupo2);
                        console.log(numSegundaRFEFGrupo3);
                        console.log(numSegundaRFEFGrupo4);
                        console.log(numSegundaRFEFGrupo5);
                        let i = Math.floor(Math.random()*numSegundaRFEFGrupo1);
                        cambiarLiga(equiposGrupo1SegundaRFEF[i].nombre, "Segunda RFEF - Grupo 2");
                        numSegundaRFEFGrupo1 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 1");
                        numSegundaRFEFGrupo2 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 2");
                        equiposGrupo1SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 1");
                        equiposGrupo2SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 2");
                    }
                    while(numSegundaRFEFGrupo1 < 18) {
                        console.log(numSegundaRFEFGrupo1);
                        console.log(numSegundaRFEFGrupo2);
                        console.log(numSegundaRFEFGrupo3);
                        console.log(numSegundaRFEFGrupo4);
                        console.log(numSegundaRFEFGrupo5);
                        let i = Math.floor(Math.random()*numSegundaRFEFGrupo2);
                        cambiarLiga(equiposGrupo2SegundaRFEF[i].nombre, "Segunda RFEF - Grupo 1");
                        numSegundaRFEFGrupo1 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 1");
                        numSegundaRFEFGrupo2 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 2");
                        equiposGrupo1SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 1");
                        equiposGrupo2SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 2");
                    }
                    while(numSegundaRFEFGrupo2 > 18) {
                        console.log(numSegundaRFEFGrupo1);
                        console.log(numSegundaRFEFGrupo2);
                        console.log(numSegundaRFEFGrupo3);
                        console.log(numSegundaRFEFGrupo4);
                        console.log(numSegundaRFEFGrupo5);
                        let i = Math.floor(Math.random()*numSegundaRFEFGrupo2);
                        cambiarLiga(equiposGrupo2SegundaRFEF[i].nombre, "Segunda RFEF - Grupo 3");    
                        numSegundaRFEFGrupo3 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 3");
                        numSegundaRFEFGrupo2 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 2");

                        equiposGrupo3SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 3");
                        equiposGrupo2SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 2");            
                    }
                    while(numSegundaRFEFGrupo2 < 18) {
                        console.log(numSegundaRFEFGrupo1);
                        console.log(numSegundaRFEFGrupo2);
                        console.log(numSegundaRFEFGrupo3);
                        console.log(numSegundaRFEFGrupo4);
                        console.log(numSegundaRFEFGrupo5);
                        let i = Math.floor(Math.random()*numSegundaRFEFGrupo3);
                        cambiarLiga(equiposGrupo3SegundaRFEF[i].nombre, "Segunda RFEF - Grupo 2"); 
                        numSegundaRFEFGrupo3 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 3");
                        numSegundaRFEFGrupo2 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 2");
                        equiposGrupo3SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 3");
                        equiposGrupo2SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 2");                          
                    }
                    while(numSegundaRFEFGrupo3 > 18) {
                        console.log(numSegundaRFEFGrupo1);
                        console.log(numSegundaRFEFGrupo2);
                        console.log(numSegundaRFEFGrupo3);
                        console.log(numSegundaRFEFGrupo4);
                        console.log(numSegundaRFEFGrupo5);
                        let i = Math.floor(Math.random()*numSegundaRFEFGrupo3);                   
                        
                        cambiarLiga(equiposGrupo3SegundaRFEF[i].nombre, "Segunda RFEF - Grupo 4");              

                        equiposGrupo3SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 3");
                        equiposGrupo4SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 4");        
                        numSegundaRFEFGrupo3 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 3");
                        numSegundaRFEFGrupo4 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 4");        
                    }
                    while(numSegundaRFEFGrupo3 < 18) {
                        console.log(numSegundaRFEFGrupo1);
                        console.log(numSegundaRFEFGrupo2);
                        console.log(numSegundaRFEFGrupo3);
                        console.log(numSegundaRFEFGrupo4);
                        console.log(numSegundaRFEFGrupo5);
                        let i = Math.floor(Math.random()*numSegundaRFEFGrupo4);
                        cambiarLiga(equiposGrupo4SegundaRFEF[i].nombre, "Segunda RFEF - Grupo 3");  

                        equiposGrupo3SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 3");
                        equiposGrupo4SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 4");      
                        numSegundaRFEFGrupo3 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 3");
                        numSegundaRFEFGrupo4 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 4");
                    
                    }
                    while(numSegundaRFEFGrupo4 > 18) {
                        console.log(numSegundaRFEFGrupo1);
                        console.log(numSegundaRFEFGrupo2);
                        console.log(numSegundaRFEFGrupo3);
                        console.log(numSegundaRFEFGrupo4);
                        console.log(numSegundaRFEFGrupo5);
                        let i = Math.floor(Math.random()*numSegundaRFEFGrupo4);
                        cambiarLiga(equiposGrupo4SegundaRFEF[i].nombre, "Segunda RFEF - Grupo 5");            
                        equiposGrupo5SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 5");
                        equiposGrupo4SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 4");           
                        numSegundaRFEFGrupo5 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 5");
                        numSegundaRFEFGrupo4 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 4");            
                    }
                    while(numSegundaRFEFGrupo4 < 18) {
                        console.log(numSegundaRFEFGrupo1);
                        console.log(numSegundaRFEFGrupo2);
                        console.log(numSegundaRFEFGrupo3);
                        console.log(numSegundaRFEFGrupo4);
                        console.log(numSegundaRFEFGrupo5);
                        let i = Math.floor(Math.random()*numSegundaRFEFGrupo5);
                        cambiarLiga(equiposGrupo5SegundaRFEF[i].nombre, "Segunda RFEF - Grupo 4");      

                        equiposGrupo5SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 5");
                        equiposGrupo4SegundaRFEF = obtenerEquiposLiga("Segunda RFEF - Grupo 4");
                        numSegundaRFEFGrupo5 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 5");
                        numSegundaRFEFGrupo4 = obtenerNumeroEquiposLiga("Segunda RFEF - Grupo 4");            
                    }
                    console.log("6");
                    const TRFEF = JSON.parse(localStorage.getItem("terceraRFEF") || "[]");
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 1", "Galicia", TRFEF["Tercera RFEF - Grupo 1"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 2", "Asturias", TRFEF["Tercera RFEF - Grupo 2"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 3", "Cantabria", TRFEF["Tercera RFEF - Grupo 3"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 4", "País Vasco", TRFEF["Tercera RFEF - Grupo 4"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 5", "Cataluña", TRFEF["Tercera RFEF - Grupo 5"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 6", "Comunidad Valenciana", TRFEF["Tercera RFEF - Grupo 6"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 7", "Madrid", TRFEF["Tercera RFEF - Grupo 7"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 8", "Castilla y León", TRFEF["Tercera RFEF - Grupo 8"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 9", "Andalucía y Melilla", TRFEF["Tercera RFEF - Grupo 9"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 10", "Andalucía y Ceuta", TRFEF["Tercera RFEF - Grupo 10"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 11", "Islas Baleares", TRFEF["Tercera RFEF - Grupo 11"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 12", "Canarias", TRFEF["Tercera RFEF - Grupo 12"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 13", "Región de Murcia", TRFEF["Tercera RFEF - Grupo 13"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 14", "Extremadura", TRFEF["Tercera RFEF - Grupo 14"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 15", "Navarra", TRFEF["Tercera RFEF - Grupo 15"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 16", "La Rioja", TRFEF["Tercera RFEF - Grupo 16"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 17", "Aragón", TRFEF["Tercera RFEF - Grupo 17"]);
                    gestionarDescensosTerceraRFEF("Tercera RFEF - Grupo 18", "Castilla-La Mancha", TRFEF["Tercera RFEF - Grupo 18"]);
                    console.log("7");

                    generarLigas(true);
    
                } catch (err) {
                    console.error("❌ Error al leer ascensos/descensos:", err);
                }
            }
           
        }};
        const flag = JSON.parse(localStorage.getItem("esLigaPrimera"));
        console.log(flag);
        generarLigas(flag === null ? true : flag); 
    }, []);
    const gestionarDescensosTerceraRFEF = (grupo, comunidad, trfef) => {
        let equiposLigaRegional = obtenerEquiposLiga("Regionales - " + comunidad);
        const ultimosTres = trfef.slice(14,17);
        Object.values(ultimosTres).forEach(equipo => {
            console.log(equipo.nombre);
          });        
          
          ultimosTres.forEach((equipo) => {
            cambiarLiga(equipo.nombre, "Regionales - " + comunidad);
        });
        let i = 14;


        let numEquiposGrupoTerceraRFEF = obtenerNumeroEquiposLiga(grupo);


        let equiposTerceraRFEF = obtenerEquiposLiga(grupo);
        console.log("1");
        if(numEquiposGrupoTerceraRFEF > 15) {
            while(numEquiposGrupoTerceraRFEF > 15) {
                cambiarLiga(trfef[i].nombre, "Regionales - " + comunidad);
                numEquiposGrupoTerceraRFEF = obtenerNumeroEquiposLiga(grupo);
                i--;
            }
            console.log("2");
            for(let j = 0; j < 3; ++j) {
                let id = Math.floor(Math.random()*equiposLigaRegional.length);
                while(equiposTerceraRFEF.includes(equiposLigaRegional[id])) {
                    id = Math.floor(Math.random()*equiposLigaRegional.length);
                }
                cambiarLiga(equiposLigaRegional[id], grupo);
                equiposLigaRegional = obtenerEquiposLiga("Regionales - " + comunidad);
                equiposTerceraRFEF = obtenerEquiposLiga(grupo);
            }
            console.log("3");
        }
        else {
            console.log("1.2");
            const ii = numEquiposGrupoTerceraRFEF;
            while(numEquiposGrupoTerceraRFEF < 18) {
                for(let j = 0; j < 18-ii; ++j) {
                    let id = Math.floor(Math.random()*equiposLigaRegional.length);
                    console.log(j);
                while(equiposTerceraRFEF.map(e => e.nombre).includes(equiposLigaRegional[id].nombre)) {
                    id = Math.floor(Math.random()*equiposLigaRegional.length);
                }
                console.log(equiposLigaRegional[id]);
                cambiarLiga(equiposLigaRegional[id].nombre, grupo);
                console.log(equiposLigaRegional[id].liga);
                console.log(numEquiposGrupoTerceraRFEF);
                equiposLigaRegional = obtenerEquiposLiga("Regionales - " + comunidad);
                equiposTerceraRFEF = obtenerEquiposLiga(grupo);
                numEquiposGrupoTerceraRFEF = obtenerNumeroEquiposLiga(grupo);
                }
            }
            console.log("4");
        }

    }

  
    const obtenerDescensosLiga = (liga) => {
        if (liga === "La Liga") return 3;
        if (liga === "Liga 2") return 4;
        if (liga.startsWith("Primera RFEF")) return 5;
        if (liga.startsWith("Segunda RFEF")) return 5;
        if (liga.startsWith("Tercera RFEF")) return 3;
        return 0;
    };

    const obtenerNumeroEquiposLiga = (ligaC) => {
        const equipos = JSON.parse(localStorage.getItem("equipos")) || [];

        let numEquipos = 0;

        equipos.forEach(equipo => {
            if (equipo.liga === ligaC) numEquipos++;
        });
        return numEquipos;
    }

    const cambiarLiga = (equipo, nuevaLiga) => {
        console.log("Antes de que se colapse " + equipo + ", " + nuevaLiga);
        const equipos = JSON.parse(localStorage.getItem("equipos")) || [];
        const equiposActualizados = equipos.map(equipoC => 
            equipoC.nombre === equipo ? {...equipoC, liga: nuevaLiga} : equipoC
        );
        localStorage.setItem("equipos", JSON.stringify(equiposActualizados));
    }
    const obtenerEquiposLiga = (ligaC) => {
        const equipos = JSON.parse(localStorage.getItem("equipos")) || [];
        const equiposFiltrados = equipos.filter(equipo => equipo.liga === ligaC);
        return equiposFiltrados;
    }
const asignarEquipoAGrupo = (equipo, grupoDestino) => {
    if (!grupoDestino) return;

    setGrupos(prev => {
        const copia = { ...prev };
        if (copia[grupoDestino].length >= (grupoDestino.includes("Primera") ? 20 : 18)) {
            alert("Grupo lleno. No se puede añadir más.");
            return prev;
        }

        // Añadir equipo
        copia[grupoDestino].push(equipo);

        // Eliminar equipo de pendientes
        setEquiposPendientes(pend => pend.filter(e => e !== equipo));

        // Actualizar liga
        equipo.liga = grupoDestino;

        return copia;
    });
};
    const crearClasificacion = (equipos) => {
        return equipos.map((equipo) => ({
            id: equipo.id,
            imagen: equipo.imagen,
            nombre: equipo.nombre,
            puntos: 0,
            partidosJugados: 0,
            victorias: 0,
            empates: 0,
            derrotas: 0,
            golesFavor: 0,
            golesContra: 0,
            diferenciaGoles: 0,
        }));
    };

    const generarJornadasLiga = (equipos) => {
        if (equipos.length % 2 !== 0) equipos.push({ id: -1, nombre: "Descanso" });
        const n = equipos.length;
        const mitad = n / 2;
        const jornadas = [];
        const rotacion = equipos.slice(1);

        for (let i = 0; i < n - 1; i++) {
            const jornada = [];
            const izquierda = [equipos[0], ...rotacion.slice(0, mitad - 1)];
            const derecha = rotacion.slice(mitad - 1).reverse();

            for (let j = 0; j < mitad; j++) {
                let local = i % 2 === 0 ? izquierda[j] : derecha[j];
                let visitante = i % 2 === 0 ? derecha[j] : izquierda[j];

                if (local.id !== -1 && visitante.id !== -1) {
                    jornada.push({ local, visitante });
                }
            }
            jornadas.push(jornada);
            rotacion.unshift(rotacion.pop());
        }

        const jornadasVuelta = jornadas.map(j =>
            j.map(({ local, visitante }) => ({
                local: visitante,
                visitante: local,
            }))
        );
        return [...jornadas, ...jornadasVuelta];
    };

    const handleContinue = () => {
        navigate("/main-menu");
    };

    return (
        <div className="league-generation">
            <h1>Ligas Generadas</h1>
            {Object.keys(clasificacion).map((liga) => (
                <div key={liga}>
                    <h2>{liga}</h2>
                </div>
            ))}
            <button onClick={handleContinue}>Continuar</button>
        </div>
    );
};

export default LeagueGeneration;
