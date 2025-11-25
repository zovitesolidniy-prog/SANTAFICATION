import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import SantaWorld from "@/components/SantaWorld";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/santa-world" element={<SantaWorld />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;