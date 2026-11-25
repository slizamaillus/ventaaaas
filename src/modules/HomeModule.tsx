import React from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Headphones,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { Avatar, Badge, Button, Card } from '../components/ds/primitives';
import { MetricCard } from '../components/ds/data';
import { formatDateCL } from '../data/chileGeo';

export const HomeModule: React.FC = () => {
  const {
    currentUser,
    empresas,
    oportunidades,
    cotizaciones,
    actividades,
    casosPostventa,
    ventas,
    formatMoney,
    navigateTo,
    openQuickCreate,
    setActividades,
    notify,
    getEmpresaName,
  } = useCRM();

  const myTasks = actividades.filter(
    (a) => a.estado !== 'Completada' && a.estado !== 'Cancelada'
  );
  const myOpps = oportunidades.filter(
    (o) => !o.archivada && o.etapaId !== 'stg-7' && o.etapaId !== 'stg-8'
  );
  const totalSalesCLP = ventas.reduce((acc, v) => acc + v.monto, 0);
  const quotaPct = Math.min(100, Math.round((totalSalesCLP / (currentUser.monthlyQuotaCLP * 2)) * 100));

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={currentUser.avatar} name={currentUser.name} initials={currentUser.initials} size="xl" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Buenos días, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {currentUser.role} · {currentUser.team} · Santiago, Chile (UTC-3)
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('oportunidad')}>
            Nueva oportunidad
          </Button>
          <Button size="sm" variant="outline" leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('cotizacion')}>
            Nueva cotización
          </Button>
          <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => navigateTo('dashboard')}>
            Ir al Panel de control
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Actividades pendientes"
          value={String(myTasks.length)}
          subtitle="Agenda operativa de la semana"
          onClick={() => navigateTo('actividades')}
        />
        <MetricCard
          label="Negocios en curso"
          value={String(myOpps.length)}
          subtitle={formatMoney(myOpps.reduce((a, o) => a + o.monto, 0))}
          onClick={() => navigateTo('oportunidades')}
        />
        <MetricCard
          label="Cotizaciones activas"
          value={String(cotizaciones.filter((c) => c.estado === 'Enviada' || c.estado === 'Vista').length)}
          subtitle="Esperando respuesta del cliente"
          onClick={() => navigateTo('cotizaciones')}
        />
        <MetricCard
          label="Casos postventa abiertos"
          value={String(casosPostventa.filter((c) => c.estado !== 'Resuelto' && c.estado !== 'Cerrado').length)}
          subtitle="Mesa de soporte y garantías"
          onClick={() => navigateTo('postventa')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Mi Jornada Hoy */}
        <div className="lg:col-span-7 space-y-5">
          <Card
            title="Mi agenda y tareas prioritarias"
            subtitle="Acciones comerciales programadas"
            actions={
              <Button size="xs" variant="outline" onClick={() => navigateTo('actividades')}>
                Ver calendario
              </Button>
            }
          >
            <div className="divide-y divide-slate-100">
              {myTasks.slice(0, 5).map((act) => (
                <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActividades((prev) =>
                          prev.map((x) => (x.id === act.id ? { ...x, estado: 'Completada' } : x))
                        );
                        notify('Actividad completada', act.titulo);
                      }}
                      title="Marcar como completada"
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{act.titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {act.tipo} · {act.empresaId ? getEmpresaName(act.empresaId) : 'Interna'} ·{' '}
                        <span className="font-mono tabular-nums">
                          {formatDateCL(act.fecha)} {act.hora}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Badge tone={act.prioridad === 'Urgente' ? 'danger' : act.prioridad === 'Alta' ? 'warning' : 'neutral'}>
                    {act.prioridad}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Cuentas empresariales activas"
            subtitle="Acceso rápido a fichas de clientes"
            actions={
              <Button size="xs" variant="outline" onClick={() => navigateTo('empresas')}>
                Ver directorio
              </Button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {empresas.slice(0, 4).map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => navigateTo('empresas', emp.id)}
                  className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">{emp.nombreComercial}</span>
                    <Badge tone={emp.estado === 'Activa' ? 'success' : 'blue'}>{emp.estado}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                    {emp.rut} · {emp.comuna}
                  </p>
                  <p className="text-xs font-medium text-blue-700 mt-2 font-mono tabular-nums">
                    Potencial {formatMoney(emp.potencialCLP)}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Quota + Shortcuts */}
        <div className="lg:col-span-5 space-y-5">
          <Card title="Cumplimiento de meta comercial" subtitle="Acumulado consolidado Q4 2026">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {formatMoney(totalSalesCLP)}
                </span>
                <span className="text-xs font-mono tabular-nums font-semibold text-blue-700">
                  {quotaPct}% cumplido
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${quotaPct}%` }} className="h-full bg-blue-700 rounded-full" />
              </div>
              <p className="text-xs text-slate-500">
                Meta de referencia bimestral: <span className="font-mono">{formatMoney(currentUser.monthlyQuotaCLP * 2)}</span>
              </p>
            </div>
          </Card>

          <Card title="Accesos directos por área">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Tablero comercial', icon: <TrendingUp className="w-4 h-4 text-blue-700" />, mod: 'oportunidades' as const },
                { label: 'Empresas', icon: <Building2 className="w-4 h-4 text-blue-700" />, mod: 'empresas' as const },
                { label: 'Cotizaciones', icon: <FileSpreadsheet className="w-4 h-4 text-blue-700" />, mod: 'cotizaciones' as const },
                { label: 'Calendario', icon: <Calendar className="w-4 h-4 text-blue-700" />, mod: 'calendario' as const },
                { label: 'Postventa', icon: <Headphones className="w-4 h-4 text-blue-700" />, mod: 'postventa' as const },
                { label: 'Reportes', icon: <Clock className="w-4 h-4 text-blue-700" />, mod: 'reportes' as const },
              ].map((s) => (
                <button
                  key={s.mod}
                  type="button"
                  onClick={() => navigateTo(s.mod)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-xs font-medium text-slate-800 transition-colors cursor-pointer text-left"
                >
                  {s.icon}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
