import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  FileSpreadsheet,
  Kanban,
  LayoutList,
  Phone,
  Plus,
  Table2,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { CurrencyCode, Oportunidad, PipelineStageConfig, PriorityLevel } from '../types/crm';
import { Avatar, Badge, BadgeTone, Button, Card, EmptyState } from '../components/ds/primitives';
import { CurrencyInput, DatePicker, FormSection, Input, MultiSelect, SearchInput, Select, Textarea } from '../components/ds/forms';
import { Drawer, KanbanCard, Modal, Table, Tabs, Timeline } from '../components/ds/data';
import { formatDateCL } from '../data/chileGeo';

type ViewMode = 'tablero' | 'tabla' | 'lista' | 'responsable';

export const OpportunitiesModule: React.FC = () => {
  const {
    oportunidades,
    setOportunidades,
    empresas,
    contactos,
    productos,
    cotizaciones,
    actividades,
    documentos,
    pipelineStages,
    setPipelineStages,
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
    getContactoName,
    getUser,
  } = useCRM();

  const [viewMode, setViewMode] = useState<ViewMode>('tablero');
  const [query, setQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnProb, setNewColumnProb] = useState(50);
  const [newColumnColor, setNewColumnColor] = useState<PipelineStageConfig['color']>('blue');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Oportunidad, 'id' | 'fechaCreacion' | 'ultimaActividad'>>({
    nombre: '',
    empresaId: empresas[0]?.id || '',
    contactoId: contactos[0]?.id || '',
    pipeline: 'Pipeline Comercial B2B',
    etapaId: pipelineStages[0]?.id || 'stg-1',
    monto: 12000000,
    moneda: 'CLP',
    probabilidad: 20,
    fechaCierreEstimada: '2026-12-20',
    responsableId: 'usr-1',
    equipo: 'Grandes Cuentas',
    origen: 'Referido Ejecutivo',
    tipo: 'Nuevo negocio',
    productosIds: [],
    prioridad: 'Media',
    descripcion: '',
    notas: '',
    competencia: '',
    etiquetas: [],
  });

  const [detailTab, setDetailTab] = useState('resumen');
  const [lossModalOpp, setLossModalOpp] = useState<Oportunidad | null>(null);
  const [lossReason, setLossReason] = useState(catalogs.motivosPerdida[0]);
  const [deleteTarget, setDeleteTarget] = useState<Oportunidad | null>(null);

  const selectedOpp = useMemo(
    () => oportunidades.find((o) => o.id === selectedRecordId) || null,
    [oportunidades, selectedRecordId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return oportunidades.filter((o) => {
      if (o.archivada) return false;
      if (q && !o.nombre.toLowerCase().includes(q) && !getEmpresaName(o.empresaId).toLowerCase().includes(q)) return false;
      if (ownerFilter !== 'all' && o.responsableId !== ownerFilter) return false;
      if (priorityFilter !== 'all' && o.prioridad !== priorityFilter) return false;
      return true;
    });
  }, [oportunidades, query, ownerFilter, priorityFilter, getEmpresaName]);

  const sortedStages = useMemo(
    () => pipelineStages.slice().sort((a, b) => a.order - b.order),
    [pipelineStages]
  );

  const moveStage = (oppId: string, targetStageId: string) => {
    const stg = pipelineStages.find((s) => s.id === targetStageId);
    if (!stg) return;
    if (stg.isClosed === 'lost') {
      const opp = oportunidades.find((o) => o.id === oppId);
      if (opp) {
        setLossModalOpp(opp);
        return;
      }
    }
    setOportunidades((prev) =>
      prev.map((o) =>
        o.id === oppId
          ? {
              ...o,
              etapaId: targetStageId,
              probabilidad: stg.probability,
              ultimaActividad: '2026-11-25',
            }
          : o
      )
    );
    addAuditLog('Oportunidades', 'Cambio de etapa', `Movió oportunidad a "${stg.name}" (${stg.probability}%)`);
    notify('Etapa actualizada', `Movida a ${stg.name} (${stg.probability}%).`);
  };

  const confirmLoss = () => {
    if (!lossModalOpp) return;
    const lostStage = pipelineStages.find((s) => s.isClosed === 'lost');
    setOportunidades((prev) =>
      prev.map((o) =>
        o.id === lossModalOpp.id
          ? {
              ...o,
              etapaId: lostStage?.id || 'stg-8',
              probabilidad: 0,
              motivoPerdida: lossReason,
              ultimaActividad: '2026-11-25',
            }
          : o
      )
    );
    addAuditLog('Oportunidades', 'Cambio de etapa', `Marcó como perdida "${lossModalOpp.nombre}" (${lossReason})`);
    notify('Oportunidad marcada como perdida', lossReason, 'warning');
    setLossModalOpp(null);
  };

  const openCreate = (presetStageId?: string) => {
    setEditingId(null);
    const stg = pipelineStages.find((s) => s.id === (presetStageId || pipelineStages[0]?.id));
    setFormData({
      nombre: '',
      empresaId: empresas[0]?.id || '',
      contactoId: contactos[0]?.id || '',
      pipeline: 'Pipeline Comercial B2B',
      etapaId: stg?.id || 'stg-1',
      monto: 12000000,
      moneda: 'CLP',
      probabilidad: stg?.probability ?? 10,
      fechaCierreEstimada: '2026-12-20',
      responsableId: 'usr-1',
      equipo: 'Grandes Cuentas',
      origen: catalogs.fuentes[0],
      tipo: 'Nuevo negocio',
      productosIds: [],
      prioridad: 'Media',
      descripcion: '',
      notas: '',
      competencia: '',
      etiquetas: [],
    });
    setFormOpen(true);
  };

  const openEdit = (o: Oportunidad) => {
    setEditingId(o.id);
    const { id: _id, fechaCreacion: _fc, ultimaActividad: _ua, ...rest } = o;
    setFormData(rest);
    setFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const today = '2026-11-25';
    if (editingId) {
      setOportunidades((prev) =>
        prev.map((o) => (o.id === editingId ? { ...o, ...formData, ultimaActividad: today } : o))
      );
      notify('Oportunidad actualizada', formData.nombre);
    } else {
      setOportunidades((prev) => [
        {
          ...formData,
          id: `opp-${Date.now()}`,
          fechaCreacion: today,
          ultimaActividad: today,
        },
        ...prev,
      ]);
      notify('Oportunidad creada', formData.nombre);
    }
    setFormOpen(false);
  };

  const stageTone = (color?: string): BadgeTone => {
    if (color === 'emerald') return 'success';
    if (color === 'amber') return 'warning';
    if (color === 'rose') return 'danger';
    if (color === 'blue') return 'blue';
    if (color === 'indigo') return 'indigo';
    return 'neutral';
  };

  const stageDotColor = (color?: PipelineStageConfig['color']) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-600';
      case 'indigo':
        return 'bg-indigo-600';
      case 'amber':
        return 'bg-amber-500';
      case 'emerald':
        return 'bg-emerald-600';
      case 'rose':
        return 'bg-rose-600';
      default:
        return 'bg-slate-400';
    }
  };

  const startRenameColumn = (stage: PipelineStageConfig) => {
    setEditingStageId(stage.id);
    setEditingStageName(stage.name);
  };

  const commitRenameColumn = (stage: PipelineStageConfig) => {
    const trimmed = editingStageName.trim();
    setEditingStageId(null);
    if (!trimmed || trimmed === stage.name) return;
    setPipelineStages((prev) => prev.map((s) => (s.id === stage.id ? { ...s, name: trimmed } : s)));
    addAuditLog('Oportunidades', 'Configuración', `Renombró columna del tablero "${stage.name}" a "${trimmed}"`);
    notify('Columna renombrada', `${stage.name} → ${trimmed}`);
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newColumnName.trim();
    if (!trimmed) return;
    const maxOrder = pipelineStages.reduce((max, s) => Math.max(max, s.order), 0);
    const clampedProb = Math.min(100, Math.max(0, Number(newColumnProb) || 0));
    const newStage: PipelineStageConfig = {
      id: `stg-${Date.now()}`,
      name: trimmed,
      probability: clampedProb,
      color: newColumnColor,
      order: maxOrder + 1,
    };
    setPipelineStages((prev) => [...prev, newStage]);
    addAuditLog('Oportunidades', 'Configuración', `Agregó columna "${trimmed}" al tablero (${clampedProb}%)`);
    notify('Columna agregada', trimmed);
    setNewColumnName('');
    setNewColumnProb(50);
    setNewColumnColor('blue');
    setAddingColumn(false);
  };

  // DETAIL VIEW
  if (selectedOpp) {
    const stg = pipelineStages.find((s) => s.id === selectedOpp.etapaId);
    const owner = getUser(selectedOpp.responsableId);
    const oppQuotes = cotizaciones.filter((q) => q.oportunidadId === selectedOpp.id);
    const oppActs = actividades.filter((a) => a.oportunidadId === selectedOpp.id);
    const oppDocs = documentos.filter((d) => d.oportunidadId === selectedOpp.id);
    const oppProducts = productos.filter((p) => selectedOpp.productosIds.includes(p.id));
    const wonStage = pipelineStages.find((s) => s.isClosed === 'won');

    return (
      <div className="space-y-5">
        <Button size="sm" variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedRecordId(null)}>
          Volver a Oportunidades
        </Button>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{selectedOpp.nombre}</h1>
                <Badge tone={stageTone(stg?.color)}>{stg?.name || 'Etapa'}</Badge>
                <Badge tone={selectedOpp.prioridad === 'Urgente' ? 'danger' : 'neutral'}>
                  Prioridad {selectedOpp.prioridad}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                <button type="button" onClick={() => navigateTo('empresas', selectedOpp.empresaId)} className="text-blue-700 font-medium hover:underline cursor-pointer">
                  {getEmpresaName(selectedOpp.empresaId)}
                </button>{' '}
                · Contacto:{' '}
                <button type="button" onClick={() => navigateTo('contactos', selectedOpp.contactoId)} className="text-blue-700 hover:underline cursor-pointer">
                  {getContactoName(selectedOpp.contactoId)}
                </button>{' '}
                · Cierre est.: <span className="font-mono">{formatDateCL(selectedOpp.fechaCierreEstimada)}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  {formatMoney(selectedOpp.monto, selectedOpp.moneda)}
                </span>
                <span className="text-xs text-slate-500 font-mono">Probabilidad: {selectedOpp.probabilidad}%</span>
                {owner && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                    <Avatar src={owner.avatar} name={owner.name} initials={owner.initials} size="xs" />
                    {owner.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Cambiar etapa"
                value={selectedOpp.etapaId}
                onChange={(e) => moveStage(selectedOpp.id, e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 cursor-pointer"
              >
                {sortedStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    Etapa: {s.name} ({s.probability}%)
                  </option>
                ))}
              </select>
              {wonStage && selectedOpp.etapaId !== wonStage.id && (
                <Button size="sm" variant="primary" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={() => moveStage(selectedOpp.id, wonStage.id)}>
                  Marcar ganada
                </Button>
              )}
              <Button size="sm" variant="outline" leftIcon={<XCircle className="w-3.5 h-3.5 text-red-600" />} onClick={() => setLossModalOpp(selectedOpp)}>
                Marcar perdida
              </Button>
              <Button size="sm" variant="outline" leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('cotizacion', { empresaId: selectedOpp.empresaId, contactoId: selectedOpp.contactoId, oportunidadId: selectedOpp.id })}>
                Crear cotización
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Phone className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('actividad', { empresaId: selectedOpp.empresaId, contactoId: selectedOpp.contactoId, oportunidadId: selectedOpp.id })}>
                Actividad
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => openEdit(selectedOpp)}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={() => {
                setOportunidades((prev) => [{ ...selectedOpp, id: `opp-${Date.now()}`, nombre: `${selectedOpp.nombre} (Copia)` }, ...prev]);
                notify('Oportunidad duplicada');
              }}>
                Duplicar
              </Button>
              <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteTarget(selectedOpp)}>
                Eliminar
              </Button>
            </div>
          </div>

          <Tabs
            activeTab={detailTab}
            onChange={setDetailTab}
            tabs={[
              { id: 'resumen', label: 'Resumen' },
              { id: 'actividades', label: 'Actividades', count: oppActs.length },
              { id: 'cotizaciones', label: 'Cotizaciones', count: oppQuotes.length },
              { id: 'productos', label: 'Productos', count: oppProducts.length },
              { id: 'documentos', label: 'Documentos', count: oppDocs.length },
              { id: 'historial', label: 'Historial' },
            ]}
          />
        </div>

        {detailTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-5">
              <Card title="Detalles comerciales">
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between"><dt className="text-slate-500">Pipeline</dt><dd className="font-medium text-slate-900">{selectedOpp.pipeline}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Tipo de negocio</dt><dd>{selectedOpp.tipo}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Origen</dt><dd>{selectedOpp.origen}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Equipo</dt><dd>{selectedOpp.equipo}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Competencia</dt><dd>{selectedOpp.competencia || 'No registrada'}</dd></div>
                  <div className="pt-2 border-t border-slate-100">
                    <dt className="text-slate-500 mb-1">Descripción</dt>
                    <dd className="text-slate-700 leading-relaxed">{selectedOpp.descripcion || '—'}</dd>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <dt className="text-slate-500 mb-1">Notas</dt>
                    <dd className="text-slate-700 leading-relaxed">{selectedOpp.notas || '—'}</dd>
                  </div>
                </dl>
              </Card>

              {selectedOpp.motivoPerdida && (
                <Card title="Motivo de pérdida">
                  <p className="text-sm font-medium text-red-700">{selectedOpp.motivoPerdida}</p>
                </Card>
              )}
            </div>

            <div className="lg:col-span-7">
              <Card title="Panel de actividad comercial">
                <Timeline
                  items={oppActs.map((a) => ({
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
          </div>
        )}

        {detailTab === 'actividades' && (
          <Card title="Actividades de la oportunidad">
            <Timeline
              items={oppActs.map((a) => ({
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

        {detailTab === 'cotizaciones' && (
          <Table
            data={oppQuotes}
            onRowClick={(q) => navigateTo('cotizaciones', q.id)}
            columns={[
              { key: 'folio', header: 'Folio', render: (q) => <span className="font-mono text-blue-700 font-medium">{q.folio}</span> },
              { key: 'nombre', header: 'Propuesta', render: (q) => q.nombre },
              { key: 'fecha', header: 'Fecha', render: (q) => formatDateCL(q.fecha) },
              { key: 'estado', header: 'Estado', render: (q) => <Badge tone="blue">{q.estado}</Badge> },
            ]}
          />
        )}

        {detailTab === 'productos' && (
          <Table
            data={oppProducts}
            onRowClick={(p) => navigateTo('productos', p.id)}
            columns={[
              { key: 'sku', header: 'SKU', render: (p) => <span className="font-mono text-xs">{p.sku}</span> },
              { key: 'nombre', header: 'Producto / Servicio', render: (p) => p.nombre },
              { key: 'precio', header: 'Precio unit.', align: 'right', render: (p) => <span className="font-mono tabular-nums">{formatMoney(p.precio, p.moneda)}</span> },
            ]}
          />
        )}

        {detailTab === 'documentos' && (
          <Table
            data={oppDocs}
            onRowClick={(d) => navigateTo('documentos', d.id)}
            columns={[
              { key: 'nombre', header: 'Documento', render: (d) => d.nombre },
              { key: 'tipo', header: 'Tipo', render: (d) => d.tipo },
              { key: 'estado', header: 'Estado', render: (d) => <Badge tone="neutral">{d.estado}</Badge> },
            ]}
          />
        )}

        {detailTab === 'historial' && (
          <Card title="Historial de etapa y cambios">
            <Timeline
              items={[
                { id: 'ho1', title: `Etapa actual: ${stg?.name}`, date: formatDateCL(selectedOpp.ultimaActividad), type: 'Pipeline' },
                { id: 'ho2', title: 'Oportunidad creada', date: formatDateCL(selectedOpp.fechaCreacion), type: 'Creación', actor: owner?.name },
              ]}
            />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === 'tablero'
          ? 'flex flex-col gap-4 h-[calc(100dvh-10.5rem)] lg:h-[calc(100dvh-6.5rem)] min-h-[480px]'
          : 'space-y-5'
      }
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Oportunidades</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestión comercial B2B con etapas configurables, pronóstico ponderado y seguimiento rápido.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200 rounded-lg">
            {[
              { id: 'tablero' as ViewMode, label: 'Tablero', icon: <Kanban className="w-3.5 h-3.5" /> },
              { id: 'tabla' as ViewMode, label: 'Tabla', icon: <Table2 className="w-3.5 h-3.5" /> },
              { id: 'lista' as ViewMode, label: 'Lista', icon: <LayoutList className="w-3.5 h-3.5" /> },
              { id: 'responsable' as ViewMode, label: 'Por responsable', icon: <Users className="w-3.5 h-3.5" /> },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setViewMode(v.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                  viewMode === v.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v.icon}
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          {viewMode === 'tablero' && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setAddingColumn(true)}
            >
              Agregar columna
            </Button>
          )}
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => openCreate()}>
            Nueva oportunidad
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end shrink-0">
        <div className="sm:col-span-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar oportunidad o empresa..." />
        </div>
        <Select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los responsables' },
            ...teamMembers.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todas las prioridades' },
            { value: 'Urgente', label: 'Urgente' },
            { value: 'Alta', label: 'Alta' },
            { value: 'Media', label: 'Media' },
            { value: 'Baja', label: 'Baja' },
          ]}
        />
      </div>

      {viewMode === 'tablero' ? (
        <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-1 items-stretch">
          {sortedStages.map((stage) => {
            const items = filtered.filter((o) => o.etapaId === stage.id);
            const sum = items.reduce((a, o) => a + o.monto, 0);
            const isRenaming = editingStageId === stage.id;
            return (
              <div
                key={stage.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedId) {
                    moveStage(draggedId, stage.id);
                    setDraggedId(null);
                  }
                }}
                className="w-[290px] shrink-0 h-full flex flex-col bg-slate-100/80 border border-slate-200 rounded-xl p-3"
              >
                <div className="flex items-start justify-between gap-2 px-1 pb-3 shrink-0">
                  <div className="min-w-0 flex-1">
                    {isRenaming ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          autoFocus
                          value={editingStageName}
                          onChange={(e) => setEditingStageName(e.target.value)}
                          onBlur={() => commitRenameColumn(stage)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitRenameColumn(stage);
                            } else if (e.key === 'Escape') {
                              setEditingStageId(null);
                            }
                          }}
                          aria-label="Renombrar columna"
                          className="w-full bg-white border border-blue-600 rounded-md px-2 py-0.5 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            commitRenameColumn(stage);
                          }}
                          title="Guardar nombre"
                          className="p-1 rounded text-emerald-700 hover:bg-white cursor-pointer shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="group flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${stageDotColor(stage.color)}`} />
                        <button
                          type="button"
                          onClick={() => startRenameColumn(stage)}
                          title="Haz clic para cambiar el nombre de la columna"
                          className="text-xs font-bold text-slate-900 truncate hover:text-blue-700 cursor-pointer text-left"
                        >
                          {stage.name}
                        </button>
                        <span className="text-[11px] font-mono text-slate-500 tabular-nums shrink-0">
                          ({items.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => startRenameColumn(stage)}
                          title="Renombrar columna"
                          aria-label={`Renombrar columna ${stage.name}`}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-700 hover:bg-white transition-opacity cursor-pointer shrink-0"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="text-[11px] font-mono tabular-nums text-slate-600 font-medium mt-0.5">
                      {formatMoney(sum)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreate(stage.id)}
                    title={`Agregar en ${stage.name}`}
                    className="p-1 rounded-md text-slate-400 hover:text-blue-700 hover:bg-white cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-0.5">
                  {items.length === 0 ? (
                    <div className="h-24 border border-dashed border-slate-300/80 rounded-lg flex items-center justify-center text-[11px] text-slate-400 px-3 text-center">
                      Arrastra oportunidades aquí o agrega una nueva
                    </div>
                  ) : (
                    items.map((opp) => {
                      const owner = getUser(opp.responsableId);
                      return (
                        <KanbanCard
                          key={opp.id}
                          draggable
                          onDragStart={() => setDraggedId(opp.id)}
                          title={opp.nombre}
                          companyName={getEmpresaName(opp.empresaId)}
                          contactName={getContactoName(opp.contactoId)}
                          amountFormatted={formatMoney(opp.monto, opp.moneda)}
                          ownerName={owner?.name || 'Sin asignar'}
                          ownerAvatar={owner?.avatar}
                          closeDate={formatDateCL(opp.fechaCierreEstimada)}
                          probability={opp.probabilidad}
                          priority={opp.prioridad}
                          lastActivity={formatDateCL(opp.ultimaActividad)}
                          onClick={() => setSelectedRecordId(opp.id)}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Column Slot */}
          <div className="w-[270px] shrink-0 h-full flex flex-col">
            {addingColumn ? (
              <form
                onSubmit={handleAddColumn}
                className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Nueva columna</span>
                  <button
                    type="button"
                    onClick={() => setAddingColumn(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Input
                  label="Nombre de la columna"
                  autoFocus
                  required
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Ej: Revisión técnica"
                />
                <div className="grid grid-cols-2 gap-2 items-end">
                  <Input
                    label="Prob. (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={newColumnProb}
                    onChange={(e) => setNewColumnProb(Number(e.target.value))}
                    className="font-mono"
                  />
                  <div>
                    <span className="block text-xs font-medium text-slate-700 mb-1.5">Color</span>
                    <div className="flex items-center gap-1.5 h-9">
                      {(['slate', 'blue', 'indigo', 'amber', 'emerald', 'rose'] as PipelineStageConfig['color'][]).map(
                        (c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewColumnColor(c)}
                            aria-label={`Color ${c}`}
                            className={`w-4 h-4 rounded-full cursor-pointer ${stageDotColor(c)} ${
                              newColumnColor === c ? 'ring-2 ring-offset-1 ring-slate-900' : 'opacity-70 hover:opacity-100'
                            }`}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button type="button" size="xs" variant="ghost" onClick={() => setAddingColumn(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="xs" variant="primary">
                    Agregar columna
                  </Button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAddingColumn(true)}
                className="w-full h-24 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar columna</span>
              </button>
            )}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No hay oportunidades en esta vista"
          description="Crea una nueva oportunidad comercial o ajusta los filtros."
          actionLabel="Nueva oportunidad"
          onAction={() => openCreate()}
        />
      ) : viewMode === 'tabla' ? (
        <Table
          data={filtered}
          onRowClick={(o) => setSelectedRecordId(o.id)}
          columns={[
            { key: 'nombre', header: 'Oportunidad', render: (o) => <span className="font-semibold text-slate-900">{o.nombre}</span> },
            { key: 'empresa', header: 'Empresa', render: (o) => getEmpresaName(o.empresaId) },
            {
              key: 'etapa',
              header: 'Etapa',
              render: (o) => {
                const stg = pipelineStages.find((s) => s.id === o.etapaId);
                return <Badge tone={stageTone(stg?.color)}>{stg?.name}</Badge>;
              },
            },
            { key: 'monto', header: 'Monto', align: 'right', render: (o) => <span className="font-mono tabular-nums font-semibold">{formatMoney(o.monto, o.moneda)}</span> },
            { key: 'probabilidad', header: 'Prob.', align: 'right', render: (o) => `${o.probabilidad}%` },
            { key: 'fechaCierreEstimada', header: 'Cierre est.', render: (o) => formatDateCL(o.fechaCierreEstimada) },
            { key: 'responsableId', header: 'Responsable', render: (o) => getUser(o.responsableId)?.name || '—' },
          ]}
          rowActions={(o) => [
            { label: 'Ver detalle', onClick: () => setSelectedRecordId(o.id) },
            { label: 'Editar', icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => openEdit(o) },
            {
              label: 'Archivar',
              icon: <Archive className="w-3.5 h-3.5" />,
              onClick: () => {
                setOportunidades((prev) => prev.map((x) => (x.id === o.id ? { ...x, archivada: true } : x)));
                notify('Oportunidad archivada', o.nombre, 'info');
              },
            },
            { label: 'Eliminar', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, dividerBefore: true, onClick: () => setDeleteTarget(o) },
          ]}
        />
      ) : viewMode === 'lista' ? (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {filtered.map((o) => {
            const stg = pipelineStages.find((s) => s.id === o.etapaId);
            return (
              <div
                key={o.id}
                onClick={() => setSelectedRecordId(o.id)}
                className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">{o.nombre}</span>
                    <Badge tone={stageTone(stg?.color)}>{stg?.name}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {getEmpresaName(o.empresaId)} · {getContactoName(o.contactoId)} · Cierre {formatDateCL(o.fechaCierreEstimada)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono tabular-nums font-bold text-slate-900">{formatMoney(o.monto, o.moneda)}</div>
                  <div className="text-xs text-slate-500 font-mono">{o.probabilidad}% prob.</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teamMembers.slice(0, 4).map((u) => {
            const userOpps = filtered.filter((o) => o.responsableId === u.id);
            const total = userOpps.reduce((a, o) => a + o.monto, 0);
            return (
              <Card
                key={u.id}
                title={u.name}
                subtitle={`${u.role} · ${userOpps.length} oportunidades`}
                actions={<span className="text-sm font-mono font-bold text-blue-700">{formatMoney(total)}</span>}
              >
                {userOpps.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin oportunidades en el filtro actual.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {userOpps.map((o) => {
                      const stg = pipelineStages.find((s) => s.id === o.etapaId);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => setSelectedRecordId(o.id)}
                          className="w-full py-2.5 flex items-center justify-between gap-2 text-left hover:bg-slate-50 px-1 rounded-lg cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate">{o.nombre}</div>
                            <div className="text-[11px] text-slate-500">{getEmpresaName(o.empresaId)} · {stg?.name}</div>
                          </div>
                          <span className="text-xs font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                            {formatMoney(o.monto, o.moneda)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Opportunity Form Drawer */}
      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? `Editar: ${formData.nombre}` : 'Nueva oportunidad'}
        subtitle="Gestión de negocio en pipeline comercial"
        width="xl"
      >
        <form id="opp-form" onSubmit={handleSaveForm} className="space-y-6">
          <FormSection title="Información del negocio">
            <div className="md:col-span-2">
              <Input label="Nombre de oportunidad" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
            </div>
            <Select label="Empresa" value={formData.empresaId} onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })} options={empresas.map((em) => ({ value: em.id, label: em.nombreComercial }))} />
            <Select label="Contacto" value={formData.contactoId} onChange={(e) => setFormData({ ...formData, contactoId: e.target.value })} options={contactos.map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))} />
            <Select
              label="Etapa"
              value={formData.etapaId}
              onChange={(e) => {
                const stg = pipelineStages.find((s) => s.id === e.target.value);
                setFormData({ ...formData, etapaId: e.target.value, probabilidad: stg?.probability ?? formData.probabilidad });
              }}
              options={sortedStages.map((s) => ({ value: s.id, label: `${s.name} (${s.probability}%)` }))}
            />
            <CurrencyInput label="Monto estimado" value={formData.monto} currency={formData.moneda} onChange={(m) => setFormData({ ...formData, monto: m })} onCurrencyChange={(c: CurrencyCode) => setFormData({ ...formData, moneda: c })} />
            <Input label="Probabilidad (%)" type="number" min={0} max={100} value={formData.probabilidad} onChange={(e) => setFormData({ ...formData, probabilidad: Number(e.target.value) })} />
            <DatePicker label="Fecha de cierre estimada" value={formData.fechaCierreEstimada} onChange={(v) => setFormData({ ...formData, fechaCierreEstimada: v })} />
            <Select label="Responsable" value={formData.responsableId} onChange={(e) => setFormData({ ...formData, responsableId: e.target.value })} options={teamMembers.map((u) => ({ value: u.id, label: u.name }))} />
            <Select label="Prioridad" value={formData.prioridad} onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as PriorityLevel })} options={['Baja', 'Media', 'Alta', 'Urgente'].map((p) => ({ value: p, label: p }))} />
            <Select label="Tipo de oportunidad" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as Oportunidad['tipo'] })} options={['Nuevo negocio', 'Expansión / Upsell', 'Renovación', 'Licitación'].map((t) => ({ value: t, label: t }))} />
            <Input label="Competencia" value={formData.competencia || ''} onChange={(e) => setFormData({ ...formData, competencia: e.target.value })} placeholder="Ej: Salesforce, HubSpot" />
          </FormSection>

          <FormSection title="Productos asociados y notas">
            <div className="md:col-span-2">
              <MultiSelect
                label="Productos / Servicios asociados"
                options={productos.map((p) => p.nombre)}
                selected={productos.filter((p) => formData.productosIds.includes(p.id)).map((p) => p.nombre)}
                onChange={(names) =>
                  setFormData({
                    ...formData,
                    productosIds: productos.filter((p) => names.includes(p.nombre)).map((p) => p.id),
                  })
                }
              />
            </div>
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
          <Button type="submit" form="opp-form">{editingId ? 'Guardar cambios' : 'Crear oportunidad'}</Button>
        </div>
      </Drawer>

      {/* Loss Reason Modal */}
      <Modal
        open={Boolean(lossModalOpp)}
        onClose={() => setLossModalOpp(null)}
        title="Registrar motivo de pérdida"
        subtitle={lossModalOpp?.nombre}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setLossModalOpp(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmLoss}>Confirmar pérdida</Button>
          </>
        }
      >
        <Select
          label="Motivo de pérdida"
          value={lossReason}
          onChange={(e) => setLossReason(e.target.value)}
          options={catalogs.motivosPerdida.map((m) => ({ value: m, label: m }))}
        />
      </Modal>

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
                setOportunidades((prev) => prev.filter((x) => x.id !== deleteTarget.id));
                if (selectedRecordId === deleteTarget.id) setSelectedRecordId(null);
                notify('Oportunidad eliminada', deleteTarget.nombre, 'warning');
                setDeleteTarget(null);
              }}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">¿Eliminar la oportunidad <strong>{deleteTarget?.nombre}</strong>?</p>
      </Modal>
    </div>
  );
};
