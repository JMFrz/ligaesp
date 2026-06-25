import { Link } from "react-router-dom";
import "../styles/mainmenu/MainMenu.css";

function MainMenu() {
    return (
        localStorage.clear(),
        sessionStorage.clear(),
        <div className="main-menu">
            <h1 className="menu-title">Liga España Emulator</h1>
            <div className="menu-options">
                <Link to="start-page" className="menu-link">
                    <button className="menu-button">
                        Play
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default MainMenu;