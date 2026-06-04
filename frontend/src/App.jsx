import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/Routes";
import { AuthProvider } from "./context/AuthContext";
import { DroneProvider } from "./context/DroneContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DroneProvider>
          <AppRoutes />
        </DroneProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;