import NewGamePage from "./components/game/NewGamePage";
import StartPage from "./components/mainmenu/StartPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EquiposPage from "./components/teams/EquiposPage";
import TeamSelection from "./components/teams/TeamSelection";
import LeagueGeneration from "./components/generation/LeagueGeneration";
import LeagueMenu from "./components/mainmenu/LeagueMenu";
import CargarEquipos from "./components/CargarEquipos";
import PlayoffsMenu from "./components/mainmenu/PlayoffsMenu";
import StartMenu from "./components/start/StartPage";
import CargarPartida from "./components/start/CargarPartida";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<StartPage />} />
                <Route path="/new-game" element={<NewGamePage />} />
                <Route path="/team-list" element={<EquiposPage />}  />
                <Route path="/start-page" element={<StartMenu />} />
                <Route path="/load-game" element={<CargarPartida />} />
                <Route path="/team-selection" element={<TeamSelection />} />
                <Route path="/league-generation" element={<LeagueGeneration />} />
                <Route path="/main-menu" element={<LeagueMenu />} />
                <Route path="/cargar-equipos" element={<CargarEquipos />} />
                <Route path="/playoffs-menu" element={<PlayoffsMenu />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;