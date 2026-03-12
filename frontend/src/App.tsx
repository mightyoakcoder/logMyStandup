import { useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import './App.css';
import LogMyStandup from './components/logMyStandup';
import NavBar from './components/NavBar';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BrowserRouter>
      <NavBar onMenuToggle={() => setSidebarOpen(v => !v)} />
      <Routes>
        <Route path="/" element={
          <LogMyStandup sidebarOpen={sidebarOpen} onSidebarClose={() => setSidebarOpen(false)} />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
