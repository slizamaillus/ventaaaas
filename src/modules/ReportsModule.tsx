import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  Plus,
  Star,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { Badge, Button, Card } from '../components/ds/primitives';
import { Input, Select } from '../components/ds/forms';
import { ChartContainer, MetricCard, Modal, Table } from '../components/ds/data';
import { BarChartSVG, HorizontalBars, LineChartSVG } from '../components/ds/charts';
import { formatDateCL } from '../data/chileGeo';

type ReportCategory =
  | 'ventas'
  | 'oportunidades'
  | 'cotizaciones'
  | 'empresas'
  | 'contactos'
  | 'actividades'
  | 'productividad'
  | 'productos'
  | 'postventa';

const REPORT_CATEGORIES: { id: ReportCategory; label: string }[] = [
  { id: 'ventas', label: '1. Ventas' },
  { id: 'oportunidades', label: '2. Oportunidades' },
  { id: 'cotizaciones', label: '3. Cotizaciones' },
  { id: 'empresas', label: '4. Empresas' },
  { id: 'contactos', label: '5. Contactos' },
  { id: 'actividades', label: '6. Actividades' },
  { id: 'productividad', label: '7. Productividad' },
  { id: 'productos', label: '8. Productos' },
  { id: 'postventa', label: '9. Postventa' },
];

export const ReportsModule: React.FC<{ initialAnalytics?: boolean }> = ({ initialAnalytics = false }) => {
  const {
    ventas,
    oportunidades,
    cotizaciones,
    empresas,
    contactos,
    actividades,
    productos,
    casosPostventa,
    teamMembers,
    pipelineStages,
    formatMoney,
    notify,
    addAuditLog,
    getEmpresaName,
    getUser,
  } = useCRM();

  const [category, setCategory] = useState<ReportCategory>(initialAnalytics ? 'oportunidades' : 'ventas');
  const [period, setPeriod] = useState('Q4 2026');
  const [favorites, setFavorites] = useState<string[]>(['ventas', 'oportunidades']);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customReportName, setCustomReportName] = useState('');
  const [customReportDim, setCustomReportDim] = useState('Región');

  const toggleFav = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const totalSales = ventas.reduce((a, v) => a + v.monto, 0);
  const openPipeline = oportunidades.filter((o) => o.etapaId !== 'stg-7' && o.etapaId !== 'stg-8').reduce((a, o) => a + o.monto, 0);
  const wonCount = oportunidades.filter((o) => o.etapaId === 'stg-7').length;
  const lostCount = oportunidades.filter((o) => o.etapaId === 'stg-8').length;

  const salesByRegion = useMemo(() => {
    const map: Record<string, number> = {};
    ventas.forEach((v) => {
      const emp = empresas.find((e) => e.id === v.empresaId);
      const reg = emp?.region || 'Sin región';
      map[reg] = (map[reg] || 0) + v.monto;
    });
    return Object.entries(map).map(([label, value]) => ({
      label,
      value,
      formattedValue: formatMoney(value),
      pct: Math.round((value / Math.max(1, totalSales)) * 100),
    }));
  }, [ventas, empresas, totalSales, formatMoney]);

  const salesByOwner = useMemo(() => {
    return teamMembers.slice(0, 4).map((u) => {
      const sum = ventas.filter((v) => v.responsableId === u.id).reduce((a, v) => a + v.monto, 0);
      return {
        label: u.name,
        value: sum,
        formattedValue: formatMoney(sum),
        pct: Math.round((sum / Math.max(1, totalSales)) * 100),
      };
    });
  }, [teamMembers, ventas, totalSales, formatMoney]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {initialAnalytics ? 'Analítica comercial' : 'Centro de Reportes'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Inteligencia comercial por período, territorio chileno, responsable, productos y postventa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { value: 'Noviembre 2026', label: 'Noviembre 2026' },
              { value: 'Q4 2026', label: 'Q4 2026' },
              { value: 'Año 2026', label: 'Año completo 2026' },
            ]}
          />
          <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setCustomModalOpen(true)}>
            Personalizar reporte
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => {
              addAuditLog('Reportes', 'Exportación', `Exportó reporte de ${category} (${period})`);
              notify('Reporte exportado', `Archivo ${category}_${period}.xlsx generado.`);
            }}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Category & Favorites Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-3 space-y-4">
          <Card title="Categorías de reporte" noPadding>
            <div className="p-2 space-y-0.5">
              {REPORT_CATEGORIES.map((c) => {
                const active = category === c.id;
                const isFav = favorites.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <button type="button" onClick={() => setCategory(c.id)} className="flex-1 text-left cursor-pointer">
                      {c.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFav(c.id)}
                      title="Marcar favorito"
                      className={`p-0.5 cursor-pointer ${isFav ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'}`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Reportes favoritos">
            {favorites.length === 0 ? (
              <p className="text-xs text-slate-400">Marca reportes con estrella para acceso rápido.</p>
            ) : (
              <div className="space-y-1.5">
                {favorites.map((fid) => {
                  const item = REPORT_CATEGORIES.find((x) => x.id === fid);
                  if (!item) return null;
                  return (
                    <button
                      key={fid}
                      type="button"
                      onClick={() => setCategory(item.id)}
                      className="w-full text-left text-xs font-medium text-blue-700 hover:underline py-1 flex items-center gap-2 cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Report Content Area */}
        <div className="lg:col-span-9 space-y-5">
          {category === 'ventas' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard label="Ventas totales" value={formatMoney(totalSales)} delta="+14,8%" deltaPositive subtitle={period} />
                <MetricCard label="Operaciones facturadas" value={String(ventas.length)} subtitle="Documentos DTE emitidos" />
                <MetricCard label="Ticket promedio" value={formatMoney(Math.round(totalSales / Math.max(1, ventas.length)))} subtitle="CLP promedio" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ChartContainer title="Ventas por responsable" subtitle="Desempeño individual en período">
                  <HorizontalBars items={salesByOwner} />
                </ChartContainer>
                <ChartContainer title="Ventas por región de Chile" subtitle="Distribución geográfica">
                  <HorizontalBars items={salesByRegion} />
                </ChartContainer>
              </div>

              <Table
                data={ventas}
                columns={[
                  { key: 'folio', header: 'Folio', render: (v) => <span className="font-mono text-xs text-blue-700 font-semibold">{v.folio}</span> },
                  { key: 'emp', header: 'Empresa', render: (v) => getEmpresaName(v.empresaId) },
                  { key: 'comuna', header: 'Comuna', render: (v) => empresas.find((e) => e.id === v.empresaId)?.comuna || '—' },
                  { key: 'fecha', header: 'Fecha', render: (v) => <span className="font-mono text-xs">{formatDateCL(v.fecha)}</span> },
                  { key: 'monto', header: 'Monto', align: 'right', render: (v) => <span className="font-mono tabular-nums font-semibold">{formatMoney(v.monto, v.moneda)}</span> },
                  { key: 'estado', header: 'Estado', render: (v) => <Badge tone="success">{v.estado}</Badge> },
                ]}
              />
            </>
          )}

          {category === 'oportunidades' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <MetricCard label="Pipeline abierto" value={formatMoney(openPipeline)} />
                <MetricCard label="Ganadas" value={String(wonCount)} deltaPositive />
                <MetricCard label="Perdidas" value={String(lostCount)} />
                <MetricCard label="Tiempo medio cierre" value="28 días" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ChartContainer title="Pipeline por etapa" subtitle="Cantidad y monto por fase">
                  <HorizontalBars
                    items={pipelineStages.map((s) => {
                      const sum = oportunidades.filter((o) => o.etapaId === s.id).reduce((a, o) => a + o.monto, 0);
                      return {
                        label: s.name,
                        value: sum,
                        formattedValue: formatMoney(sum),
                        pct: Math.round((sum / Math.max(1, openPipeline + 40000000)) * 100),
                      };
                    })}
                  />
                </ChartContainer>
                <ChartContainer title="Motivos de pérdida" subtitle="Análisis de negocios no adjudicados">
                  <HorizontalBars
                    items={[
                      { label: 'Proyecto postergado', value: 45, formattedValue: '45%', pct: 45, colorClass: 'bg-amber-600' },
                      { label: 'Presupuesto insuficiente', value: 30, formattedValue: '30%', pct: 30, colorClass: 'bg-red-600' },
                      { label: 'Adjudicado a competencia', value: 25, formattedValue: '25%', pct: 25, colorClass: 'bg-slate-600' },
                    ]}
                  />
                </ChartContainer>
              </div>
            </>
          )}

          {category === 'cotizaciones' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <MetricCard label="Cotizaciones creadas" value={String(cotizaciones.length)} />
                <MetricCard label="Enviadas / Vistas" value={String(cotizaciones.filter((c) => c.estado === 'Enviada' || c.estado === 'Vista').length)} />
                <MetricCard label="Aceptadas" value={String(cotizaciones.filter((c) => c.estado === 'Aceptada').length)} />
                <MetricCard label="Tiempo respuesta medio" value="3,4 días" />
              </div>
              <ChartContainer title="Embudo de cotizaciones" subtitle="Tasa de aceptación sobre propuestas emitidas">
                <BarChartSVG
                  primaryLabel="Cotizaciones"
                  data={[
                    { label: 'Creadas', value: cotizaciones.length },
                    { label: 'Enviadas', value: cotizaciones.filter((c) => c.estado === 'Enviada' || c.estado === 'Vista' || c.estado === 'Aceptada').length },
                    { label: 'Aceptadas', value: cotizaciones.filter((c) => c.estado === 'Aceptada').length },
                    { label: 'Rechazadas', value: cotizaciones.filter((c) => c.estado === 'Rechazada').length },
                  ]}
                />
              </ChartContainer>
            </>
          )}

          {(category === 'empresas' || category === 'contactos') && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard label="Total empresas" value={String(empresas.length)} />
                <MetricCard label="Total contactos" value={String(contactos.length)} />
                <MetricCard label="Cuentas Enterprise" value={String(empresas.filter((e) => e.segmento === 'Enterprise').length)} />
              </div>
              <ChartContainer title="Empresas por industria" subtitle="Cartera comercial segmentada">
                <HorizontalBars
                  items={Array.from(new Set(empresas.map((e) => e.industria))).map((ind) => {
                    const cnt = empresas.filter((e) => e.industria === ind).length;
                    return {
                      label: ind,
                      value: cnt,
                      formattedValue: `${cnt} cuentas`,
                      pct: Math.round((cnt / empresas.length) * 100),
                    };
                  })}
                />
              </ChartContainer>
            </>
          )}

          {(category === 'actividades' || category === 'productividad') && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <MetricCard label="Actividades totales" value={String(actividades.length)} />
                <MetricCard label="Completadas" value={String(actividades.filter((a) => a.estado === 'Completada').length)} />
                <MetricCard label="Pendientes" value={String(actividades.filter((a) => a.estado === 'Pendiente').length)} />
                <MetricCard label="Reuniones y llamadas" value={String(actividades.filter((a) => a.tipo === 'Reunión' || a.tipo === 'Llamada').length)} />
              </div>
              <ChartContainer title="Actividades por responsable" subtitle="Volumen de gestión comercial">
                <HorizontalBars
                  items={teamMembers.map((u) => {
                    const cnt = actividades.filter((a) => a.responsableId === u.id).length;
                    return {
                      label: u.name,
                      value: cnt,
                      formattedValue: `${cnt} gestiones`,
                      pct: Math.round((cnt / Math.max(1, actividades.length)) * 100),
                    };
                  })}
                />
              </ChartContainer>
            </>
          )}

          {category === 'productos' && (
            <Table
              data={productos}
              columns={[
                { key: 'sku', header: 'SKU', render: (p) => <span className="font-mono text-xs">{p.sku}</span> },
                { key: 'nombre', header: 'Producto / Servicio', render: (p) => <span className="font-medium">{p.nombre}</span> },
                { key: 'categoria', header: 'Categoría', render: (p) => p.categoria },
                { key: 'precio', header: 'Precio neto', align: 'right', render: (p) => <span className="font-mono">{formatMoney(p.precio, p.moneda)}</span> },
                { key: 'margen', header: 'Margen', align: 'right', render: (p) => <span className="font-mono text-emerald-700">{Math.round(((p.precio - p.costo) / p.precio) * 100)}%</span> },
              ]}
            />
          )}

          {category === 'postventa' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard label="Casos totales" value={String(casosPostventa.length)} />
                <MetricCard label="Resueltos" value={String(casosPostventa.filter((c) => c.estado === 'Resuelto').length)} />
                <MetricCard label="SLA Cumplimiento" value="94,2%" deltaPositive />
              </div>
              <ChartContainer title="Tendencia mensual de casos resueltos" subtitle="Mesa de ayuda postventa">
                <LineChartSVG
                  data={[
                    { label: 'Jul', value: 18 },
                    { label: 'Ago', value: 22 },
                    { label: 'Sep', value: 19 },
                    { label: 'Oct', value: 25 },
                    { label: 'Nov', value: 28 },
                  ]}
                  formatValue={(n) => `${n} casos`}
                />
              </ChartContainer>
            </>
          )}
        </div>
      </div>

      {/* Custom Report Modal */}
      <Modal
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        title="Crear reporte personalizado"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCustomModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                setCustomModalOpen(false);
                notify('Reporte guardado', `"${customReportName || 'Reporte B2B'}" agrupado por ${customReportDim}.`);
              }}
            >
              Generar reporte
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Nombre del reporte" value={customReportName} onChange={(e) => setCustomReportName(e.target.value)} placeholder="Ej: Ventas por Comuna Q4" />
          <Select label="Agrupar por dimensión" value={customReportDim} onChange={(e) => setCustomReportDim(e.target.value)} options={['Región', 'Comuna', 'Responsable', 'Industria', 'Moneda', 'Producto'].map((d) => ({ value: d, label: d }))} />
        </div>
      </Modal>
    </div>
  );
};
