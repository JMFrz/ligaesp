// ✅ playoffGenerator.js actualizado para inyectar la posición de los equipos en los playoffs

function generatePlayoffs(clasificaciones) {
    const playoffs = {};

    const segundaRFEFBrackets = [];
    const terceraRFEFBrackets = [];

    for (const [liga, clasificacion] of Object.entries(clasificaciones)) {
        if (!clasificacion || clasificacion.length === 0) continue;

        const ordenados = [...clasificacion]
            .sort((a, b) => b.puntos - a.puntos || (b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra));

        ordenados.forEach((equipo, i) => {
            equipo.posicion = i + 1;
        });

        const top52 = ordenados.slice(0, 6);
        const top5 = ordenados.slice(0,5);
        if (liga === "Liga 2") {
            playoffs[liga] = {
                rondas: [
                    [createIdaYVueltaMatch(top52[2], top52[5]), createIdaYVueltaMatch(top52[3], top52[4])],
                    []
                ],
                finalPendiente: true
            };
        }

        else if (liga.includes("Primera RFEF")) {
            const grupo = liga.includes("Grupo 1") ? "grupo1" : "grupo2";
            if (!playoffs["Primera RFEF"]) playoffs["Primera RFEF"] = { grupo1: [], grupo2: [] };
            playoffs["Primera RFEF"][grupo] = top5;
        }

        else if (liga.includes("Segunda RFEF")) {
            segundaRFEFBrackets.push({ liga, equipos: ordenados });
        }

        else if (liga.includes("Tercera RFEF")) {
            terceraRFEFBrackets.push({ liga, equipos: top5 });
        }
    }

    // ✅ Primera RFEF - brackets separados por grupo
    if (playoffs["Primera RFEF"]?.grupo1?.length === 5 && playoffs["Primera RFEF"]?.grupo2?.length === 5) {
        const g1 = playoffs["Primera RFEF"].grupo1;
        const g2 = playoffs["Primera RFEF"].grupo2;
        playoffs["Primera RFEF"] = {
            rondas: [
                [
                    [createIdaYVueltaMatch(g1[1], g2[4]), createIdaYVueltaMatch(g2[2], g1[3])],
                    [createIdaYVueltaMatch(g2[1], g1[4]), createIdaYVueltaMatch(g1[2], g2[3])]
                ],
                [ [], [] ]
            ],
            finalPendiente: true
        };
    }

    // ✅ Segunda RFEF - 5 brackets, cada uno con 2 cruces (2º vs 5º, 3º vs 4º)
    const grupos = segundaRFEFBrackets.map(g => g.equipos);
    const segundos = grupos.map(g => g[1]);
    const terceros = grupos.map(g => g[2]);
    const cuartos = grupos.map(g => g[3]);
    const quintos = grupos.map(g => g[4]);
    
    const decimoterceros = grupos.map(g => g[12]);
        const peoresCuatro = decimoterceros
          .sort((a, b) => a.puntos - b.puntos)
          .slice(0, 4);
      
        const descensoMatches = [
          createIdaYVueltaMatch(peoresCuatro[0], peoresCuatro[2]),
          createIdaYVueltaMatch(peoresCuatro[3], peoresCuatro[1])
        ];
      
        playoffs["Descenso Segunda RFEF"] = {
          partidos: descensoMatches,
          tipo: "descenso_directo"
        };
    const mezclados2vs5 = shuffleArray(parear(segundos, quintos));
    const mezclados3vs4 = shuffleArray(parear(terceros, cuartos));
    
    
    const brackets = [];
    for (let i = 0; i < 5; i++) {
        const semis = [];
        if (mezclados2vs5[i]) semis.push(createIdaYVueltaMatch(mezclados2vs5[i][0], mezclados2vs5[i][1]));
        if (mezclados3vs4[i]) semis.push(createIdaYVueltaMatch(mezclados3vs4[i][0], mezclados3vs4[i][1]));
        brackets.push({ semifinales: semis, final: [] });
    }

    playoffs["Segunda RFEF"] = {
        brackets,
        tipo: "brackets"
    };

    // ✅ Tercera RFEF - 18 brackets de ronda 1, luego 9 finales
    // ✅ Tercera RFEF - 18 brackets por grupo, luego 9 finales entre ganadores
        const terceraBracketsPorGrupo = terceraRFEFBrackets.map(g => {
            const [ , segundo, tercero, cuarto, quinto ] = g.equipos;
            const semifinales = [
                createIdaYVueltaMatch(segundo, quinto),
                createIdaYVueltaMatch(tercero, cuarto)
            ];
            return { liga: g.liga, semifinales, final: [] };
        });

        playoffs["Tercera RFEF"] = {
            brackets: terceraBracketsPorGrupo,
            finales: [], // Aquí meteremos los 9 enfrentamientos tras las finales de grupo
            tipo: "tercera"
        };

    return playoffs;
}

function parear(listaA, listaB) {
    const emparejados = [];
    const bCopia = [...listaB];
    listaA.forEach(a => {
        const index = Math.floor(Math.random() * bCopia.length);
        const b = bCopia.splice(index, 1)[0];
        if (a && b) emparejados.push([a, b]);
    });
    return emparejados;
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

function sortearBrackets(equipos, numBrackets) {
    const mezclados = shuffleArray(equipos);
    const brackets = [];
    for (let i = 0; i < numBrackets * 2; i += 2) {
        if (mezclados[i + 1]) {
            brackets.push(createIdaYVueltaMatch(mezclados[i], mezclados[i + 1]));
        }
    }
    return brackets;
}

function winnerMock(match) {
    return match.local.posicion < match.visitante.posicion ? match.local : match.visitante;
}

function shuffleArray(array) {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

export default generatePlayoffs;
