import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Edit3,
  List,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { Actividad, EstadoActividad, PriorityLevel, TipoActividad } from '../types/crm';
import { Avatar, Badge, BadgeTone, Button, Card, EmptyState } from '../components/ds/primitives';
import { DatePicker, FormSection, Input, SearchInput, Select, Textarea } from '../components/ds/forms';
import { Drawer, Table, Tabs } from '../components/ds/data';
import { formatDateCL } from '../data/chileGeo';

type ActivityView = 'lista' | 'calendario' | 'agenda' | 'pendientes' | 'completadas' | 'responsable';
type CalendarGranularity = 'dia' | 'semana' | 'mes';

export const ActivitiesModule: React.FC<{ initialView?: ActivityView }> = ({ initialView = 'lista' }) => {
  const {
    actividades,
    setActividades,
    empresas,
    contactos,
    oportunidades,
    teamMembers,
    navigateTo,
    notify,
    getEmpresaName,
    getContactoName,
    getUser,
  } = useCRM();

  const [view, setView] = useState<ActivityView>(initialView);
  const [calMode, setCalMode] = useState<CalendarGranularity>('mes');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Actividad, 'id'>>({
    tipo: 'Llamada',
    titulo: '',
    descripcion: '',
    fecha: '2026-11-26',
    hora: '10:00',
    duracionMin: 30,
    responsableId: 'usr-1',
    empresaId: '',
    contactoId: '',
    oportunidadId: '',
    prioridad: 'Media',
    estado: 'Pendiente',
    recordatorio: '15 min antes',
    notas: '',
  });

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return actividades.filter((a) => {
      if (view === 'pendientes' && (a.estado === 'Completada' || a.estado === 'Cancelada')) return false;
      if (view === 'completadas' && a.estado !== 'Completada') return false;
      if (q && !a.titulo.toLowerCase().includes(q) && !a.descripcion.toLowerCase().includes(q)) return false;
      if (typeFilter !== 'all' && a.tipo !== typeFilter) return false;
      if (ownerFilter !== 'all' && a.responsableId !== ownerFilter) return false;
      return true;
    });
  }, [actividades, view, query, typeFilter, ownerFilter]);

  const openCreate = (presetType?: TipoActividad, presetDate?: string) => {
    setEditingId(null);
    setFormData({
      tipo: presetType || (initialView === 'pendientes' ? 'Tarea' : 'Llamada'),
      titulo: '',
      descripcion: '',
      fecha: presetDate || '2026-11-26',
      hora: '10:00',
      duracionMin: 30,
      responsableId: 'usr-1',
      empresaId: empresas[0]?.id || '',
      contactoId: '',
      oportunidadId: '',
      prioridad: 'Media',
      estado: 'Pendiente',
      recordatorio: '15 min antes',
      notas: '',
    });
    setFormOpen(true);
  };

  const openEdit = (a: Actividad) => {
    setEditingId(a.id);
    const { id: _id, ...rest } = a;
    setFormData(rest);
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setActividades((prev) => prev.map((a) => (a.id === editingId ? { ...formData, id: editingId } : a)));
      notify('Actividad actualizada', formData.titulo);
    } else {
      setActividades((prev) => [{ ...formData, id: `act-${Date.now()}` }, ...prev]);
      notify('Actividad registrada', formData.titulo);
    }
    setFormOpen(false);
  };

  const toggleComplete = (a: Actividad) => {
    const next: EstadoActividad = a.estado === 'Completada' ? 'Pendiente' : 'Completada';
    setActividades((prev) => prev.map((x) => (x.id === a.id ? { ...x, estado: next } : x)));
    notify(next === 'Completada' ? 'Actividad completada' : 'Actividad reabierta', a.titulo);
  };

  const statusTone = (est: EstadoActividad): BadgeTone => {
    if (est === 'Completada') return 'success';
    if (est === 'En progreso') return 'blue';
    if (est === 'Cancelada') return 'danger';
    return 'warning';
  };

  // November 2026 Calendar grid helper (Nov 1, 2026 is Sunday -> Lun-Dom grid)
  const novDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const weekDays = ['23', '24', '25', '26', '27', '28', '29'];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {view === 'calendario' ? 'Calendario comercial' : view === 'pendientes' ? 'Tareas y seguimientos' : 'Actividades'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Centralización de llamadas, reuniones, visitas, emails, recordatorios y tareas comerciales.
          </p>
        </div>
        <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => openCreate()}>
          Nueva actividad
        </Button>
      </div>

      {/* View Tabs */}
      <Tabs
        variant="segmented"
        activeTab={view}
        onChange={(id) => setView(id as ActivityView)}
        tabs={[
          { id: 'lista', label: 'Lista', icon: <List className="w-3.5 h-3.5" /> },
          { id: 'calendario', label: 'Calendario', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
          { id: 'agenda', label: 'Agenda', icon: <Clock className="w-3.5 h-3.5" /> },
          { id: 'pendientes', label: 'Pendientes', count: actividades.filter((a) => a.estado !== 'Completada' && a.estado !== 'Cancelada').length },
          { id: 'completadas', label: 'Completadas', count: actividades.filter((a) => a.estado === 'Completada').length },
          { id: 'responsable', label: 'Por responsable', icon: <Users className="w-3.5 h-3.5" /> },
        ]}
      />

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        <div className="sm:col-span-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar actividad, título o descripción..." />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los tipos' },
            ...['Tarea', 'Llamada', 'Reunión', 'Email', 'Visita', 'Seguimiento', 'Recordatorio'].map((t) => ({ value: t, label: t })),
          ]}
        />
        <Select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          options={[{ value: 'all', label: 'Todos los responsables' }, ...teamMembers.map((u) => ({ value: u.id, label: u.name }))]}
        />
      </div>

      {/* Calendar View */}
      {view === 'calendario' && (
        <Card
          title="Noviembre 2026 · Santiago (UTC-3)"
          actions={
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
              {(['dia', 'semana', 'mes'] as CalendarGranularity[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setCalMode(g)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                    calMode === g ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {g === 'dia' ? 'Día' : g === 'semana' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          }
        >
          {calMode === 'mes' && (
            <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
                <div key={d} className="bg-slate-50 px-2 py-2 text-[11px] font-semibold text-slate-500 text-center">
                  {d}
                </div>
              ))}
              {novDays.map((day) => {
                const iso = `2026-11-${String(day).padStart(2, '0')}`;
                const dayActs = filtered.filter((a) => a.fecha === iso);
                const isToday = day === 25;
                return (
                  <div
                    key={day}
                    onClick={() => openCreate('Reunión', iso)}
                    className={`min-h-[92px] bg-white p-1.5 hover:bg-slate-50/80 cursor-pointer flex flex-col gap-1 ${
                      isToday ? 'ring-1 ring-inset ring-blue-700 bg-blue-50/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono ${isToday ? 'font-bold text-blue-700' : 'text-slate-600'}`}>
                        {day}
                      </span>
                      {isToday && <span className="text-[10px] font-medium text-blue-700">Hoy</span>}
                    </div>
                    {dayActs.map((a) => (
                      <div
                        key={a.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(a);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate border ${
                          a.estado === 'Completada'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {a.hora} {a.titulo}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {calMode === 'semana' && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {weekDays.map((day) => {
                const iso = `2026-11-${day}`;
                const dayActs = filtered.filter((a) => a.fecha === iso);
                return (
                  <div key={day} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/40 min-h-[180px]">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="text-xs font-bold font-mono text-slate-800">{day}/11/2026</span>
                      <button type="button" onClick={() => openCreate('Llamada', iso)} className="text-blue-700 text-xs cursor-pointer">+ Agregar</button>
                    </div>
                    {dayActs.length === 0 ? (
                      <p className="text-[11px] text-slate-400">Libre</p>
                    ) : (
                      dayActs.map((a) => (
                        <div key={a.id} onClick={() => openEdit(a)} className="bg-white border border-slate-200 rounded-lg p-2 text-xs cursor-pointer hover:border-blue-300">
                          <div className="font-mono text-[10px] text-blue-700">{a.hora} · {a.tipo}</div>
                          <div className="font-semibold text-slate-900 mt-0.5">{a.titulo}</div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {calMode === 'dia' && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-600">Agenda del día 25/11/2026</div>
              {filtered
                .filter((a) => a.fecha === '2026-11-25')
                .map((a) => (
                  <div key={a.id} onClick={() => openEdit(a)} className="p-3.5 border border-slate-200 rounded-xl flex items-center justify-between hover:border-blue-300 cursor-pointer">
                    <div>
                      <div className="text-xs font-mono text-blue-700 font-semibold">{a.hora} ({a.duracionMin} min) · {a.tipo}</div>
                      <div className="text-sm font-semibold text-slate-900">{a.titulo}</div>
                      <div className="text-xs text-slate-500">{a.empresaId ? getEmpresaName(a.empresaId) : 'Interna'}</div>
                    </div>
                    <Badge tone={statusTone(a.estado)}>{a.estado}</Badge>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      {/* Agenda View */}
      {view === 'agenda' && (
        <Card title="Agenda cronológica de actividades">
          <div className="divide-y divide-slate-100">
            {filtered
              .slice()
              .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))
              .map((a) => (
                <div key={a.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleComplete(a)}
                      className={`mt-0.5 cursor-pointer ${a.estado === 'Completada' ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-600'}`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{a.titulo}</div>
                      <div className="text-xs text-slate-500">
                        <span className="font-mono">{formatDateCL(a.fecha)} {a.hora}</span> · {a.tipo} ·{' '}
                        {a.empresaId ? getEmpresaName(a.empresaId) : 'General'} · {getUser(a.responsableId)?.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={statusTone(a.estado)}>{a.estado}</Badge>
                    <Button size="xs" variant="outline" onClick={() => openEdit(a)}>Reprogramar / Editar</Button>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* By Owner View */}
      {view === 'responsable' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teamMembers.map((u) => {
            const list = filtered.filter((a) => a.responsableId === u.id);
            return (
              <Card key={u.id} title={u.name} subtitle={`${u.role} · ${list.length} actividades`}>
                {list.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin actividades asignadas.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {list.map((a) => (
                      <div key={a.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">{a.titulo}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{formatDateCL(a.fecha)} {a.hora} · {a.tipo}</div>
                        </div>
                        <Badge tone={statusTone(a.estado)}>{a.estado}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Table List / Pending / Completed */}
      {(view === 'lista' || view === 'pendientes' || view === 'completadas') && (
        filtered.length === 0 ? (
          <EmptyState title="Sin actividades" description="No hay actividades en esta selección." actionLabel="Nueva actividad" onAction={() => openCreate()} />
        ) : (
          <Table
            data={filtered}
            onRowClick={openEdit}
            columns={[
              {
                key: 'titulo',
                header: 'Actividad',
                render: (a) => (
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(a);
                      }}
                      className={`cursor-pointer ${a.estado === 'Completada' ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-600'}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div>
                      <div className={`font-medium ${a.estado === 'Completada' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{a.titulo}</div>
                      <div className="text-xs text-slate-500">{a.tipo} · {a.recordatorio}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'empresa',
                header: 'Registro asociado',
                render: (a) =>
                  a.empresaId ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo('empresas', a.empresaId!);
                      }}
                      className="text-xs text-blue-700 hover:underline cursor-pointer"
                    >
                      {getEmpresaName(a.empresaId)}
                      {a.contactoId ? ` · ${getContactoName(a.contactoId)}` : ''}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Interna</span>
                  ),
              },
              { key: 'fecha', header: 'Fecha y hora', render: (a) => <span className="font-mono text-xs">{formatDateCL(a.fecha)} {a.hora}</span> },
              {
                key: 'responsable',
                header: 'Responsable',
                render: (a) => {
                  const u = getUser(a.responsableId);
                  return u ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar src={u.avatar} name={u.name} initials={u.initials} size="xs" />
                      <span className="text-xs">{u.name}</span>
                    </div>
                  ) : '—';
                },
              },
              { key: 'prioridad', header: 'Prioridad', render: (a) => <Badge tone={a.prioridad === 'Urgente' ? 'danger' : a.prioridad === 'Alta' ? 'warning' : 'neutral'}>{a.prioridad}</Badge> },
              { key: 'estado', header: 'Estado', render: (a) => <Badge tone={statusTone(a.estado)}>{a.estado}</Badge> },
            ]}
            rowActions={(a) => [
              { label: a.estado === 'Completada' ? 'Marcar pendiente' : 'Marcar completada', onClick: () => toggleComplete(a) },
              { label: 'Editar / Reprogramar', icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => openEdit(a) },
              { label: 'Eliminar', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, dividerBefore: true, onClick: () => setActividades((prev) => prev.filter((x) => x.id !== a.id)) },
            ]}
          />
        )
      )}

      {/* Activity Form Drawer */}
      <Drawer open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? 'Editar actividad' : 'Nueva actividad comercial'} width="lg">
        <form id="act-form" onSubmit={handleSave} className="space-y-5">
          <FormSection title="Detalle de actividad">
            <Select label="Tipo de actividad" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoActividad })} options={['Tarea', 'Llamada', 'Reunión', 'Email', 'Visita', 'Seguimiento', 'Recordatorio'].map((t) => ({ value: t, label: t }))} />
            <Select label="Estado" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoActividad })} options={['Pendiente', 'En progreso', 'Completada', 'Cancelada'].map((s) => ({ value: s, label: s }))} />
            <div className="md:col-span-2">
              <Input label="Título" required value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} />
            </div>
            <DatePicker label="Fecha" value={formData.fecha} onChange={(v) => setFormData({ ...formData, fecha: v })} />
            <Input label="Hora" type="time" value={formData.hora} onChange={(e) => setFormData({ ...formData, hora: e.target.value })} />
            <Input label="Duración (minutos)" type="number" min={5} value={formData.duracionMin} onChange={(e) => setFormData({ ...formData, duracionMin: Number(e.target.value) })} />
            <Select label="Recordatorio" value={formData.recordatorio} onChange={(e) => setFormData({ ...formData, recordatorio: e.target.value })} options={['Sin recordatorio', '15 min antes', '30 min antes', '1 hora antes', '1 día antes'].map((r) => ({ value: r, label: r }))} />
            <Select label="Prioridad" value={formData.prioridad} onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as PriorityLevel })} options={['Baja', 'Media', 'Alta', 'Urgente'].map((p) => ({ value: p, label: p }))} />
            <Select label="Responsable" value={formData.responsableId} onChange={(e) => setFormData({ ...formData, responsableId: e.target.value })} options={teamMembers.map((u) => ({ value: u.id, label: u.name }))} />
          </FormSection>

          <FormSection title="Asociación de registros">
            <Select label="Empresa" value={formData.empresaId || ''} onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })} options={[{ value: '', label: 'Ninguna' }, ...empresas.map((em) => ({ value: em.id, label: em.nombreComercial }))]} />
            <Select label="Contacto" value={formData.contactoId || ''} onChange={(e) => setFormData({ ...formData, contactoId: e.target.value })} options={[{ value: '', label: 'Ninguno' }, ...contactos.map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))]} />
            <div className="md:col-span-2">
              <Select label="Oportunidad" value={formData.oportunidadId || ''} onChange={(e) => setFormData({ ...formData, oportunidadId: e.target.value })} options={[{ value: '', label: 'Ninguna' }, ...oportunidades.map((o) => ({ value: o.id, label: o.nombre }))]} />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Descripción / Notas" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            </div>
          </FormSection>
        </form>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
          <Button type="submit" form="act-form">{editingId ? 'Guardar cambios' : 'Crear actividad'}</Button>
        </div>
      </Drawer>
    </div>
  );
};
