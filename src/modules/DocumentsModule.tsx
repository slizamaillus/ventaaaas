import React, { useMemo, useState } from 'react';
import {
  Archive,
  Download,
  Eye,
  FileText,
  Folder,
  FolderPlus,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { Documento } from '../types/crm';
import { Badge, BadgeTone, Button, Card, EmptyState } from '../components/ds/primitives';
import { FileUpload, Input, SearchInput, Select } from '../components/ds/forms';
import { Drawer, Modal, Table } from '../components/ds/data';
import { formatDateCL } from '../data/chileGeo';

export const DocumentsModule: React.FC = () => {
  const {
    documentos,
    setDocumentos,
    empresas,
    oportunidades,
    cotizaciones,
    selectedRecordId,
    setSelectedRecordId,
    notify,
    getEmpresaName,
    getUser,
  } = useCRM();

  const [query, setQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState('Todas');
  const [typeFilter, setTypeFilter] = useState('all');
  const [folders, setFolders] = useState<string[]>([
    'Cotizaciones 2026',
    'Contratos Firmados',
    'Órdenes de Compra',
    'Propuestas Técnicas',
    'Licitaciones',
    'Facturación DTE',
    'Implementación',
  ]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState<Documento | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [uploadData, setUploadData] = useState<{
    nombre: string;
    tipo: Documento['tipo'];
    carpeta: string;
    empresaId: string;
    oportunidadId: string;
    tamano: string;
    extension: Documento['extension'];
  }>({
    nombre: 'Documento_Comercial.pdf',
    tipo: 'Documento comercial',
    carpeta: 'Cotizaciones 2026',
    empresaId: empresas[0]?.id || '',
    oportunidadId: '',
    tamano: '1.2 MB',
    extension: 'PDF',
  });

  const selectedDoc = useMemo(
    () => documentos.find((d) => d.id === selectedRecordId) || null,
    [documentos, selectedRecordId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documentos.filter((d) => {
      if (folderFilter !== 'Todas' && d.carpeta !== folderFilter) return false;
      if (typeFilter !== 'all' && d.tipo !== typeFilter) return false;
      if (q && !d.nombre.toLowerCase().includes(q) && !getEmpresaName(d.empresaId).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [documentos, folderFilter, typeFilter, query, getEmpresaName]);

  const statusTone = (est: Documento['estado']): BadgeTone => {
    if (est === 'Firmado') return 'success';
    if (est === 'Vigente') return 'blue';
    if (est === 'En revisión') return 'warning';
    return 'neutral';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Documentos</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Central documental asociada a empresas, oportunidades, cotizaciones, pedidos y postventa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" leftIcon={<FolderPlus className="w-3.5 h-3.5" />} onClick={() => setFolderModalOpen(true)}>
            Nueva carpeta
          </Button>
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setUploadOpen(true)}>
            Subir archivo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Folders Sidebar */}
        <Card className="lg:col-span-3" title="Carpetas" noPadding>
          <div className="p-2 space-y-0.5">
            {['Todas', ...folders].map((f) => {
              const active = folderFilter === f;
              const count = f === 'Todas' ? documentos.length : documentos.filter((d) => d.carpeta === f).length;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFolderFilter(f)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 truncate">
                    <Folder className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{f}</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">{count}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Main Document Table */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <SearchInput value={query} onChange={setQuery} placeholder="Buscar archivo o empresa..." />
            </div>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los tipos' },
                ...['Cotización', 'Contrato', 'Propuesta', 'Factura', 'Comprobante', 'Documento comercial', 'Otro'].map((t) => ({ value: t, label: t })),
              ]}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Carpeta sin documentos"
              description="Sube un archivo visual o cambia de carpeta."
              actionLabel="Subir archivo"
              onAction={() => setUploadOpen(true)}
            />
          ) : (
            <Table
              data={filtered}
              onRowClick={(d) => setSelectedRecordId(d.id)}
              columns={[
                {
                  key: 'nombre',
                  header: 'Nombre',
                  render: (d) => (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                      <div>
                        <div className="font-medium text-slate-900">{d.nombre}</div>
                        <div className="text-[11px] text-slate-400">{d.carpeta} · {d.extension}</div>
                      </div>
                    </div>
                  ),
                },
                { key: 'tipo', header: 'Tipo', render: (d) => <span className="text-xs">{d.tipo}</span> },
                { key: 'empresa', header: 'Empresa', render: (d) => <span className="text-xs">{getEmpresaName(d.empresaId)}</span> },
                { key: 'fecha', header: 'Fecha', render: (d) => <span className="font-mono text-xs text-slate-500">{formatDateCL(d.fecha)}</span> },
                { key: 'tamano', header: 'Tamaño', align: 'right', render: (d) => <span className="font-mono text-xs">{d.tamano}</span> },
                { key: 'estado', header: 'Estado', render: (d) => <Badge tone={statusTone(d.estado)}>{d.estado}</Badge> },
              ]}
              rowActions={(d) => [
                { label: 'Vista previa', icon: <Eye className="w-3.5 h-3.5" />, onClick: () => setSelectedRecordId(d.id) },
                { label: 'Descargar', icon: <Download className="w-3.5 h-3.5" />, onClick: () => notify('Descarga iniciada', d.nombre) },
                {
                  label: 'Renombrar',
                  onClick: () => {
                    setRenameTarget(d);
                    setRenameValue(d.nombre);
                  },
                },
                {
                  label: 'Archivar',
                  icon: <Archive className="w-3.5 h-3.5" />,
                  onClick: () => setDocumentos((prev) => prev.map((x) => (x.id === d.id ? { ...x, estado: 'Archivado' } : x))),
                },
                { label: 'Eliminar', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, dividerBefore: true, onClick: () => setDocumentos((prev) => prev.filter((x) => x.id !== d.id)) },
              ]}
            />
          )}
        </div>
      </div>

      {/* Document Preview Drawer */}
      <Drawer
        open={Boolean(selectedDoc)}
        onClose={() => setSelectedRecordId(null)}
        title={selectedDoc?.nombre || ''}
        subtitle={`${selectedDoc?.tipo} · ${selectedDoc?.carpeta}`}
        width="md"
        footer={
          <Button leftIcon={<Download className="w-3.5 h-3.5" />} onClick={() => notify('Archivo descargado', selectedDoc?.nombre)}>
            Descargar archivo
          </Button>
        }
      >
        {selectedDoc && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-2">
              <FileText className="w-10 h-10 text-blue-700 mx-auto" />
              <div className="text-sm font-semibold text-slate-900">{selectedDoc.nombre}</div>
              <div className="text-xs text-slate-500 font-mono">{selectedDoc.extension} · {selectedDoc.tamano}</div>
            </div>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between"><dt className="text-slate-500">Estado</dt><dd><Badge tone={statusTone(selectedDoc.estado)}>{selectedDoc.estado}</Badge></dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Empresa vinculada</dt><dd className="font-medium">{getEmpresaName(selectedDoc.empresaId)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Responsable</dt><dd>{getUser(selectedDoc.responsableId)?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Fecha de carga</dt><dd className="font-mono">{formatDateCL(selectedDoc.fecha)}</dd></div>
            </dl>
          </div>
        )}
      </Drawer>

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Subir documento a illus Ventas"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                setDocumentos((prev) => [
                  {
                    id: `doc-${Date.now()}`,
                    nombre: uploadData.nombre,
                    tipo: uploadData.tipo,
                    carpeta: uploadData.carpeta,
                    empresaId: uploadData.empresaId || undefined,
                    oportunidadId: uploadData.oportunidadId || undefined,
                    fecha: '2026-11-25',
                    responsableId: 'usr-1',
                    tamano: uploadData.tamano,
                    estado: 'Vigente',
                    extension: uploadData.extension,
                  },
                  ...prev,
                ]);
                notify('Documento subido', uploadData.nombre);
                setUploadOpen(false);
              }}
            >
              Guardar documento
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FileUpload
            onFileSelect={(info) =>
              setUploadData((prev) => ({
                ...prev,
                nombre: info.name,
                tamano: info.size,
                extension: info.extension,
              }))
            }
          />
          <Input label="Nombre del archivo" value={uploadData.nombre} onChange={(e) => setUploadData({ ...uploadData, nombre: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" value={uploadData.tipo} onChange={(e) => setUploadData({ ...uploadData, tipo: e.target.value as Documento['tipo'] })} options={['Cotización', 'Contrato', 'Propuesta', 'Factura', 'Comprobante', 'Documento comercial', 'Otro'].map((t) => ({ value: t, label: t }))} />
            <Select label="Carpeta" value={uploadData.carpeta} onChange={(e) => setUploadData({ ...uploadData, carpeta: e.target.value })} options={folders.map((f) => ({ value: f, label: f }))} />
            <Select label="Empresa" value={uploadData.empresaId} onChange={(e) => setUploadData({ ...uploadData, empresaId: e.target.value })} options={[{ value: '', label: 'Ninguna' }, ...empresas.map((e) => ({ value: e.id, label: e.nombreComercial }))]} />
            <Select label="Oportunidad" value={uploadData.oportunidadId} onChange={(e) => setUploadData({ ...uploadData, oportunidadId: e.target.value })} options={[{ value: '', label: 'Ninguna' }, ...oportunidades.map((o) => ({ value: o.id, label: o.nombre }))]} />
          </div>
          {cotizaciones.length > 0 && <p className="text-[11px] text-slate-400">También puedes adjuntar archivos desde la ficha de cada cotización.</p>}
        </div>
      </Modal>

      {/* New Folder Modal */}
      <Modal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        title="Crear carpeta documental"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setFolderModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!newFolderName.trim()) return;
                setFolders((p) => [...p, newFolderName.trim()]);
                setFolderFilter(newFolderName.trim());
                setNewFolderName('');
                setFolderModalOpen(false);
                notify('Carpeta creada');
              }}
            >
              Crear carpeta
            </Button>
          </>
        }
      >
        <Input label="Nombre de carpeta" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Ej: Contratos Minería 2027" />
      </Modal>

      {/* Rename Modal */}
      <Modal
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title="Renombrar documento"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!renameTarget) return;
                setDocumentos((prev) => prev.map((x) => (x.id === renameTarget.id ? { ...x, nombre: renameValue } : x)));
                setRenameTarget(null);
                notify('Documento renombrado');
              }}
            >
              Guardar nombre
            </Button>
          </>
        }
      >
        <Input label="Nuevo nombre" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
      </Modal>
    </div>
  );
};
