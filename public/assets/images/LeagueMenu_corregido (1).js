
// LeagueMenu completamente corregido
import { useState, useEffect } from "react";
import "../styles/mainmenu/LeagueMenu.css";
import { useNavigate, useLocation } from "react-router-dom";
import { getItem, setItem } from "../storage/storage";

function LeagueMenu() {
  const [jornadas, setJornadas] = useState([]);
  const [clasificacion, setClasificacion] = useState([]);
  const [jornadaActual, setJornadaActual] = useState(0);
  const [jornadaActiva, setJornadaActiva] = useState(0);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  const [partidosPendientes, setPartidosPendientes] = useState([]);
  const [ligaSeleccionada, setLigaSeleccionada] = useState(null);
  const [ligasDisponibles, setLigasDisponibles] = useState([]);
  const [ligasAgrupadas, setLigasAgrupadas] = useState({});
  const [clasificacionPorGrupo, setClasificacionPorGrupo] = useState({});
  const [jornadasPorGrupo, setJornadasPorGrupo] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  useEffect(() => {
    const cargarDatos = async () => {
      const equipos = await getItem("equipos") || [];
      const ascensosObj = await getItem("ascensos") || {};
      const playoffsObj = await getItem("playoffs") || {};
      const descensosObj = await getItem("descensos") || {};

      const ligasUnicas = equipos.reduce((acc, equipo) => {
        if (!acc.includes(equipo.liga)) acc.push(equipo.liga);
        return acc;
      }, []);

      const agrupadas = {};
      ligasUnicas.forEach((liga) => {
        const base = liga.split(" - ")[0];
        if (!agrupadas[base]) agrupadas[base] = [];
        agrupadas[base].push(liga);
      });

      setLigasAgrupadas(agrupadas);
      const bases = Object.keys(agrupadas);
      setLigasDisponibles(bases);

      const liga = ligaSeleccionada || bases[0];
      if (!ligaSeleccionada) setLigaSeleccionada(liga);

      const grupos = agrupadas[liga] || [liga];

      const calendarioObj = {};
      const clasificacionObj = {};
      const clasificaciones = {};
      const calendarios = {};
      let pendientes = [];

      for (const grupo of grupos) {
        clasificacionObj[grupo] = await getItem(`clasificacion_${grupo}`) || [];
        calendarioObj[grupo] = await getItem(`calendario_${grupo}`) || [];

        clasificaciones[grupo] = clasificacionObj[grupo];
        calendarios[grupo] = calendarioObj[grupo];

        calendarioObj[grupo].forEach((jornada) => {
          jornada.forEach((partido) => {
            const esDelJugador = equipos.some(e => e.player && (e.id === partido.local.id || e.id === partido.visitante.id));
            if (!partido.jugado && esDelJugador) {
              pendientes.push({ ...partido, grupo });
            }
          });
        });
      }

      const seleccionados = equipos.filter(
        (equipo) => equipo.player && grupos.includes(equipo.liga)
      );

      setEquiposSeleccionados(seleccionados);
      setClasificacionPorGrupo(clasificaciones);
      setJornadasPorGrupo(calendarios);
      setClasificacion(Object.values(clasificaciones).flat());
      setJornadas(combinarJornadasPorIndice(Object.values(calendarios)));
      setPartidosPendientes(pendientes);
    };

    cargarDatos();
  }, [ligaSeleccionada, state.resultado, jornadaActiva]);

  const jugarPartido = (local, visitante) => {
    const esControlado = local.player || visitante.player;
    if (esControlado) {
      return { esControlado: true, equipoJugador: local.player ? local : visitante, local, visitante };
    }
    return {
      esControlado: false,
      golesLocal: Math.floor(Math.random() * 5),
      golesVisitante: Math.floor(Math.random() * 5),
    };
  };

  const actualizarClasificacion = async (jornada) => {
    const nueva = clasificacion.map(e => ({ ...e }));
    jornada.forEach(({ local, visitante, golesLocal, golesVisitante }) => {
      const eqL = nueva.find(e => e.id === local.id);
      const eqV = nueva.find(e => e.id === visitante.id);
      if (!eqL || !eqV) return;

      eqL.partidosJugados++;
      eqV.partidosJugados++;
      eqL.golesFavor += golesLocal;
      eqL.golesContra += golesVisitante;
      eqV.golesFavor += golesVisitante;
      eqV.golesContra += golesLocal;

      if (golesLocal > golesVisitante) {
        eqL.victorias++; eqL.puntos += 3; eqV.derrotas++;
      } else if (golesLocal < golesVisitante) {
        eqV.victorias++; eqV.puntos += 3; eqL.derrotas++;
      } else {
        eqL.empates++; eqV.empates++; eqL.puntos++; eqV.puntos++;
      }
    });

    setClasificacion(nueva);

    const grupos = ligasAgrupadas[ligaSeleccionada] || [ligaSeleccionada];
    for (const grupo of grupos) {
      const clasifGrupo = nueva.filter(e => clasificacionPorGrupo[grupo].some(g => g.id === e.id));
      await setItem(`clasificacion_${grupo}`, clasifGrupo);
    }
  };

  const jugarRestoPartidos = async () => {
    const nuevaJornada = [...(jornadas[jornadaActiva] || [])];
    nuevaJornada.forEach((partido, index) => {
      if (!partido.jugado) {
        const resultado = jugarPartido(partido.local, partido.visitante);
        nuevaJornada[index] = { ...partido, ...resultado, jugado: true };
      }
    });

    const nuevasJornadas = [...jornadas];
    nuevasJornadas[jornadaActiva] = nuevaJornada;
    setJornadas(nuevasJornadas);

    const grupos = ligasAgrupadas[ligaSeleccionada] || [ligaSeleccionada];
    for (const grupo of grupos) {
      const calendarioGrupo = await getItem(`calendario_${grupo}`) || [];
      if (!Array.isArray(calendarioGrupo)) continue;

      calendarioGrupo[jornadaActiva] = calendarioGrupo[jornadaActiva]?.map(partido => {
        const actualizado = nuevaJornada.find(p => p.local.id === partido.local.id && p.visitante.id === partido.visitante.id);
        return actualizado || partido;
      }) || [];

      await setItem(`calendario_${grupo}`, calendarioGrupo);
    }

    setPartidosPendientes([]);
    await actualizarClasificacion(nuevaJornada);
    avanzarJornada();
  };

  const avanzarJornada = () => {
    setJornadaActiva((prev) => prev + 1);
  };

  const combinarJornadasPorIndice = (jornadasPorGrupo) => {
    const max = Math.max(...jornadasPorGrupo.map(j => j.length));
    const fusionadas = [];
    for (let i = 0; i < max; i++) {
      const jornada = [];
      jornadasPorGrupo.forEach(g => {
        if (g[i]) jornada.push(...g[i]);
      });
      fusionadas.push(jornada);
    }
    return fusionadas;
  };

  return (
    <div>
      <h2>Menu Liga</h2>
      <button onClick={jugarRestoPartidos}>Simular Jornada</button>
    </div>
  );
}

export default LeagueMenu;
