import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URLS } from '../../../config/api';

const ChequeoGm = ({ selectedModelId, readOnly = false, valuesById }) => {
  const { idTipoChequeo } = useParams();
  const [observaciones, setObservaciones] = useState('');
  const [funciona, setFunciona] = useState({}); // Estado para almacenar las selecciones
  const [cliente, setCliente] = useState('');
  const [modeloMaquina, setModeloMaquina] = useState('');
  const [serieMaquina, setSerieMaquina] = useState('');
  const [respuestasMap, setRespuestasMap] = useState({}); // { [idPregunta]: valor }
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('success'); // 'success' | 'error'
  const [showToast, setShowToast] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');

  useEffect(() => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    setFechaInicio(now);
  }, []);

  // Prefill for read-only (historial) using valuesById map: selects 65..93, obs 66..94 and 95
  useEffect(() => {
    if (!valuesById) return;
    // Completar selects por detalle
    const prefilled = {};
    detalles.forEach((detalle, idx) => {
      const selectIdNumber = 65 + (idx * 2);
      const v = valuesById.get(String(selectIdNumber));
      if (v !== undefined && v !== null && String(v) !== '') {
        prefilled[detalle] = String(v).toLowerCase();
      }
    });
    if (Object.keys(prefilled).length > 0) {
      setFunciona(prev => ({ ...prev, ...prefilled }));
    }
    const obs95 = valuesById.get('95');
    if (obs95 !== undefined) {
      setObservaciones(obs95 || '');
    }
  }, [valuesById]);

  const detalles = [
    'DESPUNTADOR', 
    'PONTON DERECHO', 
    'PONTON IZQUIERDO', 
    'CORTADOR DE BASE', 
    'TROCEADORES', 
    'EXTRACTOR PRIMARIO', 
    'CUENTA VUELTAS DEL EXTRACTOR PRIMARIO', 
    'CAPOTA PRIMARIA', 
    'ELEVADOR', 
    'GIRO DEL ELEVADOR', 
    'BIN FLAP', 
    'CAPOTA SECUNDARIA', 
    'SISTEMA ELECTRICO DE SENSORES DE ALTURA', 
    'SENSOR DE NIVEL DE COMBUSTIBLE', 
    'COMPONENTES ELECTRICOS DE LA CABINA'
  ];

  const handleSelectChange = (detalle, value, idPregunta) => {
    setFunciona(prev => ({ ...prev, [detalle]: value }));
    if (idPregunta) {
      setRespuestasMap(prev => ({ ...prev, [idPregunta]: value }));
    }
  };

  const handleObsChange = (idPregunta, value) => {
    setRespuestasMap(prev => ({ ...prev, [idPregunta]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (!user || !user.legajo) {
        throw new Error('Usuario no autenticado'); 
      }

      const modeloId = selectedModelId ? Number(selectedModelId) : Number(modeloMaquina);
      if (!Number.isFinite(modeloId)) {
        throw new Error('Modelo de máquina inválido (ID). Selecciona un modelo válido.');
      }

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const payload = {
        legajo: user.legajo,
        idTipoChequeo: Number(idTipoChequeo) || idTipoChequeo,
        cliente,
        hora_maquina: null,
        serie_maquina: serieMaquina,
        fecha: now,
        temp_durante_la_prueba: null,
        modelo_maquina: modeloId,
        cor_involucrada: null,
        num_servicio: null,
        fechaInicio,
        fechaFin: now
      };

      const resp = await fetch(API_URLS.SESIONES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.message || 'Error al guardar la sesión');
      }
      const data = await resp.json();

      // Preparar respuestas (incluye selects 65..93, observaciones 66..94 y textarea 95)
      const idsPregunta = Object.keys(respuestasMap);
      const fechaRespuesta = now;
      const respuestasPayload = idsPregunta
        .map(id => ({
          idPregunta: Number(id),
          idSesion: data.idSesion,
          respuesta: respuestasMap[id],
          fechaRespuesta
        }))
        .filter(r => Number.isFinite(r.idPregunta) && String(r.respuesta ?? '').trim() !== '');

      if (respuestasPayload.length > 0) {
        const respResp = await fetch(API_URLS.RESPUESTAS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ respuestas: respuestasPayload })
        });
        if (!respResp.ok) {
          const errData = await respResp.json().catch(() => ({}));
          throw new Error(errData.message || 'Error al guardar respuestas');
        }
      }

      setStatusType('success');
      setStatusMsg('Formulario enviado con éxito');
      setShowToast(true);

      // Reset visual sólo de campos de cabecera; mantiene selects si deseas
      if (e && e.target && typeof e.target.reset === 'function') {
        e.target.reset();
      }
      setCliente('');
      setModeloMaquina('');
      setSerieMaquina('');
      setObservaciones('');
      setFunciona({});
      setRespuestasMap({});
      // nueva fecha de inicio para una próxima sesión
      setFechaInicio(new Date().toISOString().slice(0, 19).replace('T', ' '));
    } catch (err) {
      setStatusType('error');
      setStatusMsg(err.message || 'Error');
      setShowToast(true);
    }
  };

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 3500);
    return () => clearTimeout(t);
  }, [showToast]);

  return (
    
    <div className="p-4 ">
      <form onSubmit={handleSubmit}>
      <div className='shadow bg-gray-100 border border-gray-200 mb-4 p-4 rounded-xl'>
      <h2 className="text-2xl font-bold mb-4">CONTROL DE FUNCIONAMIENTO GENERAL DE MAQUINA</h2>
      {showToast && (
        <div className={`fixed right-4 bottom-4 z-50 shadow-lg rounded-lg px-4 py-3 border text-sm transition-all ${statusType === 'success' ? 'bg-green-600/95 text-white border-green-700' : 'bg-red-600/95 text-white border-red-700'}`}>
          <div className="font-semibold mb-0.5">{statusType === 'success' ? 'Éxito' : 'Error'}</div>
          <div>{statusMsg}</div>
        </div>
      )}
      {!readOnly && (
        <>
          <div className="mb-4">
            <label>CLIENTE:</label>
            <input type="text" className="border rounded w-full" value={cliente} onChange={(e)=>setCliente(e.target.value)} />
          </div>
          <div className="mb-4">
            <label>MODELO DE MAQUINA (ID):</label>
            <input type="text" className="border rounded w-full" value={selectedModelId || modeloMaquina} onChange={(e)=>setModeloMaquina(e.target.value)} disabled={!!selectedModelId} />
          </div>
          <div className="mb-4">
            <label>SERIE N°:</label>
            <input type="text" className="border rounded w-full" value={serieMaquina} onChange={(e)=>setSerieMaquina(e.target.value)} />
          </div>
        </>
      )}
      </div>

<div  className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr>
            <th>DETALLE</th>
            <th>FUNCIONA</th>
            <th>OBSERVACIONES</th>
          </tr>
        </thead>
        <tbody className="odd:bg-gray-100">
          {detalles.map((detalle, idx) => {
            const selectIdNumber = 65 + (idx * 2);
            const obsIdNumber = selectIdNumber + 1;
            const selectId = `idPreg${selectIdNumber}`;
            const obsId = `idPreg${obsIdNumber}`;
            return (
            <tr key={detalle}>
              <td className="border p-2">{detalle}</td>
              <td className="border p-2 text-center">
                <select 
                  className="border rounded mx-auto h-9"
                  id={selectId}
                  value={funciona[detalle] || ''}
                  onChange={(e) => handleSelectChange(detalle, e.target.value, selectIdNumber)}
                  disabled={readOnly}
                >
                  <option value="">Seleccionar</option>
                  <option value="si">SI</option>
                  <option value="no">NO</option> 
                </select>
              </td>
              <td className="border p-2">
                <input 
                  type="text" 
                  className="border rounded w-full h-9" 
                  id={obsId} 
                  defaultValue={valuesById ? valuesById.get(String(obsIdNumber)) || '' : ''}
                  onChange={(e)=>handleObsChange(obsIdNumber, e.target.value)} 
                  disabled={readOnly}
                />
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>

      </div>

<div className="border rounded-xl p-4 mb-4 shadow bg-white border-gray-200">
      <div className="mb-4">
        <label>OBSERVACIONES:</label>
        <textarea
          className="border rounded w-full"
          rows="3"
          id="idPreg95"
          value={observaciones}
          onChange={(e) => { setObservaciones(e.target.value); handleObsChange(95, e.target.value); }}
          readOnly={readOnly}
        ></textarea>
      </div>
      {!readOnly && (
        <button type="submit" className="bg-green-700 hover:bg-green-800 text-white p-2 rounded-md mt-4">Enviar</button>
      )}
    </div>
   </form>
   </div> 
  );
};

export default ChequeoGm;