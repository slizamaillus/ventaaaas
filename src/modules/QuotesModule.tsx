import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  FilePlus2,
  History,
  Plus,
  Printer,
  Send,
  ShoppingCart,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { Cotizacion, CotizacionItem, CurrencyCode, EstadoCotizacion } from '../types/crm';
import { Badge, BadgeTone, Button, Card, EmptyState, IconButton } from '../components/ds/primitives';
import { DatePicker, FormSection, Input, SearchInput, Select, Textarea } from '../components/ds/forms';
import { Drawer, Modal, Table, Tabs } from '../components/ds/data';
import { formatCurrency, formatDateCL } from '../data/chileGeo';

function calcQuoteTotals(q: Pick<Cotizacion, 'items' | 'descuentoGlobalPct' | 'ivaPct' | 'otrosImpuestosPct'>) {
  const bruto = q.items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
  const descLineas = q.items.reduce(
    (acc, it) => acc + it.cantidad * it.precioUnitario * (it.descuentoPct / 100),
    0
  );
  const subtotal = Math.max(0, bruto - descLineas);
  const descGlobal = subtotal * ((q.descuentoGlobalPct || 0) / 100);
  const neto = Math.max(0, subtotal - descGlobal);
  const iva = Math.round(neto * (q.ivaPct / 100));
  const otros = Math.round(neto * ((q.otrosImpuestosPct || 0) / 100));
  const total = neto + iva + otros;
  return { bruto, descuentos: descLineas + descGlobal, neto, iva, otros, total };
}

export const QuotesModule: React.FC = () => {
  const {
    cotizaciones,
    setCotizaciones,
    empresas,
    contactos,
    oportunidades,
    productos,
    setPedidos,
    teamMembers,
    orgSettings,
    selectedRecordId,
    setSelectedRecordId,
    navigateTo,
    formatMoney,
    notify,
    addAuditLog,
    getEmpresaName,
    getContactoName,
    getUser,
  } = useCRM();

  const [query, setQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState('documento');
  const [deleteTarget, setDeleteTarget] = useState<Cotizacion | null>(null);

  const [formData, setFormData] = useState<Omit<Cotizacion, 'id' | 'versiones' | 'versionActual'>>({
    folio: `${orgSettings.folioCotizacionPrefijo}0150`,
    nombre: '',
    empresaId: empresas[0]?.id || '',
    contactoId: contactos[0]?.id || '',
    oportunidadId: '',
    responsableId: 'usr-1',
    fecha: '2026-11-25',
    vencimiento: '2026-12-10',
    moneda: orgSettings.monedaPredeterminada,
    items: [],
    descuentoGlobalPct: 0,
    ivaPct: orgSettings.ivaPorDefecto,
    otrosImpuestosPct: 0,
    estado: 'Borrador',
    formaPago: 'Transferencia electrónica / Orden de Compra',
    plazoPago: '30 días fecha factura',
    vigenciaDias: 15,
    entrega: '10 días hábiles desde emisión de OC',
    garantia: '12 meses de garantía funcional',
    notas: 'Precios más IVA (19%).',
    descripcion: '',
    comentarios: '',
  });

  const selectedQuote = useMemo(
    () => cotizaciones.find((q) => q.id === selectedRecordId) || null,
    [cotizaciones, selectedRecordId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cotizaciones.filter((c) => {
      if (q && !c.folio.toLowerCase().includes(q) && !c.nombre.toLowerCase().includes(q) && !getEmpresaName(c.empresaId).toLowerCase().includes(q)) return false;
      if (estadoFilter !== 'all' && c.estado !== estadoFilter) return false;
      return true;
    });
  }, [cotizaciones, query, estadoFilter, getEmpresaName]);

  const estadoTone = (est: EstadoCotizacion): BadgeTone => {
    if (est === 'Aceptada') return 'success';
    if (est === 'Enviada' || est === 'Vista') return 'blue';
    if (est === 'En revisión') return 'warning';
    if (est === 'Rechazada' || est === 'Vencida' || est === 'Cancelada') return 'danger';
    return 'neutral';
  };

  const openCreate = () => {
    setEditingId(null);
    const firstProd = productos[0];
    setFormData({
      folio: `${orgSettings.folioCotizacionPrefijo}${Math.floor(150 + Math.random() * 800)}`,
      nombre: '',
      empresaId: empresas[0]?.id || '',
      contactoId: contactos[0]?.id || '',
      oportunidadId: oportunidades[0]?.id || '',
      responsableId: 'usr-1',
      fecha: '2026-11-25',
      vencimiento: '2026-12-10',
      moneda: orgSettings.monedaPredeterminada,
      items: firstProd
        ? [
            {
              id: `ci-${Date.now()}`,
              productoId: firstProd.id,
              nombre: firstProd.nombre,
              descripcion: firstProd.descripcion,
              cantidad: 1,
              unidad: firstProd.unidad,
              precioUnitario: firstProd.precio,
              descuentoPct: 0,
              ivaPct: orgSettings.ivaPorDefecto,
            },
          ]
        : [],
      descuentoGlobalPct: 0,
      ivaPct: orgSettings.ivaPorDefecto,
      otrosImpuestosPct: 0,
      estado: 'Borrador',
      formaPago: 'Transferencia electrónica / Orden de Compra',
      plazoPago: '30 días fecha factura',
      vigenciaDias: 15,
      entrega: '10 días hábiles desde emisión de OC',
      garantia: '12 meses de garantía funcional',
      notas: 'Precios expresados más IVA (19%).',
      descripcion: '',
      comentarios: '',
    });
    setFormOpen(true);
  };

  const openEdit = (q: Cotizacion) => {
    setEditingId(q.id);
    const { id: _id, versiones: _v, versionActual: _va, ...rest } = q;
    setFormData(rest);
    setFormOpen(true);
  };

  const addLineItem = (prodId: string) => {
    const p = productos.find((x) => x.id === prodId) || productos[0];
    if (!p) return;
    const item: CotizacionItem = {
      id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      productoId: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      cantidad: 1,
      unidad: p.unidad,
      precioUnitario: p.precio,
      descuentoPct: 0,
      ivaPct: formData.ivaPct,
    };
    setFormData((prev) => ({ ...prev, items: [...prev.items, item] }));
  };

  const updateLine = (id: string, patch: Partial<CotizacionItem>) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const { total } = calcQuoteTotals(formData);
    if (editingId) {
      setCotizaciones((prev) =>
        prev.map((q) => (q.id === editingId ? { ...q, ...formData } : q))
      );
      addAuditLog('Cotizaciones', 'Edición', `Actualizó cotización ${formData.folio}`);
      notify('Cotización actualizada', formData.folio);
    } else {
      const next: Cotizacion = {
        ...formData,
        id: `cot-${Date.now()}`,
        versionActual: 'v1.0',
        versiones: [
          {
            version: 'v1.0',
            fecha: formData.fecha,
            autorId: formData.responsableId,
            resumenCambio: 'Emisión inicial.',
            total,
          },
        ],
      };
      setCotizaciones((prev) => [next, ...prev]);
      addAuditLog('Cotizaciones', 'Creación', `Creó cotización ${formData.folio}`);
      notify('Cotización creada', formData.folio);
    }
    setFormOpen(false);
  };

  const createNewVersion = (q: Cotizacion) => {
    const nextNum = q.versiones.length + 1;
    const verLabel = `v${nextNum}.0`;
    const { total } = calcQuoteTotals(q);
    setCotizaciones((prev) =>
      prev.map((x) =>
        x.id === q.id
          ? {
              ...x,
              versionActual: verLabel,
              versiones: [
                ...x.versiones,
                {
                  version: verLabel,
                  fecha: '2026-11-25',
                  autorId: x.responsableId,
                  resumenCambio: 'Nueva revisión comercial generada.',
                  total,
                },
              ],
            }
          : x
      )
    );
    notify('Nueva versión creada', `${q.folio} actualizada a ${verLabel}`);
  };

  const changeStatus = (q: Cotizacion, estado: EstadoCotizacion) => {
    setCotizaciones((prev) => prev.map((x) => (x.id === q.id ? { ...x, estado } : x)));
    addAuditLog('Cotizaciones', 'Edición', `Cambió estado de ${q.folio} a ${estado}`);
    notify(`Cotización ${estado}`, q.folio);
  };

  const convertToOrder = (q: Cotizacion) => {
    const folio = `${orgSettings.folioPedidoPrefijo}${Math.floor(100 + Math.random() * 800)}`;
    setPedidos((prev) => [
      {
        id: `ped-${Date.now()}`,
        folio,
        empresaId: q.empresaId,
        contactoId: q.contactoId,
        cotizacionId: q.id,
        fecha: '2026-11-25',
        items: q.items,
        moneda: q.moneda,
        ivaPct: q.ivaPct,
        estado: 'Confirmado',
        condiciones: q.plazoPago,
        responsableId: q.responsableId,
        notas: `Generado desde cotización ${q.folio}.`,
      },
      ...prev,
    ]);
    notify('Pedido generado desde cotización', `Folio ${folio} creado.`);
    navigateTo('pedidos');
  };

  // DETAIL & DOCUMENT PREVIEW VIEW
  if (selectedQuote) {
    const emp = empresas.find((e) => e.id === selectedQuote.empresaId);
    const con = contactos.find((c) => c.id === selectedQuote.contactoId);
    const owner = getUser(selectedQuote.responsableId);
    const totals = calcQuoteTotals(selectedQuote);

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between no-print">
          <Button size="sm" variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedRecordId(null)}>
            Volver a Cotizaciones
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 no-print">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-blue-700">{selectedQuote.folio}</span>
                <Badge tone={estadoTone(selectedQuote.estado)}>{selectedQuote.estado}</Badge>
                <Badge tone="neutral">{selectedQuote.versionActual}</Badge>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-1">{selectedQuote.nombre}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {emp?.nombreComercial} · {con ? `${con.nombre} ${con.apellido}` : '—'} · Vencimiento:{' '}
                <span className="font-mono">{formatDateCL(selectedQuote.vencimiento)}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="primary" leftIcon={<Send className="w-3.5 h-3.5" />} onClick={() => changeStatus(selectedQuote, 'Enviada')}>
                Enviar
              </Button>
              <Button size="sm" variant="outline" leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />} onClick={() => changeStatus(selectedQuote, 'Aceptada')}>
                Aceptar
              </Button>
              <Button size="sm" variant="outline" leftIcon={<ShoppingCart className="w-3.5 h-3.5" />} onClick={() => convertToOrder(selectedQuote)}>
                Generar Pedido
              </Button>
              <Button size="sm" variant="outline" leftIcon={<XCircle className="w-3.5 h-3.5 text-red-600" />} onClick={() => changeStatus(selectedQuote, 'Rechazada')}>
                Rechazar
              </Button>
              <Button size="sm" variant="outline" leftIcon={<FilePlus2 className="w-3.5 h-3.5" />} onClick={() => createNewVersion(selectedQuote)}>
                Nueva versión
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Printer className="w-3.5 h-3.5" />} onClick={() => window.print()}>
                Imprimir
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={() => notify('PDF generado (Vista previa)', `${selectedQuote.folio}.pdf descargado.`)}>
                Descargar
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => openEdit(selectedQuote)}>
                Editar
              </Button>
              <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteTarget(selectedQuote)}>
                Eliminar
              </Button>
            </div>
          </div>

          <Tabs
            activeTab={detailTab}
            onChange={setDetailTab}
            tabs={[
              { id: 'documento', label: 'Vista previa de documento' },
              { id: 'versiones', label: 'Historial de versiones', count: selectedQuote.versiones.length },
              { id: 'condiciones', label: 'Condiciones y notas' },
            ]}
          />
        </div>

        {detailTab === 'documento' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/aistudio/logo_595a16cf.png"
                    alt="illus Ventas"
                    referrerPolicy="no-referrer"
                    className="h-6 w-auto object-contain shrink-0"
                  />
                  <div className="border-l border-slate-200 pl-3">
                    <div className="text-base font-bold text-slate-900">{orgSettings.razonSocial}</div>
                    <div className="text-xs font-mono text-slate-500">RUT: {orgSettings.rut}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  {orgSettings.direccion}, {orgSettings.comuna}, {orgSettings.region}
                </p>
                <p className="text-xs text-slate-500">{orgSettings.email} · {orgSettings.telefono}</p>
              </div>

              <div className="sm:text-right space-y-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cotización Comercial</div>
                <div className="text-xl font-bold font-mono text-blue-700">{selectedQuote.folio}</div>
                <div className="text-xs text-slate-600 font-mono">
                  Emisión: {formatDateCL(selectedQuote.fecha)} · Vence: {formatDateCL(selectedQuote.vencimiento)}
                </div>
                <div className="text-xs text-slate-500">Versión {selectedQuote.versionActual}</div>
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 border border-slate-200 rounded-xl p-4 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-slate-400 uppercase">Cliente</div>
                <div className="text-sm font-bold text-slate-900">{emp?.razonSocial || '—'}</div>
                <div className="font-mono text-slate-600">RUT: {emp?.rut || '—'}</div>
                <div className="text-slate-600">{emp?.direccion} {emp?.numero}, {emp?.comuna}</div>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-slate-400 uppercase">Atención a</div>
                <div className="text-sm font-semibold text-slate-900">{con ? `${con.nombre} ${con.apellido}` : '—'}</div>
                <div className="text-slate-600">{con?.cargo} · {con?.email}</div>
                <div className="text-slate-600">Ejecutivo: {owner?.name}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="px-4 py-3 font-semibold">Descripción</th>
                    <th className="px-3 py-3 font-semibold text-right">Cant.</th>
                    <th className="px-3 py-3 font-semibold">Unidad</th>
                    <th className="px-3 py-3 font-semibold text-right">Precio Unit.</th>
                    <th className="px-3 py-3 font-semibold text-right">Desc.</th>
                    <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedQuote.items.map((it) => {
                    const lineSub = it.cantidad * it.precioUnitario * (1 - it.descuentoPct / 100);
                    return (
                      <tr key={it.id}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{it.nombre}</div>
                          <div className="text-slate-500 mt-0.5">{it.descripcion}</div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">{it.cantidad}</td>
                        <td className="px-3 py-3 text-slate-600">{it.unidad}</td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">{formatCurrency(it.precioUnitario, selectedQuote.moneda)}</td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">{it.descuentoPct}%</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatCurrency(lineSub, selectedQuote.moneda)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals & Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-7 space-y-2 text-xs text-slate-600">
                <div className="font-semibold text-slate-900">Condiciones comerciales</div>
                <p><strong>Forma de pago:</strong> {selectedQuote.formaPago}</p>
                <p><strong>Plazo de pago:</strong> {selectedQuote.plazoPago}</p>
                <p><strong>Entrega / Plazo:</strong> {selectedQuote.entrega}</p>
                <p><strong>Garantía:</strong> {selectedQuote.garantia}</p>
                {selectedQuote.notas && <p className="pt-2 text-slate-500">{selectedQuote.notas}</p>}
              </div>

              <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-600">Subtotal neto</span><span className="font-mono tabular-nums">{formatCurrency(totals.neto, selectedQuote.moneda)}</span></div>
                {totals.descuentos > 0 && (
                  <div className="flex justify-between text-emerald-700"><span>Descuentos aplicados</span><span className="font-mono tabular-nums">-{formatCurrency(totals.descuentos, selectedQuote.moneda)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-600">IVA ({selectedQuote.ivaPct}%)</span><span className="font-mono tabular-nums">{formatCurrency(totals.iva, selectedQuote.moneda)}</span></div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Total {selectedQuote.moneda}</span>
                  <span className="font-mono tabular-nums text-blue-700">{formatCurrency(totals.total, selectedQuote.moneda)}</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
              <div className="pt-8 border-t border-slate-300 mx-6">
                Firma Emisor · {owner?.name}
              </div>
              <div className="pt-8 border-t border-slate-300 mx-6">
                Aceptación Cliente · {emp?.razonSocial}
              </div>
            </div>
          </div>
        )}

        {detailTab === 'versiones' && (
          <Card title="Historial de versiones" subtitle="Control de cambios emitidos al cliente">
            <div className="divide-y divide-slate-100">
              {selectedQuote.versiones.map((v) => (
                <div key={v.version} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-blue-700" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {v.version} · {v.resumenCambio}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDateCL(v.fecha)} · {getUser(v.autorId)?.name}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono tabular-nums text-sm font-semibold text-slate-900">
                    {formatCurrency(v.total, selectedQuote.moneda)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {detailTab === 'condiciones' && (
          <Card title="Detalles internos y observaciones">
            <div className="space-y-3 text-xs text-slate-700">
              <p><strong>Descripción:</strong> {selectedQuote.descripcion || '—'}</p>
              <p><strong>Comentarios internos:</strong> {selectedQuote.comentarios || '—'}</p>
              <p><strong>Vigencia:</strong> {selectedQuote.vigenciaDias} días corridos</p>
            </div>
          </Card>
        )}
      </div>
    );
  }

  const editorTotals = calcQuoteTotals(formData);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Presupuestos comerciales en CLP, UF, USD o EUR con IVA configurable y control de versiones.
          </p>
        </div>
        <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>
          Nueva cotización
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="sm:col-span-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar por folio, nombre o empresa..." />
        </div>
        <Select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Todos los estados' },
            ...['Borrador', 'En revisión', 'Enviada', 'Vista', 'Aceptada', 'Rechazada', 'Vencida', 'Cancelada'].map((s) => ({ value: s, label: s })),
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin cotizaciones"
          description="Crea una nueva cotización seleccionando productos del catálogo."
          actionLabel="Nueva cotización"
          onAction={openCreate}
        />
      ) : (
        <Table
          data={filtered}
          onRowClick={(q) => setSelectedRecordId(q.id)}
          columns={[
            { key: 'folio', header: 'Folio', render: (q) => <span className="font-mono text-xs font-bold text-blue-700">{q.folio}</span> },
            { key: 'nombre', header: 'Nombre', render: (q) => <span className="font-medium text-slate-900">{q.nombre}</span> },
            { key: 'empresa', header: 'Empresa', render: (q) => getEmpresaName(q.empresaId) },
            { key: 'vencimiento', header: 'Vencimiento', render: (q) => <span className="font-mono text-xs">{formatDateCL(q.vencimiento)}</span> },
            {
              key: 'neto',
              header: 'Neto',
              align: 'right',
              render: (q) => <span className="font-mono tabular-nums text-xs">{formatMoney(calcQuoteTotals(q).neto, q.moneda)}</span>,
            },
            {
              key: 'total',
              header: 'Total c/IVA',
              align: 'right',
              render: (q) => <span className="font-mono tabular-nums font-semibold text-slate-900">{formatMoney(calcQuoteTotals(q).total, q.moneda)}</span>,
            },
            { key: 'estado', header: 'Estado', render: (q) => <Badge tone={estadoTone(q.estado)}>{q.estado}</Badge> },
            { key: 'responsable', header: 'Responsable', render: (q) => <span className="text-xs text-slate-600">{getUser(q.responsableId)?.name}</span> },
          ]}
          rowActions={(q) => [
            { label: 'Vista previa documento', onClick: () => setSelectedRecordId(q.id) },
            { label: 'Editar cotización', icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => openEdit(q) },
            {
              label: 'Duplicar',
              icon: <Copy className="w-3.5 h-3.5" />,
              onClick: () => {
                setCotizaciones((prev) => [{ ...q, id: `cot-${Date.now()}`, folio: `${orgSettings.folioCotizacionPrefijo}${Math.floor(150 + Math.random() * 800)}`, estado: 'Borrador' }, ...prev]);
                notify('Cotización duplicada');
              },
            },
            { label: 'Eliminar', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, dividerBefore: true, onClick: () => setDeleteTarget(q) },
          ]}
        />
      )}

      {/* Quote Editor Drawer */}
      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? `Editar ${formData.folio}` : 'Nueva cotización comercial'}
        subtitle="Editor de líneas de productos, descuentos e IVA configurable"
        width="xl"
      >
        <form id="quote-form" onSubmit={handleSaveForm} className="space-y-6">
          <FormSection title="1. Información general">
            <Input label="Folio" required value={formData.folio} onChange={(e) => setFormData({ ...formData, folio: e.target.value })} className="font-mono" />
            <Select label="Estado" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoCotizacion })} options={['Borrador', 'En revisión', 'Enviada', 'Vista', 'Aceptada', 'Rechazada', 'Vencida', 'Cancelada'].map((s) => ({ value: s, label: s }))} />
            <div className="md:col-span-2">
              <Input label="Título de cotización" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Propuesta Licenciamiento y Soporte 2027" />
            </div>
            <Select label="Empresa" value={formData.empresaId} onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })} options={empresas.map((em) => ({ value: em.id, label: em.nombreComercial }))} />
            <Select label="Contacto" value={formData.contactoId} onChange={(e) => setFormData({ ...formData, contactoId: e.target.value })} options={contactos.map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))} />
            <Select label="Oportunidad vinculada" value={formData.oportunidadId || ''} onChange={(e) => setFormData({ ...formData, oportunidadId: e.target.value })} options={[{ value: '', label: 'Sin oportunidad' }, ...oportunidades.map((o) => ({ value: o.id, label: o.nombre }))]} />
            <Select label="Responsable" value={formData.responsableId} onChange={(e) => setFormData({ ...formData, responsableId: e.target.value })} options={teamMembers.map((u) => ({ value: u.id, label: u.name }))} />
            <DatePicker label="Fecha de emisión" value={formData.fecha} onChange={(v) => setFormData({ ...formData, fecha: v })} />
            <DatePicker label="Fecha de vencimiento" value={formData.vencimiento} onChange={(v) => setFormData({ ...formData, vencimiento: v })} />
          </FormSection>

          {/* 2. Line Items Editor */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">2. Productos y servicios</h4>
                <p className="text-xs text-slate-500">Agrega ítems del catálogo y ajusta cantidades o descuentos.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Agregar desde catálogo"
                  onChange={(e) => {
                    if (e.target.value) {
                      addLineItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 cursor-pointer"
                >
                  <option value="">+ Agregar del catálogo...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({formatCurrency(p.precio, p.moneda)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2.5">
              {formData.items.map((it) => (
                <div key={it.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl items-end">
                  <div className="sm:col-span-4">
                    <Input label="Ítem" value={it.nombre} onChange={(e) => updateLine(it.id, { nombre: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label="Cant." type="number" min={1} value={it.cantidad} onChange={(e) => updateLine(it.id, { cantidad: Number(e.target.value) || 1 })} />
                  </div>
                  <div className="sm:col-span-3">
                    <Input label="Precio unit." type="number" min={0} value={it.precioUnitario} onChange={(e) => updateLine(it.id, { precioUnitario: Number(e.target.value) || 0 })} className="font-mono" />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label="Desc %" type="number" min={0} max={100} value={it.descuentoPct} onChange={(e) => updateLine(it.id, { descuentoPct: Number(e.target.value) || 0 })} className="font-mono" />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <IconButton label="Quitar ítem" size="sm" onClick={() => setFormData((p) => ({ ...p, items: p.items.filter((x) => x.id !== it.id) }))}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <FormSection title="3. Totales e impuestos">
            <Select label="Moneda" value={formData.moneda} onChange={(e) => setFormData({ ...formData, moneda: e.target.value as CurrencyCode })} options={['CLP', 'UF', 'USD', 'EUR'].map((m) => ({ value: m, label: m }))} />
            <Input label="IVA (%)" type="number" min={0} max={30} value={formData.ivaPct} onChange={(e) => setFormData({ ...formData, ivaPct: Number(e.target.value) || 0 })} className="font-mono" />
            <Input label="Descuento global (%)" type="number" min={0} max={100} value={formData.descuentoGlobalPct} onChange={(e) => setFormData({ ...formData, descuentoGlobalPct: Number(e.target.value) || 0 })} className="font-mono" />
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between"><span>Neto:</span><strong className="font-mono">{formatCurrency(editorTotals.neto, formData.moneda)}</strong></div>
              <div className="flex justify-between"><span>IVA ({formData.ivaPct}%):</span><strong className="font-mono">{formatCurrency(editorTotals.iva, formData.moneda)}</strong></div>
              <div className="flex justify-between text-sm text-blue-700 pt-1 border-t border-slate-200"><span>Total:</span><strong className="font-mono">{formatCurrency(editorTotals.total, formData.moneda)}</strong></div>
            </div>
          </FormSection>

          <FormSection title="4. Condiciones comerciales">
            <Input label="Forma de pago" value={formData.formaPago} onChange={(e) => setFormData({ ...formData, formaPago: e.target.value })} />
            <Input label="Plazo" value={formData.plazoPago} onChange={(e) => setFormData({ ...formData, plazoPago: e.target.value })} />
            <Input label="Entrega" value={formData.entrega} onChange={(e) => setFormData({ ...formData, entrega: e.target.value })} />
            <Input label="Garantía" value={formData.garantia} onChange={(e) => setFormData({ ...formData, garantia: e.target.value })} />
            <div className="md:col-span-2">
              <Textarea label="Notas de pie de cotización" value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} />
            </div>
          </FormSection>
        </form>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
          <Button type="submit" form="quote-form">{editingId ? 'Guardar cambios' : 'Crear cotización'}</Button>
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
                setCotizaciones((prev) => prev.filter((x) => x.id !== deleteTarget.id));
                if (selectedRecordId === deleteTarget.id) setSelectedRecordId(null);
                notify('Cotización eliminada', deleteTarget.folio, 'warning');
                setDeleteTarget(null);
              }}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">¿Eliminar la cotización <strong>{deleteTarget?.folio}</strong>?</p>
      </Modal>
    </div>
  );
};
