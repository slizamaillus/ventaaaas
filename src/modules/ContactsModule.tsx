import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Calendar,
  CheckSquare,
  Columns3,
  Copy,
  Download,
  Edit3,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { Contacto } from '../types/crm';
import { Avatar, Badge, BadgeTone, Button, Card, EmptyState } from '../components/ds/primitives';
import { Checkbox, FormSection, Input, MultiSelect, RUTInput, SearchInput, Select, Textarea } from '../components/ds/forms';
import { ColumnDef, Drawer, Modal, Pagination, Table, Tabs, Timeline } from '../components/ds/data';
import { formatDateCL } from '../data/chileGeo';

const ALL_CONTACTO_COLUMNS = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'empresaId', label: 'Empresa' },
  { key: 'email', label: 'Email' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'responsableId', label: 'Responsable' },
  { key: 'estado', label: 'Estado' },
  { key: 'ultimaActividad', label: 'Últ. actividad' },
  { key: 'fechaCreacion', label: 'Creación' },
];

const EMPTY_CONTACTO = (defaultEmpId: string): Omit<Contacto, 'id' | 'fechaCreacion' | 'ultimaActividad'> => ({
  nombre: '',
  apellido: '',
  rut: '',
  cargo: '',
  departamento: 'Comercial',
  cumpleanos: '',
  email: '',
  telefono: '',
  movil: '',
  whatsapp: '',
  contactoPreferido: 'Email',
  empresaId: defaultEmpId,
  relacion: 'Tomador de decisión',
  esPrincipal: false,
  responsableId: 'usr-1',
  fuente: 'Sitio Web',
  estado: 'Activo',
  etiquetas: [],
  segmentacion: 'Mid-Market',
  notas: '',
  descripcion: '',
});

export const ContactsModule: React.FC = () => {
  const {
    contactos,
    setContactos,
    empresas,
    oportunidades,
    cotizaciones,
    actividades,
    documentos,
    teamMembers,
    catalogs,
    selectedRecordId,
    setSelectedRecordId,
    navigateTo,
    openQuickCreate,
    formatMoney,
    notify,
    addAuditLog,
    getEmpresaName,
    getUser,
  } = useCRM();

  const [query, setQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [empresaFilter, setEmpresaFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [visibleCols, setVisibleCols] = useState<string[]>([
    'nombre',
    'cargo',
    'empresaId',
    'email',
    'telefono',
    'responsableId',
    'estado',
    'ultimaActividad',
  ]);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [sortKey, setSortKey] = useState('ultimaActividad');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(() => EMPTY_CONTACTO(empresas[0]?.id || ''));
  const [deleteTarget, setDeleteTarget] = useState<Contacto | null>(null);
  const [detailTab, setDetailTab] = useState('resumen');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const selectedContacto = useMemo(
    () => contactos.find((c) => c.id === selectedRecordId) || null,
    [contactos, selectedRecordId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contactos
      .filter((c) => {
        if (q) {
          const hit =
            `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.cargo.toLowerCase().includes(q) ||
            getEmpresaName(c.empresaId).toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (estadoFilter !== 'all' && c.estado !== estadoFilter) return false;
        if (empresaFilter !== 'all' && c.empresaId !== empresaFilter) return false;
        if (ownerFilter !== 'all' && c.responsableId !== ownerFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const va = String((a as unknown as Record<string, unknown>)[sortKey] || '');
        const vb = String((b as unknown as Record<string, unknown>)[sortKey] || '');
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
  }, [contactos, query, estadoFilter, empresaFilter, ownerFilter, sortKey, sortDir, getEmpresaName]);

  const pageSize = 8;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_CONTACTO(empresas[0]?.id || ''));
    setFormOpen(true);
  };

  const openEdit = (c: Contacto) => {
    setEditingId(c.id);
    const { id: _id, fechaCreacion: _fc, ultimaActividad: _ua, ...rest } = c;
    setFormData(rest);
    setFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const today = '2026-11-25';
    if (editingId) {
      setContactos((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...formData, ultimaActividad: today } : c))
      );
      addAuditLog('Contactos', 'Edición', `Actualizó contacto ${formData.nombre} ${formData.apellido}`);
      notify('Contacto actualizado', `${formData.nombre} ${formData.apellido}`);
    } else {
      const next: Contacto = {
        ...formData,
        id: `con-${Date.now()}`,
        fechaCreacion: today,
        ultimaActividad: today,
      };
      setContactos((prev) => [next, ...prev]);
      addAuditLog('Contactos', 'Creación', `Creó contacto ${formData.nombre} ${formData.apellido}`);
      notify('Contacto creado', `${formData.nombre} ${formData.apellido}`);
    }
    setFormOpen(false);
  };

  const estadoTone = (est: Contacto['estado']): BadgeTone => {
    if (est === 'Activo') return 'success';
    if (est === 'Contactado') return 'blue';
    if (est === 'No contactar') return 'danger';
    return 'neutral';
  };

  const columns: ColumnDef<Contacto>[] = ALL_CONTACTO_COLUMNS.filter((c) =>
    visibleCols.includes(c.key)
  ).map((c) => {
    if (c.key === 'nombre') {
      return {
        key: c.key,
        header: 'Nombre y apellido',
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <Avatar name={`${row.nombre} ${row.apellido}`} size="sm" />
            <div>
              <div className="font-semibold text-slate-900">
                {row.nombre} {row.apellido}
              </div>
              {row.esPrincipal && <span className="text-[11px] text-blue-700">Contacto principal</span>}
            </div>
          </div>
        ),
      };
    }
    if (c.key === 'empresaId') {
      return {
        key: c.key,
        header: 'Empresa',
        render: (row) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateTo('empresas', row.empresaId);
            }}
            className="text-xs font-medium text-blue-700 hover:underline cursor-pointer"
          >
            {getEmpresaName(row.empresaId)}
          </button>
        ),
      };
    }
    if (c.key === 'responsableId') {
      return {
        key: c.key,
        header: 'Responsable',
        render: (row) => <span className="text-xs text-slate-700">{getUser(row.responsableId)?.name || '—'}</span>,
      };
    }
    if (c.key === 'estado') {
      return {
        key: c.key,
        header: 'Estado',
        render: (row) => <Badge tone={estadoTone(row.estado)}>{row.estado}</Badge>,
      };
    }
    if (c.key === 'ultimaActividad' || c.key === 'fechaCreacion') {
      const dateField = c.key;
      return {
        key: c.key,
        header: c.label,
        sortable: true,
        render: (row) => (
          <span className="font-mono text-xs text-slate-500">
            {formatDateCL(dateField === 'fechaCreacion' ? row.fechaCreacion : row.ultimaActividad)}
          </span>
        ),
      };
    }
    return {
      key: c.key,
      header: c.label,
      sortable: true,
      render: (row) => <span className="text-xs text-slate-700">{String((row as unknown as Record<string, unknown>)[c.key] || '—')}</span>,
    };
  });

  // DETAIL VIEW
  if (selectedContacto) {
    const emp = empresas.find((e) => e.id === selectedContacto.empresaId);
    const conOpps = oportunidades.filter((o) => o.contactoId === selectedContacto.id);
    const conQuotes = cotizaciones.filter((q) => q.contactoId === selectedContacto.id);
    const conActs = actividades.filter((a) => a.contactoId === selectedContacto.id);
    const conDocs = documentos.filter((d) => d.contactoId === selectedContacto.id);
    const owner = getUser(selectedContacto.responsableId);

    return (
      <div className="space-y-5">
        <Button size="sm" variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedRecordId(null)}>
          Volver a Contactos
        </Button>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Avatar name={`${selectedContacto.nombre} ${selectedContacto.apellido}`} size="xl" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold text-slate-900">
                    {selectedContacto.nombre} {selectedContacto.apellido}
                  </h1>
                  <Badge tone={estadoTone(selectedContacto.estado)}>{selectedContacto.estado}</Badge>
                  <Badge tone="neutral">{selectedContacto.relacion}</Badge>
                </div>
                <p className="text-xs text-slate-600">
                  {selectedContacto.cargo} ·{' '}
                  {emp ? (
                    <button type="button" onClick={() => navigateTo('empresas', emp.id)} className="text-blue-700 font-medium hover:underline cursor-pointer">
                      {emp.nombreComercial}
                    </button>
                  ) : (
                    'Sin empresa'
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{selectedContacto.email}</span>
                  <span className="inline-flex items-center gap-1.5 font-mono"><Phone className="w-3.5 h-3.5 text-slate-400" />{selectedContacto.telefono}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" leftIcon={<Mail className="w-3.5 h-3.5" />} onClick={() => { setEmailSubject(`Seguimiento comercial — ${emp?.nombreComercial || ''}`); setEmailModalOpen(true); }}>
                Enviar email
              </Button>
              <Button size="sm" variant="outline" leftIcon={<CheckSquare className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('tarea', { contactoId: selectedContacto.id, empresaId: selectedContacto.empresaId })}>
                Crear tarea
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Calendar className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('actividad', { contactoId: selectedContacto.id, empresaId: selectedContacto.empresaId })}>
                Crear reunión
              </Button>
              <Button size="sm" variant="outline" leftIcon={<TrendingUp className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('oportunidad', { contactoId: selectedContacto.id, empresaId: selectedContacto.empresaId })}>
                Oportunidad
              </Button>
              <Button size="sm" variant="outline" leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('cotizacion', { contactoId: selectedContacto.id, empresaId: selectedContacto.empresaId })}>
                Cotización
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => openEdit(selectedContacto)}>
                Editar
              </Button>
              <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteTarget(selectedContacto)}>
                Eliminar
              </Button>
            </div>
          </div>

          <Tabs
            activeTab={detailTab}
            onChange={setDetailTab}
            tabs={[
              { id: 'resumen', label: 'Resumen' },
              { id: 'actividades', label: 'Actividades', count: conActs.length },
              { id: 'oportunidades', label: 'Oportunidades', count: conOpps.length },
              { id: 'cotizaciones', label: 'Cotizaciones', count: conQuotes.length },
              { id: 'documentos', label: 'Documentos', count: conDocs.length },
              { id: 'historial', label: 'Historial' },
            ]}
          />
        </div>

        {detailTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Card className="lg:col-span-5" title="Ficha individual">
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between"><dt className="text-slate-500">Departamento</dt><dd className="font-medium text-slate-900">{selectedContacto.departamento}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">RUT</dt><dd className="font-mono">{selectedContacto.rut || 'No informado'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Móvil / WhatsApp</dt><dd className="font-mono">{selectedContacto.movil || selectedContacto.whatsapp || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Canal preferido</dt><dd>{selectedContacto.contactoPreferido}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Responsable</dt><dd>{owner?.name || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Fuente</dt><dd>{selectedContacto.fuente}</dd></div>
                <div className="pt-2 border-t border-slate-100">
                  <dt className="text-slate-500 mb-1">Notas</dt>
                  <dd className="text-slate-700 leading-relaxed">{selectedContacto.notas || 'Sin notas.'}</dd>
                </div>
              </dl>
            </Card>
            <Card className="lg:col-span-7" title="Timeline de interacciones">
              <Timeline
                items={conActs.map((a) => ({
                  id: a.id,
                  title: a.titulo,
                  description: a.descripcion,
                  date: `${formatDateCL(a.fecha)} ${a.hora}`,
                  type: a.tipo,
                  tone: a.estado === 'Completada' ? 'success' : 'blue',
                  actor: getUser(a.responsableId)?.name,
                }))}
              />
            </Card>
          </div>
        )}

        {detailTab === 'actividades' && (
          <Card title="Actividades del contacto">
            <Timeline
              items={conActs.map((a) => ({
                id: a.id,
                title: a.titulo,
                description: a.descripcion,
                date: `${formatDateCL(a.fecha)} ${a.hora}`,
                type: a.tipo,
                actor: getUser(a.responsableId)?.name,
              }))}
            />
          </Card>
        )}

        {detailTab === 'oportunidades' && (
          <Table
            data={conOpps}
            onRowClick={(o) => navigateTo('oportunidades', o.id)}
            columns={[
              { key: 'nombre', header: 'Oportunidad', render: (o) => <span className="font-medium text-slate-900">{o.nombre}</span> },
              { key: 'monto', header: 'Monto', align: 'right', render: (o) => <span className="font-mono tabular-nums font-semibold">{formatMoney(o.monto, o.moneda)}</span> },
              { key: 'fechaCierreEstimada', header: 'Cierre', render: (o) => formatDateCL(o.fechaCierreEstimada) },
            ]}
          />
        )}

        {detailTab === 'cotizaciones' && (
          <Table
            data={conQuotes}
            onRowClick={(q) => navigateTo('cotizaciones', q.id)}
            columns={[
              { key: 'folio', header: 'Folio', render: (q) => <span className="font-mono text-blue-700">{q.folio}</span> },
              { key: 'nombre', header: 'Título', render: (q) => q.nombre },
              { key: 'estado', header: 'Estado', render: (q) => <Badge tone="blue">{q.estado}</Badge> },
            ]}
          />
        )}

        {detailTab === 'documentos' && (
          <Table
            data={conDocs}
            onRowClick={(d) => navigateTo('documentos', d.id)}
            columns={[
              { key: 'nombre', header: 'Documento', render: (d) => d.nombre },
              { key: 'tipo', header: 'Tipo', render: (d) => d.tipo },
              { key: 'estado', header: 'Estado', render: (d) => <Badge tone="neutral">{d.estado}</Badge> },
            ]}
          />
        )}

        {detailTab === 'historial' && (
          <Card title="Historial de cambios">
            <Timeline
              items={[
                { id: 'hc1', title: 'Última actividad registrada', date: formatDateCL(selectedContacto.ultimaActividad), type: 'Actividad' },
                { id: 'hc2', title: 'Contacto incorporado al directorio', date: formatDateCL(selectedContacto.fechaCreacion), type: 'Creación', actor: owner?.name },
              ]}
            />
          </Card>
        )}

        {/* Email Action Modal */}
        <Modal
          open={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          title={`Enviar correo a ${selectedContacto.nombre} ${selectedContacto.apellido}`}
          subtitle={selectedContacto.email}
          footer={
            <>
              <Button variant="outline" onClick={() => setEmailModalOpen(false)}>Cancelar</Button>
              <Button
                leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                onClick={() => {
                  setEmailModalOpen(false);
                  notify('Correo registrado', `Enviado a ${selectedContacto.email} y guardado en timeline.`);
                }}
              >
                Enviar email
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <Input label="Asunto" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            <Textarea label="Mensaje" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Estimado/a..." />
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contactos</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Directorio de personas, ejecutivos, tomadores de decisión e historial de interacciones.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Button size="sm" variant="outline" leftIcon={<Columns3 className="w-3.5 h-3.5" />} onClick={() => setColPickerOpen((o) => !o)}>
              Columnas
            </Button>
            {colPickerOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-40 space-y-1.5">
                {ALL_CONTACTO_COLUMNS.map((col) => {
                  const active = visibleCols.includes(col.key);
                  return (
                    <label key={col.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() =>
                          setVisibleCols((prev) =>
                            active ? prev.filter((x) => x !== col.key) : [...prev, col.key]
                          )
                        }
                      />
                      <span>{col.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => notify('Exportación lista', `${filtered.length} contactos exportados.`)}
          >
            Exportar
          </Button>
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>
            Nuevo contacto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
        <div className="lg:col-span-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar nombre, cargo, email o empresa..." />
        </div>
        <Select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los estados' },
            { value: 'Activo', label: 'Activo' },
            { value: 'Contactado', label: 'Contactado' },
            { value: 'No contactar', label: 'No contactar' },
            { value: 'Archivado', label: 'Archivado' },
          ]}
        />
        <Select
          value={empresaFilter}
          onChange={(e) => setEmpresaFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todas las empresas' },
            ...empresas.map((e) => ({ value: e.id, label: e.nombreComercial })),
          ]}
        />
        <Select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los responsables' },
            ...teamMembers.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-900">{selectedIds.length} contactos seleccionados</span>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setContactos((prev) => prev.map((c) => (selectedIds.includes(c.id) ? { ...c, estado: 'Archivado' } : c)));
                setSelectedIds([]);
                notify('Contactos archivados', undefined, 'info');
              }}
            >
              Archivar
            </Button>
            <Button
              size="xs"
              variant="danger"
              onClick={() => {
                setContactos((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
                setSelectedIds([]);
                notify('Contactos eliminados', undefined, 'warning');
              }}
            >
              Eliminar
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin contactos encontrados"
          description="Modifica los filtros o crea un nuevo contacto comercial."
          actionLabel="Nuevo contacto"
          onAction={openCreate}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table
              data={paginated}
              columns={columns}
              selectedIds={selectedIds}
              onToggleSelect={(id) =>
                setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
              }
              onToggleSelectAll={setSelectedIds}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={(k) => {
                setSortDir((d) => (sortKey === k && d === 'asc' ? 'desc' : 'asc'));
                setSortKey(k);
              }}
              onRowClick={(c) => setSelectedRecordId(c.id)}
              rowActions={(c) => [
                { label: 'Ver ficha', onClick: () => setSelectedRecordId(c.id) },
                { label: 'Editar', icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => openEdit(c) },
                {
                  label: 'Duplicar',
                  icon: <Copy className="w-3.5 h-3.5" />,
                  onClick: () => {
                    setContactos((prev) => [{ ...c, id: `con-${Date.now()}`, nombre: `${c.nombre} (Copia)` }, ...prev]);
                    notify('Contacto duplicado');
                  },
                },
                {
                  label: 'Archivar',
                  icon: <Archive className="w-3.5 h-3.5" />,
                  onClick: () => {
                    setContactos((prev) => prev.map((x) => (x.id === c.id ? { ...x, estado: 'Archivado' } : x)));
                    notify('Contacto archivado', undefined, 'info');
                  },
                },
                { label: 'Eliminar', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, dividerBefore: true, onClick: () => setDeleteTarget(c) },
              ]}
            />
          </div>

          <div className="md:hidden space-y-3">
            {paginated.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedRecordId(c.id)}
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{c.nombre} {c.apellido}</span>
                  <Badge tone={estadoTone(c.estado)}>{c.estado}</Badge>
                </div>
                <p className="text-xs text-slate-500">{c.cargo} · {getEmpresaName(c.empresaId)}</p>
                <p className="text-xs text-slate-600 font-mono">{c.email}</p>
              </div>
            ))}
          </div>

          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      {/* 5-Section Contact Form Drawer */}
      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? `Editar contacto: ${formData.nombre} ${formData.apellido}` : 'Nuevo contacto'}
        subtitle="Ficha de persona organizada en 5 secciones"
        width="xl"
      >
        <form id="contacto-form" onSubmit={handleSaveForm} className="space-y-6">
          <FormSection title="1. Información personal">
            <Input label="Nombre" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
            <Input label="Apellido" required value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} />
            <RUTInput label="RUT opcional" value={formData.rut || ''} onChange={(val) => setFormData({ ...formData, rut: val })} />
            <Input label="Cargo" required value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} />
            <Input label="Departamento" value={formData.departamento} onChange={(e) => setFormData({ ...formData, departamento: e.target.value })} />
            <Input label="Cumpleaños (opcional)" type="date" value={formData.cumpleanos || ''} onChange={(e) => setFormData({ ...formData, cumpleanos: e.target.value })} />
          </FormSection>

          <FormSection title="2. Canales de contacto">
            <Input label="Email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <Input label="Teléfono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
            <Input label="Teléfono móvil" value={formData.movil || ''} onChange={(e) => setFormData({ ...formData, movil: e.target.value })} />
            <Input label="WhatsApp" value={formData.whatsapp || ''} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} />
            <Select label="Contacto preferido" value={formData.contactoPreferido} onChange={(e) => setFormData({ ...formData, contactoPreferido: e.target.value as Contacto['contactoPreferido'] })} options={['Email', 'Teléfono', 'WhatsApp', 'Reunión'].map((x) => ({ value: x, label: x }))} />
          </FormSection>

          <FormSection title="3. Empresa asociada">
            <Select label="Empresa" value={formData.empresaId} onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })} options={empresas.map((em) => ({ value: em.id, label: em.nombreComercial }))} />
            <Select label="Relación comercial" value={formData.relacion} onChange={(e) => setFormData({ ...formData, relacion: e.target.value as Contacto['relacion'] })} options={['Tomador de decisión', 'Influenciador', 'Usuario clave', 'Finanzas / Compras', 'Sponsor Ejecutivo'].map((r) => ({ value: r, label: r }))} />
            <div className="md:col-span-2">
              <Checkbox checked={formData.esPrincipal} onChange={(val) => setFormData({ ...formData, esPrincipal: val })} label="Definir como contacto principal de la empresa" />
            </div>
          </FormSection>

          <FormSection title="4. Gestión comercial">
            <Select label="Responsable" value={formData.responsableId} onChange={(e) => setFormData({ ...formData, responsableId: e.target.value })} options={teamMembers.map((u) => ({ value: u.id, label: u.name }))} />
            <Select label="Fuente" value={formData.fuente} onChange={(e) => setFormData({ ...formData, fuente: e.target.value })} options={catalogs.fuentes.map((f) => ({ value: f, label: f }))} />
            <Select label="Estado" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value as Contacto['estado'] })} options={['Activo', 'Contactado', 'No contactar', 'Archivado'].map((s) => ({ value: s, label: s }))} />
            <Input label="Segmentación" value={formData.segmentacion} onChange={(e) => setFormData({ ...formData, segmentacion: e.target.value })} />
            <div className="md:col-span-2">
              <MultiSelect label="Etiquetas" options={catalogs.etiquetas.map((t) => t.name)} selected={formData.etiquetas} onChange={(etiquetas) => setFormData({ ...formData, etiquetas })} />
            </div>
          </FormSection>

          <FormSection title="5. Información adicional">
            <div className="md:col-span-2">
              <Textarea label="Descripción" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Notas" value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
            </div>
          </FormSection>
        </form>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
          <Button type="submit" form="contacto-form">{editingId ? 'Guardar cambios' : 'Crear contacto'}</Button>
        </div>
      </Drawer>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar eliminación"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!deleteTarget) return;
                setContactos((prev) => prev.filter((x) => x.id !== deleteTarget.id));
                if (selectedRecordId === deleteTarget.id) setSelectedRecordId(null);
                notify('Contacto eliminado', `${deleteTarget.nombre} ${deleteTarget.apellido}`, 'warning');
                setDeleteTarget(null);
              }}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Eliminar a <strong>{deleteTarget?.nombre} {deleteTarget?.apellido}</strong>?
        </p>
      </Modal>
    </div>
  );
};
