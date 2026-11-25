import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Building2,
  Columns3,
  Copy,
  Download,
  Edit3,
  FileSpreadsheet,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { Empresa } from '../types/crm';
import {
  Avatar,
  Badge,
  BadgeTone,
  Button,
  Card,
  EmptyState,
} from '../components/ds/primitives';
import {
  CurrencyInput,
  FormSection,
  Input,
  MultiSelect,
  RUTInput,
  SearchInput,
  Select,
  Textarea,
} from '../components/ds/forms';
import {
  ColumnDef,
  Drawer,
  Modal,
  Pagination,
  Table,
  Tabs,
  Timeline,
} from '../components/ds/data';
import {
  REGIONES_CHILE,
  formatDateCL,
  getComunasByRegionAndProvincia,
  getProvinciasByRegion,
} from '../data/chileGeo';

const ALL_EMPRESA_COLUMNS = [
  { key: 'nombreComercial', label: 'Nombre empresa' },
  { key: 'rut', label: 'RUT' },
  { key: 'tipoEntidad', label: 'Tipo' },
  { key: 'industria', label: 'Industria' },
  { key: 'responsableId', label: 'Responsable' },
  { key: 'contactoPrincipal', label: 'Contacto principal' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Email' },
  { key: 'region', label: 'Región' },
  { key: 'comuna', label: 'Comuna' },
  { key: 'estado', label: 'Estado' },
  { key: 'fechaCreacion', label: 'Creación' },
  { key: 'ultimaActividad', label: 'Últ. actividad' },
  { key: 'potencialCLP', label: 'Valor asociado' },
];

const EMPTY_EMPRESA_FORM = (): Omit<Empresa, 'id' | 'fechaCreacion' | 'ultimaActividad'> => ({
  razonSocial: '',
  nombreComercial: '',
  rut: '',
  tipoEntidad: 'Prospecto',
  industria: 'Tecnología y Software',
  tamano: 'Mediana',
  sitioWeb: '',
  estado: 'En prospección',
  origen: 'Sitio Web',
  email: '',
  telefono: '',
  telefonoAlt: '',
  pais: 'Chile',
  region: 'Región Metropolitana de Santiago',
  provincia: 'Santiago',
  comuna: 'Las Condes',
  direccion: '',
  numero: '',
  oficina: '',
  codigoPostal: '',
  responsableId: 'usr-1',
  equipo: 'Grandes Cuentas',
  segmento: 'Mid-Market',
  clasificacion: 'B',
  potencialCLP: 15000000,
  condicionesComerciales: 'Pago a 30 días fecha factura.',
  descripcion: '',
  notas: '',
  etiquetas: [],
  customFields: {},
});

export const CompaniesModule: React.FC = () => {
  const {
    empresas,
    setEmpresas,
    contactos,
    oportunidades,
    cotizaciones,
    pedidos,
    ventas,
    actividades,
    documentos,
    casosPostventa,
    teamMembers,
    catalogs,
    customFields,
    selectedRecordId,
    setSelectedRecordId,
    navigateTo,
    openQuickCreate,
    formatMoney,
    notify,
    addAuditLog,
    getUser,
    sheetTabs,
  } = useCRM();

  const [query, setQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [industriaFilter, setIndustriaFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [visibleCols, setVisibleCols] = useState<string[]>([
    'nombreComercial',
    'rut',
    'tipoEntidad',
    'industria',
    'responsableId',
    'contactoPrincipal',
    'comuna',
    'estado',
    'potencialCLP',
  ]);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string>('potencialCLP');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_EMPRESA_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Empresa | null>(null);
  const [detailTab, setDetailTab] = useState('resumen');

  const empresaCustomFields = customFields.filter((f) => f.module === 'empresas' && f.visible);

  const selectedEmpresa = useMemo(
    () => empresas.find((e) => e.id === selectedRecordId) || null,
    [empresas, selectedRecordId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return empresas
      .filter((e) => {
        if (q) {
          const hit =
            e.nombreComercial.toLowerCase().includes(q) ||
            e.razonSocial.toLowerCase().includes(q) ||
            e.rut.toLowerCase().includes(q) ||
            e.comuna.toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (estadoFilter !== 'all' && e.estado !== estadoFilter) return false;
        if (industriaFilter !== 'all' && e.industria !== industriaFilter) return false;
        if (regionFilter !== 'all' && e.region !== regionFilter) return false;
        if (ownerFilter !== 'all' && e.responsableId !== ownerFilter) return false;
        if (tipoFilter !== 'all' && e.tipoEntidad !== tipoFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const va = (a as unknown as Record<string, unknown>)[sortKey];
        const vb = (b as unknown as Record<string, unknown>)[sortKey];
        if (typeof va === 'number' && typeof vb === 'number') {
          return sortDir === 'asc' ? va - vb : vb - va;
        }
        return sortDir === 'asc'
          ? String(va ?? '').localeCompare(String(vb ?? ''))
          : String(vb ?? '').localeCompare(String(va ?? ''));
      });
  }, [empresas, query, estadoFilter, industriaFilter, regionFilter, ownerFilter, tipoFilter, sortKey, sortDir]);

  const pageSize = 8;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_EMPRESA_FORM());
    setFormOpen(true);
  };

  const openEdit = (emp: Empresa) => {
    setEditingId(emp.id);
    const { id: _id, fechaCreacion: _fc, ultimaActividad: _ua, ...rest } = emp;
    setFormData(rest);
    setFormOpen(true);
  };

  const handleDuplicate = (emp: Empresa) => {
    const copy: Empresa = {
      ...emp,
      id: `emp-${Date.now()}`,
      nombreComercial: `${emp.nombreComercial} (Copia)`,
      razonSocial: `${emp.razonSocial} (Copia)`,
      fechaCreacion: '2026-11-25',
      ultimaActividad: '2026-11-25',
    };
    setEmpresas((prev) => [copy, ...prev]);
    addAuditLog('Empresas', 'Creación', `Duplicó empresa ${emp.nombreComercial}`);
    notify('Empresa duplicada', copy.nombreComercial);
  };

  const handleArchive = (emp: Empresa) => {
    setEmpresas((prev) =>
      prev.map((e) => (e.id === emp.id ? { ...e, estado: 'Archivada' } : e))
    );
    notify('Empresa archivada', emp.nombreComercial, 'info');
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setEmpresas((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    addAuditLog('Empresas', 'Eliminación', `Eliminó empresa ${deleteTarget.nombreComercial}`);
    notify('Empresa eliminada', deleteTarget.nombreComercial, 'warning');
    if (selectedRecordId === deleteTarget.id) {
      setSelectedRecordId(null);
    }
    setDeleteTarget(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const today = '2026-11-25';
    if (editingId) {
      setEmpresas((prev) =>
        prev.map((emp) =>
          emp.id === editingId ? { ...emp, ...formData, ultimaActividad: today } : emp
        )
      );
      addAuditLog('Empresas', 'Edición', `Actualizó ficha de ${formData.nombreComercial}`);
      notify('Empresa actualizada', formData.nombreComercial);
    } else {
      const newEmp: Empresa = {
        ...formData,
        id: `emp-${Date.now()}`,
        fechaCreacion: today,
        ultimaActividad: today,
      };
      setEmpresas((prev) => [newEmp, ...prev]);
      addAuditLog('Empresas', 'Creación', `Creó empresa ${formData.nombreComercial}`);
      notify('Empresa creada', formData.nombreComercial);
    }
    setFormOpen(false);
  };

  const estadoTone = (est: Empresa['estado']): BadgeTone => {
    if (est === 'Activa') return 'success';
    if (est === 'En prospección') return 'blue';
    if (est === 'En pausa') return 'warning';
    if (est === 'Inactiva') return 'danger';
    return 'neutral';
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const tableColumns: ColumnDef<Empresa>[] = ALL_EMPRESA_COLUMNS.filter((c) =>
    visibleCols.includes(c.key)
  ).map((c) => {
    if (c.key === 'nombreComercial') {
      return {
        key: c.key,
        header: c.label,
        sortable: true,
        render: (e) => (
          <div>
            <div className="font-semibold text-slate-900">{e.nombreComercial}</div>
            <div className="text-xs text-slate-500 truncate max-w-[220px]">{e.razonSocial}</div>
          </div>
        ),
      };
    }
    if (c.key === 'rut') {
      return {
        key: c.key,
        header: c.label,
        sortable: true,
        render: (e) => <span className="font-mono tabular-nums text-xs">{e.rut}</span>,
      };
    }
    if (c.key === 'responsableId') {
      return {
        key: c.key,
        header: c.label,
        render: (e) => {
          const u = getUser(e.responsableId);
          return u ? (
            <div className="flex items-center gap-2">
              <Avatar src={u.avatar} name={u.name} initials={u.initials} size="xs" />
              <span className="text-xs text-slate-700 truncate max-w-[120px]">{u.name}</span>
            </div>
          ) : (
            '—'
          );
        },
      };
    }
    if (c.key === 'contactoPrincipal') {
      return {
        key: c.key,
        header: c.label,
        render: (e) => {
          const main = contactos.find((x) => x.empresaId === e.id && x.esPrincipal) || contactos.find((x) => x.empresaId === e.id);
          return main ? (
            <span className="text-xs text-slate-700">{main.nombre} {main.apellido}</span>
          ) : (
            <span className="text-xs text-slate-400">Sin contacto</span>
          );
        },
      };
    }
    if (c.key === 'estado') {
      return {
        key: c.key,
        header: c.label,
        sortable: true,
        render: (e) => <Badge tone={estadoTone(e.estado)}>{e.estado}</Badge>,
      };
    }
    if (c.key === 'potencialCLP') {
      return {
        key: c.key,
        header: c.label,
        align: 'right',
        sortable: true,
        render: (e) => (
          <span className="font-mono tabular-nums font-semibold text-slate-900">
            {formatMoney(e.potencialCLP)}
          </span>
        ),
      };
    }
    if (c.key === 'fechaCreacion' || c.key === 'ultimaActividad') {
      const dateField = c.key;
      return {
        key: c.key,
        header: c.label,
        sortable: true,
        render: (e) => (
          <span className="font-mono tabular-nums text-xs text-slate-500">
            {formatDateCL(dateField === 'fechaCreacion' ? e.fechaCreacion : e.ultimaActividad)}
          </span>
        ),
      };
    }
    return {
      key: c.key,
      header: c.label,
      sortable: true,
      render: (e) => <span className="text-xs text-slate-700">{String((e as unknown as Record<string, unknown>)[c.key] || '—')}</span>,
    };
  });

  // DETAIL VIEW OF SELECTED EMPRESA
  if (selectedEmpresa) {
    const empContactos = contactos.filter((c) => c.empresaId === selectedEmpresa.id);
    const empOpps = oportunidades.filter((o) => o.empresaId === selectedEmpresa.id);
    const empQuotes = cotizaciones.filter((q) => q.empresaId === selectedEmpresa.id);
    const empOrders = pedidos.filter((p) => p.empresaId === selectedEmpresa.id);
    const empSales = ventas.filter((v) => v.empresaId === selectedEmpresa.id);
    const empActs = actividades.filter((a) => a.empresaId === selectedEmpresa.id);
    const empDocs = documentos.filter((d) => d.empresaId === selectedEmpresa.id);
    const empCases = casosPostventa.filter((c) => c.empresaId === selectedEmpresa.id);
    const owner = getUser(selectedEmpresa.responsableId);

    const visibleTabConfig = sheetTabs.find((s) => s.module === 'empresas')?.tabs || [];
    const tabCounts: Record<string, number | undefined> = {
      contactos: empContactos.length,
      oportunidades: empOpps.length,
      cotizaciones: empQuotes.length,
      pedidos: empOrders.length,
      ventas: empSales.length,
      actividades: empActs.length,
      documentos: empDocs.length,
      postventa: empCases.length,
    };

    const tabsList = visibleTabConfig
      .filter((t) => t.visible)
      .map((t) => ({ id: t.id, label: t.label, count: tabCounts[t.id] }));

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => setSelectedRecordId(null)}
          >
            Volver a Empresas
          </Button>
        </div>

        {/* Company Detail Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold text-slate-900">{selectedEmpresa.nombreComercial}</h1>
                  <Badge tone={estadoTone(selectedEmpresa.estado)}>{selectedEmpresa.estado}</Badge>
                  <Badge tone="neutral">{selectedEmpresa.tipoEntidad}</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedEmpresa.razonSocial} · RUT{' '}
                  <span className="font-mono tabular-nums font-medium text-slate-700">{selectedEmpresa.rut}</span>{' '}
                  · {selectedEmpresa.industria} · {selectedEmpresa.comuna}, {selectedEmpresa.region}
                </p>
                {owner && (
                  <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
                    <Avatar src={owner.avatar} name={owner.name} initials={owner.initials} size="xs" />
                    <span>Responsable: <strong className="text-slate-900">{owner.name}</strong> ({selectedEmpresa.equipo})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" leftIcon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('contacto', { empresaId: selectedEmpresa.id })}>
                Crear contacto
              </Button>
              <Button size="sm" variant="outline" leftIcon={<TrendingUp className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('oportunidad', { empresaId: selectedEmpresa.id })}>
                Crear oportunidad
              </Button>
              <Button size="sm" variant="outline" leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('cotizacion', { empresaId: selectedEmpresa.id })}>
                Crear cotización
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('actividad', { empresaId: selectedEmpresa.id })}>
                Actividad
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => openEdit(selectedEmpresa)}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={() => handleDuplicate(selectedEmpresa)}>
                Duplicar
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<Archive className="w-3.5 h-3.5" />} onClick={() => handleArchive(selectedEmpresa)}>
                Archivar
              </Button>
              <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteTarget(selectedEmpresa)}>
                Eliminar
              </Button>
            </div>
          </div>

          <Tabs tabs={tabsList} activeTab={detailTab} onChange={setDetailTab} />
        </div>

        {/* Detail Tab Body */}
        {detailTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 space-y-5">
              <Card title="Información general y comercial">
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Segmento / Clasificación</dt>
                    <dd className="font-medium text-slate-900">{selectedEmpresa.segmento} · Clase {selectedEmpresa.clasificacion}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Tamaño</dt>
                    <dd className="font-medium text-slate-900">{selectedEmpresa.tamano}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Potencial anual</dt>
                    <dd className="font-mono tabular-nums font-semibold text-blue-700">{formatMoney(selectedEmpresa.potencialCLP)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Condiciones</dt>
                    <dd className="text-right text-slate-800 max-w-[200px]">{selectedEmpresa.condicionesComerciales}</dd>
                  </div>
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedEmpresa.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedEmpresa.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {selectedEmpresa.direccion} {selectedEmpresa.numero}
                        {selectedEmpresa.oficina ? `, ${selectedEmpresa.oficina}` : ''}, {selectedEmpresa.comuna}
                      </span>
                    </div>
                    {selectedEmpresa.sitioWeb && (
                      <div className="flex items-center gap-2 text-blue-700">
                        <Globe className="w-3.5 h-3.5" />
                        <span>{selectedEmpresa.sitioWeb}</span>
                      </div>
                    )}
                  </div>
                </dl>
              </Card>

              <Card title="Notas y descripción">
                <p className="text-xs text-slate-600 leading-relaxed">{selectedEmpresa.descripcion || 'Sin descripción.'}</p>
                {selectedEmpresa.notas && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-700">
                    <strong className="block text-slate-900 mb-1">Notas internas:</strong>
                    {selectedEmpresa.notas}
                  </div>
                )}
              </Card>
            </div>

            <div className="lg:col-span-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card title="Contactos principales" actions={<Button size="xs" variant="outline" onClick={() => setDetailTab('contactos')}>Ver todos</Button>}>
                  {empContactos.length === 0 ? (
                    <p className="text-xs text-slate-500">Sin contactos asociados.</p>
                  ) : (
                    <div className="space-y-3">
                      {empContactos.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => navigateTo('contactos', c.id)}
                          className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{c.nombre} {c.apellido}</div>
                            <div className="text-[11px] text-slate-500">{c.cargo}</div>
                          </div>
                          {c.esPrincipal && <Badge tone="blue">Principal</Badge>}
                        </button>
                      ))}
                    </div>
                  )}
                </Card>

                <Card title="Oportunidades activas" actions={<Button size="xs" variant="outline" onClick={() => setDetailTab('oportunidades')}>Ver todas</Button>}>
                  {empOpps.length === 0 ? (
                    <p className="text-xs text-slate-500">Sin oportunidades registradas.</p>
                  ) : (
                    <div className="space-y-3">
                      {empOpps.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => navigateTo('oportunidades', o.id)}
                          className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-semibold text-slate-900 truncate">{o.nombre}</div>
                            <div className="text-[11px] text-slate-500">Cierre: {formatDateCL(o.fechaCierreEstimada)}</div>
                          </div>
                          <span className="font-mono tabular-nums text-xs font-semibold text-blue-700 shrink-0">
                            {formatMoney(o.monto, o.moneda)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <Card title="Historial y actividad reciente">
                <Timeline
                  items={empActs.map((a) => ({
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

        {detailTab === 'contactos' && (
          <Table
            data={empContactos}
            onRowClick={(c) => navigateTo('contactos', c.id)}
            columns={[
              { key: 'nombre', header: 'Nombre', render: (c) => <span className="font-medium text-slate-900">{c.nombre} {c.apellido}</span> },
              { key: 'cargo', header: 'Cargo', render: (c) => c.cargo },
              { key: 'email', header: 'Email', render: (c) => c.email },
              { key: 'telefono', header: 'Teléfono', render: (c) => <span className="font-mono text-xs">{c.telefono}</span> },
              { key: 'relacion', header: 'Relación', render: (c) => <Badge tone="neutral">{c.relacion}</Badge> },
            ]}
          />
        )}

        {detailTab === 'oportunidades' && (
          <Table
            data={empOpps}
            onRowClick={(o) => navigateTo('oportunidades', o.id)}
            columns={[
              { key: 'nombre', header: 'Oportunidad', render: (o) => <span className="font-medium text-slate-900">{o.nombre}</span> },
              { key: 'monto', header: 'Monto', align: 'right', render: (o) => <span className="font-mono tabular-nums font-semibold">{formatMoney(o.monto, o.moneda)}</span> },
              { key: 'probabilidad', header: 'Prob.', align: 'right', render: (o) => `${o.probabilidad}%` },
              { key: 'fechaCierreEstimada', header: 'Cierre est.', render: (o) => formatDateCL(o.fechaCierreEstimada) },
            ]}
          />
        )}

        {detailTab === 'cotizaciones' && (
          <Table
            data={empQuotes}
            onRowClick={(q) => navigateTo('cotizaciones', q.id)}
            columns={[
              { key: 'folio', header: 'Folio', render: (q) => <span className="font-mono text-blue-700 font-medium">{q.folio}</span> },
              { key: 'nombre', header: 'Nombre', render: (q) => q.nombre },
              { key: 'fecha', header: 'Fecha', render: (q) => formatDateCL(q.fecha) },
              { key: 'estado', header: 'Estado', render: (q) => <Badge tone={q.estado === 'Aceptada' ? 'success' : 'blue'}>{q.estado}</Badge> },
            ]}
          />
        )}

        {detailTab === 'pedidos' && (
          <Table
            data={empOrders}
            onRowClick={(p) => navigateTo('pedidos', p.id)}
            columns={[
              { key: 'folio', header: 'Folio', render: (p) => <span className="font-mono text-blue-700 font-medium">{p.folio}</span> },
              { key: 'fecha', header: 'Fecha', render: (p) => formatDateCL(p.fecha) },
              { key: 'estado', header: 'Estado', render: (p) => <Badge tone="blue">{p.estado}</Badge> },
            ]}
          />
        )}

        {detailTab === 'ventas' && (
          <Table
            data={empSales}
            onRowClick={(v) => navigateTo('ventas', v.id)}
            columns={[
              { key: 'folio', header: 'Folio', render: (v) => <span className="font-mono text-blue-700 font-medium">{v.folio}</span> },
              { key: 'documentoTributario', header: 'Documento', render: (v) => v.documentoTributario },
              { key: 'monto', header: 'Monto', align: 'right', render: (v) => <span className="font-mono tabular-nums font-semibold">{formatMoney(v.monto, v.moneda)}</span> },
              { key: 'estado', header: 'Estado', render: (v) => <Badge tone="success">{v.estado}</Badge> },
            ]}
          />
        )}

        {detailTab === 'actividades' && (
          <Card title="Actividades asociadas">
            <Timeline
              items={empActs.map((a) => ({
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

        {detailTab === 'documentos' && (
          <Table
            data={empDocs}
            onRowClick={(d) => navigateTo('documentos', d.id)}
            columns={[
              { key: 'nombre', header: 'Documento', render: (d) => <span className="font-medium text-slate-900">{d.nombre}</span> },
              { key: 'tipo', header: 'Tipo', render: (d) => d.tipo },
              { key: 'tamano', header: 'Tamaño', render: (d) => <span className="font-mono text-xs">{d.tamano}</span> },
              { key: 'estado', header: 'Estado', render: (d) => <Badge tone="neutral">{d.estado}</Badge> },
            ]}
          />
        )}

        {detailTab === 'postventa' && (
          <Table
            data={empCases}
            onRowClick={(c) => navigateTo('postventa', c.id)}
            columns={[
              { key: 'folio', header: 'Folio', render: (c) => <span className="font-mono text-blue-700 font-medium">{c.folio}</span> },
              { key: 'asunto', header: 'Asunto', render: (c) => c.asunto },
              { key: 'prioridad', header: 'Prioridad', render: (c) => <Badge tone={c.prioridad === 'Alta' ? 'warning' : 'neutral'}>{c.prioridad}</Badge> },
              { key: 'estado', header: 'Estado', render: (c) => <Badge tone="blue">{c.estado}</Badge> },
            ]}
          />
        )}

        {detailTab === 'historial' && (
          <Card title="Historial de auditoría de cuenta">
            <Timeline
              items={[
                { id: 'h1', title: 'Última interacción registrada', date: formatDateCL(selectedEmpresa.ultimaActividad), type: 'Sistema' },
                { id: 'h2', title: 'Cuenta creada en illus Ventas', date: formatDateCL(selectedEmpresa.fechaCreacion), type: 'Creación', actor: owner?.name },
              ]}
            />
          </Card>
        )}
      </div>
    );
  }

  // LIST VIEW
  const comunasForm = getComunasByRegionAndProvincia(formData.region, formData.provincia);
  const provinciasForm = getProvinciasByRegion(formData.region);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Empresas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestión centralizada de cuentas empresariales, clientes, prospectos y RUT comerciales.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Columns3 className="w-3.5 h-3.5" />}
              onClick={() => setColPickerOpen((o) => !o)}
            >
              Columnas
            </Button>
            {colPickerOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-40 space-y-1.5">
                <div className="text-xs font-semibold text-slate-900 pb-1 border-b border-slate-100">
                  Columnas visibles
                </div>
                {ALL_EMPRESA_COLUMNS.map((c) => {
                  const checked = visibleCols.includes(c.key);
                  return (
                    <label key={c.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setVisibleCols((prev) =>
                            checked ? prev.filter((x) => x !== c.key) : [...prev, c.key]
                          )
                        }
                        className="rounded border-slate-300 text-blue-700"
                      />
                      <span>{c.label}</span>
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
            onClick={() => {
              addAuditLog('Empresas', 'Exportación', `Exportó ${filtered.length} empresas a CSV`);
              notify('Exportación generada', `${filtered.length} empresas exportadas en formato CSV (UTF-8).`);
            }}
          >
            Exportar
          </Button>
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>
            Nueva empresa
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end">
        <div className="lg:col-span-2">
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Buscar empresa, razón social, RUT o comuna..."
          />
        </div>
        <Select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los estados' },
            { value: 'Activa', label: 'Activa' },
            { value: 'En prospección', label: 'En prospección' },
            { value: 'En pausa', label: 'En pausa' },
            { value: 'Inactiva', label: 'Inactiva' },
            { value: 'Archivada', label: 'Archivada' },
          ]}
        />
        <Select
          value={industriaFilter}
          onChange={(e) => setIndustriaFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todas las industrias' },
            ...catalogs.industrias.map((i) => ({ value: i, label: i })),
          ]}
        />
        <Select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todas las regiones' },
            ...REGIONES_CHILE.map((r) => ({ value: r, label: r })),
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

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-blue-900">
            {selectedIds.length} empresas seleccionadas
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setEmpresas((prev) =>
                  prev.map((e) => (selectedIds.includes(e.id) ? { ...e, estado: 'Archivada' } : e))
                );
                notify('Acción masiva aplicada', `${selectedIds.length} empresas archivadas.`, 'info');
                setSelectedIds([]);
              }}
            >
              Archivar selección
            </Button>
            <Button
              size="xs"
              variant="danger"
              onClick={() => {
                setEmpresas((prev) => prev.filter((e) => !selectedIds.includes(e.id)));
                notify('Empresas eliminadas', `${selectedIds.length} registros eliminados.`, 'warning');
                setSelectedIds([]);
              }}
            >
              Eliminar selección
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Table & Mobile Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No hay empresas que coincidan"
          description="Ajusta los filtros de búsqueda o registra una nueva empresa."
          actionLabel="Nueva empresa"
          onAction={openCreate}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table
              data={paginated}
              columns={tableColumns}
              selectedIds={selectedIds}
              onToggleSelect={(id) =>
                setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
              }
              onToggleSelectAll={setSelectedIds}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              onRowClick={(e) => setSelectedRecordId(e.id)}
              rowActions={(emp) => [
                { label: 'Ver ficha completa', onClick: () => setSelectedRecordId(emp.id) },
                { label: 'Editar empresa', icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => openEdit(emp) },
                { label: 'Duplicar', icon: <Copy className="w-3.5 h-3.5" />, onClick: () => handleDuplicate(emp) },
                { label: 'Archivar', icon: <Archive className="w-3.5 h-3.5" />, onClick: () => handleArchive(emp) },
                { label: 'Eliminar', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, dividerBefore: true, onClick: () => setDeleteTarget(emp) },
              ]}
            />
          </div>

          {/* Mobile Responsive Card List */}
          <div className="md:hidden space-y-3">
            {paginated.map((emp) => (
              <div
                key={emp.id}
                onClick={() => setSelectedRecordId(emp.id)}
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{emp.nombreComercial}</div>
                    <div className="text-xs font-mono text-slate-500">{emp.rut} · {emp.comuna}</div>
                  </div>
                  <Badge tone={estadoTone(emp.estado)}>{emp.estado}</Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">{emp.industria}</span>
                  <span className="font-mono tabular-nums font-semibold text-blue-700">
                    {formatMoney(emp.potencialCLP)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      {/* 5-Section Create / Edit Drawer */}
      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? `Editar empresa: ${formData.nombreComercial}` : 'Nueva empresa'}
        subtitle="Formulario completo organizado por secciones (Localización Chile)"
        width="xl"
      >
        <form id="empresa-form" onSubmit={handleSaveForm} className="space-y-6">
          <FormSection title="1. Información general">
            <Input label="Razón social" required value={formData.razonSocial} onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })} placeholder="Ej: Ingeniería Austral SpA" />
            <Input label="Nombre comercial" required value={formData.nombreComercial} onChange={(e) => setFormData({ ...formData, nombreComercial: e.target.value })} placeholder="Ej: Ingeniería Austral" />
            <RUTInput value={formData.rut} onChange={(val) => setFormData({ ...formData, rut: val })} required />
            <Select label="Tipo de entidad" value={formData.tipoEntidad} onChange={(e) => setFormData({ ...formData, tipoEntidad: e.target.value as Empresa['tipoEntidad'] })} options={catalogs.tiposEmpresa.map((t) => ({ value: t, label: t }))} />
            <Select label="Industria" value={formData.industria} onChange={(e) => setFormData({ ...formData, industria: e.target.value })} options={catalogs.industrias.map((i) => ({ value: i, label: i }))} />
            <Select label="Tamaño de empresa" value={formData.tamano} onChange={(e) => setFormData({ ...formData, tamano: e.target.value as Empresa['tamano'] })} options={['Micro', 'Pequeña', 'Mediana', 'Gran Empresa', 'Corporativo'].map((t) => ({ value: t, label: t }))} />
            <Input label="Sitio web" value={formData.sitioWeb} onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })} placeholder="https://empresa.cl" />
            <Select label="Estado" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value as Empresa['estado'] })} options={['Activa', 'En prospección', 'En pausa', 'Inactiva', 'Archivada'].map((s) => ({ value: s, label: s }))} />
            <Select label="Origen" value={formData.origen} onChange={(e) => setFormData({ ...formData, origen: e.target.value })} options={catalogs.fuentes.map((o) => ({ value: o, label: o }))} />
          </FormSection>

          <FormSection title="2. Información de contacto">
            <Input label="Email corporativo" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <Input label="Teléfono" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="+56 2 2400 0000" />
            <Input label="Teléfono alternativo" value={formData.telefonoAlt || ''} onChange={(e) => setFormData({ ...formData, telefonoAlt: e.target.value })} placeholder="+56 9 ..." />
          </FormSection>

          <FormSection title="3. Dirección en Chile">
            <Input label="País" value={formData.pais} disabled />
            <Select
              label="Región"
              value={formData.region}
              onChange={(e) => {
                const nextReg = e.target.value;
                const nextProv = getProvinciasByRegion(nextReg)[0] || '';
                const nextCom = getComunasByRegionAndProvincia(nextReg, nextProv)[0] || '';
                setFormData({ ...formData, region: nextReg, provincia: nextProv, comuna: nextCom });
              }}
              options={REGIONES_CHILE.map((r) => ({ value: r, label: r }))}
            />
            <Select
              label="Provincia"
              value={formData.provincia}
              onChange={(e) => {
                const nextProv = e.target.value;
                const nextCom = getComunasByRegionAndProvincia(formData.region, nextProv)[0] || '';
                setFormData({ ...formData, provincia: nextProv, comuna: nextCom });
              }}
              options={provinciasForm.map((p) => ({ value: p, label: p }))}
            />
            <Select
              label="Comuna"
              value={formData.comuna}
              onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
              options={comunasForm.map((c) => ({ value: c, label: c }))}
            />
            <Input label="Dirección" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} placeholder="Av. Providencia" />
            <Input label="Número" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} placeholder="1234" />
            <Input label="Oficina / Depto" value={formData.oficina || ''} onChange={(e) => setFormData({ ...formData, oficina: e.target.value })} placeholder="Of. 802" />
            <Input label="Código postal" value={formData.codigoPostal || ''} onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })} />
          </FormSection>

          <FormSection title="4. Información comercial">
            <Select label="Responsable" value={formData.responsableId} onChange={(e) => setFormData({ ...formData, responsableId: e.target.value })} options={teamMembers.map((u) => ({ value: u.id, label: u.name }))} />
            <Select label="Equipo" value={formData.equipo} onChange={(e) => setFormData({ ...formData, equipo: e.target.value })} options={['Grandes Cuentas', 'Zona Norte & Minería', 'Zona Centro & Sur'].map((eq) => ({ value: eq, label: eq }))} />
            <Select label="Segmento" value={formData.segmento} onChange={(e) => setFormData({ ...formData, segmento: e.target.value as Empresa['segmento'] })} options={catalogs.segmentos.map((s) => ({ value: s, label: s }))} />
            <Select label="Clasificación" value={formData.clasificacion} onChange={(e) => setFormData({ ...formData, clasificacion: e.target.value as Empresa['clasificacion'] })} options={[{ value: 'A', label: 'Clase A (Estratégica)' }, { value: 'B', label: 'Clase B (Crecimiento)' }, { value: 'C', label: 'Clase C (Estándar)' }]} />
            <CurrencyInput label="Potencial anual estimado" value={formData.potencialCLP} currency="CLP" onChange={(v) => setFormData({ ...formData, potencialCLP: v })} />
            <Input label="Condiciones comerciales" value={formData.condicionesComerciales} onChange={(e) => setFormData({ ...formData, condicionesComerciales: e.target.value })} />
          </FormSection>

          <FormSection title="5. Información adicional y campos personalizados">
            <div className="md:col-span-2">
              <MultiSelect
                label="Etiquetas"
                options={catalogs.etiquetas.map((t) => t.name)}
                selected={formData.etiquetas}
                onChange={(etiquetas) => setFormData({ ...formData, etiquetas })}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Descripción" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Notas comerciales" value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
            </div>
            {empresaCustomFields.map((cf) => (
              <Input
                key={cf.id}
                label={cf.label}
                required={cf.required}
                hint={cf.helpText}
                value={String(formData.customFields?.[cf.key] ?? cf.defaultValue ?? '')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customFields: { ...(formData.customFields || {}), [cf.key]: e.target.value },
                  })
                }
              />
            ))}
          </FormSection>
        </form>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
          <Button type="submit" form="empresa-form">
            {editingId ? 'Guardar cambios' : 'Crear empresa'}
          </Button>
        </div>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar eliminación de empresa"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Eliminar definitivamente</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de eliminar a <strong className="text-slate-900">{deleteTarget?.nombreComercial}</strong> (RUT {deleteTarget?.rut})? Esta acción solo afecta al prototipo visual actual.
        </p>
      </Modal>
    </div>
  );
};
