import React, { useState } from 'react'; // Importar useState
import { useNavigate } from 'react-router-dom';
import Logo from '../../assets/Logo.svg';
import { motion } from 'framer-motion';

const NavBar = ({ onLogout, user }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para controlar el menú
    const navigate = useNavigate();

    const handleLogout = () => {
        // Limpiar localStorage completamente
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        onLogout();
        navigate('/');
    };

    const handleHome = () => {
        navigate('/home');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen); // Alternar el estado del menú
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 ">
                <div className="flex justify-between">
                    <div className="flex space-x-4">
                        <div>
                            <motion.a href="#" 
                            className="flex items-center py-0 px-2 text-gray-700 hover:text-gray-900"
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x:0, opacity: 1 }}
                            transition={{ duration: 0.4, ease: 'easeOut'}}
                            >
                                <img src={Logo} alt='Logo' className='h-16 w-16 mr-2 object-contain'></img>
                                <span className="font-bold">Zafra S.A</span>
                            </motion.a>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-2">
                        {user && (
                            <span className="py-2 px-3 text-gray-700">{user.nombre} {user.apellido}</span>
                        )}
                        <motion.button 
                        type="button"
                        onClick={() => navigate('/home')}
                        className="py-2 px-3 font-medium text-gray-700 hover:text-gray-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30"
                        initial={{ x: 40, opacity: 0 }}
                        animate={{ x:0, opacity: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut'}}
                        >Inicio</motion.button>
                        <motion.button 
                            type="button"
                            onClick={handleLogout}
                            className="py-2 px-3 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 hover:text-yellow-800 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/30"
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x:0, opacity: 1 }}
                           transition={{ duration: 0.4, ease: 'easeOut'}}                       
                        >Cerrar Sesión
                        </motion.button>
                    </div>

                    <div className="md:hidden flex items-center">
                        <button className="mobile-menu-button p-2 rounded-md hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30" onClick={toggleMenu} aria-label="Abrir menú">
                            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className={`mobile-menu ${isMenuOpen ? 'block' : 'hidden'} md:hidden border-t border-gray-200`}>
                <button type="button" onClick={() => { setIsMenuOpen(false); navigate('/home'); }} className="block w-full text-left py-3 px-4 text-sm hover:bg-gray-50">Inicio</button>
                <button type="button" onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="block w-full text-left py-3 px-4 text-sm hover:bg-gray-50">Cerrar Sesión</button>
            </div>
        </nav>
    );
}

export default NavBar;