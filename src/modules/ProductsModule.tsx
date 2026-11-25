import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Copy,
  Download,
  Edit3,
  Package,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { CurrencyCode, Producto } from '../types/crm';
import { Badge, BadgeTone, Button, Card, EmptyState } from '../components/ds/primitives';
import { Checkbox, CurrencyInput, FormSection, Input, MultiSelect, SearchInput, Select, Textarea } from '../components/ds/forms';
import { Drawer, Modal, Table, Tabs } from '../components/ds/data';
import { formatDateCL } from '../data/chileGeo';

export const ProductsModule: React.FC = () => {
  const {
    productos,
    setProductos,
    cotizaciones,
    pedidos,
    catalogs,
    selectedRecordId,
    setSelectedRecordId,
    navigateTo,
    formatMoney,
    notify,
  } = useCRM();

  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('general');

  const [formData, setFormData] = useState<Omit<Producto, 'id' | 'fechaCreacion'>>({
    codigo: '',
    sku: '',
    nombre: '',
    descripcion: '',
    tipo: 'Servicio',
    categoria: catalogs.categoriasProducto[0],
    unidad: 'Unidad',
    precio: 500000,
    moneda: 'CLP',
    ivaAfecto: true,
    costo: 200000,
    estado: 'Activo',
    disponibilidad: 'Disponible',
    etiquetas: [],
  });

  const selectedProduct = useMemo(
    () => productos.find((p) => p.id === selectedRecordId) || null,
    [productos, selectedRecordId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos.filter((p) => {
      if (q && !p.nombre.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !p.codigo.toLowerCase().includes(q)) return false;
      if (catFilter !== 'all' && p.categoria !== catFilter) return false;
      if (typeFilter !== 'all' && p.tipo !== typeFilter) return false;
      if (statusFilter !== 'all' && p.estado !== statusFilter) return false;
      return true;
    });
  }, [productos, query, catFilter, typeFilter, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      codigo: `PRD-${Math.floor(100 + Math.random() * 899)}`,
      sku: `AT-${Math.floor(1000 + Math.random() * 8999)}`,
      nombre: '',
      descripcion: '',
      tipo: 'Servicio',
      categoria: catalogs.categoriasProducto[0],
      unidad: 'Unidad',
      precio: 500000,
      moneda: 'CLP',
      ivaAfecto: true,
      costo: 200000,
      estado: 'Activo',
      disponibilidad: 'Disponible',
      etiquetas: [],
    });
    setFormOpen(true);
  };

  const openEdit = (p: Producto) => {
    setEditingId(p.id);
    const { id: _id, fechaCreacion: _fc, ...rest } = p;
    setFormData(rest);
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setProductos((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...formData } : p)));
      notify('Producto actualizado', formData.nombre);
    } else {
      setProductos((prev) => [{ ...formData, id: `prd-${Date.now()}`, fechaCreacion: '2026-11-25' }, ...prev]);
      notify('Producto creado', formData.nombre);
    }
    setFormOpen(false);
  };

  const marginPct = (precio: number, costo: number) => {
    if (precio <= 0) return 0;
    return Math.round(((precio - costo) / precio) * 100);
  };

  const dispTone = (d: Producto['disponibilidad']): BadgeTone => {
    if (d === 'Disponible') return 'success';
    if (d === 'Bajo stock' || d === 'Bajo pedido') return 'warning';
    return 'danger';
  };

  if (selectedProduct) {
    const assocQuotes = cotizaciones.filter((q) => q.items.some((i) => i.productoId === selectedProduct.id));
    const assocOrders = pedidos.filter((p) => p.items.some((i) => i.productoId === selectedProduct.id));

    return (
      <div className="space-y-5">
        <Button size="sm" variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedRecordId(null)}>
          Volver al catálogo
        </Button>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{selectedProduct.nombre}</h1>
                  <Badge tone={selectedProduct.estado === 'Activo' ? 'success' : 'neutral'}>{selectedProduct.estado}</Badge>
                  <Badge tone={dispTone(selectedProduct.disponibilidad)}>{selectedProduct.disponibilidad}</Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  SKU: {selectedProduct.sku} · Código: {selectedProduct.codigo} · {selectedProduct.tipo} · {selectedProduct.categoria}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" leftIcon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => openEdit(selectedProduct)}>
                Editar
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<Copy className="w-3.5 h-3.5" />} onClick={() => {
                setProductos((prev) => [{ ...selectedProduct, id: `prd-${Date.now()}`, nombre: `${selectedProduct.nombre} (Copia)`, sku: `${selectedProduct.sku}-C` }, ...prev]);
                notify('Producto duplicado');
              }}>
                Duplicar
              </Button>
            </div>
          </div>

          <Tabs
            activeTab={detailTab}
            onChange={setDetailTab}
            tabs={[
              { id: 'general', label: 'Información general y precios' },
              { id: 'cotizaciones', label: 'Cotizaciones asociadas', count: assocQuotes.length },
              { id: 'pedidos', label: 'Pedidos asociados', count: assocOrders.length },
            ]}
          />
        </div>

        {detailTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card title="Especificaciones">
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between"><dt className="text-slate-500">Tipo</dt><dd className="font-medium">{selectedProduct.tipo}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Categoría</dt><dd>{selectedProduct.categoria}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Unidad de medida</dt><dd>{selectedProduct.unidad}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Afecto a IVA (19%)</dt><dd>{selectedProduct.ivaAfecto ? 'Sí' : 'Exento'}</dd></div>
                <div className="pt-2 border-t border-slate-100">
                  <dt className="text-slate-500 mb-1">Descripción</dt>
                  <dd className="text-slate-700 leading-relaxed">{selectedProduct.descripcion}</dd>
                </div>
              </dl>
            </Card>
            <Card title="Estructura de precios y margen">
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between"><dt className="text-slate-500">Precio lista neto</dt><dd className="font-mono font-bold text-slate-900">{formatMoney(selectedProduct.precio, selectedProduct.moneda)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Costo estimado</dt><dd className="font-mono text-slate-700">{formatMoney(selectedProduct.costo, selectedProduct.moneda)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Margen bruto</dt><dd className="font-mono font-semibold text-emerald-700">{marginPct(selectedProduct.precio, selectedProduct.costo)}%</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Listas de precios</dt><dd className="text-slate-500">Lista Estándar CLP (Preparado para multi-lista)</dd></div>
              </dl>
            </Card>
          </div>
        )}

        {detailTab === 'cotizaciones' && (
          <Table
            data={assocQuotes}
            onRowClick={(q) => navigateTo('cotizaciones', q.id)}
            columns={[
              { key: 'folio', header: 'Folio', render: (q) => <span className="font-mono text-blue-700">{q.folio}</span> },
              { key: 'nombre', header: 'Título', render: (q) => q.nombre },
              { key: 'estado', header: 'Estado', render: (q) => <Badge tone="blue">{q.estado}</Badge> },
            ]}
          />
        )}

        {detailTab === 'pedidos' && (
          <Table
            data={assocOrders}
            onRowClick={(p) => navigateTo('pedidos', p.id)}
            columns={[
              { key: 'folio', header: 'Folio', render: (p) => <span className="font-mono text-blue-700">{p.folio}</span> },
              { key: 'fecha', header: 'Fecha', render: (p) => formatDateCL(p.fecha) },
              { key: 'estado', header: 'Estado', render: (p) => <Badge tone="success">{p.estado}</Badge> },
            ]}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Productos y servicios</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Catálogo comercial unificado con precios, costos, márgenes y disponibilidad para cotizaciones.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" leftIcon={<Upload className="w-3.5 h-3.5" />} onClick={() => setImportOpen(true)}>
            Importar
          </Button>
          <Button size="sm" variant="outline" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={() => notify('Catálogo exportado', `${filtered.length} ítems exportados.`)}>
            Exportar
          </Button>
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openCreate}>
            Nuevo producto
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="lg:col-span-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre, código o SKU..." />
        </div>
        <Select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          options={[{ value: 'all', label: 'Todas las categorías' }, ...catalogs.categoriasProducto.map((c) => ({ value: c, label: c }))]}
        />
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[{ value: 'all', label: 'Todos los tipos' }, ...['Producto', 'Servicio', 'Suscripción', 'Implementación'].map((t) => ({ value: t, label: t }))]}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ value: 'all', label: 'Todos los estados' }, { value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' }, { value: 'Archivado', label: 'Archivado' }]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Sin productos" description="Agrega un producto o servicio al catálogo." actionLabel="Nuevo producto" onAction={openCreate} />
      ) : (
        <Table
          data={filtered}
          selectedIds={selectedIds}
          onToggleSelect={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          onToggleSelectAll={setSelectedIds}
          onRowClick={(p) => setSelectedRecordId(p.id)}
          columns={[
            { key: 'sku', header: 'Código / SKU', render: (p) => <span className="font-mono text-xs text-slate-600">{p.sku}</span> },
            { key: 'nombre', header: 'Nombre', render: (p) => <span className="font-semibold text-slate-900">{p.nombre}</span> },
            { key: 'tipo', header: 'Tipo', render: (p) => <Badge tone="neutral">{p.tipo}</Badge> },
            { key: 'categoria', header: 'Categoría', render: (p) => <span className="text-xs text-slate-600">{p.categoria}</span> },
            { key: 'precio', header: 'Precio neto', align: 'right', render: (p) => <span className="font-mono tabular-nums font-semibold">{formatMoney(p.precio, p.moneda)}</span> },
            { key: 'margen', header: 'Margen', align: 'right', render: (p) => <span className="font-mono tabular-nums text-emerald-700 text-xs">{marginPct(p.precio, p.costo)}%</span> },
            { key: 'unidad', header: 'Unidad', render: (p) => <span className="text-xs text-slate-600">{p.unidad}</span> },
            { key: 'disponibilidad', header: 'Disponibilidad', render: (p) => <Badge tone={dispTone(p.disponibilidad)}>{p.disponibilidad}</Badge> },
          ]}
          rowActions={(p) => [
            { label: 'Ver detalle', onClick: () => setSelectedRecordId(p.id) },
            { label: 'Editar', icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => openEdit(p) },
            { label: 'Archivar', icon: <Archive className="w-3.5 h-3.5" />, onClick: () => setProductos((prev) => prev.map((x) => (x.id === p.id ? { ...x, estado: 'Archivado' } : x))) },
            { label: 'Eliminar', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, dividerBefore: true, onClick: () => setProductos((prev) => prev.filter((x) => x.id !== p.id)) },
          ]}
        />
      )}

      <Drawer open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? 'Editar producto' : 'Nuevo producto / servicio'} width="lg">
        <form id="prod-form" onSubmit={handleSave} className="space-y-5">
          <FormSection title="Identificación y clasificación">
            <Input label="Nombre" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
            <Input label="SKU" required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="font-mono" />
            <Input label="Código interno" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} className="font-mono" />
            <Select label="Tipo" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as Producto['tipo'] })} options={['Producto', 'Servicio', 'Suscripción', 'Implementación'].map((t) => ({ value: t, label: t }))} />
            <Select label="Categoría" value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} options={catalogs.categoriasProducto.map((c) => ({ value: c, label: c }))} />
            <Input label="Unidad de medida" value={formData.unidad} onChange={(e) => setFormData({ ...formData, unidad: e.target.value })} />
          </FormSection>

          <FormSection title="Precios y márgenes">
            <CurrencyInput label="Precio neto" value={formData.precio} currency={formData.moneda} onChange={(v) => setFormData({ ...formData, precio: v })} onCurrencyChange={(c: CurrencyCode) => setFormData({ ...formData, moneda: c })} />
            <CurrencyInput label="Costo" value={formData.costo} currency={formData.moneda} onChange={(v) => setFormData({ ...formData, costo: v })} />
            <Select label="Estado" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value as Producto['estado'] })} options={['Activo', 'Inactivo', 'Archivado'].map((s) => ({ value: s, label: s }))} />
            <Select label="Disponibilidad" value={formData.disponibilidad} onChange={(e) => setFormData({ ...formData, disponibilidad: e.target.value as Producto['disponibilidad'] })} options={['Disponible', 'Bajo stock', 'Bajo pedido', 'Agotado'].map((s) => ({ value: s, label: s }))} />
            <div className="md:col-span-2">
              <Checkbox checked={formData.ivaAfecto} onChange={(v) => setFormData({ ...formData, ivaAfecto: v })} label="Producto/Servicio afecto a IVA (19%)" />
            </div>
            <div className="md:col-span-2">
              <MultiSelect label="Etiquetas" options={catalogs.etiquetas.map((t) => t.name)} selected={formData.etiquetas} onChange={(etiquetas) => setFormData({ ...formData, etiquetas })} />
            </div>
            <div className="md:col-span-2">
              <Textarea label="Descripción" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            </div>
          </FormSection>
        </form>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
          <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
          <Button type="submit" form="prod-form">{editingId ? 'Guardar cambios' : 'Crear producto'}</Button>
        </div>
      </Drawer>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Importar catálogo (Prototipo visual)"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cerrar</Button>
            <Button onClick={() => { setImportOpen(false); notify('Importación simulada', 'Archivo CSV validado sin errores.'); }}>Procesar archivo</Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Carga masiva compatible con planillas Excel/CSV con columnas SKU, Nombre, Categoría, Precio CLP y Unidad.
        </p>
      </Modal>
    </div>
  );
};
