import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URLS, formatArgentinaDate } from '../../config/api';
import ChequeoInyTurbAft from '../chequeos/chequeoITA/ChequeoInyTurbAft';
import ChequeoNeu from '../chequeos/chequeoNeu/ChequeoNeu';
import ChequeoForm from '../chequeos/chequeoForm/ChequeoForm';
import ChequeoGm from '../chequeos/chequeoGm/ChequeoGm';
import InformeGeneralTractor from '../informeGeneraTractor/InformeGeneralTractor';

const fetchJson = async (url) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('Error de red');
  return res.json();
};

export default function HistorialDetalle() {
  const { idSesion } = useParams();
  const navigate = useNavigate();
  const [sesion, setSesion] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [docs, setDocs] = useState([]);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([
          fetchJson(API_URLS.SESION_DETALLE(idSesion)),
          fetchJson(API_URLS.SESION_RESPUESTAS(idSesion))
        ]);
        setSesion(s);
        setRespuestas(r || []);
      } catch (e) {
        setError('No se pudo cargar la sesión');
      } finally {
        setLoading(false);
      }
    })();
  }, [idSesion]);

  const mapRes = useMemo(() => {
    const m = new Map();
    for (const r of respuestas) m.set(String(r.idPregunta), r.respuesta);
    return m;
  }, [respuestas]);

  const handleViewImages = async () => {
    setLoadingImages(true);
    setShowImagesModal(true);
    
    try {
      const response = await fetch(API_URLS.IMAGES(idSesion));
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error cargando imágenes:', error);
      setImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleViewDocs = async () => {
    setLoadingDocs(true);
    setShowDocsModal(true);
    try {
      const res = await fetch(API_URLS.DOCS(idSesion));
      const data = await res.json();
      setDocs(data.docs || []);
    } catch (e) {
      setDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Inyectar valores en inputs por id/name idPreg{ID} y bloquear edición
  useEffect(() => {
    if (!sesion) return;

    // Completar valores según idPregunta
    for (const [id, valRaw] of mapRes.entries()) {
      const valueNorm = String(valRaw ?? '').trim().toLowerCase();

      // 1) Radios por name="idPreg{ID}" o por grupos con sufijo _{ID} (motor_162, operador_195, etc.)
      let radios = document.querySelectorAll(`input[type="radio"][name="idPreg${id}"]`);
      if (!radios || radios.length === 0) {
        radios = document.querySelectorAll(`input[type="radio"][name$="_${id}"]`);
      }
      if (radios && radios.length > 0) {
        Array.from(radios).forEach(r => {
          const v = String(r.value ?? '').trim().toLowerCase();
          r.checked = v === valueNorm;
          r.disabled = true;
        });
        continue;
      }

      // 2) Checkboxes por name/id
      const checkbox = document.querySelector(`input[type="checkbox"][name="idPreg${id}"]`) ||
                       document.querySelector(`#idPreg${id}`);
      if (checkbox && checkbox instanceof HTMLInputElement && checkbox.type === 'checkbox') {
        checkbox.checked = valueNorm === 'true' || valueNorm === '1' || valueNorm === 'si';
        checkbox.disabled = true;
        continue;
      }

      // 3) Inputs/textarea/select por id o name
      const el = document.querySelector(`#idPreg${id}`) ||
                 document.querySelector(`[name="idPreg${id}"]`);
      if (el) {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.value = valRaw ?? '';
          el.setAttribute('readonly', 'true');
          el.setAttribute('disabled', 'true');
        } else if (el instanceof HTMLSelectElement) {
          el.value = String(valRaw ?? '');
          el.disabled = true;
        }
      }
    }

    // 4) Forzar modo solo-lectura de todo el formulario renderizado
    const container = document.querySelector('.readonly-form');
    if (container) {
      container.querySelectorAll('input, select, textarea, button').forEach((ctrl) => {
        if ((ctrl instanceof HTMLButtonElement) && ctrl.type === 'button') return; // preservar botón Volver
        (ctrl).setAttribute('disabled', 'true');
      });
    }
  }, [sesion, mapRes]);

  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!sesion) return <div className="p-4">Sin datos</div>;

  const pickBestDatetime = () => {
    // Prefer a field that includes a non-midnight time if available
    const candidates = [sesion.fechaFin, sesion.fechaInicio, sesion.fecha];
    for (const v of candidates) {
      if (!v) continue;
      if (typeof v === 'string') {
        // has time portion?
        const m = v.match(/[T ](\d{2}:\d{2}:\d{2})/);
        if (m && m[1] && m[1] !== '00:00:00') return v;
      }
    }
    // fallback to fechaInicio then fecha then fechaFin
    return sesion.fechaInicio || sesion.fecha || sesion.fechaFin || '';
  };

  return (
    <div className="p-4 max-w-5xl mx-auto print-container">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .signature-line { border-top: 1px solid #000; height: 1px; margin-top: 48px; }
          .signature-box { height: 90px; }
        }
      `}</style>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Detalle del Chequeo</h1>
        <button className="no-print text-sm px-3 h-9 rounded bg-gray-200 hover:bg-gray-300" onClick={()=> navigate('/historial')}>Volver</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded border mb-4">
        <div><span className="text-xs text-gray-600">--------</span><div className="text-sm">-------</div></div>
      <div><span className="text-xs text-gray-600">Fecha</span><div className="text-sm">{formatArgentinaDate(pickBestDatetime())}</div></div>
        <div><span className="text-xs text-gray-600">Cliente</span><div className="text-sm">{sesion.cliente || ''}</div></div>
        <div><span className="text-xs text-gray-600">Tipo Chequeo</span><div className="text-sm">{sesion.tipoChequeo}</div></div>
        <div><span className="text-xs text-gray-600">Máquina</span><div className="text-sm">{sesion.tipoMaquina || ''}</div></div>
        <div><span className="text-xs text-gray-600">Modelo</span><div className="text-sm">{sesion.modelo || ''}</div></div>
        <div><span className="text-xs text-gray-600">Serie</span><div className="text-sm">{sesion.serie_maquina || ''}</div></div>
  <div><span className="text-xs text-gray-600">Técnico</span><div className="text-sm">{sesion.usuario_nombre || ''}</div></div>
      </div>
      <div className="bg-white p-3 rounded border readonly-form">
        {Number(sesion.idTipoChequeo) === 1 && (
          <ChequeoForm selectedModelId={sesion.modelo_maquina || null} readOnly={true} valuesById={mapRes} />
        )}
        {Number(sesion.idTipoChequeo) === 7 && (() => {
          const v = new Map(mapRes);
          if (sesion.cliente) v.set('cliente', sesion.cliente);
          if (sesion.serie_maquina) v.set('serieChasis', sesion.serie_maquina);
          if (sesion.hora_maquina) v.set('horas', sesion.hora_maquina);
          if (sesion.modelo) v.set('modelo', sesion.modelo);
          return (
            <InformeGeneralTractor
              selectedModelId={sesion.modelo_maquina || null}
              readOnly={true}
              valuesById={v}
            />
          );
        })()}
        {Number(sesion.idTipoChequeo) === 3 && (
          <ChequeoInyTurbAft selectedModelId={sesion.modelo_maquina || null} readOnly={true} valuesById={mapRes} />
        )}
        {Number(sesion.idTipoChequeo) === 2 && (
          <ChequeoNeu selectedModelId={sesion.modelo_maquina || null} readOnly={true} valuesById={mapRes} />
        )}
        {Number(sesion.idTipoChequeo) === 6 && (
          <ChequeoGm selectedModelId={sesion.modelo_maquina || null} readOnly={true} valuesById={mapRes} />
        )}

        {![1,2,3,6,7].includes(Number(sesion.idTipoChequeo)) && (
          <div>
            <div className="mb-3 text-sm text-gray-600">Vista genérica de historial para este tipo de chequeo (aún sin formulario específico).</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Pregunta</th>
                    <th className="border p-2 text-left">Respuesta</th>
                  </tr>
                </thead>
                <tbody>
                  {respuestas.map((r, idx) => (
                    <tr key={`${r.idPregunta}-${idx}`}>
                      <td className="border p-2 align-top">{r.pregunta || `#${r.idPregunta}`}</td>
                      <td className="border p-2 whitespace-pre-wrap">{r.respuesta ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sección de firmas para impresión */}
      <div className="bg-white p-4 rounded border mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="signature-box"></div>
            <div className="signature-line"></div>
            <div className="mt-2 text-sm text-center">Firma del Cliente</div>
          </div>
          <div>
            <div className="signature-box"></div>
            <div className="signature-line"></div>
            <div className="mt-2 text-sm text-center">Firma del Técnico</div>
          </div>
        </div>
      </div>

      {/* Botón Imprimir (no se imprime) */}
      <div className="mt-4 flex justify-end gap-2 no-print">
        <button
          className="px-4 h-10 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => handleViewImages()}
          type="button"
        >
          📷 Ver Imágenes
        </button>
        <button
          className="px-4 h-10 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={() => handleViewDocs()}
          type="button"
        >
          📄 Ver Documentos
        </button>
        <button
          className="px-4 h-10 rounded bg-green-600 text-white hover:bg-green-700"
          onClick={() => window.print()}
          type="button"
        >
          Imprimir
        </button>
      </div>

      {/* Modal para mostrar imágenes */}
      {showImagesModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-700/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Imágenes del Chequeo</h2>
              <button
                onClick={() => setShowImagesModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {loadingImages ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Cargando imágenes...</div>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600">No hay imágenes para este chequeo</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <img
                      src={API_URLS.IMAGE(image.nombre_archivo.split('/').pop())}
                      alt={image.nombre_original}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yIGFsIGNhcmdhciBpbWFnZW48L3RleHQ+PC9zdmc+';
                      }}
                    />
                    <div className="p-3 bg-gray-50">
                      <div className="text-sm font-medium truncate">{image.nombre_original}</div>
                      <div className="text-xs text-gray-500">
                        {formatArgentinaDate(image.fecha_subida)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(image.tamanio / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Documentos */}
      {showDocsModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-700/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Documentos del Chequeo</h2> 
              <button onClick={() => setShowDocsModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            {loadingDocs ? (
              <div className="text-center py-8 text-gray-600">Cargando documentos...</div>
            ) : docs.length === 0 ? (
              <div className="text-center py-8 text-gray-600">No hay documentos para este chequeo</div>
            ) : (
              <ul className="space-y-3">
                {docs.map((d, idx) => (
                  <li key={idx} className="border rounded p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium truncate max-w-[420px]">{d.nombre_original}</div>
                      <div className="text-xs text-gray-500">{formatArgentinaDate(d.fecha_subida)} · {(d.tamanio/1024).toFixed(1)} KB</div>
                    </div>
                    <a
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                      href={API_URLS.DOCUMENT(d.nombre_archivo.split('/').pop())}
                      target="_blank" rel="noreferrer"
                    >
                      📄 Descargar
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


