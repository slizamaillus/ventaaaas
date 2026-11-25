import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Edit3,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  Breadcrumb,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  Tooltip,
} from '../components/ds/primitives';
import {
  Checkbox,
  CurrencyInput,
  DatePicker,
  DateRangePicker,
  FileUpload,
  FormSection,
  Input,
  MultiSelect,
  RUTInput,
  Radio,
  SearchInput,
  Select,
  Textarea,
  Toggle,
} from '../components/ds/forms';
import {
  ChartContainer,
  ContextMenu,
  Drawer,
  DropdownMenu,
  FilterBuilder,
  FilterRule,
  KanbanCard,
  MetricCard,
  Modal,
  Pagination,
  Table,
  Tabs,
  Timeline,
} from '../components/ds/data';
import { BarChartSVG } from '../components/ds/charts';
import { useCRM } from '../context/CRMContext';
import { CurrencyCode } from '../types/crm';

export const DesignSystemModule: React.FC = () => {
  const { notify, currentUser, teamMembers } = useCRM();

  const [tab, setTab] = useState('all');
  const [textVal, setTextVal] = useState('AndesTech Soluciones S.A.');
  const [rutVal, setRutVal] = useState('76.543.210-K');
  const [amountVal, setAmountVal] = useState(14500000);
  const [curr, setCurr] = useState<CurrencyCode>('CLP');
  const [dateVal, setDateVal] = useState('2026-11-25');
  const [rangeVal, setRangeVal] = useState({ from: '2026-11-01', to: '2026-11-30' });
  const [multiVal, setMultiVal] = useState<string[]>(['Minería', 'Enterprise']);
  const [searchVal, setSearchVal] = useState('');
  const [checked, setChecked] = useState(true);
  const [radioVal, setRadioVal] = useState('clp');
  const [toggleVal, setToggleVal] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>(['ds-1']);
  const [filterRules, setFilterRules] = useState<FilterRule[]>([
    { id: 'r1', field: 'industria', operator: 'contiene', value: 'Minería' },
  ]);

  const sampleRows = [
    { id: 'ds-1', empresa: 'Minera Atacama Norte S.A.', rut: '76.120.450-3', monto: 28500000, estado: 'Activa' },
    { id: 'ds-2', empresa: 'Constructora Cordillera SpA', rut: '77.345.812-8', monto: 19400000, estado: 'En prospección' },
    { id: 'ds-3', empresa: 'Clínica Salud Metropolitana SpA', rut: '77.018.920-6', monto: 24800000, estado: 'Activa' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Design System — illus Ventas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sistema visual empresarial unificado: 40 componentes base, tokens, tipografía y estados interactivos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => notify('Toast de prueba', 'Notificación en vivo del Design System.', 'info')}
          >
            Probar Toast
          </Button>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Abrir Modal
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setDrawerOpen(true)}>
            Abrir Drawer
          </Button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <Tabs
        variant="segmented"
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'Catálogo completo (40)' },
          { id: 'tokens', label: 'Tokens y Paleta' },
          { id: 'forms', label: 'Controles de Formulario' },
          { id: 'data', label: 'Tablas, Overlays y Gráficos' },
          { id: 'states', label: 'Estados del Sistema' },
        ]}
      />

      {/* Tokens & Palette */}
      {(tab === 'all' || tab === 'tokens') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Paleta cromática y semántica" subtitle="Distribución 60-30-10 · Contraste WCAG AA">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Fondo Canvas', hex: '#F8FAFC', cls: 'bg-[#F8FAFC] border border-slate-200' },
                { name: 'Superficie', hex: '#FFFFFF', cls: 'bg-white border border-slate-200' },
                { name: 'Primario Azul', hex: '#1D4ED8', cls: 'bg-blue-700' },
                { name: 'Secundario Slate', hex: '#0F172A', cls: 'bg-slate-900' },
                { name: 'Positivo', hex: '#16A34A', cls: 'bg-emerald-600' },
                { name: 'Advertencia', hex: '#D97706', cls: 'bg-amber-600' },
                { name: 'Crítico / Error', hex: '#DC2626', cls: 'bg-red-600' },
                { name: 'Neutro Borde', hex: '#E2E8F0', cls: 'bg-slate-200' },
              ].map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <div className={`h-11 rounded-lg ${c.cls}`} />
                  <div className="text-xs font-medium text-slate-800">{c.name}</div>
                  <div className="text-[11px] font-mono text-slate-500">{c.hex}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Jerarquía tipográfica y espaciados" subtitle="Plus Jakarta Sans + IBM Plex Mono (tabular-nums)">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                <span className="text-xl font-bold text-slate-900">Título de módulo H1</span>
                <span className="text-xs font-mono text-slate-400">20px · Bold</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                <span className="text-base font-semibold text-slate-900">Subtítulo de sección H2</span>
                <span className="text-xs font-mono text-slate-400">16px · SemiBold</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-700">Texto estándar de tablas y formularios</span>
                <span className="text-xs font-mono text-slate-400">14px · Regular</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-mono tabular-nums font-semibold text-blue-700">$ 28.500.000 · 76.120.450-3</span>
                <span className="text-xs font-mono text-slate-400">IBM Plex Mono</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Buttons, Badges, Avatars, Breadcrumb, Tooltip */}
      {(tab === 'all' || tab === 'tokens') && (
        <Card title="1–2, 15–18, 26, 33. Botones, Badges, Avatars, Breadcrumb y Tooltips" subtitle="Variantes, tamaños y estados hover, focus, loading y disabled">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>Eliminar</Button>
              <Button loading>Cargando</Button>
              <Button disabled>Deshabilitado</Button>
              <IconButton label="Editar registro" variant="outline"><Edit3 className="w-4 h-4" /></IconButton>
              <Tooltip content="Tooltip informativo de acción">
                <Button variant="outline" size="sm">Hover Tooltip</Button>
              </Tooltip>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">Borrador</Badge>
                <Badge tone="blue">En prospección</Badge>
                <Badge tone="indigo">Calificado</Badge>
                <Badge tone="success" icon={<CheckCircle2 className="w-3 h-3" />}>Ganada</Badge>
                <Badge tone="warning">Por vencer</Badge>
                <Badge tone="danger">Rechazada</Badge>
              </div>
              <div className="flex items-center gap-4">
                <Avatar src={currentUser.avatar} name={currentUser.name} size="md" />
                <AvatarGroup
                  users={teamMembers.map((u) => ({ name: u.name, src: u.avatar, initials: u.initials }))}
                  max={3}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Breadcrumb
                items={[
                  { label: 'illus Ventas', onClick: () => {} },
                  { label: 'Comercial', onClick: () => {} },
                  { label: 'Minera Atacama Norte S.A.' },
                ]}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Forms */}
      {(tab === 'all' || tab === 'forms') && (
        <Card title="3–14, 32, 36. Controles de formulario y localización chilena">
          <FormSection
            title="Entradas estándar, RUT chileno, moneda y selectores"
            description="Validación en tiempo real y soporte CLP, UF, USD y EUR."
          >
            <Input
              label="Input estándar"
              required
              value={textVal}
              onChange={(e) => setTextVal(e.target.value)}
              hint="Texto auxiliar debajo del campo."
            />
            <Input
              label="Input con error"
              value=""
              onChange={() => {}}
              error="Este campo es obligatorio para emitir DTE."
            />
            <RUTInput label="RUTInput (Validación chilena)" value={rutVal} onChange={setRutVal} required />
            <CurrencyInput
              label="CurrencyInput (Multi-moneda)"
              value={amountVal}
              currency={curr}
              onChange={setAmountVal}
              onCurrencyChange={setCurr}
            />
            <Select
              label="Select"
              value="rm"
              onChange={() => {}}
              options={[
                { value: 'rm', label: 'Región Metropolitana de Santiago' },
                { value: 'val', label: 'Región de Valparaíso' },
                { value: 'ant', label: 'Región de Antofagasta' },
              ]}
            />
            <MultiSelect
              label="MultiSelect"
              options={['Minería', 'Enterprise', 'Sector Público', 'Renovación']}
              selected={multiVal}
              onChange={setMultiVal}
            />
            <DatePicker label="DatePicker" value={dateVal} onChange={setDateVal} />
            <DateRangePicker label="DateRangePicker" from={rangeVal.from} to={rangeVal.to} onChange={setRangeVal} />
            <div className="md:col-span-2">
              <SearchInput value={searchVal} onChange={setSearchVal} placeholder="SearchInput: buscar por nombre, RUT o folio..." />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Textarea" placeholder="Notas comerciales y condiciones..." />
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-6 pt-2">
              <Checkbox checked={checked} onChange={setChecked} label="Checkbox activo" />
              <Radio name="ds-curr" checked={radioVal === 'clp'} onChange={() => setRadioVal('clp')} label="Radio CLP" />
              <Radio name="ds-curr" checked={radioVal === 'uf'} onChange={() => setRadioVal('uf')} label="Radio UF" />
              <Toggle checked={toggleVal} onChange={setToggleVal} label="Toggle automatización" />
            </div>
            <div className="md:col-span-2">
              <FileUpload
                label="FileUpload"
                onFileSelect={(f) => notify('Archivo seleccionado', `${f.name} (${f.size})`, 'info')}
              />
            </div>
          </FormSection>
        </Card>
      )}

      {/* Data, Tables, Kanban, FilterBuilder, Timeline, Charts */}
      {(tab === 'all' || tab === 'data') && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="MetricCard Ventas" value="$ 74.101.300" delta="+14,2%" deltaPositive subtitle="Últimos 30 días" />
            <MetricCard label="Pipeline Activo" value="$ 134.900.000" delta="+8,5%" deltaPositive subtitle="8 negocios abiertos" />
            <MetricCard label="Tasa Conversión" value="28,4%" delta="-1,2%" deltaPositive={false} subtitle="Cotización → Venta" />
            <MetricCard label="Ticket Promedio" value="$ 14.820.260" delta="+5,1%" deltaPositive subtitle="CLP neto" />
          </div>

          <FilterBuilder
            fields={[
              { value: 'industria', label: 'Industria' },
              { value: 'region', label: 'Región' },
              { value: 'estado', label: 'Estado' },
            ]}
            rules={filterRules}
            onChange={setFilterRules}
          />

          <ContextMenu
            items={[
              { label: 'Ver detalle', onClick: () => notify('Acción contextual', 'Detalle abierto', 'info') },
              { label: 'Duplicar fila', onClick: () => notify('Duplicado', 'Registro duplicado', 'success') },
            ]}
          >
            <Table
              data={sampleRows}
              selectedIds={selectedIds}
              onToggleSelect={(id) =>
                setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
              }
              onToggleSelectAll={setSelectedIds}
              columns={[
                { key: 'empresa', header: 'Empresa', sortable: true, render: (r) => <span className="font-medium text-slate-900">{r.empresa}</span> },
                { key: 'rut', header: 'RUT', render: (r) => <span className="font-mono tabular-nums text-xs">{r.rut}</span> },
                { key: 'monto', header: 'Valor asociado', align: 'right', sortable: true, render: (r) => <span className="font-mono tabular-nums font-medium">$ {r.monto.toLocaleString('es-CL')}</span> },
                { key: 'estado', header: 'Estado', render: (r) => <Badge tone={r.estado === 'Activa' ? 'success' : 'blue'}>{r.estado}</Badge> },
              ]}
              rowActions={(r) => [
                { label: 'Abrir ficha', onClick: () => notify('Abrir ficha', r.empresa, 'info') },
                { label: 'Eliminar', danger: true, dividerBefore: true, onClick: () => notify('Confirmación requerida', r.empresa, 'warning') },
              ]}
            />
          </ContextMenu>

          <Pagination page={page} pageSize={10} total={34} onPageChange={setPage} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <ChartContainer title="40. ChartContainer — Ventas vs Meta" subtitle="Miles de pesos CLP">
              <BarChartSVG
                primaryLabel="Venta real"
                secondaryLabel="Meta"
                data={[
                  { label: 'Jul', value: 42, secondaryValue: 40 },
                  { label: 'Ago', value: 51, secondaryValue: 45 },
                  { label: 'Sep', value: 48, secondaryValue: 50 },
                  { label: 'Oct', value: 64, secondaryValue: 55 },
                  { label: 'Nov', value: 74, secondaryValue: 65 },
                ]}
                formatValue={(v) => `$ ${v}M`}
              />
            </ChartContainer>

            <Card title="37. KanbanCard" subtitle="Tarjeta estándar de pipeline">
              <KanbanCard
                title="Expansión CRM Faenas Norte (45 Usuarios)"
                companyName="Minera Atacama"
                contactName="Rodrigo Alarcón"
                amountFormatted="$ 28.500.000"
                ownerName="Sebastián Fuentes"
                ownerAvatar={teamMembers[2]?.avatar}
                closeDate="05/12/2026"
                probability={85}
                priority="Alta"
                lastActivity="24/11/2026"
                onClick={() => notify('KanbanCard', 'Click en oportunidad de demostración', 'info')}
              />
            </Card>

            <Card title="34–35. Timeline & ActivityItem" subtitle="Trazabilidad cronológica">
              <Timeline
                items={[
                  { id: 't1', title: 'Cotización COT-2026-0145 vista', date: '25/11 09:15', type: 'Cotización', tone: 'blue', actor: 'Sistema' },
                  { id: 't2', title: 'Reunión comité técnico', date: '23/11 11:00', type: 'Reunión', tone: 'success', actor: 'Sebastián Fuentes' },
                  { id: 't3', title: 'Empresa calificada', date: '18/11 16:40', type: 'Pipeline', tone: 'neutral', actor: 'Matías Valenzuela' },
                ]}
              />
            </Card>
          </div>
        </div>
      )}

      {/* States */}
      {(tab === 'all' || tab === 'states') && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert tone="info" title="Alert Informativa" description="Los montos en UF se calculan con el valor diario configurado ($ 38.250)." />
            <Alert tone="success" title="Alert de Éxito" description="La cotización COT-2026-0138 fue aceptada con Orden de Compra adjunta." />
            <Alert tone="warning" title="Alert de Advertencia" description="Dos cotizaciones enviadas vencen dentro de los próximos 5 días." />
            <Alert tone="error" title="Alert de Error" description="El RUT ingresado no coincide con el dígito verificador." />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <LoadingState rows={3} label="29. LoadingState (Skeleton)" />
            <EmptyState
              title="30. EmptyState — Sin registros"
              description="Aún no existen cotizaciones asociadas a esta cuenta empresarial."
              actionLabel="Crear cotización"
              onAction={() => notify('Acción EmptyState', 'Creando nuevo registro...', 'info')}
            />
            <ErrorState
              title="31. ErrorState — Error de consulta"
              onRetry={() => notify('Reintentando', 'Conexión restablecida correctamente.', 'success')}
            />
          </div>
        </div>
      )}

      {/* Demo Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="24. Modal empresarial"
        subtitle="Diálogo estándar para confirmaciones y formularios enfocados"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => { setModalOpen(false); notify('Confirmado', 'Acción ejecutada desde Modal.'); }}>Guardar cambios</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Este componente modal respeta el espaciado, jerarquía de acciones y cierre accesible del Design System de illus Ventas.
        </p>
      </Modal>

      {/* Demo Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="25. Drawer lateral"
        subtitle="Panel deslizante para vistas previas o edición contextual"
        footer={
          <>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cerrar</Button>
            <Button onClick={() => { setDrawerOpen(false); notify('Guardado', 'Cambios aplicados desde Drawer.'); }}>Aplicar</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          El Drawer lateral permite inspeccionar fichas, editar líneas o revisar documentos sin perder el contexto de la tabla principal.
        </p>
        <DropdownMenu
          items={[
            { label: 'Opción A', onClick: () => {} },
            { label: 'Opción B', onClick: () => {} },
          ]}
          trigger={<Button variant="outline" size="sm">22. Probar DropdownMenu</Button>}
        />
      </Drawer>
    </div>
  );
};
