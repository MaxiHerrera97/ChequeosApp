import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useParams } from 'react-router-dom';
import { API_URLS } from '../../../config/api';

const ChequeoGm = ({ selectedModelId, selectedModelName = '', readOnly = false, valuesById }) => {
  const { idTipoChequeo: paramTipoChequeo } = useParams();
  // Si no viene por params (ruta /chequeo-general), usar 6
  const idTipoChequeo = paramTipoChequeo !== undefined ? paramTipoChequeo : 6;
  const [observaciones, setObservaciones] = useState('');
  const [idSesion, setIdSesion] = useState(null);
  const [funciona, setFunciona] = useState({}); // Estado para almacenar las selecciones
  const [cliente, setCliente] = useState('');
  const [clientesOptions, setClientesOptions] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  useEffect(() => {
    setClientesLoading(true);
    fetch(API_URLS.CLIENTES)
      .then(res => res.json())
      .then(data => {
        setClientesOptions(
          Array.isArray(data)
            ? data.map(c => ({ value: c.EMPRESA, label: c.EMPRESA, id: c.IDCLIENTE }))
            : []
        );
      })
      .catch(() => setClientesOptions([]))
      .finally(() => setClientesLoading(false));
  }, []);
  const [modeloMaquina, setModeloMaquina] = useState('');
  const [serieMaquina, setSerieMaquina] = useState('');
  const [respuestasMap, setRespuestasMap] = useState({}); // { [idPregunta]: valor }
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('success'); // 'success' | 'error'
  const [showToast, setShowToast] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

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

  const handleUploadImages = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      setUploadingImages(true);
      try {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('images', file);
        });
        
        // Requiere idSesion creado
        if (!idSesion) {
          throw new Error('Primero envía el formulario para generar la sesión');
        }
        formData.append('idSesion', idSesion);

        const response = await fetch(API_URLS.UPLOAD_IMAGES, {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
          setStatusType('success');
          setStatusMsg(result.message);
          setShowToast(true);
        } else {
          throw new Error(result.message || 'Error al subir imágenes');
        }
      } catch (error) {
        setStatusType('error');
        setStatusMsg(error.message);
        setShowToast(true);
      } finally {
        setUploadingImages(false);
      }
    };
    input.click();
  };

  const handleUploadDocs = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      if (!idSesion) { setStatusType('error'); setStatusMsg('Primero guarda el formulario para generar la sesión'); setShowToast(true); return; }
      setUploadingDocs(true);
      try {
        const formData = new FormData();
        files.forEach(f => formData.append('docs', f));
        formData.append('idSesion', idSesion);
        const response = await fetch(API_URLS.UPLOAD_DOCS, { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error al subir documentos');
        setStatusType('success'); setStatusMsg(result.message); setShowToast(true);
      } catch (err) {
        setStatusType('error'); setStatusMsg(err.message); setShowToast(true);
      } finally {
        setUploadingDocs(false);
      }
    };
    input.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = window.confirm('Una vez envíes este formulario, no podrás editarlo. ¿Estás seguro que deseas enviar?');
    if (!ok) return;
    setStatusMsg('');
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (!user || !user.legajo) {
        setStatusType('error');
        setStatusMsg('Error: Usuario no autenticado o legajo no disponible. Vuelve a iniciar sesión.');
        setShowToast(true);
        return;
      }
      if (!idTipoChequeo || isNaN(Number(idTipoChequeo))) {
        setStatusType('error');
        setStatusMsg('Error: Tipo de chequeo inválido. Vuelve a ingresar desde el menú principal.');
        setShowToast(true);
        return;
      }
      const modeloId = selectedModelId ? Number(selectedModelId) : Number(modeloMaquina);
      if (!Number.isFinite(modeloId)) {
        setStatusType('error');
        setStatusMsg('Modelo de máquina inválido (ID). Selecciona un modelo válido.');
        setShowToast(true);
        return;
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
      setIdSesion(data.idSesion);

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
    
    <div className="p-4">
      {showToast && (
        <div className={`fixed right-4 bottom-4 z-50 shadow-lg rounded-lg px-4 py-3 border text-sm transition-all ${statusType === 'success' ? 'bg-green-600/95 text-white border-green-700' : 'bg-red-600/95 text-white border-red-700'}`}>
          <div className="font-semibold mb-0.5">{statusType === 'success' ? 'Éxito' : 'Error'}</div>
          <div>{statusMsg}</div>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className='shadow bg-gray-100 border border-gray-200 mb-4 p-4 rounded-xl'>
          <h2 className="text-2xl font-bold mb-4">CONTROL DE FUNCIONAMIENTO GENERAL DE MAQUINA</h2>
          <div>
            <label>CLIENTE:</label>
            <Select
              isClearable
              isSearchable
              isLoading={clientesLoading}
              options={clientesOptions}
              value={clientesOptions.find(opt => opt.value === cliente) || null}
              onChange={opt => setCliente(opt ? opt.value : '')}
              placeholder={clientesLoading ? 'Cargando clientes...' : 'Seleccione un cliente'}
              noOptionsMessage={() => clientesLoading ? 'Cargando...' : 'Sin resultados'}
              classNamePrefix="react-select"
            />
          </div>
          <div className="mb-4">
            <label>MODELO DE MAQUINA:</label>
            {selectedModelName ? (
              <input type="text" className="border rounded w-full bg-gray-100" value={selectedModelName} readOnly />
            ) : selectedModelId ? (
              <input type="text" className="border rounded w-full bg-gray-100" value={selectedModelId} readOnly />
            ) : (
              <input type="text" className="border rounded w-full" value={modeloMaquina} onChange={(e)=>setModeloMaquina(e.target.value)} />
            )}
          </div>
          <div className="mb-4">
            <label>SERIE N°:</label>
            <input type="text" className="border rounded w-full" value={serieMaquina} onChange={(e)=>setSerieMaquina(e.target.value)} />
          </div>
        </div>
        <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
              <button type="submit" className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-md">
                Enviar
              </button>
              <button 
                type="button" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUploadDocs}
                disabled={uploadingDocs || !idSesion}
              >
                {uploadingDocs ? '⏳ Subiendo...' : (!idSesion ? '📄 Subir PDF (guardar primero)' : '📄 Subir PDF')}
              </button>
              <button 
                type="button" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUploadImages}
                disabled={uploadingImages || !idSesion}
              >
                {uploadingImages ? '⏳ Subiendo...' : (!idSesion ? '📷 Subir Imágenes (guardar primero)' : '📷 Subir Imágenes')}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChequeoGm;