import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { API_URLS } from '../../config/api';

const Sidebar = ({ isLoggedIn, toggleSidebar, onModelSelect, onTipoMaquinaSelect }) => {
    const location = useLocation(); // Obtener la ubicación actual
    const [tiposMaquinas, setTiposMaquinas] = useState([]);
    const [modelos, setModelos] = useState([]);
    const [selectedTipo, setSelectedTipo] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    // Resetear estado cuando se desloguea
    useEffect(() => {
        if (!isLoggedIn) {
            setModelos([]);
            setSelectedTipo(null);
            setIsOpen(false);
        }
    }, [isLoggedIn]);

    // Cerrar sidebar automáticamente en rutas de chequeo para evitar overlay bloqueando clics
    useEffect(() => {
        if ((location.pathname.startsWith('/chequeo') || location.pathname.startsWith('/informe-general-tractor')) && isOpen) {
            setIsOpen(false);
            toggleSidebar();
        }
    }, [location.pathname]);

    useEffect(() => {
        fetch(API_URLS.TIPOS_MAQUINAS)
            .then(response => response.json())
            .then(data => setTiposMaquinas(data))
            .catch(error => console.error('Error al obtener tipos de máquinas:', error));
    }, []);

    const handleTipoClick = (idTipoMaquina) => {
        setSelectedTipo(idTipoMaquina);
        setModelos([]); // Limpiar modelos al seleccionar un nuevo tipo
        onModelSelect(null); // Limpiar el modelo seleccionado
        
        // Si es tractor (idTipoMaquina=4), llamar directamente a onTipoMaquinaSelect
        if (idTipoMaquina === 4) {
            onTipoMaquinaSelect(idTipoMaquina);
            toggleSidebarLocal(); // Cerrar el sidebar después de seleccionar tractor
            return;
        }
        
        // Para otros tipos, obtener modelos como antes
        fetch(API_URLS.MODELOS_MAQUINAS(idTipoMaquina))
            .then(response => response.json())
            .then(data => setModelos(data))
            .catch(error => console.error('Error al obtener modelos de máquinas:', error));
    };

    const handleModelClick = (idModelo) => {
        const modeloObj = modelos.find(m => m.idModelo === idModelo);
        const modeloNombre = modeloObj ? modeloObj.modelo : '';
        onModelSelect(idModelo, modeloNombre); // Pasar ambos valores
        toggleSidebarLocal(); // Cerrar el sidebar después de seleccionar
    };

    const toggleSidebarLocal = () => {
        setIsOpen(!isOpen);
        toggleSidebar();
    };

    return (
        <>
            {isLoggedIn && (
                <>
                    <div className="text-center mt-4 no-print">
                        {(location.pathname.startsWith('/chequeo') || location.pathname.startsWith('/informe-general-tractor')) ? null : (
                            <motion.button
                                className="text-white bg-green-700 hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30 font-medium rounded-lg text-sm px-4 py-2.5"
                                type="button"
                                onClick={toggleSidebarLocal}
                                initial={{ x: 40, opacity: 0 }}
                                animate={{ x:0, opacity: 1 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                            >
                                Menu de Máquinas
                            </motion.button>
                        )}
                    </div>

                    {isOpen && (
                        <div className="fixed inset-0 z-40 bg-black/30" onClick={toggleSidebarLocal} aria-hidden="true"></div>
                    )}

                    <div
                        className={`fixed top-0 left-0 z-50 w-72 h-screen p-4 overflow-y-auto transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} bg-white shadow-xl`}
                        tabIndex="-1"
                        aria-labelledby="drawer-navigation-label"
                        role="dialog"
                        aria-modal="true"
                    >
                        <h5 id="drawer-navigation-label" className="text-sm font-semibold text-green-700 uppercase tracking-wide">Menu</h5>
                        <button
                            type="button"
                            onClick={toggleSidebarLocal}
                            className="text-gray-600 bg-transparent hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm p-1.5 absolute top-2.5 right-2.5 inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30"
                            aria-label="Cerrar menú"
                        >
                            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                            </svg>
                            <span className="sr-only">Close menu</span>
                        </button>
                        <div className="py-4 overflow-y-auto">
                            <div className="mb-3">
                                <a
                                  href="/historial"
                                  className="w-full inline-flex items-center justify-center px-3 py-2 text-white bg-green-700 hover:bg-green-800 rounded-md text-sm"
                                  role="menuitem"
                                  onClick={toggleSidebarLocal}
                                >
                                  Historial de Chequeos
                                </a>
                            </div>
                            <ul className="space-y-1 font-medium" role="menu">
                                {tiposMaquinas.map(tipo => (
                                    <li key={tipo.idTipoMaquina}>
                                        <button
                                            type="button"
                                            className="w-full text-left flex items-center px-3 py-2 text-gray-900 rounded-md hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30"
                                            onClick={() => handleTipoClick(tipo.idTipoMaquina)}
                                            role="menuitem"
                                        >
                                            <span className="flex-1 ms-1">{tipo.tipoMaquina}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {selectedTipo && (
                                <div className="mt-4">
                                    <h3 className="text-xs uppercase tracking-wide text-gray-600 mb-2">Modelos de Máquina</h3>
                                    <ul className="space-y-1 font-medium" role="menu">
                                        {modelos.map(modelo => (
                                            <li key={modelo.idModelo}>
                                                <button
                                                    type="button"
                                                    className="w-full text-left flex items-center px-3 py-2 text-gray-900 rounded-md hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30"
                                                    onClick={() => handleModelClick(modelo.idModelo)}
                                                    role="menuitem"
                                                >
                                                    <span className="flex-1 ms-1">{modelo.modelo}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Sidebar;