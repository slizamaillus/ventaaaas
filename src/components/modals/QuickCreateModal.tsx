import React, { useEffect, useState } from 'react';
import { Modal } from '../ds/data';
import { Button } from '../ds/primitives';
import { CurrencyInput, DatePicker, Input, RUTInput, Select, Textarea } from '../ds/forms';
import { useCRM } from '../../context/CRMContext';
import { REGIONES_CHILE, getComunasByRegionAndProvincia, getProvinciasByRegion } from '../../data/chileGeo';
import { CurrencyCode, PriorityLevel, TipoActividad } from '../../types/crm';

export const QuickCreateModal: React.FC = () => {
  const {
    quickCreate,
    closeQuickCreate,
    empresas,
    setEmpresas,
    contactos,
    setContactos,
    oportunidades,
    setOportunidades,
    cotizaciones,
    setCotizaciones,
    productos,
    setProductos,
    setActividades,
    setPedidos,
    setCasosPostventa,
    teamMembers,
    pipelineStages,
    catalogs,
    currentUser,
    orgSettings,
    notify,
    addAuditLog,
    navigateTo,
  } = useCRM();

  const [title, setTitle] = useState('');
  const [secondary, setSecondary] = useState('');
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [contactoId, setContactoId] = useState('');
  const [oportunidadId, setOportunidadId] = useState('');
  const [region, setRegion] = useState(REGIONES_CHILE[0]);
  const [comuna, setComuna] = useState('Las Condes');
  const [industria, setIndustria] = useState(catalogs.industrias[0]);
  const [monto, setMonto] = useState(8500000);
  const [moneda, setMoneda] = useState<CurrencyCode>('CLP');
  const [etapaId, setEtapaId] = useState(pipelineStages[0]?.id || 'stg-1');
  const [fecha, setFecha] = useState('2026-11-26');
  const [hora, setHora] = useState('10:00');
  const [prioridad, setPrioridad] = useState<PriorityLevel>('Media');
  const [tipoAct, setTipoAct] = useState<TipoActividad>('Llamada');
  const [responsableId, setResponsableId] = useState(currentUser.id);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (!quickCreate) return;
    setTitle('');
    setSecondary('');
    setRut('');
    setEmail('');
    setPhone('');
    setEmpresaId(quickCreate.empresaId || empresas[0]?.id || '');
    setContactoId(quickCreate.contactoId || contactos[0]?.id || '');
    setOportunidadId(quickCreate.oportunidadId || '');
    setResponsableId(currentUser.id);
    setMonto(8500000);
    setMoneda(orgSettings.monedaPredeterminada);
    setEtapaId(pipelineStages[0]?.id || 'stg-1');
    setPrioridad('Media');
    setTipoAct(quickCreate.entity === 'tarea' ? 'Tarea' : 'Llamada');
    setNotas('');
  }, [quickCreate, empresas, contactos, currentUser.id, orgSettings.monedaPredeterminada, pipelineStages]);

  if (!quickCreate) return null;

  const titles: Record<string, string> = {
    empresa: 'Nueva empresa',
    contacto: 'Nuevo contacto',
    oportunidad: 'Nueva oportunidad',
    cotizacion: 'Nueva cotización rápida',
    tarea: 'Nueva tarea comercial',
    actividad: 'Nueva actividad',
    producto: 'Nuevo producto o servicio',
    pedido: 'Nuevo pedido comercial',
    postventa: 'Nuevo caso de postventa',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = '2026-11-25';

    if (quickCreate.entity === 'empresa') {
      const id = `emp-${Date.now()}`;
      const provs = getProvinciasByRegion(region);
      setEmpresas((prev) => [
        {
          id,
          razonSocial: title || 'Nueva Empresa SpA',
          nombreComercial: secondary || title || 'Nueva Empresa',
          rut: rut || '76.500.120-4',
          tipoEntidad: 'Prospecto',
          industria,
          tamano: 'Mediana',
          sitioWeb: 'https://empresa.cl',
          estado: 'En prospección',
          origen: 'Creación rápida',
          email: email || 'contacto@empresa.cl',
          telefono: phone || '+56 2 2400 1000',
          pais: 'Chile',
          region,
          provincia: provs[0] || 'Santiago',
          comuna,
          direccion: 'Av. Principal',
          numero: '100',
          responsableId,
          equipo: currentUser.team,
          segmento: 'Mid-Market',
          clasificacion: 'B',
          potencialCLP: monto,
          condicionesComerciales: 'Pago a 30 días.',
          descripcion: notas,
          notas,
          etiquetas: [],
          fechaCreacion: today,
          ultimaActividad: today,
        },
        ...prev,
      ]);
      addAuditLog('Empresas', 'Creación', `Creó empresa ${secondary || title}`);
      notify('Empresa creada', `${secondary || title} añadida al directorio.`);
      closeQuickCreate();
      navigateTo('empresas', id);
      return;
    }

    if (quickCreate.entity === 'contacto') {
      const id = `con-${Date.now()}`;
      setContactos((prev) => [
        {
          id,
          nombre: title || 'Nombre',
          apellido: secondary || 'Apellido',
          rut: rut || undefined,
          cargo: 'Gerente Comercial',
          departamento: 'Comercial',
          email: email || 'contacto@cliente.cl',
          telefono: phone || '+56 9 8000 1122',
          contactoPreferido: 'Email',
          empresaId,
          relacion: 'Tomador de decisión',
          esPrincipal: false,
          responsableId,
          fuente: 'Creación rápida',
          estado: 'Activo',
          etiquetas: [],
          segmentacion: 'Mid-Market',
          notas,
          descripcion: notas,
          fechaCreacion: today,
          ultimaActividad: today,
        },
        ...prev,
      ]);
      addAuditLog('Contactos', 'Creación', `Creó contacto ${title} ${secondary}`);
      notify('Contacto creado', `${title} ${secondary} vinculado correctamente.`);
      closeQuickCreate();
      return;
    }

    if (quickCreate.entity === 'oportunidad') {
      const id = `opp-${Date.now()}`;
      const stg = pipelineStages.find((s) => s.id === etapaId);
      setOportunidades((prev) => [
        {
          id,
          nombre: title || 'Nueva oportunidad B2B',
          empresaId,
          contactoId,
          pipeline: 'Pipeline Comercial B2B',
          etapaId,
          monto,
          moneda,
          probabilidad: stg?.probability ?? 20,
          fechaCierreEstimada: fecha,
          responsableId,
          equipo: currentUser.team,
          origen: 'Creación rápida',
          tipo: 'Nuevo negocio',
          productosIds: [productos[0]?.id].filter(Boolean) as string[],
          prioridad,
          descripcion: notas,
          notas,
          etiquetas: [],
          fechaCreacion: today,
          ultimaActividad: today,
        },
        ...prev,
      ]);
      addAuditLog('Oportunidades', 'Creación', `Creó oportunidad "${title}"`);
      notify('Oportunidad creada', 'Se incorporó al pipeline comercial.');
      closeQuickCreate();
      return;
    }

    if (quickCreate.entity === 'cotizacion') {
      const id = `cot-${Date.now()}`;
      const folio = `${orgSettings.folioCotizacionPrefijo}${Math.floor(150 + Math.random() * 800)}`;
      const baseProd = productos[0];
      setCotizaciones((prev) => [
        {
          id,
          folio,
          nombre: title || `Propuesta comercial ${folio}`,
          empresaId,
          contactoId,
          oportunidadId: oportunidadId || undefined,
          responsableId,
          fecha: today,
          vencimiento: fecha,
          moneda,
          items: baseProd
            ? [
                {
                  id: `ci-${Date.now()}`,
                  productoId: baseProd.id,
                  nombre: baseProd.nombre,
                  descripcion: baseProd.descripcion,
                  cantidad: 1,
                  unidad: baseProd.unidad,
                  precioUnitario: baseProd.precio,
                  descuentoPct: 0,
                  ivaPct: orgSettings.ivaPorDefecto,
                },
              ]
            : [],
          descuentoGlobalPct: 0,
          ivaPct: orgSettings.ivaPorDefecto,
          otrosImpuestosPct: 0,
          estado: 'Borrador',
          formaPago: 'Transferencia electrónica',
          plazoPago: '30 días fecha factura',
          vigenciaDias: 15,
          entrega: '10 días hábiles',
          garantia: '12 meses',
          notas,
          descripcion: notas,
          comentarios: '',
          versionActual: 'v1.0',
          versiones: [{ version: 'v1.0', fecha: today, autorId: responsableId, resumenCambio: 'Creación rápida', total: baseProd?.precio || 0 }],
        },
        ...prev,
      ]);
      addAuditLog('Cotizaciones', 'Creación', `Generó borrador ${folio}`);
      notify('Cotización creada', `Folio ${folio} listo para edición.`);
      closeQuickCreate();
      navigateTo('cotizaciones', id);
      return;
    }

    if (quickCreate.entity === 'tarea' || quickCreate.entity === 'actividad') {
      setActividades((prev) => [
        {
          id: `act-${Date.now()}`,
          tipo: quickCreate.entity === 'tarea' ? 'Tarea' : tipoAct,
          titulo: title || 'Seguimiento comercial',
          descripcion: notas || 'Actividad agendada desde creación rápida.',
          fecha,
          hora,
          duracionMin: 30,
          responsableId,
          empresaId: empresaId || undefined,
          contactoId: contactoId || undefined,
          oportunidadId: oportunidadId || undefined,
          prioridad,
          estado: 'Pendiente',
          recordatorio: '15 min antes',
          notas,
        },
        ...prev,
      ]);
      notify(
        quickCreate.entity === 'tarea' ? 'Tarea creada' : 'Actividad agendada',
        `${title || 'Seguimiento'} programada para el ${fecha}.`
      );
      closeQuickCreate();
      return;
    }

    if (quickCreate.entity === 'producto') {
      setProductos((prev) => [
        {
          id: `prd-${Date.now()}`,
          codigo: secondary || `PRD-${Math.floor(100 + Math.random() * 899)}`,
          sku: secondary || `SKU-${Math.floor(1000 + Math.random() * 8999)}`,
          nombre: title || 'Nuevo servicio B2B',
          descripcion: notas || 'Servicio profesional configurable.',
          tipo: 'Servicio',
          categoria: catalogs.categoriasProducto[0],
          unidad: 'Unidad',
          precio: monto,
          moneda,
          ivaAfecto: true,
          costo: Math.round(monto * 0.45),
          estado: 'Activo',
          disponibilidad: 'Disponible',
          etiquetas: [],
          fechaCreacion: today,
        },
        ...prev,
      ]);
      notify('Producto agregado al catálogo', title);
      closeQuickCreate();
      return;
    }

    if (quickCreate.entity === 'pedido') {
      const folio = `${orgSettings.folioPedidoPrefijo}${Math.floor(100 + Math.random() * 800)}`;
      const baseProd = productos[0];
      setPedidos((prev) => [
        {
          id: `ped-${Date.now()}`,
          folio,
          empresaId,
          contactoId,
          cotizacionId: quickCreate.cotizacionId,
          fecha: today,
          items: baseProd
            ? [
                {
                  id: `pi-${Date.now()}`,
                  productoId: baseProd.id,
                  nombre: baseProd.nombre,
                  descripcion: baseProd.descripcion,
                  cantidad: 1,
                  unidad: baseProd.unidad,
                  precioUnitario: baseProd.precio,
                  descuentoPct: 0,
                  ivaPct: orgSettings.ivaPorDefecto,
                },
              ]
            : [],
          moneda,
          ivaPct: orgSettings.ivaPorDefecto,
          estado: 'Pendiente',
          condiciones: 'Pago 30 días contra factura',
          responsableId,
          notas,
        },
        ...prev,
      ]);
      notify('Pedido generado', `Folio ${folio} creado.`);
      closeQuickCreate();
      navigateTo('pedidos');
      return;
    }

    if (quickCreate.entity === 'postventa') {
      const folio = `CAS-2026-0${Math.floor(200 + Math.random() * 799)}`;
      setCasosPostventa((prev) => [
        {
          id: `cas-${Date.now()}`,
          folio,
          asunto: title || 'Requerimiento de soporte',
          empresaId,
          contactoId,
          tipo: 'Soporte técnico',
          categoria: 'Mesa de Ayuda',
          prioridad,
          responsableId,
          estado: 'Nuevo',
          fecha: today,
          ultimaActualizacion: today,
          descripcion: notas,
          etiquetas: [],
          comentarios: [],
        },
        ...prev,
      ]);
      notify('Caso de postventa abierto', `Ticket ${folio} asignado.`);
      closeQuickCreate();
      navigateTo('postventa');
    }
  };

  const comunasDisp = getComunasByRegionAndProvincia(region);

  return (
    <Modal
      open={Boolean(quickCreate)}
      onClose={closeQuickCreate}
      title={titles[quickCreate.entity]}
      subtitle="Creación rápida integrada con illus Ventas"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {quickCreate.entity === 'empresa' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Razón social" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Inversiones Pacífico SpA" />
            <Input label="Nombre comercial" required value={secondary} onChange={(e) => setSecondary(e.target.value)} placeholder="Ej: Grupo Pacífico" />
            <RUTInput value={rut} onChange={setRut} required />
            <Select
              label="Industria"
              value={industria}
              onChange={(e) => setIndustria(e.target.value)}
              options={catalogs.industrias.map((i) => ({ value: i, label: i }))}
            />
            <Input label="Email corporativo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@empresa.cl" />
            <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 2 2400 0000" />
            <Select
              label="Región"
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setComuna(getComunasByRegionAndProvincia(e.target.value)[0] || '');
              }}
              options={REGIONES_CHILE.map((r) => ({ value: r, label: r }))}
            />
            <Select
              label="Comuna"
              value={comuna}
              onChange={(e) => setComuna(e.target.value)}
              options={comunasDisp.map((c) => ({ value: c, label: c }))}
            />
          </div>
        )}

        {quickCreate.entity === 'contacto' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Nombre" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Javier" />
            <Input label="Apellido" required value={secondary} onChange={(e) => setSecondary(e.target.value)} placeholder="Ej: Morales" />
            <Input label="Email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jmorales@empresa.cl" />
            <Input label="Teléfono móvil" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 9123 4567" />
            <Select
              label="Empresa asociada"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              options={empresas.map((em) => ({ value: em.id, label: em.nombreComercial }))}
            />
            <RUTInput label="RUT (opcional)" value={rut} onChange={setRut} />
          </div>
        )}

        {(quickCreate.entity === 'oportunidad' || quickCreate.entity === 'cotizacion') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input
                label={quickCreate.entity === 'oportunidad' ? 'Nombre de oportunidad' : 'Título de cotización'}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Implementación ERP Comercial Q1"
              />
            </div>
            <Select
              label="Empresa"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              options={empresas.map((em) => ({ value: em.id, label: em.nombreComercial }))}
            />
            <Select
              label="Contacto"
              value={contactoId}
              onChange={(e) => setContactoId(e.target.value)}
              options={contactos.map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))}
            />
            {quickCreate.entity === 'oportunidad' && (
              <>
                <CurrencyInput label="Monto estimado" value={monto} currency={moneda} onChange={setMonto} onCurrencyChange={setMoneda} />
                <Select
                  label="Etapa"
                  value={etapaId}
                  onChange={(e) => setEtapaId(e.target.value)}
                  options={pipelineStages.map((s) => ({ value: s.id, label: `${s.name} (${s.probability}%)` }))}
                />
              </>
            )}
            <DatePicker
              label={quickCreate.entity === 'oportunidad' ? 'Fecha estimada de cierre' : 'Fecha de vencimiento'}
              value={fecha}
              onChange={setFecha}
            />
            <Select
              label="Responsable"
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
              options={teamMembers.map((u) => ({ value: u.id, label: u.name }))}
            />
          </div>
        )}

        {(quickCreate.entity === 'tarea' || quickCreate.entity === 'actividad') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input label="Título" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Llamar para validar condiciones" />
            </div>
            {quickCreate.entity === 'actividad' && (
              <Select
                label="Tipo de actividad"
                value={tipoAct}
                onChange={(e) => setTipoAct(e.target.value as TipoActividad)}
                options={[
                  { value: 'Llamada', label: 'Llamada' },
                  { value: 'Reunión', label: 'Reunión' },
                  { value: 'Email', label: 'Email' },
                  { value: 'Visita', label: 'Visita' },
                  { value: 'Seguimiento', label: 'Seguimiento' },
                  { value: 'Recordatorio', label: 'Recordatorio' },
                ]}
              />
            )}
            <Select
              label="Prioridad"
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as PriorityLevel)}
              options={[
                { value: 'Baja', label: 'Baja' },
                { value: 'Media', label: 'Media' },
                { value: 'Alta', label: 'Alta' },
                { value: 'Urgente', label: 'Urgente' },
              ]}
            />
            <DatePicker label="Fecha" value={fecha} onChange={setFecha} />
            <Input label="Hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            <Select
              label="Empresa"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              options={[{ value: '', label: 'Sin empresa' }, ...empresas.map((em) => ({ value: em.id, label: em.nombreComercial }))]}
            />
            <Select
              label="Responsable"
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
              options={teamMembers.map((u) => ({ value: u.id, label: u.name }))}
            />
          </div>
        )}

        {quickCreate.entity === 'producto' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Nombre del producto / servicio" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Consultoría BI Comercial" />
            <Input label="Código / SKU" value={secondary} onChange={(e) => setSecondary(e.target.value)} placeholder="AT-SRV-09" />
            <CurrencyInput label="Precio neto" value={monto} currency={moneda} onChange={setMonto} onCurrencyChange={setMoneda} />
          </div>
        )}

        {(quickCreate.entity === 'pedido' || quickCreate.entity === 'postventa') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickCreate.entity === 'postventa' && (
              <div className="sm:col-span-2">
                <Input label="Asunto del caso" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Consulta sobre facturación o soporte" />
              </div>
            )}
            <Select
              label="Empresa"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              options={empresas.map((em) => ({ value: em.id, label: em.nombreComercial }))}
            />
            <Select
              label="Contacto"
              value={contactoId}
              onChange={(e) => setContactoId(e.target.value)}
              options={contactos.map((c) => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))}
            />
            <Select
              label="Responsable"
              value={responsableId}
              onChange={(e) => setResponsableId(e.target.value)}
              options={teamMembers.map((u) => ({ value: u.id, label: u.name }))}
            />
            {quickCreate.entity === 'postventa' && (
              <Select
                label="Prioridad"
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as PriorityLevel)}
                options={[
                  { value: 'Baja', label: 'Baja' },
                  { value: 'Media', label: 'Media' },
                  { value: 'Alta', label: 'Alta' },
                  { value: 'Urgente', label: 'Urgente' },
                ]}
              />
            )}
          </div>
        )}

        <Textarea
          label="Descripción / Notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Contexto adicional del registro..."
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={closeQuickCreate}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Guardar registro
          </Button>
        </div>
      </form>
    </Modal>
  );
};
