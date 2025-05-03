import { Link } from "react-router-dom";
import "../styles/mainmenu/MainMenu.css";

function MainMenu() {
    return (
        localStorage.clear(),
        <div className="main-menu">
            <div className="menu-options>">
                <Link to="start-page" className="menu-link">
                    <button className="menu-button">
                        Play
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default MainMenu; // Asegúrate de exportar por defecto