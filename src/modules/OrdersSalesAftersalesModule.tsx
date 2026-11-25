import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Edit3,
  MessageSquare,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { CasoPostventa, CurrencyCode, Pedido, PriorityLevel, Venta } from '../types/crm';
import { Badge, BadgeTone, Button, Card } from '../components/ds/primitives';
import { CurrencyInput, DatePicker, FormSection, Input, SearchInput, Select, Textarea } from '../components/ds/forms';
import { Drawer, Table, Tabs, Timeline } from '../components/ds/data';
import { formatDateCL } from '../data/chileGeo';

export const OrdersSalesAftersalesModule: React.FC<{ section: 'pedidos' | 'ventas' | 'postventa' }> = ({ section }) => {
  const {
    pedidos,
    setPedidos,
    ventas,
    setVentas,
    casosPostventa,
    setCasosPostventa,
    empresas,
    contactos,
    cotizaciones,
    oportunidades,
    productos,
    teamMembers,
    orgSettings,
    selectedRecordId,
    setSelectedRecordId,
    navigateTo,
    formatMoney,
    notify,
    getEmpresaName,
    getContactoName,
    getUser,
  } = useCRM();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Pedidos form
  const [pedForm, setPedForm] = useState({
    empresaId: empresas[0]?.id || '',
    contactoId: contactos[0]?.id || '',
    cotizacionId: '',
    fecha: '2026-11-25',
    estado: 'Pendiente' as Pedido['estado'],
    condiciones: 'Pago 30 días contra factura',
    responsableId: 'usr-1',
    notas: '',
    productoId: productos[0]?.id || '',
    cantidad: 1,
  });

  // Ventas form
  const [vtaForm, setVtaForm] = useState({
    empresaId: empresas[0]?.id || '',
    contactoId: contactos[0]?.id || '',
    oportunidadId: '',
    pedidoId: '',
    fecha: '2026-11-25',
    monto: 12000000,
    moneda: 'CLP' as CurrencyCode,
    responsableId: 'usr-1',
    estado: 'Facturada' as Venta['estado'],
    metodoPago: 'Transferencia Bancaria',
    documentoTributario: 'Factura Electrónica N° 4830',
  });

  // Postventa form & comments
  const [casForm, setCasForm] = useState({
    asunto: '',
    empresaId: empresas[0]?.id || '',
    contactoId: contactos[0]?.id || '',
    tipo: 'Soporte técnico' as CasoPostventa['tipo'],
    categoria: 'Mesa de Ayuda',
    prioridad: 'Media' as PriorityLevel,
    responsableId: 'usr-5',
    estado: 'Nuevo' as CasoPostventa['estado'],
    descripcion: '',
  });
  const [commentText, setCommentText] = useState('');
  const [postTab, setPostTab] = useState('info');

  const calcPedidoTotal = (p: Pedido) => {
    const net = p.items.reduce((a, i) => a + i.cantidad * i.precioUnitario * (1 - i.descuentoPct / 100), 0);
    return Math.round(net * (1 + p.ivaPct / 100));
  };

  // ===================== PEDIDOS =====================
  if (section === 'pedidos') {
    const selectedPedido = pedidos.find((p) => p.id === selectedRecordId) || null;
    const filteredPedidos = pedidos.filter((p) => {
      const q = query.toLowerCase();
      if (q && !p.folio.toLowerCase().includes(q) && !getEmpresaName(p.empresaId).toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && p.estado !== statusFilter) return false;
      return true;
    });

    const pedidoTone = (e: Pedido['estado']): BadgeTone => {
      if (e === 'Entregado') return 'success';
      if (e === 'Confirmado' || e === 'En preparación') return 'blue';
      if (e === 'Cancelado') return 'danger';
      return 'warning';
    };

    if (selectedPedido) {
      return (
        <div className="space-y-5">
          <Button size="sm" variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedRecordId(null)}>
            Volver a Pedidos
          </Button>
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold font-mono text-slate-900">{selectedPedido.folio}</h1>
                <Badge tone={pedidoTone(selectedPedido.estado)}>{selectedPedido.estado}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {getEmpresaName(selectedPedido.empresaId)} · {getContactoName(selectedPedido.contactoId)} · Fecha {formatDateCL(selectedPedido.fecha)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedPedido.estado}
                onChange={(e) => {
                  const st = e.target.value as Pedido['estado'];
                  setPedidos((prev) => prev.map((x) => (x.id === selectedPedido.id ? { ...x, estado: st } : x)));
                  notify('Estado de pedido actualizado', st);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium"
              >
                {['Pendiente', 'Confirmado', 'En preparación', 'Entregado', 'Cancelado'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                onClick={() => {
                  const total = calcPedidoTotal(selectedPedido);
                  setVentas((prev) => [
                    {
                      id: `vta-${Date.now()}`,
                      folio: `VTA-2026-${Math.floor(320 + Math.random() * 500)}`,
                      empresaId: selectedPedido.empresaId,
                      contactoId: selectedPedido.contactoId,
                      pedidoId: selectedPedido.id,
                      fecha: '2026-11-25',
                      monto: total,
                      moneda: selectedPedido.moneda,
                      responsableId: selectedPedido.responsableId,
                      estado: 'Facturada',
                      metodoPago: 'Transferencia Bancaria',
                      documentoTributario: `Factura Electrónica N° ${Math.floor(4850 + Math.random() * 100)}`,
                    },
                    ...prev,
                  ]);
                  notify('Venta registrada', 'Pedido convertido en venta facturada.');
                  navigateTo('ventas');
                }}
              >
                Registrar Venta
              </Button>
            </div>
          </div>

          <Card title="Detalle de productos del pedido">
            <Table
              data={selectedPedido.items}
              columns={[
                { key: 'nombre', header: 'Producto / Servicio', render: (i) => i.nombre },
                { key: 'cantidad', header: 'Cant.', align: 'right', render: (i) => <span className="font-mono">{i.cantidad}</span> },
                { key: 'precioUnitario', header: 'Precio unit.', align: 'right', render: (i) => <span className="font-mono">{formatMoney(i.precioUnitario, selectedPedido.moneda)}</span> },
                { key: 'sub', header: 'Subtotal', align: 'right', render: (i) => <span className="font-mono font-semibold">{formatMoney(i.cantidad * i.precioUnitario * (1 - i.descuentoPct / 100), selectedPedido.moneda)}</span> },
              ]}
            />
            <div className="mt-4 flex justify-between items-center text-sm font-bold">
              <span>Total c/IVA ({selectedPedido.ivaPct}%)</span>
              <span className="font-mono text-blue-700">{formatMoney(calcPedidoTotal(selectedPedido), selectedPedido.moneda)}</span>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pedidos</h1>
            <p className="text-sm text-slate-500 mt-0.5">Órdenes comerciales, preparación de entrega y seguimiento de cumplimiento.</p>
          </div>
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setDrawerOpen(true)}>
            Nuevo pedido
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-2"><SearchInput value={query} onChange={setQuery} placeholder="Buscar folio o empresa..." /></div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: 'all', label: 'Todos los estados' }, ...['Pendiente', 'Confirmado', 'En preparación', 'Entregado', 'Cancelado'].map((s) => ({ value: s, label: s }))]} />
        </div>

        <Table
          data={filteredPedidos}
          onRowClick={(p) => setSelectedRecordId(p.id)}
          columns={[
            { key: 'folio', header: 'Folio', render: (p) => <span className="font-mono text-xs font-bold text-blue-700">{p.folio}</span> },
            { key: 'empresa', header: 'Empresa', render: (p) => getEmpresaName(p.empresaId) },
            { key: 'contacto', header: 'Cliente', render: (p) => getContactoName(p.contactoId) },
            { key: 'cotizacion', header: 'Cotización', render: (p) => <span className="font-mono text-xs">{cotizaciones.find((c) => c.id === p.cotizacionId)?.folio || 'Directo'}</span> },
            { key: 'fecha', header: 'Fecha', render: (p) => <span className="font-mono text-xs">{formatDateCL(p.fecha)}</span> },
            { key: 'monto', header: 'Monto c/IVA', align: 'right', render: (p) => <span className="font-mono tabular-nums font-semibold">{formatMoney(calcPedidoTotal(p), p.moneda)}</span> },
            { key: 'estado', header: 'Estado', render: (p) => <Badge tone={pedidoTone(p.estado)}>{p.estado}</Badge> },
            { key: 'resp', header: 'Responsable', render: (p) => <span className="text-xs">{getUser(p.responsableId)?.name}</span> },
          ]}
          rowActions={(p) => [
            { label: 'Ver pedido', onClick: () => setSelectedRecordId(p.id) },
            { label: 'Eliminar', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => setPedidos((prev) => prev.filter((x) => x.id !== p.id)) },
          ]}
        />

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Nuevo pedido comercial" width="lg">
          <form
            id="ped-form"
            onSubmit={(e) => {
              e.preventDefault();
              const prod = productos.find((p) => p.id === pedForm.productoId) || productos[0];
              const folio = `${orgSettings.folioPedidoPrefijo}${Math.floor(100 + Math.random() * 800)}`;
              setPedidos((prev) => [
                {
                  id: `ped-${Date.now()}`,
                  folio,
                  empresaId: pedForm.empresaId,
                  contactoId: pedForm.contactoId,
                  cotizacionId: pedForm.cotizacionId || undefined,
                  fecha: pedForm.fecha,
                  items: prod ? [{ id: `pi-${Date.now()}`, productoId: prod.id, nombre: prod.nombre, descripcion: prod.descripcion, cantidad: pedForm.cantidad, unidad: prod.unidad, precioUnitario: prod.precio, descuentoPct: 0, ivaPct: orgSettings.ivaPorDefecto }] : [],
                  moneda: 'CLP',
                  ivaPct: orgSettings.ivaPorDefecto,
                  estado: pedForm.estado,
                  condiciones: pedForm.condiciones,
                  responsableId: pedForm.responsableId,
                  notas: pedForm.notas,
                },
                ...prev,
              ]);
              notify('Pedido creado', folio);
              setDrawerOpen(false);
            }}
            className="space-y-4"
          >
            <FormSection title="Datos del pedido">
              <Select label="Empresa" value={pedForm.empresaId} onChange={(e) => setPedForm({ ...pedForm, empresaId: e.target.value })} options={empresas.map((e) => ({ value: e.id, label: e.nombreComercial }))} />
              <Select label="Contacto" value={pedForm.contactoId} onChange={(e) => setPedForm({ ...pedForm, contactoId: e.target.value })} options={contactos.map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))} />
              <Select label="Cotización asociada" value={pedForm.cotizacionId} onChange={(e) => setPedForm({ ...pedForm, cotizacionId: e.target.value })} options={[{ value: '', label: 'Sin cotización' }, ...cotizaciones.map((c) => ({ value: c.id, label: c.folio }))]} />
              <DatePicker label="Fecha" value={pedForm.fecha} onChange={(v) => setPedForm({ ...pedForm, fecha: v })} />
              <Select label="Producto / Servicio" value={pedForm.productoId} onChange={(e) => setPedForm({ ...pedForm, productoId: e.target.value })} options={productos.map((p) => ({ value: p.id, label: p.nombre }))} />
              <Input label="Cantidad" type="number" min={1} value={pedForm.cantidad} onChange={(e) => setPedForm({ ...pedForm, cantidad: Number(e.target.value) || 1 })} />
              <Select label="Responsable" value={pedForm.responsableId} onChange={(e) => setPedForm({ ...pedForm, responsableId: e.target.value })} options={teamMembers.map((u) => ({ value: u.id, label: u.name }))} />
              <Input label="Condiciones" value={pedForm.condiciones} onChange={(e) => setPedForm({ ...pedForm, condiciones: e.target.value })} />
              <div className="md:col-span-2"><Textarea label="Notas" value={pedForm.notas} onChange={(e) => setPedForm({ ...pedForm, notas: e.target.value })} /></div>
            </FormSection>
          </form>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="submit" form="ped-form">Crear pedido</Button>
          </div>
        </Drawer>
      </div>
    );
  }

  // ===================== VENTAS =====================
  if (section === 'ventas') {
    const selectedVenta = ventas.find((v) => v.id === selectedRecordId) || null;
    const filteredVentas = ventas.filter((v) => {
      const q = query.toLowerCase();
      if (q && !v.folio.toLowerCase().includes(q) && !getEmpresaName(v.empresaId).toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && v.estado !== statusFilter) return false;
      return true;
    });

    const ventaTone = (e: Venta['estado']): BadgeTone => {
      if (e === 'Pagada') return 'success';
      if (e === 'Facturada') return 'blue';
      if (e === 'Pendiente de pago') return 'warning';
      return 'danger';
    };

    if (selectedVenta) {
      return (
        <div className="space-y-5">
          <Button size="sm" variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedRecordId(null)}>
            Volver a Ventas
          </Button>
          <Card
            title={`${selectedVenta.folio} · ${getEmpresaName(selectedVenta.empresaId)}`}
            subtitle={selectedVenta.documentoTributario}
            actions={<Badge tone={ventaTone(selectedVenta.estado)}>{selectedVenta.estado}</Badge>}
          >
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div><dt className="text-slate-500">Monto total</dt><dd className="text-lg font-bold font-mono text-slate-900 mt-0.5">{formatMoney(selectedVenta.monto, selectedVenta.moneda)}</dd></div>
              <div><dt className="text-slate-500">Fecha emisión</dt><dd className="font-mono mt-0.5">{formatDateCL(selectedVenta.fecha)}</dd></div>
              <div><dt className="text-slate-500">Método de pago</dt><dd className="mt-0.5">{selectedVenta.metodoPago}</dd></div>
              <div><dt className="text-slate-500">Contacto</dt><dd className="mt-0.5">{getContactoName(selectedVenta.contactoId)}</dd></div>
              <div><dt className="text-slate-500">Ejecutivo</dt><dd className="mt-0.5">{getUser(selectedVenta.responsableId)?.name}</dd></div>
            </dl>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ventas</h1>
            <p className="text-sm text-slate-500 mt-0.5">Registro de ventas cerradas, documentos tributarios DTE y estado de recaudación.</p>
          </div>
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setDrawerOpen(true)}>
            Registrar venta
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-2"><SearchInput value={query} onChange={setQuery} placeholder="Buscar folio o empresa..." /></div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: 'all', label: 'Todos los estados' }, ...['Facturada', 'Pagada', 'Pendiente de pago', 'Anulada'].map((s) => ({ value: s, label: s }))]} />
        </div>

        <Table
          data={filteredVentas}
          onRowClick={(v) => setSelectedRecordId(v.id)}
          columns={[
            { key: 'folio', header: 'Folio', render: (v) => <span className="font-mono text-xs font-bold text-blue-700">{v.folio}</span> },
            { key: 'empresa', header: 'Empresa', render: (v) => getEmpresaName(v.empresaId) },
            { key: 'doc', header: 'Documento', render: (v) => <span className="text-xs">{v.documentoTributario}</span> },
            { key: 'fecha', header: 'Fecha', render: (v) => <span className="font-mono text-xs">{formatDateCL(v.fecha)}</span> },
            { key: 'monto', header: 'Monto', align: 'right', render: (v) => <span className="font-mono tabular-nums font-semibold">{formatMoney(v.monto, v.moneda)}</span> },
            { key: 'estado', header: 'Estado', render: (v) => <Badge tone={ventaTone(v.estado)}>{v.estado}</Badge> },
            { key: 'resp', header: 'Responsable', render: (v) => <span className="text-xs">{getUser(v.responsableId)?.name}</span> },
          ]}
        />

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Registrar nueva venta" width="lg">
          <form
            id="vta-form"
            onSubmit={(e) => {
              e.preventDefault();
              const folio = `VTA-2026-${Math.floor(320 + Math.random() * 600)}`;
              setVentas((prev) => [{ ...vtaForm, id: `vta-${Date.now()}`, folio }, ...prev]);
              notify('Venta registrada', folio);
              setDrawerOpen(false);
            }}
            className="space-y-4"
          >
            <FormSection title="Información de venta y DTE">
              <Select label="Empresa" value={vtaForm.empresaId} onChange={(e) => setVtaForm({ ...vtaForm, empresaId: e.target.value })} options={empresas.map((e) => ({ value: e.id, label: e.nombreComercial }))} />
              <Select label="Contacto" value={vtaForm.contactoId} onChange={(e) => setVtaForm({ ...vtaForm, contactoId: e.target.value })} options={contactos.map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))} />
              <Select label="Oportunidad" value={vtaForm.oportunidadId} onChange={(e) => setVtaForm({ ...vtaForm, oportunidadId: e.target.value })} options={[{ value: '', label: 'Ninguna' }, ...oportunidades.map((o) => ({ value: o.id, label: o.nombre }))]} />
              <Select label="Pedido" value={vtaForm.pedidoId} onChange={(e) => setVtaForm({ ...vtaForm, pedidoId: e.target.value })} options={[{ value: '', label: 'Ninguno' }, ...pedidos.map((p) => ({ value: p.id, label: p.folio }))]} />
              <CurrencyInput label="Monto" value={vtaForm.monto} currency={vtaForm.moneda} onChange={(m) => setVtaForm({ ...vtaForm, monto: m })} onCurrencyChange={(c) => setVtaForm({ ...vtaForm, moneda: c })} />
              <DatePicker label="Fecha" value={vtaForm.fecha} onChange={(v) => setVtaForm({ ...vtaForm, fecha: v })} />
              <Input label="Documento tributario" value={vtaForm.documentoTributario} onChange={(e) => setVtaForm({ ...vtaForm, documentoTributario: e.target.value })} />
              <Select label="Estado" value={vtaForm.estado} onChange={(e) => setVtaForm({ ...vtaForm, estado: e.target.value as Venta['estado'] })} options={['Facturada', 'Pagada', 'Pendiente de pago', 'Anulada'].map((s) => ({ value: s, label: s }))} />
            </FormSection>
          </form>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancelar</Button>
            <Button type="submit" form="vta-form">Guardar venta</Button>
          </div>
        </Drawer>
      </div>
    );
  }

  // ===================== POSTVENTA =====================
  const selectedCase = casosPostventa.find((c) => c.id === selectedRecordId) || null;
  const filteredCases = useMemo(() => {
    const q = query.toLowerCase();
    return casosPostventa.filter((c) => {
      if (q && !c.folio.toLowerCase().includes(q) && !c.asunto.toLowerCase().includes(q) && !getEmpresaName(c.empresaId).toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && c.estado !== statusFilter) return false;
      return true;
    });
  }, [casosPostventa, query, statusFilter, getEmpresaName]);

  const caseTone = (e: CasoPostventa['estado']): BadgeTone => {
    if (e === 'Resuelto' || e === 'Cerrado') return 'success';
    if (e === 'En proceso' || e === 'Abierto') return 'blue';
    if (e === 'En espera') return 'warning';
    return 'indigo';
  };

  if (selectedCase) {
    return (
      <div className="space-y-5">
        <Button size="sm" variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedRecordId(null)}>
          Volver a Postventa
        </Button>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-700">{selectedCase.folio}</span>
                <Badge tone={caseTone(selectedCase.estado)}>{selectedCase.estado}</Badge>
                <Badge tone={selectedCase.prioridad === 'Urgente' ? 'danger' : selectedCase.prioridad === 'Alta' ? 'warning' : 'neutral'}>
                  {selectedCase.prioridad}
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">{selectedCase.asunto}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {getEmpresaName(selectedCase.empresaId)} · {getContactoName(selectedCase.contactoId)} · {selectedCase.tipo} ({selectedCase.categoria})
              </p>
            </div>
            <select
              value={selectedCase.estado}
              onChange={(e) => {
                const st = e.target.value as CasoPostventa['estado'];
                setCasosPostventa((prev) => prev.map((x) => (x.id === selectedCase.id ? { ...x, estado: st, ultimaActualizacion: '2026-11-25' } : x)));
                notify('Estado de caso actualizado', st);
              }}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium"
            >
              {['Nuevo', 'Abierto', 'En proceso', 'En espera', 'Resuelto', 'Cerrado'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <Tabs
            activeTab={postTab}
            onChange={setPostTab}
            tabs={[
              { id: 'info', label: 'Información y Comentarios', count: selectedCase.comentarios.length },
              { id: 'timeline', label: 'Timeline e Historial' },
            ]}
          />
        </div>

        {postTab === 'info' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <Card className="lg:col-span-5" title="Detalle del requerimiento">
              <p className="text-xs text-slate-700 leading-relaxed">{selectedCase.descripcion}</p>
              <dl className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between"><dt className="text-slate-500">Responsable</dt><dd className="font-medium">{getUser(selectedCase.responsableId)?.name}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Fecha apertura</dt><dd className="font-mono">{formatDateCL(selectedCase.fecha)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Última actualización</dt><dd className="font-mono">{formatDateCL(selectedCase.ultimaActualizacion)}</dd></div>
              </dl>
            </Card>
            <Card className="lg:col-span-7" title="Comentarios y seguimiento">
              <div className="space-y-3 mb-4">
                {selectedCase.comentarios.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin comentarios aún.</p>
                ) : (
                  selectedCase.comentarios.map((cm) => (
                    <div key={cm.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{getUser(cm.autorId)?.name}</span>
                        <span className="font-mono text-slate-400">{cm.fecha}</span>
                      </div>
                      <p className="text-slate-700 mt-1">{cm.texto}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Agregar nota o respuesta al caso..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <Button
                  size="sm"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  onClick={() => {
                    if (!commentText.trim()) return;
                    setCasosPostventa((prev) =>
                      prev.map((x) =>
                        x.id === selectedCase.id
                          ? {
                              ...x,
                              ultimaActualizacion: '2026-11-25',
                              comentarios: [
                                ...x.comentarios,
                                { id: `cm-${Date.now()}`, autorId: 'usr-1', fecha: '25/11/2026 11:30', texto: commentText },
                              ],
                            }
                          : x
                      )
                    );
                    setCommentText('');
                    notify('Comentario agregado');
                  }}
                >
                  Comentar
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <Card title="Timeline del caso">
            <Timeline
              items={[
                { id: 't1', title: `Estado actual: ${selectedCase.estado}`, date: formatDateCL(selectedCase.ultimaActualizacion), type: 'Actualización' },
                { id: 't2', title: `Caso creado (${selectedCase.folio})`, date: formatDateCL(selectedCase.fecha), type: selectedCase.tipo },
              ]}
            />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Postventa y Soporte</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestión de casos, garantías, incidencias técnicas y requerimientos de clientes.</p>
        </div>
        <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setDrawerOpen(true)}>
          Nuevo caso
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="sm:col-span-2"><SearchInput value={query} onChange={setQuery} placeholder="Buscar folio, asunto o empresa..." /></div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: 'all', label: 'Todos los estados' }, ...['Nuevo', 'Abierto', 'En proceso', 'En espera', 'Resuelto', 'Cerrado'].map((s) => ({ value: s, label: s }))]} />
      </div>

      <Table
        data={filteredCases}
        onRowClick={(c) => setSelectedRecordId(c.id)}
        columns={[
          { key: 'folio', header: 'Folio', render: (c) => <span className="font-mono text-xs font-bold text-blue-700">{c.folio}</span> },
          { key: 'asunto', header: 'Asunto', render: (c) => <span className="font-medium text-slate-900">{c.asunto}</span> },
          { key: 'empresa', header: 'Empresa', render: (c) => getEmpresaName(c.empresaId) },
          { key: 'tipo', header: 'Tipo', render: (c) => <span className="text-xs">{c.tipo}</span> },
          { key: 'prioridad', header: 'Prioridad', render: (c) => <Badge tone={c.prioridad === 'Urgente' ? 'danger' : c.prioridad === 'Alta' ? 'warning' : 'neutral'}>{c.prioridad}</Badge> },
          { key: 'estado', header: 'Estado', render: (c) => <Badge tone={caseTone(c.estado)}>{c.estado}</Badge> },
          { key: 'act', header: 'Últ. act.', render: (c) => <span className="font-mono text-xs text-slate-500">{formatDateCL(c.ultimaActualizacion)}</span> },
        ]}
        rowActions={(c) => [
          { label: 'Abrir caso', icon: <MessageSquare className="w-3.5 h-3.5" />, onClick: () => setSelectedRecordId(c.id) },
          { label: 'Marcar resuelto', icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => setCasosPostventa((prev) => prev.map((x) => (x.id === c.id ? { ...x, estado: 'Resuelto' } : x))) },
        ]}
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Nuevo caso de postventa" width="lg">
        <form
          id="cas-form"
          onSubmit={(e) => {
            e.preventDefault();
            const folio = `CAS-2026-0${Math.floor(200 + Math.random() * 799)}`;
            setCasosPostventa((prev) => [
              {
                ...casForm,
                id: `cas-${Date.now()}`,
                folio,
                fecha: '2026-11-25',
                ultimaActualizacion: '2026-11-25',
                etiquetas: [],
                comentarios: [],
              },
              ...prev,
            ]);
            notify('Caso abierto', folio);
            setDrawerOpen(false);
          }}
          className="space-y-4"
        >
          <FormSection title="Datos del ticket">
            <div className="md:col-span-2">
              <Input label="Asunto" required value={casForm.asunto} onChange={(e) => setCasForm({ ...casForm, asunto: e.target.value })} />
            </div>
            <Select label="Empresa" value={casForm.empresaId} onChange={(e) => setCasForm({ ...casForm, empresaId: e.target.value })} options={empresas.map((e) => ({ value: e.id, label: e.nombreComercial }))} />
            <Select label="Contacto" value={casForm.contactoId} onChange={(e) => setCasForm({ ...casForm, contactoId: e.target.value })} options={contactos.map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))} />
            <Select label="Tipo" value={casForm.tipo} onChange={(e) => setCasForm({ ...casForm, tipo: e.target.value as CasoPostventa['tipo'] })} options={['Soporte técnico', 'Reclamo', 'Garantía', 'Consultoría', 'Solicitud comercial'].map((t) => ({ value: t, label: t }))} />
            <Select label="Prioridad" value={casForm.prioridad} onChange={(e) => setCasForm({ ...casForm, prioridad: e.target.value as PriorityLevel })} options={['Baja', 'Media', 'Alta', 'Urgente'].map((p) => ({ value: p, label: p }))} />
            <Select label="Responsable" value={casForm.responsableId} onChange={(e) => setCasForm({ ...casForm, responsableId: e.target.value })} options={teamMembers.map((u) => ({ value: u.id, label: u.name }))} />
            <Input label="Categoría" value={casForm.categoria} onChange={(e) => setCasForm({ ...casForm, categoria: e.target.value })} />
            <div className="md:col-span-2">
              <Textarea label="Descripción" required value={casForm.descripcion} onChange={(e) => setCasForm({ ...casForm, descripcion: e.target.value })} />
            </div>
          </FormSection>
        </form>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
          <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancelar</Button>
          <Button type="submit" form="cas-form">Crear caso</Button>
        </div>
      </Drawer>
    </div>
  );
};
