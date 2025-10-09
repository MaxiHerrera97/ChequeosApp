import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useParams } from 'react-router-dom';
import { API_URLS } from '../../../config/api';

const ChequeoNeu = ({ selectedModelId, readOnly = false, valuesById }) => {
  const { idTipoChequeo } = useParams();
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
  const [hsMaquina, setHsMaquina] = useState('');
  const [serieMaquina, setSerieMaquina] = useState('');
  const [fecha, setFecha] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [respuestasMap, setRespuestasMap] = useState({});
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('success');
  const [showToast, setShowToast] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [idSesion, setIdSesion] = useState(null);

  const getNowBuenosAires = () => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
  };

  const handleRespuestaChange = (idPregunta, valor) => {
    setRespuestasMap(prev => ({ ...prev, [idPregunta]: valor }));
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
        
        if (!idSesion) throw new Error('Primero envía el formulario para generar la sesión');
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
        throw new Error('Usuario no autenticado');
      }

      const modeloId = selectedModelId ? Number(selectedModelId) : null;
      if (!Number.isFinite(modeloId)) {
        throw new Error('Modelo de máquina inválido (ID). Selecciona un modelo válido.');
      }

      const now = getNowBuenosAires();
      const tipoId = Number(idTipoChequeo);
      if (!Number.isFinite(tipoId) || tipoId <= 0) {
        throw new Error('Tipo de chequeo inválido');
      }

      const payload = {
        legajo: user.legajo,
        idTipoChequeo: tipoId,
        cliente,
        hora_maquina: hsMaquina,
        serie_maquina: serieMaquina,
        fecha: fecha || now,
        temp_durante_la_prueba: null,
        modelo_maquina: modeloId,
        cor_involucrada: null,
        num_servicio: null,
        fechaInicio: fechaInicio || now,
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

      // Preparar respuestas (inputs idPreg96 a idPreg119)
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

      // Resetear formulario
      if (e && e.target && typeof e.target.reset === 'function') {
        e.target.reset();
      }
      setCliente('');
      setHsMaquina('');
      setSerieMaquina('');
      setFecha('');
      setRespuestasMap({});
      // Nueva fecha de inicio para próxima sesión
      setFechaInicio(getNowBuenosAires());
    } catch (err) {
      setStatusType('error');
      setStatusMsg(err.message || 'Error');
      setShowToast(true);
    }
  };

  useEffect(() => {
    setFechaInicio(getNowBuenosAires());
  }, []);

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 3500);
    return () => clearTimeout(t);
  }, [showToast]);

  return (
    <div className="p-2 sm:p-4 w-full max-w-6xl mx-auto">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4 text-center px-2">CHEQUEO DE NEUMATICOS</h2>
      {showToast && (
        <div className={`fixed right-4 bottom-4 z-50 shadow-lg rounded-lg px-4 py-3 border text-sm transition-all ${statusType === 'success' ? 'bg-green-600/95 text-white border-green-700' : 'bg-red-600/95 text-white border-red-700'}`}>
          <div className="font-semibold mb-0.5">{statusType === 'success' ? 'Éxito' : 'Error'}</div>
          <div>{statusMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!readOnly && (
        <div className='shadow bg-gray-100 border border-gray-200 mb-4 p-4 rounded-xl'>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-700">CLIENTE:</label>
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
            <div>
              <label className="block text-sm text-gray-700">HS MAQUINA:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={hsMaquina} onChange={(e)=>setHsMaquina(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">MAQUINA SERIE N°:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={serieMaquina} onChange={(e)=>setSerieMaquina(e.target.value)} />
            </div>
    <div>
              <label className="block text-sm text-gray-700">FECHA:</label>
              <input type="date" className="border rounded w-full h-10 px-3" value={fecha} onChange={(e)=>setFecha(e.target.value)} />
            </div>
          </div>
        </div>
        )}

        <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2">RUEDA TRASERA</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr>
                <th></th>
                <th className="border p-1 sm:p-2" colSpan="2">DERECHA</th>
                <th className="border p-1 sm:p-2" colSpan="2">IZQUIERDA</th>
              </tr>
              <tr>
                <th></th>
                <th className="border p-1 sm:p-2">CUBIERTA</th>
                <th className="border p-1 sm:p-2">LLANTA</th>
                <th className="border p-1 sm:p-2">CUBIERTA</th>
                <th className="border p-1 sm:p-2">LLANTA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-1 sm:p-2">MARCA</td>
                <td className="border p-1 sm:p-2"><input id="idPreg96" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(96, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg97" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(97, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg98" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(98, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg99" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(99, e.target.value)} /></td>
              </tr>
              <tr>
                <td className="border p-1 sm:p-2">RODADO</td>
                <td className="border p-1 sm:p-2"><input id="idPreg100" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(100, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg101" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(101, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg102" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(102, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg103" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(103, e.target.value)} /></td>
              </tr>
              <tr>
                <td className="border p-1 sm:p-2">ESTADO</td>
                <td className="border p-1 sm:p-2"><input id="idPreg104" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(104, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg105" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(105, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg106" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(106, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg107" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(107, e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2">RUEDA DELANTERA</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr>
                <th></th>
                <th className="border p-1 sm:p-2" colSpan="2">DERECHA</th>
                <th className="border p-1 sm:p-2" colSpan="2">IZQUIERDA</th>
              </tr>
              <tr>
                <th></th>
                <th className="border p-1 sm:p-2">CUBIERTA</th>
                <th className="border p-1 sm:p-2">LLANTA</th>
                <th className="border p-1 sm:p-2">CUBIERTA</th>
                <th className="border p-1 sm:p-2">LLANTA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-1 sm:p-2">MARCA</td>
                <td className="border p-1 sm:p-2"><input id="idPreg108" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(108, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg109" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(109, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg110" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(110, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg111" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(111, e.target.value)} /></td>
              </tr>
              <tr>
                <td className="border p-1 sm:p-2">RODADO</td>
                <td className="border p-1 sm:p-2"><input id="idPreg112" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(112, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg113" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(113, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg114" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(114, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg115" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(115, e.target.value)} /></td>
              </tr>
              <tr>
                <td className="border p-1 sm:p-2">ESTADO</td>
                <td className="border p-1 sm:p-2"><input id="idPreg116" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(116, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg117" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(117, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg118" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(118, e.target.value)} /></td>
                <td className="border p-1 sm:p-2"><input id="idPreg119" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(119, e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        {!readOnly && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg shadow w-full sm:w-auto">
              Enviar
            </button>
            <button 
              type="button" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg shadow w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleUploadImages}
              disabled={uploadingImages || !idSesion}
            >
              {uploadingImages ? '⏳ Subiendo...' : (!idSesion ? '📷 Subir Imágenes (guardar primero)' : '📷 Subir Imágenes')}
            </button>
            <button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg shadow w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleUploadDocs}
              disabled={uploadingDocs || !idSesion}
            >
              {uploadingDocs ? '⏳ Subiendo...' : (!idSesion ? '📄 Subir PDF (guardar primero)' : '📄 Subir PDF')}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default ChequeoNeu
