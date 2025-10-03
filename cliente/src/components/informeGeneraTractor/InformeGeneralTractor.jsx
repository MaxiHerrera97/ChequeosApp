import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useParams } from 'react-router-dom';
import { API_URLS } from '../../config/api';

const InformeGeneralTractor = ({ selectedModelId, readOnly = false, valuesById }) => {
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
  const [ubicacion, setUbicacion] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [serieChasis, setSerieChasis] = useState('');
  const [horas, setHoras] = useState('');
  const [año, setAño] = useState('');
  const [motor, setMotor] = useState('');
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

      const now = getNowBuenosAires();
      const tipoId = Number(idTipoChequeo);
      if (!Number.isFinite(tipoId) || tipoId <= 0) {
        throw new Error('Tipo de chequeo inválido');
      }

      const modeloId = selectedModelId ? Number(selectedModelId) : null;
      // Para el Informe General Tractor (idTipoChequeo = 7), no es obligatorio tener un modelo específico
      // ya que se selecciona directamente por tipo de máquina (Tractor)
      if (tipoId !== 7 && !Number.isFinite(modeloId)) {
        throw new Error('Modelo de máquina inválido (ID). Selecciona un modelo válido.');
      }

      const payload = {
        legajo: user.legajo,
        idTipoChequeo: tipoId,
        cliente,
        hora_maquina: horas,
        serie_maquina: serieChasis,
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

      // Preparar respuestas (inputs desde idPreg162 hasta idPreg254)
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
      setStatusMsg('Informe enviado con éxito');
      setShowToast(true);

      // Resetear formulario
      if (e && e.target && typeof e.target.reset === 'function') {
        e.target.reset();
      }
      setCliente('');
      setUbicacion('');
      setMarca('');
      setModelo('');
      setSerieChasis('');
      setHoras('');
      setAño('');
      setMotor('');
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

  // Prefill from historial when readOnly/valuesById provided
  useEffect(() => {
    if (!valuesById) return;
    const v = (key) => valuesById.get(key);
    if (v('cliente') !== undefined) setCliente(v('cliente') || '');
    if (v('ubicacion') !== undefined) setUbicacion(v('ubicacion') || '');
    if (v('marca') !== undefined) setMarca(v('marca') || '');
    if (v('modelo') !== undefined) setModelo(v('modelo') || '');
    if (v('serieChasis') !== undefined) setSerieChasis(v('serieChasis') || '');
    if (v('horas') !== undefined) setHoras(v('horas') || '');
    if (v('año') !== undefined) setAño(v('año') || '');
    if (v('motor') !== undefined) setMotor(v('motor') || '');
    if (v('fecha') !== undefined) setFecha(v('fecha') || '');
  }, [valuesById]);

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 3500);
    return () => clearTimeout(t);
  }, [showToast]);

  return (
    <div className="p-2 sm:p-4 w-full max-w-6xl mx-auto">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4 text-center px-2">INFORME DE REVISION GENERAL DE TRACTOR</h2>
      {showToast && (
        <div className={`fixed right-4 bottom-4 z-50 shadow-lg rounded-lg px-4 py-3 border text-sm transition-all ${statusType === 'success' ? 'bg-green-600/95 text-white border-green-700' : 'bg-red-600/95 text-white border-red-700'}`}>
          <div className="font-semibold mb-0.5">{statusType === 'success' ? 'Éxito' : 'Error'}</div>
          <div>{statusMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Información General */}
        {!readOnly && (
        <div className='shadow bg-gray-100 border border-gray-200 mb-4 p-2 sm:p-4 rounded-xl'>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
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
              <label className="block text-sm text-gray-700">UBICACION:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={ubicacion} onChange={(e)=>setUbicacion(e.target.value)} readOnly={readOnly} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">MARCA:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={marca} onChange={(e)=>setMarca(e.target.value)} readOnly={readOnly} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">MODELO:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={modelo} onChange={(e)=>setModelo(e.target.value)} readOnly={readOnly} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">NUMEROS DE SERIE: CHASIS:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={serieChasis} onChange={(e)=>setSerieChasis(e.target.value)} readOnly={readOnly} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">HORAS:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={horas} onChange={(e)=>setHoras(e.target.value)} readOnly={readOnly} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">AÑO:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={año} onChange={(e)=>setAño(e.target.value)} readOnly={readOnly} />
            </div>
    <div>
              <label className="block text-sm text-gray-700">MOTOR:</label>
              <input type="text" className="border rounded w-full h-10 px-3" value={motor} onChange={(e)=>setMotor(e.target.value)} readOnly={readOnly} />
            </div>
          </div>
        </div>
        )}

        {/* MOTOR */}
        <div className="border rounded-xl p-2 sm:p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2 sm:mb-4 text-sm sm:text-base">MOTOR</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs sm:text-sm md:text-base">
              <thead>
                <tr>
                  <th className="border p-1 sm:p-2"></th>
                  <th className="border p-1 sm:p-2">BUENO</th>
                  <th className="border p-1 sm:p-2">REGULAR</th>
                  <th className="border p-1 sm:p-2">MALO</th>
                  <th className="border p-1 sm:p-2">COMENTARIOS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { item: 'Arranque en frío', id: 162, comentario: 163 },
                  { item: 'Refrigeración', id: 164, comentario: 165 },
                  { item: 'Paquete de enfriamiento', id: 166, comentario: 167 },
                  { item: 'Admisión', id: 168, comentario: 169 },
                  { item: 'Alimentación', id: 170, comentario: 171 },
                  { item: 'Gaseo', id: 172, comentario: 173 },
                  { item: 'Instalación eléctrica', id: 174, comentario: 175 },
                  { item: 'Batería', id: 176, comentario: 177 },
                  { item: 'Pérdidas de aceite', id: 178, comentario: 179 },
                  { item: 'Pérdidas de combustible', id: 180, comentario: 181 },
                  { item: 'Motor de arranque', id: 182, comentario: 183 },
                  { item: 'Alternador', id: 184, comentario: 185 },
                  { item: 'Cableado', id: 186, comentario: 187 }
                ].map((motorItem) => (
                  <tr key={motorItem.id}>
                    <td className="border p-2 font-semibold">{motorItem.item}</td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`motor_${motorItem.id}`} value="bueno" onChange={(e)=>handleRespuestaChange(motorItem.id, e.target.value)} />
                    </td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`motor_${motorItem.id}`} value="regular" onChange={(e)=>handleRespuestaChange(motorItem.id, e.target.value)} />
                    </td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`motor_${motorItem.id}`} value="malo" onChange={(e)=>handleRespuestaChange(motorItem.id, e.target.value)} />
                    </td>
                    <td className="border p-1 sm:p-2">
                      <input id={`idPreg${motorItem.comentario}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(motorItem.comentario, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FILTROS */}
        <div className="border rounded-xl p-2 sm:p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2 sm:mb-4 text-sm sm:text-base">FILTROS</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border p-1 sm:p-2">FILTRO</th>
                  <th className="border p-1 sm:p-2">CODIGO</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { filtro: 'Filtro de aceite código', id: 188 },
                  { filtro: 'Filtro de Aire 1º código', id: 189 },
                  { filtro: 'Filtro de Aire 2º código', id: 190 },
                  { filtro: 'Filtro de combustible 1° código', id: 191 },
                  { filtro: 'Filtro de combustible 2º código', id: 192 },
                  { filtro: 'Filtro de aceite hidráulico', id: 193 },
                  { filtro: 'Filtro de aceite de transmisión', id: 194 }
                ].map((filtroItem) => (
                  <tr key={filtroItem.id}>
                    <td className="border p-2 font-semibold">{filtroItem.filtro}</td>
                    <td className="border p-1 sm:p-2">
                      <input id={`idPreg${filtroItem.id}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(filtroItem.id, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PUESTO DEL OPERADOR */}
        <div className="border rounded-xl p-2 sm:p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2 sm:mb-4 text-sm sm:text-base">PUESTO DEL OPERADOR</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border p-1 sm:p-2"></th>
                  <th className="border p-1 sm:p-2">BUENO</th>
                  <th className="border p-1 sm:p-2">REGULAR</th>
                  <th className="border p-1 sm:p-2">MALO</th>
                  <th className="border p-1 sm:p-2">COMENTARIOS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { item: 'Instrumental (tablero)', id: 195, comentario: 196 },
                  { item: 'Controles y perillas', id: 197, comentario: 198 },
                  { item: 'Aire acondicionado', id: 199, comentario: 200 },
                  { item: 'Asiento', id: 201, comentario: 202 },
                  { item: 'Techo', id: 203, comentario: 204 },
                  { item: 'Piso / Alfombra', id: 205, comentario: 206 },
                  { item: 'Accesorios', id: 207, comentario: 208 },
                  { item: 'Bocina', id: 209, comentario: 210 },
                  { item: 'Luces', id: 211, comentario: 212 },
                  { item: 'Vidrios/Puerta/Ventana/Cerraduras', id: 213, comentario: 214 }
                ].map((operadorItem) => (
                  <tr key={operadorItem.id}>
                    <td className="border p-2 font-semibold">{operadorItem.item}</td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`operador_${operadorItem.id}`} value="bueno" onChange={(e)=>handleRespuestaChange(operadorItem.id, e.target.value)} />
                    </td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`operador_${operadorItem.id}`} value="regular" onChange={(e)=>handleRespuestaChange(operadorItem.id, e.target.value)} />
                    </td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`operador_${operadorItem.id}`} value="malo" onChange={(e)=>handleRespuestaChange(operadorItem.id, e.target.value)} />
                    </td>
                    <td className="border p-1 sm:p-2">
                      <input id={`idPreg${operadorItem.comentario}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(operadorItem.comentario, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SISTEMA HIDRAULICO */}
        <div className="border rounded-xl p-2 sm:p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2 sm:mb-4 text-sm sm:text-base">SISTEMA HIDRAULICO</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border p-1 sm:p-2"></th>
                  <th className="border p-1 sm:p-2">BUENO</th>
                  <th className="border p-1 sm:p-2">REGULAR</th>
                  <th className="border p-1 sm:p-2">MALO</th>
                  <th className="border p-1 sm:p-2">COMENTARIOS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { item: 'Levante de 3 puntos', id: 215, comentario: 216 },
                  { item: 'Enganche/barra de tiro', id: 217, comentario: 218 },
                  { item: 'Toma de Fuerza', id: 219, comentario: 220 },
                  { item: 'Dirección', id: 221, comentario: 222 },
                  { item: 'Doble tracción', id: 223, comentario: 224 },
                  { item: 'Mandos finales', id: 225, comentario: 226 },
                  { item: 'Válvulas comando a distancia (VCS)', id: 227, comentario: 228 }
                ].map((hidraulicoItem) => (
                  <tr key={hidraulicoItem.id}>
                    <td className="border p-2 font-semibold">{hidraulicoItem.item}</td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`hidraulico_${hidraulicoItem.id}`} value="bueno" onChange={(e)=>handleRespuestaChange(hidraulicoItem.id, e.target.value)} />
                    </td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`hidraulico_${hidraulicoItem.id}`} value="regular" onChange={(e)=>handleRespuestaChange(hidraulicoItem.id, e.target.value)} />
                    </td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`hidraulico_${hidraulicoItem.id}`} value="malo" onChange={(e)=>handleRespuestaChange(hidraulicoItem.id, e.target.value)} />
                    </td>
                    <td className="border p-1 sm:p-2">
                      <input id={`idPreg${hidraulicoItem.comentario}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(hidraulicoItem.comentario, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TREN DELANTERO Y TRASERO */}
        <div className="border rounded-xl p-2 sm:p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2 sm:mb-4 text-sm sm:text-base">TREN DELANTERO Y TRASERO</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border p-1 sm:p-2"></th>
                  <th className="border p-1 sm:p-2">BUENO</th>
                  <th className="border p-1 sm:p-2">REGULAR</th>
                  <th className="border p-1 sm:p-2">MALO</th>
                  <th className="border p-1 sm:p-2">% DESGASTE / COMENTARIOS</th>
                  <th className="border p-1 sm:p-2">MARCA/MEDIDA</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { item: 'Precaps/Rótulas/Ejes/etc', id: 229, comentario: 230, desgaste: false },
                  { item: 'Llantas delanteras', id: 231, comentario: 232, desgaste: false },
                  { item: 'Llantas traseras', id: 233, comentario: 234, desgaste: false },
                  { item: 'Cubierta delantera izquierda', id: 235, comentario: 236, desgaste: true, desgasteId: 255 },
                  { item: 'Cubierta delantera derecha', id: 237, comentario: 238, desgaste: true, desgasteId: 256 },
                  { item: 'Cubierta trasera izquierda', id: 239, comentario: 240, desgaste: true, desgasteId: 257 },
                  { item: 'Cubierta trasera derecha', id: 241, comentario: 242, desgaste: true, desgasteId: 258 }
                ].map((trenItem) => (
                  <tr key={trenItem.id}>
                    <td className="border p-2 font-semibold">{trenItem.item}</td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`tren_${trenItem.id}`} value="bueno" onChange={(e)=>handleRespuestaChange(trenItem.id, e.target.value)} />
                    </td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`tren_${trenItem.id}`} value="regular" onChange={(e)=>handleRespuestaChange(trenItem.id, e.target.value)} />
                    </td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`tren_${trenItem.id}`} value="malo" onChange={(e)=>handleRespuestaChange(trenItem.id, e.target.value)} />
                    </td>
                    <td className="border p-1 sm:p-2">
                      {trenItem.desgaste ? (
                        <input id={`idPreg${trenItem.desgasteId}`} type="number" min="0" max="100" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" placeholder="%" onChange={(e)=>handleRespuestaChange(trenItem.desgasteId, e.target.value)} />
                      ) : (
                        <input id={`idPreg${trenItem.comentario}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(trenItem.comentario, e.target.value)} />
                      )}
                    </td>
                    <td className="border p-1 sm:p-2">
                      {trenItem.desgaste ? (
                        <input id={`idPreg${trenItem.comentario}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(trenItem.comentario, e.target.value)} />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CARROCERIA/FUNCIONAMIENTO */}
        <div className="border rounded-xl p-2 sm:p-4 mb-4 shadow bg-gray-100 border-gray-200">
          <h3 className="font-bold text-center mb-2 sm:mb-4 text-sm sm:text-base">CARROCERIA/FUNCIONAMIENTO</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="border p-1 sm:p-2"></th>
                  <th className="border p-1 sm:p-2">BUENO</th>
                  <th className="border p-1 sm:p-2">REGULAR</th>
                  <th className="border p-1 sm:p-2">MALO</th>
                  <th className="border p-1 sm:p-2">COMENTARIOS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { item: 'Chapas y protecciones', id: 243, comentario: 244 },
                  { item: 'Pintura en general', id: 245, comentario: 246 },
                  { item: 'Caja de cambios y Grupos', id: 247, comentario: 248 },
                  { item: 'Funcionamiento de luces y faros', id: 249, comentario: 250 },
                  { item: 'Funcionamiento de embrague', id: 251, comentario: 252 },
                  { item: 'Funcionamiento de frenos', id: 253, comentario: 254 }
                ].map((carroceriaItem) => (
                  <tr key={carroceriaItem.id}>
                    <td className="border p-2 font-semibold">{carroceriaItem.item}</td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`carroceria_${carroceriaItem.id}`} value="bueno" onChange={(e)=>handleRespuestaChange(carroceriaItem.id, e.target.value)} />
                    </td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`carroceria_${carroceriaItem.id}`} value="regular" onChange={(e)=>handleRespuestaChange(carroceriaItem.id, e.target.value)} />
                    </td>
                    <td className="border p-2 text-center">
                      <input type="radio" name={`carroceria_${carroceriaItem.id}`} value="malo" onChange={(e)=>handleRespuestaChange(carroceriaItem.id, e.target.value)} />
                    </td>
                    <td className="border p-1 sm:p-2">
                      <input id={`idPreg${carroceriaItem.comentario}`} type="text" className="border rounded w-full h-8 sm:h-9 px-1 sm:px-2 text-xs sm:text-sm" onChange={(e)=>handleRespuestaChange(carroceriaItem.comentario, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {!readOnly && (
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg mt-6 block mx-auto text-lg shadow w-full sm:w-auto">
            Enviar
          </button>
        )}
      </form>
    </div>
  )
}

export default InformeGeneralTractor
