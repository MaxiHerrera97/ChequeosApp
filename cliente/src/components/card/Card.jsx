import React from 'react';
import { useNavigate } from 'react-router-dom';

const Card = ({ title, idTipoChequeo }) => {
  const navigate = useNavigate();

  const handleStartCheck = () => {
    // Navegar a la ruta correspondiente según el tipo de chequeo
    const tipoNum = Number(idTipoChequeo);
    console.log('Card clicked - title:', title, 'idTipoChequeo:', idTipoChequeo, 'tipoNum:', tipoNum);
    
    // Verificar primero el caso específico del Informe General Tractor
    if (tipoNum === 7) {
      console.log('Navegando a informe-general-tractor (idTipoChequeo=7)');
      navigate(`/informe-general-tractor/${idTipoChequeo}`);
      return;
    }
    
    const isGeneral = idTipoChequeo === 'general' || tipoNum === 6 || String(title).toLowerCase().includes('general');
    const isNeumaticos = tipoNum === 2 || String(title).toLowerCase().includes('neumatic');
    const isInyectorTurbo = tipoNum === 3 || String(title).toLowerCase().includes('inyector') || String(title).toLowerCase().includes('turbo');
    
    console.log('isGeneral:', isGeneral, 'isNeumaticos:', isNeumaticos, 'isInyectorTurbo:', isInyectorTurbo);
    
    if (isGeneral) {
      console.log('Navegando a chequeo-general');
      navigate(`/chequeo-general`); // Asegúrate de que esta ruta esté definida
    } else if (isNeumaticos) {
      console.log('Navegando a chequeo-neumaticos');
      navigate(`/chequeo-neumaticos/${idTipoChequeo}`);
    } else if (isInyectorTurbo) {
      console.log('Navegando a chequeo-inyector-turbo');
      navigate(`/chequeo-inyector-turbo/${idTipoChequeo}`);
    } else {
      console.log('Navegando a chequeo genérico');
      navigate(`/chequeo/${idTipoChequeo}`); // Para otros chequeos
    }
  };

  return (
    <div className="group flex flex-col justify-between items-start gap-2 w-full max-w-sm min-h-44 transition relative rounded-xl p-5 bg-gray-100 border border-gray-300 shadow-sm hover:-translate-y-1 hover:shadow">
      <div>
        <h2 className="text-lg font-semibold mb-1 text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">Chequeo de sistema</p>
      </div>
      <button 
        className="bg-green-700 hover:bg-green-800 text-white mt-3 rounded-md py-2 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/30"
        onClick={handleStartCheck}
      >
        Iniciar Chequeo
      </button>
    </div>
  );
};

export default Card;