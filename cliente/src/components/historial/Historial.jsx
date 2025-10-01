import React, { useEffect, useMemo, useState } from 'react';
import { API_URLS } from '../../config/api';
import { useNavigate } from 'react-router-dom';

const fetchJson = async (url) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('Error de red');
  return res.json();
};

export default function Historial() {
  const navigate = useNavigate();
  const [tiposMaquina, setTiposMaquina] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [tiposChequeo, setTiposChequeo] = useState([]);

  const [filtros, setFiltros] = useState({
    idTipoMaquina: '',
    idModelo: '',
    serie: '',
    idTipoChequeo: '',
    cliente: '',
    desde: '',
    hasta: ''
  });

  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [tm, tc] = await Promise.all([
          fetchJson(API_URLS.TIPOS_MAQUINAS),
          fetchJson(API_URLS.TIPOS_CHEQUEOS)
        ]);
        setTiposMaquina(tm || []);
        setTiposChequeo(tc || []);
      } catch (e) {
        setError('No se pudieron cargar datos iniciales');
      }
    })();
  }, []);

  useEffect(() => {
    const idTipoMaquina = filtros.idTipoMaquina;
    if (!idTipoMaquina) { setModelos([]); return; }
    (async () => {
      try {
        const data = await fetchJson(API_URLS.MODELOS_MAQUINAS(idTipoMaquina));
        setModelos(data || []);
      } catch (e) {
        setModelos([]);
      }
    })();
  }, [filtros.idTipoMaquina]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filtros.idTipoMaquina) params.set('idTipoMaquina', filtros.idTipoMaquina);
    if (filtros.idModelo) params.set('idModelo', filtros.idModelo);
    if (filtros.serie) params.set('serie', filtros.serie);
    if (filtros.idTipoChequeo) params.set('idTipoChequeo', filtros.idTipoChequeo);
    if (filtros.cliente) params.set('cliente', filtros.cliente);
    if (filtros.desde) params.set('desde', filtros.desde);
    if (filtros.hasta) params.set('hasta', filtros.hasta);
    return params.toString();
  }, [filtros]);

  const buscar = async () => {
    setLoading(true); setError('');
    try {
      const data = await fetchJson(`${API_URLS.HISTORIAL}?${queryString}`);
      setResultados(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('No se pudo obtener el historial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-3">Historial de Chequeos</h1>
      <p className="text-sm text-gray-600 mb-4">Selecciona para filtrar los chequeos.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3 rounded border">
        <div>
          <label className="text-xs text-gray-700">Máquina</label>
          <select name="idTipoMaquina" value={filtros.idTipoMaquina} onChange={onChange} className="w-full border rounded h-9 px-2 text-sm">
            <option value="">Todas</option>
            {tiposMaquina.map((t)=> (
              <option key={t.idTipoMaquina} value={t.idTipoMaquina}>{t.tipoMaquina}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-700">Modelo de máquina</label>
          <select name="idModelo" value={filtros.idModelo} onChange={onChange} className="w-full border rounded h-9 px-2 text-sm" disabled={!filtros.idTipoMaquina}>
            <option value="">Todos</option>
            {modelos.map((m)=> (
              <option key={m.idModelo} value={m.idModelo}>{m.modelo}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-700">Número de serie</label>
          <input name="serie" value={filtros.serie} onChange={onChange} className="w-full border rounded h-9 px-2 text-sm" placeholder="Ej: 1ZABCDEFG" />
        </div>
        <div>
          <label className="text-xs text-gray-700">Tipo de chequeo</label>
          <select name="idTipoChequeo" value={filtros.idTipoChequeo} onChange={onChange} className="w-full border rounded h-9 px-2 text-sm">
            <option value="">Todos</option>
            {tiposChequeo.map((c)=> (
              <option key={c.idTipoChequeo} value={c.idTipoChequeo}>{c.tipo}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-700">Cliente</label>
          <input name="cliente" value={filtros.cliente} onChange={onChange} className="w-full border rounded h-9 px-2 text-sm" placeholder="Cliente" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-700">Desde</label>
            <input type="date" name="desde" value={filtros.desde} onChange={onChange} className="w-full border rounded h-9 px-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-700">Hasta</label>
            <input type="date" name="hasta" value={filtros.hasta} onChange={onChange} className="w-full border rounded h-9 px-2 text-sm" />
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-3 flex gap-2 justify-end mt-1">
          <button onClick={buscar} className="bg-green-700 hover:bg-green-800 text-white px-4 h-9 rounded text-sm" disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm mt-3">{error}</div>}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Fecha</th>
              <th className="border p-2">Cliente</th>
              <th className="border p-2">Tipo Chequeo</th>
              <th className="border p-2">Tipo Máquina</th>
              <th className="border p-2">Modelo</th>
              <th className="border p-2">Serie</th>
              <th className="border p-2">Legajo</th>
            </tr>
          </thead>
          <tbody>
            {resultados.length === 0 ? (
              <tr><td className="p-3 text-center text-gray-500" colSpan={7}>Sin resultados</td></tr>
            ) : resultados.map((r)=> (
              <tr key={`${r.idSesion}-${r.fecha || ''}`} className="cursor-pointer hover:bg-green-50" onClick={()=> navigate(`/historial/${r.idSesion}`)}>
                <td className="border p-2">{r.fecha || r.fechaInicio || ''}</td>
                <td className="border p-2">{r.cliente || ''}</td>
                <td className="border p-2">{r.tipoChequeo}</td>
                <td className="border p-2">{r.tipoMaquina || ''}</td>
                <td className="border p-2">{r.modelo || ''}</td>
                <td className="border p-2">{r.serie_maquina || ''}</td>
                <td className="border p-2">{r.legajo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


