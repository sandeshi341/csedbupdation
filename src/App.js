import React from "react";
import "./App.css";
import Cseboard from "./Components/cseboard"; // Corrected component import
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Cseboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
