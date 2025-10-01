
import { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './components/login/Login';
import NavBar from './components/navbar/Navbar';
import Home from './components/home/Home';
import Sidebar from './components/sidebar/Sidebar';
import ChequeoForm from './components/chequeos/chequeoForm/ChequeoForm';
import ChequeoGm from './components/chequeos/chequeoGm/ChequeoGm';
import ChequeoNeu from './components/chequeos/chequeoNeu/ChequeoNeu';
import ChequeoInyTurbAft from './components/chequeos/chequeoITA/ChequeoInyTurbAft';
import InformeGeneralTractor from './components/informeGeneraTractor/InformeGeneralTractor';
import Historial from './components/historial/Historial';
import HistorialDetalle from './components/historial/HistorialDetalle';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para controlar el sidebar
  const [selectedModelId, setSelectedModelId] = useState(null); // Estado para almacenar el ID del modelo seleccionado
  const [selectedTipoMaquina, setSelectedTipoMaquina] = useState(null); // Estado para almacenar el ID del tipo de máquina seleccionado

  useEffect(() => {
    // Verificar el estado de autenticación al cargar la página
    const loggedInStatus = localStorage.getItem('isAuthenticated');
    if (loggedInStatus) {
      setIsAuthenticated(JSON.parse(loggedInStatus));
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', true); // Guardar estado de autenticación
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated'); // Limpiar estado de autenticación
    localStorage.removeItem('user'); // Limpiar datos del usuario
    setSelectedModelId(null); // Limpiar modelo seleccionado
    setSelectedTipoMaquina(null); // Limpiar tipo de máquina seleccionado
    setIsSidebarOpen(false); // Cerrar sidebar
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen); // Alternar el estado del sidebar
  };

  // Función para manejar la selección del modelo
  const handleModelSelect = (modelId) => {
    setSelectedModelId(modelId); // Actualiza el ID del modelo seleccionado
  };

  // Función para manejar la selección del tipo de máquina
  const handleTipoMaquinaSelect = (tipoMaquinaId) => {
    setSelectedTipoMaquina(tipoMaquinaId); // Actualiza el ID del tipo de máquina seleccionado
  };

  return (
    <>
      {isAuthenticated && (
        <div className={`transition-all duration-500 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}> {/* Ajustar el margen del NavBar */}
          <NavBar onLogout={handleLogout} />
        </div>
      )}
      {isAuthenticated && (
        <Sidebar 
          isLoggedIn={isAuthenticated} 
          toggleSidebar={toggleSidebar} 
          onModelSelect={handleModelSelect} // Pasar la función para seleccionar el modelo
          onTipoMaquinaSelect={handleTipoMaquinaSelect} // Pasar la función para seleccionar el tipo de máquina
        />
      )}
      <div className={`transition-all duration-1000 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}> {/* Ajustar el margen del contenido */}
        <Routes>
          <Route path="/" element={<Login onLogin={handleLogin} />} />
          <Route path='/home' element={<Home selectedModelId={selectedModelId} selectedTipoMaquina={selectedTipoMaquina} />} /> {/* Pasar el ID del modelo y tipo de máquina seleccionado a Home */}
          <Route path='/chequeo/:idTipoChequeo' element={<ChequeoForm selectedModelId={selectedModelId} />} />
          <Route path='/chequeo-general' element={<ChequeoGm selectedModelId={selectedModelId} />} />
          <Route path='/chequeo-neumaticos/:idTipoChequeo' element={<ChequeoNeu selectedModelId={selectedModelId} />} />
          <Route path='/chequeo-inyector-turbo/:idTipoChequeo' element={<ChequeoInyTurbAft selectedModelId={selectedModelId} />} />
          <Route path='/informe-general-tractor/:idTipoChequeo' element={<InformeGeneralTractor selectedModelId={selectedModelId} />} />
          <Route path='/historial' element={<Historial />} />
          <Route path='/historial/:idSesion' element={<HistorialDetalle />} />
        </Routes>
      </div>
    </>
  );
}

export default App;