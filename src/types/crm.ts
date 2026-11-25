export type CurrencyCode = 'CLP' | 'UF' | 'USD' | 'EUR';

export type ModuleId =
  | 'inicio'
  | 'dashboard'
  | 'empresas'
  | 'contactos'
  | 'oportunidades'
  | 'cotizaciones'
  | 'pedidos'
  | 'ventas'
  | 'productos'
  | 'actividades'
  | 'calendario'
  | 'tareas'
  | 'postventa'
  | 'documentos'
  | 'reportes'
  | 'analitica'
  | 'automatizaciones'
  | 'usuarios'
  | 'configuracion'
  | 'personalizacion'
  | 'design-system';

export type PriorityLevel = 'Baja' | 'Media' | 'Alta' | 'Urgente';

export interface CustomFieldDef {
  id: string;
  module: 'empresas' | 'contactos' | 'oportunidades' | 'cotizaciones' | 'productos' | 'postventa';
  label: string;
  key: string;
  type:
    | 'Texto'
    | 'Texto largo'
    | 'Número'
    | 'Moneda'
    | 'Porcentaje'
    | 'Fecha'
    | 'Fecha y hora'
    | 'Booleano'
    | 'Checkbox'
    | 'Selector'
    | 'Multi selector'
    | 'Email'
    | 'Teléfono'
    | 'URL'
    | 'RUT'
    | 'Relación';
  required: boolean;
  defaultValue?: string;
  options?: string[];
  validation?: string;
  section: string;
  visible: boolean;
  order: number;
  helpText?: string;
}

export type UserRole = 'Administrador' | 'Vendedor';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cargo?: string;
  team: string;
  avatar?: string;
  initials: string;
  status: 'Activo' | 'Inactivo' | 'Invitado';
  phone: string;
  monthlyQuotaCLP: number;
}

export interface RoleDef {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: Record<
    string,
    {
      read: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      export: boolean;
      admin: boolean;
    }
  >;
}

export interface TeamDef {
  id: string;
  name: string;
  leaderId: string;
  memberIds: string[];
  regionFocus: string;
  targetCLP: number;
}

export interface Empresa {
  id: string;
  razonSocial: string;
  nombreComercial: string;
  rut: string;
  tipoEntidad: 'Cliente' | 'Prospecto' | 'Proveedor' | 'Socio Comercial';
  industria: string;
  tamano: 'Micro' | 'Pequeña' | 'Mediana' | 'Gran Empresa' | 'Corporativo';
  sitioWeb: string;
  estado: 'Activa' | 'En prospección' | 'En pausa' | 'Inactiva' | 'Archivada';
  origen: string;
  email: string;
  telefono: string;
  telefonoAlt?: string;
  pais: string;
  region: string;
  provincia: string;
  comuna: string;
  direccion: string;
  numero: string;
  oficina?: string;
  codigoPostal?: string;
  responsableId: string;
  equipo: string;
  segmento: 'Enterprise' | 'Mid-Market' | 'PyME' | 'Sector Público';
  clasificacion: 'A' | 'B' | 'C';
  potencialCLP: number;
  condicionesComerciales: string;
  descripcion: string;
  notas: string;
  etiquetas: string[];
  fechaCreacion: string;
  ultimaActividad: string;
  customFields?: Record<string, string | boolean | number>;
}

export interface Contacto {
  id: string;
  nombre: string;
  apellido: string;
  rut?: string;
  cargo: string;
  departamento: string;
  cumpleanos?: string;
  email: string;
  telefono: string;
  movil?: string;
  whatsapp?: string;
  contactoPreferido: 'Email' | 'Teléfono' | 'WhatsApp' | 'Reunión';
  empresaId: string;
  relacion: 'Tomador de decisión' | 'Influenciador' | 'Usuario clave' | 'Finanzas / Compras' | 'Sponsor Ejecutivo';
  esPrincipal: boolean;
  responsableId: string;
  fuente: string;
  estado: 'Activo' | 'Contactado' | 'No contactar' | 'Archivado';
  etiquetas: string[];
  segmentacion: string;
  notas: string;
  descripcion: string;
  fechaCreacion: string;
  ultimaActividad: string;
  customFields?: Record<string, string | boolean | number>;
}

export interface PipelineStageConfig {
  id: string;
  name: string;
  probability: number;
  color: 'slate' | 'blue' | 'indigo' | 'amber' | 'emerald' | 'rose';
  order: number;
  isClosed?: 'won' | 'lost';
}

export interface Oportunidad {
  id: string;
  nombre: string;
  empresaId: string;
  contactoId: string;
  pipeline: string;
  etapaId: string;
  monto: number;
  moneda: CurrencyCode;
  probabilidad: number;
  fechaCierreEstimada: string;
  responsableId: string;
  equipo: string;
  origen: string;
  tipo: 'Nuevo negocio' | 'Expansión / Upsell' | 'Renovación' | 'Licitación';
  productosIds: string[];
  prioridad: PriorityLevel;
  descripcion: string;
  notas: string;
  competencia?: string;
  motivoPerdida?: string;
  etiquetas: string[];
  fechaCreacion: string;
  ultimaActividad: string;
  archivada?: boolean;
  customFields?: Record<string, string | boolean | number>;
}

export interface CotizacionItem {
  id: string;
  productoId: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  descuentoPct: number;
  ivaPct: number;
}

export interface CotizacionVersion {
  version: string;
  fecha: string;
  autorId: string;
  resumenCambio: string;
  total: number;
}

export type EstadoCotizacion =
  | 'Borrador'
  | 'En revisión'
  | 'Enviada'
  | 'Vista'
  | 'Aceptada'
  | 'Rechazada'
  | 'Vencida'
  | 'Cancelada';

export interface Cotizacion {
  id: string;
  folio: string;
  nombre: string;
  empresaId: string;
  contactoId: string;
  oportunidadId?: string;
  responsableId: string;
  fecha: string;
  vencimiento: string;
  moneda: CurrencyCode;
  items: CotizacionItem[];
  descuentoGlobalPct: number;
  ivaPct: number;
  otrosImpuestosPct: number;
  estado: EstadoCotizacion;
  formaPago: string;
  plazoPago: string;
  vigenciaDias: number;
  entrega: string;
  garantia: string;
  notas: string;
  descripcion: string;
  comentarios: string;
  versionActual: string;
  versiones: CotizacionVersion[];
}

export interface Producto {
  id: string;
  codigo: string;
  sku: string;
  nombre: string;
  descripcion: string;
  tipo: 'Producto' | 'Servicio' | 'Suscripción' | 'Implementación';
  categoria: string;
  unidad: string;
  precio: number;
  moneda: CurrencyCode;
  ivaAfecto: boolean;
  costo: number;
  estado: 'Activo' | 'Inactivo' | 'Archivado';
  disponibilidad: 'Disponible' | 'Bajo stock' | 'Bajo pedido' | 'Agotado';
  etiquetas: string[];
  fechaCreacion: string;
}

export type TipoActividad =
  | 'Tarea'
  | 'Llamada'
  | 'Reunión'
  | 'Email'
  | 'Visita'
  | 'Seguimiento'
  | 'Recordatorio';

export type EstadoActividad = 'Pendiente' | 'En progreso' | 'Completada' | 'Cancelada';

export interface Actividad {
  id: string;
  tipo: TipoActividad;
  titulo: string;
  descripcion: string;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  duracionMin: number;
  responsableId: string;
  empresaId?: string;
  contactoId?: string;
  oportunidadId?: string;
  cotizacionId?: string;
  prioridad: PriorityLevel;
  estado: EstadoActividad;
  recordatorio: string;
  notas: string;
}

export interface Pedido {
  id: string;
  folio: string;
  empresaId: string;
  contactoId: string;
  cotizacionId?: string;
  fecha: string;
  items: CotizacionItem[];
  moneda: CurrencyCode;
  ivaPct: number;
  estado: 'Pendiente' | 'Confirmado' | 'En preparación' | 'Entregado' | 'Cancelado';
  condiciones: string;
  responsableId: string;
  notas: string;
}

export interface Venta {
  id: string;
  folio: string;
  empresaId: string;
  contactoId: string;
  oportunidadId?: string;
  pedidoId?: string;
  fecha: string;
  monto: number;
  moneda: CurrencyCode;
  responsableId: string;
  estado: 'Facturada' | 'Pagada' | 'Pendiente de pago' | 'Anulada';
  metodoPago: string;
  documentoTributario: string;
}

export interface CasoPostventa {
  id: string;
  folio: string;
  asunto: string;
  empresaId: string;
  contactoId: string;
  tipo: 'Soporte técnico' | 'Reclamo' | 'Garantía' | 'Consultoría' | 'Solicitud comercial';
  categoria: string;
  prioridad: PriorityLevel;
  responsableId: string;
  estado: 'Nuevo' | 'Abierto' | 'En proceso' | 'En espera' | 'Resuelto' | 'Cerrado';
  fecha: string;
  ultimaActualizacion: string;
  descripcion: string;
  etiquetas: string[];
  comentarios: { id: string; autorId: string; fecha: string; texto: string }[];
}

export interface Documento {
  id: string;
  nombre: string;
  tipo: 'Cotización' | 'Contrato' | 'Propuesta' | 'Factura' | 'Comprobante' | 'Documento comercial' | 'Otro';
  carpeta: string;
  empresaId?: string;
  contactoId?: string;
  oportunidadId?: string;
  cotizacionId?: string;
  pedidoId?: string;
  ventaId?: string;
  casoId?: string;
  fecha: string;
  responsableId: string;
  tamano: string;
  estado: 'Vigente' | 'En revisión' | 'Firmado' | 'Archivado';
  extension: 'PDF' | 'DOCX' | 'XLSX' | 'PNG';
}

export interface WorkflowNode {
  id: string;
  kind: 'trigger' | 'condition' | 'action' | 'result';
  title: string;
  subtitle: string;
  config: Record<string, string>;
}

export interface Automatizacion {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'Activa' | 'Inactiva' | 'Borrador';
  tipo: 'Comercial' | 'Cotizaciones' | 'Pedidos' | 'Asignación' | 'Postventa';
  fechaCreacion: string;
  ultimaEjecucion: string;
  ejecucionesTotales: number;
  responsableId: string;
  nodes: WorkflowNode[];
}

export interface SavedViewConfig {
  id: string;
  module: 'empresas' | 'contactos' | 'oportunidades' | 'cotizaciones' | 'productos';
  name: string;
  viewType: 'Tabla' | 'Tablero' | 'Lista' | 'Calendario';
  columns: string[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  visibility: 'Privada' | 'Equipo' | 'Organización';
  isDefault?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  targetModule: ModuleId;
  targetId?: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface AuditLogEntry {
  id: string;
  fecha: string;
  usuarioId: string;
  modulo: string;
  accion: 'Creación' | 'Edición' | 'Eliminación' | 'Cambio de etapa' | 'Configuración' | 'Exportación';
  detalle: string;
  ip: string;
}

export interface OrgSettings {
  nombreOrganizacion: string;
  nombrePlataforma: string;
  razonSocial: string;
  rut: string;
  nombreComercial: string;
  direccion: string;
  region: string;
  provincia: string;
  comuna: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  idioma: string;
  zonaHoraria: string;
  monedaPredeterminada: CurrencyCode;
  formatoFecha: string;
  ivaPorDefecto: number;
  folioCotizacionPrefijo: string;
  folioPedidoPrefijo: string;
  valorUF: number;
  valorUSD: number;
  valorEUR: number;
}
