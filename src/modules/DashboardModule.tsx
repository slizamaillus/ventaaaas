import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { Avatar, Badge, Button, Card, IconButton } from '../components/ds/primitives';
import { Select, Toggle } from '../components/ds/forms';
import { ChartContainer, MetricCard, Modal } from '../components/ds/data';
import { BarChartSVG, HorizontalBars, LineChartSVG } from '../components/ds/charts';
import { formatDateCL } from '../data/chileGeo';

interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'kpis', label: 'Indicadores clave (KPIs)', visible: true },
  { id: 'ventas_mensuales', label: 'Ventas mensuales vs Meta', visible: true },
  { id: 'pipeline_etapa', label: 'Pipeline por etapa y Conversión', visible: true },
  { id: 'evolucion_ingresos', label: 'Evolución de ingresos y Cotizaciones vs Ventas', visible: true },
  { id: 'oportunidades_resumen', label: 'Resumen de oportunidades y Próximas a cerrar', visible: true },
  { id: 'tareas_actividades', label: 'Próximas tareas y Actividades recientes', visible: true },
  { id: 'cotizaciones_empresas', label: 'Cotizaciones pendientes y Empresas recientes', visible: true },
  { id: 'ranking_objetivos', label: 'Alertas, Objetivos y Ranking comercial', visible: true },
];

export const DashboardModule: React.FC = () => {
  const {
    oportunidades,
    cotizaciones,
    ventas,
    actividades,
    empresas,
    teamMembers,
    pipelineStages,
    catalogs,
    formatMoney,
    navigateTo,
    openQuickCreate,
    setActividades,
    notify,
    getEmpresaName,
    getUser,
  } = useCRM();

  const [periodo, setPeriodo] = useState('Q4 2026');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [empresaFilter, setEmpresaFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [estadoFilter, setEstadoFilter] = useState('all');

  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [kpiModal, setKpiModal] = useState<{ title: string; items: { label: string; value: string; onClick?: () => void }[] } | null>(null);

  const periodFactor = periodo === 'Noviembre 2026' ? 0.65 : periodo === 'Año 2026' ? 2.4 : 1;

  const filteredOpps = useMemo(() => {
    return oportunidades.filter((o) => {
      if (o.archivada) return false;
      if (ownerFilter !== 'all' && o.responsableId !== ownerFilter) return false;
      if (teamFilter !== 'all' && o.equipo !== teamFilter) return false;
      if (empresaFilter !== 'all' && o.empresaId !== empresaFilter) return false;
      if (sourceFilter !== 'all' && o.origen !== sourceFilter) return false;
      if (estadoFilter === 'Abiertas' && (o.etapaId === 'stg-7' || o.etapaId === 'stg-8')) return false;
      if (estadoFilter === 'Ganadas' && o.etapaId !== 'stg-7') return false;
      if (estadoFilter === 'Perdidas' && o.etapaId !== 'stg-8') return false;
      return true;
    });
  }, [oportunidades, ownerFilter, teamFilter, empresaFilter, sourceFilter, estadoFilter]);

  const filteredQuotes = useMemo(() => {
    return cotizaciones.filter((c) => {
      if (ownerFilter !== 'all' && c.responsableId !== ownerFilter) return false;
      if (empresaFilter !== 'all' && c.empresaId !== empresaFilter) return false;
      return true;
    });
  }, [cotizaciones, ownerFilter, empresaFilter]);

  const filteredSales = useMemo(() => {
    return ventas.filter((v) => {
      if (ownerFilter !== 'all' && v.responsableId !== ownerFilter) return false;
      if (empresaFilter !== 'all' && v.empresaId !== empresaFilter) return false;
      return true;
    });
  }, [ventas, ownerFilter, empresaFilter]);

  const filteredActs = useMemo(() => {
    return actividades.filter((a) => {
      if (ownerFilter !== 'all' && a.responsableId !== ownerFilter) return false;
      if (empresaFilter !== 'all' && a.empresaId !== empresaFilter) return false;
      return true;
    });
  }, [actividades, ownerFilter, empresaFilter]);

  const openOpps = filteredOpps.filter((o) => o.etapaId !== 'stg-7' && o.etapaId !== 'stg-8');
  const wonOpps = filteredOpps.filter((o) => o.etapaId === 'stg-7');
  const totalSalesAmt = Math.round(filteredSales.reduce((acc, v) => acc + v.monto, 0) * periodFactor);
  const pipelineTotal = openOpps.reduce((acc, o) => acc + o.monto, 0);
  const quotesSent = filteredQuotes.filter((q) => q.estado === 'Enviada' || q.estado === 'Vista').length;
  const quotesAccepted = filteredQuotes.filter((q) => q.estado === 'Aceptada').length;
  const conversionRate =
    filteredOpps.length > 0 ? Math.round((wonOpps.length / filteredOpps.length) * 1000) / 10 : 0;
  const avgTicket = filteredSales.length > 0 ? Math.round(totalSalesAmt / filteredSales.length) : 0;
  const pendingActs = filteredActs.filter((a) => a.estado === 'Pendiente' || a.estado === 'En progreso').length;

  const moveWidget = (idx: number, dir: -1 | 1) => {
    const next = [...widgets];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setWidgets(next);
  };

  const resetFilters = () => {
    setPeriodo('Q4 2026');
    setOwnerFilter('all');
    setTeamFilter('all');
    setEmpresaFilter('all');
    setSourceFilter('all');
    setEstadoFilter('all');
  };

  const renderWidget = (w: WidgetConfig) => {
    if (!w.visible) return null;

    if (w.id === 'kpis') {
      return (
        <div key={w.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Ventas del período"
            value={formatMoney(totalSalesAmt)}
            delta="+14,8%"
            deltaPositive
            subtitle={`${filteredSales.length} ventas facturadas`}
            onClick={() =>
              setKpiModal({
                title: 'Detalle de Ventas del Período',
                items: filteredSales.map((v) => ({
                  label: `${v.folio} · ${getEmpresaName(v.empresaId)}`,
                  value: formatMoney(v.monto, v.moneda),
                  onClick: () => navigateTo('ventas', v.id),
                })),
              })
            }
          />
          <MetricCard
            label="Pipeline total activo"
            value={formatMoney(pipelineTotal)}
            delta="+9,2%"
            deltaPositive
            subtitle={`${openOpps.length} oportunidades abiertas`}
            onClick={() =>
              setKpiModal({
                title: 'Detalle de Pipeline Activo',
                items: openOpps.map((o) => ({
                  label: `${o.nombre} · ${getEmpresaName(o.empresaId)}`,
                  value: formatMoney(o.monto, o.moneda),
                  onClick: () => navigateTo('oportunidades', o.id),
                })),
              })
            }
          />
          <MetricCard
            label="Oportunidades abiertas"
            value={String(openOpps.length)}
            delta={`${wonOpps.length} ganadas`}
            deltaPositive
            subtitle="Pipeline Comercial B2B"
            onClick={() => navigateTo('oportunidades')}
          />
          <MetricCard
            label="Cotizaciones enviadas"
            value={String(quotesSent)}
            subtitle={`${quotesAccepted} aceptadas en período`}
            onClick={() => navigateTo('cotizaciones')}
          />
          <MetricCard
            label="Cotizaciones aceptadas"
            value={String(quotesAccepted)}
            delta="+1"
            deltaPositive
            subtitle="Listas para pedido"
            onClick={() => navigateTo('cotizaciones')}
          />
          <MetricCard
            label="Tasa de conversión"
            value={`${conversionRate}%`}
            delta="+2,1%"
            deltaPositive
            subtitle="Oportunidades ganadas vs total"
            onClick={() => navigateTo('reportes')}
          />
          <MetricCard
            label="Ticket promedio"
            value={formatMoney(avgTicket)}
            subtitle="Promedio por venta cerrada"
            onClick={() => navigateTo('ventas')}
          />
          <MetricCard
            label="Actividades pendientes"
            value={String(pendingActs)}
            delta="Hoy: 3"
            deltaPositive
            subtitle="Llamadas, reuniones y tareas"
            onClick={() => navigateTo('actividades')}
          />
        </div>
      );
    }

    if (w.id === 'ventas_mensuales') {
      const ownerStats = teamMembers.slice(0, 4).map((u) => {
        const sum = filteredOpps
          .filter((o) => o.responsableId === u.id)
          .reduce((a, o) => a + o.monto, 0);
        return {
          label: u.name,
          value: sum,
          formattedValue: formatMoney(sum),
          pct: Math.round((sum / Math.max(1, pipelineTotal + 35000000)) * 100),
        };
      });

      return (
        <div key={w.id} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <ChartContainer
            className="lg:col-span-7"
            title="Ventas mensuales vs Meta comercial"
            subtitle={`Comparativa en ${periodo} (valores expresados en millones CLP)`}
          >
            <BarChartSVG
              primaryLabel="Ventas reales"
              secondaryLabel="Meta mensual"
              data={[
                { label: 'Jun', value: Math.round(38 * periodFactor), secondaryValue: 40 },
                { label: 'Jul', value: Math.round(45 * periodFactor), secondaryValue: 44 },
                { label: 'Ago', value: Math.round(52 * periodFactor), secondaryValue: 48 },
                { label: 'Sep', value: Math.round(49 * periodFactor), secondaryValue: 52 },
                { label: 'Oct', value: Math.round(64 * periodFactor), secondaryValue: 58 },
                { label: 'Nov', value: Math.round(74 * periodFactor), secondaryValue: 65 },
              ]}
              formatValue={(n) => `$ ${n}M`}
            />
          </ChartContainer>

          <ChartContainer
            className="lg:col-span-5"
            title="Oportunidades por responsable"
            subtitle="Monto total en cartera filtrada"
          >
            <HorizontalBars
              items={ownerStats}
              onItemClick={() => navigateTo('oportunidades')}
            />
          </ChartContainer>
        </div>
      );
    }

    if (w.id === 'pipeline_etapa') {
      const stageBars = pipelineStages
        .filter((s) => s.isClosed !== 'lost')
        .map((s) => {
          const list = filteredOpps.filter((o) => o.etapaId === s.id);
          const total = list.reduce((a, o) => a + o.monto, 0);
          return {
            label: `${s.name} (${list.length})`,
            value: total,
            formattedValue: formatMoney(total),
            pct: Math.round((total / Math.max(1, pipelineTotal + 25000000)) * 100),
            colorClass: s.isClosed === 'won' ? 'bg-emerald-600' : 'bg-blue-700',
          };
        });

      const funnelBars = [
        { label: 'Prospectos calificados', value: 42, formattedValue: '42 (100%)', pct: 100, colorClass: 'bg-slate-700' },
        { label: 'Reuniones realizadas', value: 29, formattedValue: '29 (69%)', pct: 69, colorClass: 'bg-blue-700' },
        { label: 'Cotizaciones enviadas', value: 19, formattedValue: '19 (45%)', pct: 45, colorClass: 'bg-blue-600' },
        { label: 'Negocios ganados', value: 11, formattedValue: '11 (26%)', pct: 26, colorClass: 'bg-emerald-600' },
      ];

      return (
        <div key={w.id} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartContainer title="Pipeline por etapa" subtitle="Distribución económica por fase del embudo">
            <HorizontalBars items={stageBars} onItemClick={() => navigateTo('oportunidades')} />
          </ChartContainer>
          <ChartContainer title="Conversión comercial" subtitle="Embudo de avance desde prospección a cierre">
            <HorizontalBars items={funnelBars} onItemClick={() => navigateTo('reportes')} />
          </ChartContainer>
        </div>
      );
    }

    if (w.id === 'evolucion_ingresos') {
      return (
        <div key={w.id} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <ChartContainer
            className="lg:col-span-6"
            title="Evolución de ingresos acumulados"
            subtitle="Tendencia semestral en millones CLP"
          >
            <LineChartSVG
              data={[
                { label: 'Jun', value: 38 },
                { label: 'Jul', value: 45 },
                { label: 'Ago', value: 52 },
                { label: 'Sep', value: 49 },
                { label: 'Oct', value: 64 },
                { label: 'Nov', value: 74 },
              ]}
              formatValue={(n) => `$ ${n}.000.000 CLP`}
            />
          </ChartContainer>

          <ChartContainer
            className="lg:col-span-6"
            title="Cotizaciones vs Ventas y Actividades realizadas"
            subtitle="Comparación mensual de propuestas emitidas, cierres y gestiones"
          >
            <BarChartSVG
              primaryLabel="Cotizaciones ($M)"
              secondaryLabel="Ventas ($M)"
              data={[
                { label: 'Ago', value: 68, secondaryValue: 52 },
                { label: 'Sep', value: 74, secondaryValue: 49 },
                { label: 'Oct', value: 82, secondaryValue: 64 },
                { label: 'Nov', value: 94, secondaryValue: 74 },
              ]}
              formatValue={(n) => `$ ${n}M`}
            />
          </ChartContainer>
        </div>
      );
    }

    if (w.id === 'oportunidades_resumen') {
      return (
        <div key={w.id} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card
            title="A. Resumen de oportunidades"
            subtitle="Negocios destacados en etapa avanzada"
            actions={<Button size="xs" variant="outline" onClick={() => navigateTo('oportunidades')}>Ver pipeline</Button>}
          >
            <div className="divide-y divide-slate-100">
              {openOpps.slice(0, 4).map((o) => {
                const stg = pipelineStages.find((s) => s.id === o.etapaId);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => navigateTo('oportunidades', o.id)}
                    className="w-full py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left hover:bg-slate-50 rounded-lg px-1 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{o.nombre}</div>
                      <div className="text-xs text-slate-500">{getEmpresaName(o.empresaId)} · {stg?.name}</div>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-900 shrink-0">
                      {formatMoney(o.monto, o.moneda)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card
            title="E. Oportunidades próximas a cerrar"
            subtitle="Fecha estimada de cierre dentro de 30 días"
          >
            <div className="divide-y divide-slate-100">
              {openOpps
                .slice()
                .sort((a, b) => a.fechaCierreEstimada.localeCompare(b.fechaCierreEstimada))
                .slice(0, 4)
                .map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => navigateTo('oportunidades', o.id)}
                    className="w-full py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left hover:bg-slate-50 rounded-lg px-1 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{o.nombre}</div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">
                        Cierre: {formatDateCL(o.fechaCierreEstimada)} · Prob: {o.probabilidad}%
                      </div>
                    </div>
                    <Badge tone={o.probabilidad >= 75 ? 'success' : 'warning'}>
                      {formatMoney(o.monto, o.moneda)}
                    </Badge>
                  </button>
                ))}
            </div>
          </Card>
        </div>
      );
    }

    if (w.id === 'tareas_actividades') {
      return (
        <div key={w.id} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card
            title="B. Próximas tareas"
            subtitle="Pendientes con acción directa"
            actions={<Button size="xs" variant="outline" onClick={() => navigateTo('tareas')}>Ver tareas</Button>}
          >
            <div className="divide-y divide-slate-100">
              {filteredActs
                .filter((a) => a.estado !== 'Completada')
                .slice(0, 4)
                .map((act) => (
                  <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActividades((prev) =>
                            prev.map((x) => (x.id === act.id ? { ...x, estado: 'Completada' } : x))
                          );
                          notify('Tarea completada', act.titulo);
                        }}
                        className="text-slate-400 hover:text-emerald-600 cursor-pointer shrink-0"
                        title="Completar"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{act.titulo}</div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">
                          {formatDateCL(act.fecha)} {act.hora} · {act.tipo}
                        </div>
                      </div>
                    </div>
                    <Badge tone={act.prioridad === 'Urgente' ? 'danger' : 'neutral'}>{act.prioridad}</Badge>
                  </div>
                ))}
            </div>
          </Card>

          <Card
            title="C. Actividades recientes"
            subtitle="Últimas interacciones comerciales"
            actions={<Button size="xs" variant="outline" onClick={() => navigateTo('actividades')}>Historial</Button>}
          >
            <div className="divide-y divide-slate-100">
              {filteredActs.slice(0, 4).map((act) => (
                <div
                  key={act.id}
                  onClick={() => navigateTo('actividades')}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 px-1 rounded-lg"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{act.titulo}</div>
                    <div className="text-xs text-slate-500">
                      {getUser(act.responsableId)?.name} · {act.empresaId ? getEmpresaName(act.empresaId) : 'General'}
                    </div>
                  </div>
                  <Badge tone={act.estado === 'Completada' ? 'success' : 'blue'}>{act.estado}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );
    }

    if (w.id === 'cotizaciones_empresas') {
      return (
        <div key={w.id} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card
            title="D. Cotizaciones pendientes"
            subtitle="Propuestas en revisión, enviadas o vistas"
            actions={<Button size="xs" variant="outline" onClick={() => navigateTo('cotizaciones')}>Ir a cotizaciones</Button>}
          >
            <div className="divide-y divide-slate-100">
              {filteredQuotes
                .filter((q) => q.estado === 'Enviada' || q.estado === 'Vista' || q.estado === 'En revisión')
                .map((q) => {
                  const net = q.items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario * (1 - it.descuentoPct / 100), 0);
                  const total = net * (1 + q.ivaPct / 100);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => navigateTo('cotizaciones', q.id)}
                      className="w-full py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left hover:bg-slate-50 px-1 rounded-lg cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          <span className="font-mono text-xs text-blue-700 mr-1.5">{q.folio}</span>
                          {getEmpresaName(q.empresaId)}
                        </div>
                        <div className="text-xs text-slate-500">Vence: {formatDateCL(q.vencimiento)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono tabular-nums font-semibold text-slate-900">
                          {formatMoney(total, q.moneda)}
                        </div>
                        <Badge tone={q.estado === 'Vista' ? 'blue' : 'warning'}>{q.estado}</Badge>
                      </div>
                    </button>
                  );
                })}
            </div>
          </Card>

          <Card
            title="F. Empresas recientemente creadas"
            subtitle="Últimas cuentas incorporadas"
            actions={<Button size="xs" variant="outline" onClick={() => navigateTo('empresas')}>Ver todas</Button>}
          >
            <div className="divide-y divide-slate-100">
              {empresas
                .slice()
                .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
                .slice(0, 4)
                .map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => navigateTo('empresas', emp.id)}
                    className="w-full py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left hover:bg-slate-50 px-1 rounded-lg cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{emp.nombreComercial}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {emp.rut} · {emp.comuna}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      {formatDateCL(emp.fechaCreacion)}
                    </span>
                  </button>
                ))}
            </div>
          </Card>
        </div>
      );
    }

    if (w.id === 'ranking_objetivos') {
      const ranking = teamMembers.slice(0, 4).map((u) => {
        const closed = ventas.filter((v) => v.responsableId === u.id).reduce((a, v) => a + v.monto, 0);
        const pct = Math.min(100, Math.round((closed / u.monthlyQuotaCLP) * 100));
        return { user: u, closed, pct };
      }).sort((a, b) => b.closed - a.closed);

      return (
        <div key={w.id} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-4" title="G. Alertas comerciales" subtitle="Situaciones que requieren atención">
            <div className="space-y-3">
              {[
                { title: 'COT-2026-0142 vence en 8 días', desc: 'Constructora Cordillera · $ 22.141.140', mod: 'cotizaciones' as const, id: 'cot-1' },
                { title: 'Caso SII prioridad Alta abierto', desc: 'Valle Central · Esperando respuesta', mod: 'postventa' as const, id: 'cas-1' },
                { title: 'Licitación Puerto Sur sin OC', desc: 'Cierre estimado 22/12/2026', mod: 'oportunidades' as const, id: 'opp-5' },
              ].map((al, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigateTo(al.mod, al.id)}
                  className="w-full text-left p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{al.title}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{al.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-4" title="H. Objetivos y cumplimiento" subtitle="Metas trimestrales por equipo">
            <div className="space-y-4">
              {[
                { name: 'Grandes Cuentas (RM)', pct: 82, val: '$ 94.3M / $ 115M' },
                { name: 'Zona Norte & Minería', pct: 68, val: '$ 30.8M / $ 45M' },
                { name: 'Zona Centro & Sur', pct: 79, val: '$ 30.1M / $ 38M' },
              ].map((g) => (
                <div key={g.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{g.name}</span>
                    <span className="font-mono tabular-nums text-slate-500">{g.pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${g.pct}%` }} className="h-full bg-emerald-600 rounded-full" />
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">{g.val}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-4" title="I. Ranking comercial" subtitle="Desempeño por ejecutivo">
            <div className="space-y-3">
              {ranking.map((r, idx) => (
                <div key={r.user.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-mono font-semibold text-slate-400 w-4">#{idx + 1}</span>
                    <Avatar src={r.user.avatar} name={r.user.name} initials={r.user.initials} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">{r.user.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{r.user.team}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono tabular-nums font-semibold text-slate-900">
                      {formatMoney(r.closed)}
                    </div>
                    <div className="text-[11px] font-mono text-emerald-700">{r.pct}% cuota</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Panel de control</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Visión consolidada del rendimiento comercial, pipeline y actividad del equipo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            onClick={() => setCustomizeOpen(true)}
          >
            Personalizar Dashboard
          </Button>
          <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('oportunidad')}>
            Nueva oportunidad
          </Button>
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => openQuickCreate('cotizacion')}>
            Nueva cotización
          </Button>
        </div>
      </div>

      {/* Interactive Filter Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 items-end">
        <Select
          label="Período"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          options={[
            { value: 'Noviembre 2026', label: 'Noviembre 2026' },
            { value: 'Q4 2026', label: 'Q4 2026' },
            { value: 'Año 2026', label: 'Año 2026' },
          ]}
        />
        <Select
          label="Responsable"
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos' },
            ...teamMembers.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />
        <Select
          label="Equipo"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'Grandes Cuentas', label: 'Grandes Cuentas' },
            { value: 'Zona Norte & Minería', label: 'Zona Norte & Minería' },
            { value: 'Zona Centro & Sur', label: 'Zona Centro & Sur' },
          ]}
        />
        <Select
          label="Empresa"
          value={empresaFilter}
          onChange={(e) => setEmpresaFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todas' },
            ...empresas.map((e) => ({ value: e.id, label: e.nombreComercial })),
          ]}
        />
        <Select
          label="Fuente"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todas' },
            ...catalogs.fuentes.map((f) => ({ value: f, label: f })),
          ]}
        />
        <Select
          label="Estado"
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'Abiertas', label: 'Abiertas' },
            { value: 'Ganadas', label: 'Ganadas' },
            { value: 'Perdidas', label: 'Perdidas' },
          ]}
        />
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={resetFilters}
          className="h-[38px]"
        >
          Limpiar
        </Button>
      </div>

      {/* Rendered Widgets */}
      <div className="space-y-5">{widgets.map(renderWidget)}</div>

      {/* KPI Drill-down Modal */}
      <Modal
        open={Boolean(kpiModal)}
        onClose={() => setKpiModal(null)}
        title={kpiModal?.title || ''}
        subtitle="Registros incluidos según los filtros actuales"
        size="md"
        footer={<Button onClick={() => setKpiModal(null)}>Cerrar</Button>}
      >
        <div className="divide-y divide-slate-100">
          {kpiModal?.items.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Sin registros coincidentes.</p>
          ) : (
            kpiModal?.items.map((it, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setKpiModal(null);
                  it.onClick?.();
                }}
                className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 px-2 rounded-lg cursor-pointer"
              >
                <span className="text-sm text-slate-800 truncate">{it.label}</span>
                <span className="text-xs font-mono tabular-nums font-semibold text-blue-700 shrink-0">
                  {it.value}
                </span>
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* Customize Dashboard Modal */}
      <Modal
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        title="Personalizar Panel de control"
        subtitle="Activa, oculta o reordena los bloques del Dashboard según tu rol"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setWidgets(DEFAULT_WIDGETS);
                notify('Dashboard restablecido', 'Orden y visibilidad predeterminados.');
              }}
            >
              Restablecer
            </Button>
            <Button
              onClick={() => {
                setCustomizeOpen(false);
                notify('Dashboard actualizado', 'Preferencias visuales aplicadas.');
              }}
            >
              Guardar diseño
            </Button>
          </>
        }
      >
        <div className="divide-y divide-slate-100">
          {widgets.map((w, idx) => (
            <div key={w.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {w.visible ? <Eye className="w-4 h-4 text-blue-700" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                <span className="text-sm font-medium text-slate-800 truncate">{w.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <IconButton label="Subir" size="sm" disabled={idx === 0} onClick={() => moveWidget(idx, -1)}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton label="Bajar" size="sm" disabled={idx === widgets.length - 1} onClick={() => moveWidget(idx, 1)}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </IconButton>
                <Toggle
                  checked={w.visible}
                  onChange={(val) =>
                    setWidgets((prev) => prev.map((x) => (x.id === w.id ? { ...x, visible: val } : x)))
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
