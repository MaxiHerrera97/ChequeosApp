import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useParams } from 'react-router-dom';
import { API_URLS } from '../../../config/api';

const ChequeoInyTurbAft = ({ selectedModelId, readOnly = false, valuesById }) => {
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
  const [serieMotor, setSerieMotor] = useState('');
  const [fecha, setFecha] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [respuestasMap, setRespuestasMap] = useState({});
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('success');
  const [showToast, setShowToast] = useState(false);

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

      // Preparar respuestas (inputs para blow-by, goteo de inyectores y compresión)
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
      setSerieMotor('');
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
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4 text-center px-2">CHEQUEO DE INYECTORES, TURBO Y AFTERCOOLER</h2>
      {showToast && (
        <div className={`fixed right-4 bottom-4 z-50 shadow-lg rounded-lg px-4 py-3 border text-sm transition-all ${statusType === 'success' ? 'bg-green-600/95 text-white border-green-700' : 'bg-red-600/95 text-white border-red-700'}`}>
          <div className="font-semibold mb-0.5">{statusType === 'success' ? 'Éxito' : 'Error'}</div>
          <div>{statusMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Información General */}
        {!readOnly && (
        <div className='shadow bg-gray-100 border border-gray-200 mb-4 p-4 rounded-xl'>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <label className="block text-sm text-gray-700">MAQUINA SERIE N°:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={serieMaquina} onChange={(e)=>setSerieMaquina(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">MOTOR SERIE N°:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={serieMotor} onChange={(e)=>setSerieMotor(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">HORAS MOTOR:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={hsMaquina} onChange={(e)=>setHsMaquina(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">FECHA:</label>
              <input type="date" className="border rounded w-full h-10 px-3" value={fecha} onChange={(e)=>setFecha(e.target.value)} />
            </div>
          </div>
        </div>
        )}

        {/* CHEQUEO BLOW-BY CON TURBO */}
        <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2">CHEQUEO BLOW-BY CON TURBO</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border p-1 sm:p-2"></th>
                  <th className="border p-1 sm:p-2">1ra. ACELERACION</th>
                  <th className="border p-1 sm:p-2">2da. ACELERACION</th>
                  <th className="border p-1 sm:p-2">3ra. ACELERACION</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2 font-semibold">VALORES</td>
                  <td className="border p-1 sm:p-2"><input id="idPreg120" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(120, e.target.value)} /></td>
                  <td className="border p-1 sm:p-2"><input id="idPreg121" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(121, e.target.value)} /></td>
                  <td className="border p-1 sm:p-2"><input id="idPreg122" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(122, e.target.value)} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CHEQUEO BLOW-BY SIN TURBO */}
        <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2">CHEQUEO BLOW-BY SIN TURBO</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border p-1 sm:p-2"></th>
                  <th className="border p-1 sm:p-2">1ra. ACELERACION</th>
                  <th className="border p-1 sm:p-2">2da. ACELERACION</th>
                  <th className="border p-1 sm:p-2">3ra. ACELERACION</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2 font-semibold">VALORES</td>
                  <td className="border p-1 sm:p-2"><input id="idPreg123" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(123, e.target.value)} /></td>
                  <td className="border p-1 sm:p-2"><input id="idPreg124" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(124, e.target.value)} /></td>
                  <td className="border p-1 sm:p-2"><input id="idPreg125" type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(125, e.target.value)} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* GOTEO DE INYECTORES EN UN MINUTO */}
        <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2">GOTEO DE INYECTORES EN UN MINUTO</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border p-1 sm:p-2">INY</th>
                  <th className="border p-1 sm:p-2">1ra. ACELERACION</th>
                  <th className="border p-1 sm:p-2">2da. ACELERACION</th>
                  <th className="border p-1 sm:p-2">3ra. ACELERACION</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6].map((inyector, index) => (
                  <tr key={inyector}>
                    <td className="border p-2 font-semibold">{inyector}</td>
                    <td className="border p-1 sm:p-2"><input id={`idPreg${126 + (index * 3)}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(126 + (index * 3), e.target.value)} /> ml</td>
                    <td className="border p-1 sm:p-2"><input id={`idPreg${127 + (index * 3)}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(127 + (index * 3), e.target.value)} /> ml</td>
                    <td className="border p-1 sm:p-2"><input id={`idPreg${128 + (index * 3)}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(128 + (index * 3), e.target.value)} /> ml</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DATOS DE PRUEBA DE COMPRESION CON SERVICE ADVISOR */}
        <div className="border rounded-xl p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2">DATOS DE PRUEBA DE COMPRESION CON SERVICE ADVISOR</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border p-1 sm:p-2">CIL</th>
                  <th className="border p-1 sm:p-2">1ra. PRUEBA</th>
                  <th className="border p-1 sm:p-2">2da. PRUEBA</th>
                  <th className="border p-1 sm:p-2">3ra. PRUEBA</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6].map((cilindro, index) => (
                  <tr key={cilindro}>
                    <td className="border p-2 font-semibold">{cilindro}</td>
                    <td className="border p-1 sm:p-2"><input id={`idPreg${144 + (index * 3)}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(144 + (index * 3), e.target.value)} /> %</td>
                    <td className="border p-1 sm:p-2"><input id={`idPreg${145 + (index * 3)}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(145 + (index * 3), e.target.value)} /> %</td>
                    <td className="border p-1 sm:p-2"><input id={`idPreg${146 + (index * 3)}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(146 + (index * 3), e.target.value)} /> %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg mt-6 block mx-auto text-lg shadow w-full sm:w-auto">
          Enviar
        </button>
      </form>
    </div>
  )
}

export default ChequeoInyTurbAft