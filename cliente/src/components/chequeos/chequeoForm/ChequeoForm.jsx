import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useParams } from 'react-router-dom';
import { API_URLS } from '../../../config/api';

// Ahora acepta selectedModelName
const ChequeoForm = ({ selectedModelId, selectedModelName = '', readOnly = false, valuesById }) => {
  const { idTipoChequeo } = useParams();
  const [idSesion, setIdSesion] = useState(null);
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
  const [horaMaquina, setHoraMaquina] = useState('');
  const [serieMaquina, setSerieMaquina] = useState('');
  const [fecha, setFecha] = useState('');
  const [tempPrueba, setTempPrueba] = useState('');
  const [modeloMaquina, setModeloMaquina] = useState('');
  const [corInvolucrada, setCorInvolucrada] = useState('');
  const [numServicio, setNumServicio] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('success'); // 'success' | 'error'
  const [showToast, setShowToast] = useState(false);
  const [respuestasMap, setRespuestasMap] = useState({}); // { [idPregunta]: valor }
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

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
    // Confirmación antes de enviar
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
      const usuario_nombre = `${user.nombre} ${user.apellido}`;
      const nowBuenosAires = (() => {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Argentina/Buenos_Aires',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        const parts = formatter.formatToParts(new Date());
        const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
        return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
      })();
      const payload = {
        legajo: user.legajo,
        usuario_nombre,
        idTipoChequeo: Number(idTipoChequeo) || idTipoChequeo,
        cliente,
        hora_maquina: horaMaquina,
        serie_maquina: serieMaquina,
        fecha,
        temp_durante_la_prueba: tempPrueba,
        modelo_maquina: modeloId,
        cor_involucrada: corInvolucrada,
        num_servicio: numServicio,
        fechaInicio: fechaInicio || nowBuenosAires,
        fechaFin: nowBuenosAires
      };
      const resp = await fetch(API_URLS.SESIONES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.message || 'Error al guardar');
      }
      const data = await resp.json();
      setIdSesion(data.idSesion);
      setIdSesion(data.idSesion);

      // Si hay respuestas marcadas, enviarlas en lote
      const idsPregunta = Object.keys(respuestasMap);
      if (idsPregunta.length > 0) {
        const fechaRespuesta = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const respuestasPayload = idsPregunta
          .map(id => ({
            idPregunta: Number(id),
            idSesion: data.idSesion,
            respuesta: respuestasMap[id],
            fechaRespuesta
          }))
          .filter(r => Number.isFinite(r.idPregunta) && String(r.respuesta).trim() !== '');
        if (respuestasPayload.length === 0) {
          setStatusType('success');
          setStatusMsg('Formulario enviado con éxito');
          setShowToast(true);
          return;
        }
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
      // Resetear formulario e inputs controlados
      if (e && e.target && typeof e.target.reset === 'function') {
        e.target.reset();
      }
      setCliente('');
      setHoraMaquina('');
      setSerieMaquina('');
      setFecha('');
      setTempPrueba('');
      setModeloMaquina('');
      setCorInvolucrada('');
      setNumServicio('');
      setFechaInicio('');
      setFechaFin('');
      setRespuestasMap({});
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
    <div className="p-4 w-full max-w-6xl mx-auto">
      
      <h2 className="text-2xl font-bold mb-4 text-center">CHEQUEO DE PRESIONES MAQUINA</h2>
      {showToast && (
        <div className={`fixed right-4 bottom-4 z-50 shadow-lg rounded-lg px-4 py-3 border text-sm transition-all ${statusType === 'success' ? 'bg-green-600/95 text-white border-green-700' : 'bg-red-600/95 text-white border-red-700'}`}>
          <div className="font-semibold mb-0.5">{statusType === 'success' ? 'Éxito' : 'Error'}</div>
          <div>{statusMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
          {!readOnly && (
          <div className='shadow bg-gray-100 border border-gray-200 mb-4 p-4 rounded-xl'>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <input type="text" className="border rounded w-full h-10 px-3" value={horaMaquina} onChange={(e)=>setHoraMaquina(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">MAQUINA SERIE N°:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={serieMaquina} onChange={(e)=>setSerieMaquina(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">MODELO MÁQUINA:</label>
              {/* Mostrar el nombre si está disponible, si no el ID, si no el input editable */}
              {selectedModelName ? (
                <input type="text" className="border rounded w-full h-10 px-3 bg-gray-100" value={selectedModelName} readOnly />
              ) : selectedModelId ? (
                <input type="text" className="border rounded w-full h-10 px-3 bg-gray-100" value={selectedModelId} readOnly />
              ) : (
                <input type="text" className="border rounded w-full h-10 px-3" value={modeloMaquina} onChange={(e)=>setModeloMaquina(e.target.value)} />
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700">FECHA:</label>
              <input type="date" className="border rounded w-full h-10 px-3" value={fecha} onChange={(e)=>setFecha(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">TEMP DURANTE LA PRUEBA:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={tempPrueba} onChange={(e)=>setTempPrueba(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">COR RELACIONADA:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={corInvolucrada} onChange={(e)=>setCorInvolucrada(e.target.value)} />
            </div>
          </div>
        </div>
          )}

 {/* Tarjeta para BOMBA Y MOTOR TRANSMISIÓN */}
 <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          
          <h3 className="font-bold text-center mb-2">BOMBA Y MOTOR TRANSMISIÓN</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr>
                <th>VALOR REF. CARGA MAX.</th>
              </tr>
              <tr>
                <th className='bg-slate-600'>360 ± 10</th>
                <th className="border p-2" colSpan="2">DERECHA</th>
                <th className="border p-2" colSpan="2">IZQUIERDA</th>
              </tr>
              <tr>
                <th className='bg-slate-600'>5500 ± 100</th>
                <th className="border p-2">AVANCE</th>
                <th className="border p-2">REVERSA</th>
                <th className="border p-2">AVANCE</th>
                <th className="border p-2">REVERSA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">PRE CARGA</td>
                <td className="border p-2"><input id="idPreg1" type="text" className="border rounded w-full" data-id-pregunta="1" onChange={(e)=>handleRespuestaChange(1, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg2" type="text" className="border rounded w-full" data-id-pregunta="2" onChange={(e)=>handleRespuestaChange(2, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg3" type="text" className="border rounded w-full" data-id-pregunta="3" onChange={(e)=>handleRespuestaChange(3, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg4" type="text" className="border rounded w-full" data-id-pregunta="4" onChange={(e)=>handleRespuestaChange(4, e.target.value)} /></td>
              </tr>
              <tr>
                <td className="border p-2">ALTA</td>
                <td className="border p-2"><input id="idPreg5" type="text" className="border rounded w-full" data-id-pregunta="5" onChange={(e)=>handleRespuestaChange(5, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg6" type="text" className="border rounded w-full" data-id-pregunta="6" onChange={(e)=>handleRespuestaChange(6, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg7" type="text" className="border rounded w-full" data-id-pregunta="7" onChange={(e)=>handleRespuestaChange(7, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg8" type="text" className="border rounded w-full" data-id-pregunta="8" onChange={(e)=>handleRespuestaChange(8, e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4">
            <label>OBSERVACIONES:</label>
            <textarea className="border rounded w-full" rows="3"></textarea>
          </div>
          </div>
        </div>

         {/* Tarjeta para BOMBA TRANSMISIÓN */}
 <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          
          <h3 className="font-bold text-center mb-2">BOMBA TRANSMISIÓN</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr>
                <th>VALOR REF. CARGA MAX.</th>
              </tr>
              <tr>
                <th className='bg-slate-600'>360 ± 10</th>
                <th className="border p-2" colSpan="2">DERECHA</th>
                <th className="border p-2" colSpan="2">IZQUIERDA</th>
              </tr>
              <tr>
                <th className='bg-slate-600'>5500 ± 100</th>
                <th className="border p-2">AVANCE</th>
                <th className="border p-2">REVERSA</th>
                <th className="border p-2">AVANCE</th>
                <th className="border p-2">REVERSA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">PRE CARGA</td>
                <td className="border p-2"><input id="idPreg9" type="text" className="border rounded w-full" data-id-pregunta="9" onChange={(e)=>handleRespuestaChange(9, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg10" type="text" className="border rounded w-full" data-id-pregunta="10" onChange={(e)=>handleRespuestaChange(10, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg11" type="text" className="border rounded w-full" data-id-pregunta="11" onChange={(e)=>handleRespuestaChange(11, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg12" type="text" className="border rounded w-full" data-id-pregunta="12" onChange={(e)=>handleRespuestaChange(12, e.target.value)} /></td>
              </tr>
              <tr>
                <td className="border p-2">ALTA</td>
                <td className="border p-2"><input id="idPreg13" type="text" className="border rounded w-full" data-id-pregunta="13" onChange={(e)=>handleRespuestaChange(13, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg14" type="text" className="border rounded w-full" data-id-pregunta="14" onChange={(e)=>handleRespuestaChange(14, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg15" type="text" className="border rounded w-full" data-id-pregunta="15" onChange={(e)=>handleRespuestaChange(15, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg16" type="text" className="border rounded w-full" data-id-pregunta="16" onChange={(e)=>handleRespuestaChange(16, e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4">
            <label>OBSERVACIONES:</label>
            <textarea className="border rounded w-full" rows="3"></textarea>
          </div>
          </div>
        </div>

        {/* Tarjeta para BOMBA CORTADOR DE BASE - TROCEADOR */}
 <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          
          <h3 className="font-bold text-center mb-2">SISTEMA DE CORTADOR DE BASE - TROCEADOR</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr>
                <th>VALOR REF. CARGA MAX.</th>
              </tr>
              <tr>
                <th className='bg-slate-600'>360 ± 10</th>
                <th className="border p-2" colSpan="2">DERECHA</th>
                <th className="border p-2" colSpan="2">IZQUIERDA</th>
              </tr>
              <tr>
                <th className='bg-slate-600'>5500 ± 100</th>
                <th className="border p-2">AVANCE</th>
                <th className="border p-2">REVERSA</th>
                <th className="border p-2">AVANCE</th>
                <th className="border p-2">REVERSA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">PRE CARGA</td>
                <td className="border p-2"><input id="idPreg17" type="text" className="border rounded w-full" data-id-pregunta="17" onChange={(e)=>handleRespuestaChange(17, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg18" type="text" className="border rounded w-full" data-id-pregunta="18" onChange={(e)=>handleRespuestaChange(18, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg19" type="text" className="border rounded w-full" data-id-pregunta="19" onChange={(e)=>handleRespuestaChange(19, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg20" type="text" className="border rounded w-full" data-id-pregunta="20" onChange={(e)=>handleRespuestaChange(20, e.target.value)} /></td>
              </tr>
              <tr>
                <td className="border p-2">ALTA</td>
                <td className="border p-2"><input id="idPreg21" type="text" className="border rounded w-full" data-id-pregunta="21" onChange={(e)=>handleRespuestaChange(21, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg22" type="text" className="border rounded w-full" data-id-pregunta="22" onChange={(e)=>handleRespuestaChange(22, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg23" type="text" className="border rounded w-full" data-id-pregunta="23" onChange={(e)=>handleRespuestaChange(23, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg24" type="text" className="border rounded w-full" data-id-pregunta="24" onChange={(e)=>handleRespuestaChange(24, e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4">
            <label>OBSERVACIONES:</label>
            <textarea className="border rounded w-full" rows="3"></textarea>
          </div>
          </div>
        </div>

         {/* Tarjeta para SISTEMA DE CORTADOR DE BASE - TROCEADOR */}
 <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          
          <h3 className="font-bold text-center mb-2">BOMBA CORTADOR DE BASE - TROCEADOR</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr>
                <th>VALOR REF. CARGA MAX.</th>
              </tr>
              <tr>
                <th className='bg-slate-600'>360 ± 10</th>
                <th className="border p-2" colSpan="2">DERECHA</th>
                <th className="border p-2" colSpan="2">IZQUIERDA</th>
              </tr>
              <tr>
                <th className='bg-slate-600'>5500 ± 100</th>
                <th className="border p-2">AVANCE</th>
                <th className="border p-2">REVERSA</th>
                <th className="border p-2">AVANCE</th>
                <th className="border p-2">REVERSA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">PRE CARGA</td>
                <td className="border p-2"><input id="idPreg25" type="text" className="border rounded w-full" data-id-pregunta="25" onChange={(e)=>handleRespuestaChange(25, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg26" type="text" className="border rounded w-full" data-id-pregunta="26" onChange={(e)=>handleRespuestaChange(26, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg27" type="text" className="border rounded w-full" data-id-pregunta="27" onChange={(e)=>handleRespuestaChange(27, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg28" type="text" className="border rounded w-full" data-id-pregunta="28" onChange={(e)=>handleRespuestaChange(28, e.target.value)} /></td>
              </tr>
              <tr>
                <td className="border p-2">ALTA</td>
                <td className="border p-2"><input id="idPreg29" type="text" className="border rounded w-full" data-id-pregunta="29" onChange={(e)=>handleRespuestaChange(29, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg30" type="text" className="border rounded w-full" data-id-pregunta="30" onChange={(e)=>handleRespuestaChange(30, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg31" type="text" className="border rounded w-full" data-id-pregunta="31" onChange={(e)=>handleRespuestaChange(31, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg32" type="text" className="border rounded w-full" data-id-pregunta="32" onChange={(e)=>handleRespuestaChange(32, e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4">
            <label>OBSERVACIONES:</label>
            <textarea className="border rounded w-full" rows="3"></textarea>
          </div>
          </div>
        </div>

        {/* Nueva tarjeta para SISTEMA DE EXTRACTOR PRIMARIO */}
        <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2">SISTEMA DE EXTRACTOR PRIMARIO</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr>
                <th></th>
                <th className="border p-2 " colSpan="2">EXTRACTOR PRIMARIO</th>
                <th className="border p-2 bg-slate-600" colSpan="1">VALORES DE REF CARGA AMBIENTE</th>
                <th className="border p-2 bg-slate-600" colSpan="2">VALORES DE REF CARGA MAX</th>
              </tr>
              <tr>
                <th></th>
                <th className="border p-2">AVANCE AMBIENTE</th>
                <th className="border p-2">AVANCE BLOQ</th>
                <td className="border p-2 text-center bg-slate-600">300-500</td>
                <td className="border p-2 text-center bg-slate-600">300-350</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">PRE CARGA</td>
                <td className="border p-2"><input id="idPreg33" type="text" className="border rounded w-full" data-id-pregunta="33" onChange={(e)=>handleRespuestaChange(33, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg34" type="text" className="border rounded w-full" data-id-pregunta="34" onChange={(e)=>handleRespuestaChange(34, e.target.value)} /></td>
                <td className="border p-2 text-center bg-slate-600">500-1500</td>
                
                <td className="border p-2 text-center ">5460-5560</td>
              </tr>
              <tr>
                <td className="border p-2">ALTA</td>
                <td className="border p-2"><input id="idPreg35" type="text" className="border rounded w-full" data-id-pregunta="35" onChange={(e)=>handleRespuestaChange(35, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg36" type="text" className="border rounded w-full" data-id-pregunta="36" onChange={(e)=>handleRespuestaChange(36, e.target.value)} /></td>
                
                
                
              </tr>
            </tbody>
          </table>
          <div className="mt-4">
            <label>OBSERVACIONES:</label>
            <textarea className="border rounded w-full" rows="3"></textarea>
          </div>
          </div>
        </div>

        {/* Nueva tarjeta para PAQ. DE ENFRIAMIENTO */}
        <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2">PAQ. DE ENFRIAMIENTO</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr>
                <th></th>
                <th className="border p-2 " colSpan='3'>ACELERACION</th>
              </tr>
              <tr>
                <th className='bg-slate-600 '>800 | 1800 | 2800 ± 100</th>
                
                <th className="border p-2">1°</th>
                <th className="border p-2">2°</th>
                <th className="border p-2">3°</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">PRESION</td>
                <td className="border p-2"><input id="idPreg37" type="text" className="border rounded w-full" data-id-pregunta="37" onChange={(e)=>handleRespuestaChange(37, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg38" type="text" className="border rounded w-full" data-id-pregunta="38" onChange={(e)=>handleRespuestaChange(38, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg39" type="text" className="border rounded w-full" data-id-pregunta="39" onChange={(e)=>handleRespuestaChange(39, e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        {/* Nueva tarjeta para FUNCIÓN DE CILINDROS */}
        <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2">FUNCIÓN DE CILINDROS</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr>
                <th className='bg-slate-600'>2800 ±100 </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className="border p-2">PRESION</th>
                <td className="border p-2"><input id="idPreg40" type="text" className="border rounded w-full" data-id-pregunta="40" onChange={(e)=>handleRespuestaChange(40, e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>

        {/* Nueva tarjeta para DESPUNTADOR */}
        <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2">DESPUNTADOR</h3>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm sm:text-base">
            <thead>
              <tr>
                <th className='bg-slate-600'>2800 ± 100</th>
                <th className="border p-2" colSpan='2'>DERECHA</th>
                <th className="border p-2">IZQUIERDA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className="border p-2">PRESION</th>
                <td className="border p-2"><input id="idPreg41" type="text" className="border rounded w-full" data-id-pregunta="41" onChange={(e)=>handleRespuestaChange(41, e.target.value)} /></td>
                <td className="border p-2"><input id="idPreg42" type="text" className="border rounded w-full" data-id-pregunta="42" onChange={(e)=>handleRespuestaChange(42, e.target.value)} /></td>
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
  );
};

export default ChequeoForm;