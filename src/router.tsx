import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import MonitoringPage from "./pages/MonitoringPage.tsx";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
      </Routes>
    </BrowserRouter>
  );
}