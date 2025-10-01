import React, { useState, useEffect } from 'react';
import Card from '../Card/Card';
import { API_URLS } from '../../config/api'; 
import Pagination from '../pagination/Pagination'; 
import { motion } from 'framer-motion';

const Home = ({ selectedModelId, selectedTipoMaquina }) => { 
  const [cardsData, setCardsData] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;

  useEffect(() => {
    // Si hay un modelo específico seleccionado, usar la lógica de modelos (prioridad alta)
    if (selectedModelId) {
      const fetchCheckups = async () => {
        try {
          const response = await fetch(API_URLS.CHEQUEOS_MAQUINA(selectedModelId));
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          const data = await response.json();
          console.log('Datos de chequeos recibidos:', data); 
          
          // Verificar si ya existe el chequeo general en los datos del backend
          const chequeoGeneralExiste = data.some(item => 
            item.tipo === 'Chequeo General Maquina' || item.idTipoChequeo === 6
          );
          
          let updatedData = [...data];
          
          // Solo agregar chequeo general si no está presente
          if (!chequeoGeneralExiste) {
            const chequeoGeneral = {
              idTipoChequeo: 'general', // Asegúrate de que este ID sea único
              tipo: 'Chequeo General Maquina'
            };
            updatedData = [...data, chequeoGeneral];
          }
          
          setCardsData(updatedData);
          setCurrentPage(1); 
        } catch (error) {
          console.error('Error fetching checkups:', error);
        }
      };
      fetchCheckups();
    } else if (selectedTipoMaquina === 4) {
      // Si se seleccionó tractor (idTipoMaquina=4) pero no hay modelo específico, mostrar directamente el informe general
      const tractorChequeo = {
        idTipoChequeo: 7,
        tipo: "Informe General Tractor"
      };
      setCardsData([tractorChequeo]);
      setCurrentPage(1);
    } else {
      setCardsData([]); 
      setCurrentPage(1); 
    }
  }, [selectedModelId, selectedTipoMaquina]); 

  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;

  const totalCards = cardsData.length < 6 ? 6 : cardsData.length; 
  const currentCards = [...cardsData, ...Array.from({ length: totalCards - cardsData.length })].slice(indexOfFirstCard, indexOfLastCard);

  const handleNext = () => {
    if (currentPage < Math.ceil(totalCards / cardsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex flex-col items-center mt-8 px-4">
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y:0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {currentCards.map((card, index) => (
          card ? (
            <Card key={index} title={card.tipo} idTipoChequeo={card.idTipoChequeo} />
          ) : (
            <div key={index} className="w-full max-w-sm min-h-44 rounded-xl border border-dashed border-gray-400 bg-gray-100 grid place-items-center text-sm text-gray-600">Chequeo no disponible</div>
          )
        ))}
      </motion.div>

      <Pagination 
        currentPage={currentPage} 
        totalPages={Math.ceil(totalCards / cardsPerPage)} 
        onNext={handleNext} 
        onPrevious={handlePrevious} 
      />
    </div>
  );
};

export default Home;