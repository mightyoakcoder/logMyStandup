import { BrowserRouter, Routes, Route } from "react-router-dom"
import './App.css';
import LogMyStandup from './components/logMyStandup';
import NavBar from './components/NavBar';
function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<LogMyStandup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
