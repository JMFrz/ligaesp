import { useEffect } from "react";
import localforage from "localforage";

const CargarEquipos = () => {
    useEffect(() => {
        const equipos = [
            {
                id: 1,
                nombre: "Equipo A",
                liga: "Primera RFEF - Grupo 1",
                comunidad: "Galicia",
                imagen: "equipoA.png",
                player: true
            },
            {
                id: 2,
                nombre: "Equipo B",
                liga: "Primera RFEF - Grupo 1",
                comunidad: "Asturias",
                imagen: "equipoB.png",
                player: false
            },
            {
                id: 3,
                nombre: "Equipo C",
                liga: "Primera RFEF - Grupo 2",
                comunidad: "Andalucía",
                imagen: "equipoC.png",
                player: false
            }
            // ... puedes agregar más
        ];

        localforage.setItem("equipos", equipos)
            .then(() => {
                alert("Equipos cargados correctamente en localForage");
                console.log("Equipos:", equipos);
            })
            .catch((error) => {
                console.error("Error al guardar equipos:", error);
            });
    }, []);

    return (
        <div style={{ padding: "2rem" }}>
            <h2>Carga inicial de equipos completada</h2>
            <p>Revisa DevTools → IndexedDB → localforage para ver los datos.</p>
        </div>
    );
};

export default CargarEquipos;