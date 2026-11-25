import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  Actividad,
  AuditLogEntry,
  Automatizacion,
  CasoPostventa,
  Contacto,
  Cotizacion,
  CurrencyCode,
  CustomFieldDef,
  Documento,
  Empresa,
  ModuleId,
  NotificationItem,
  Oportunidad,
  OrgSettings,
  Pedido,
  PipelineStageConfig,
  Producto,
  RoleDef,
  SavedViewConfig,
  TeamDef,
  TeamMember,
  Venta,
} from '../types/crm';
import {
  INITIAL_ACTIVIDADES,
  INITIAL_AUDIT_LOGS,
  INITIAL_AUTOMATIZACIONES,
  INITIAL_CATALOGS,
  INITIAL_CONTACTOS,
  INITIAL_COTIZACIONES,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_DOCUMENTOS,
  INITIAL_EMPRESAS,
  INITIAL_NOTIFICATIONS,
  INITIAL_OPORTUNIDADES,
  INITIAL_ORG_SETTINGS,
  INITIAL_PEDIDOS,
  INITIAL_PIPELINE_STAGES,
  INITIAL_POSTVENTA,
  INITIAL_PRODUCTOS,
  INITIAL_ROLES,
  INITIAL_SAVED_VIEWS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_TEAMS,
  INITIAL_VENTAS,
} from '../data/mockData';
import { ToastContainer, ToastMessage } from '../components/ds/data';
import { convertFromCLP, convertToCLP, formatCurrency } from '../data/chileGeo';

export type QuickCreateEntity =
  | 'empresa'
  | 'contacto'
  | 'oportunidad'
  | 'cotizacion'
  | 'tarea'
  | 'actividad'
  | 'producto'
  | 'pedido'
  | 'postventa';

export interface QuickCreatePreset {
  entity: QuickCreateEntity;
  empresaId?: string;
  contactoId?: string;
  oportunidadId?: string;
  cotizacionId?: string;
}

export interface ModuleConfigItem {
  id: ModuleId;
  label: string;
  enabled: boolean;
  description: string;
}

export interface FormLayoutConfig {
  module: 'empresas' | 'contactos' | 'oportunidades';
  sections: {
    id: string;
    title: string;
    visible: boolean;
    fields: { key: string; label: string; required: boolean; visible: boolean; helpText?: string }[];
  }[];
}

export interface SheetTabConfig {
  module: 'empresas' | 'contactos' | 'oportunidades';
  tabs: { id: string; label: string; visible: boolean }[];
}

interface CRMContextValue {
  activeModule: ModuleId;
  selectedRecordId: string | null;
  navigateTo: (module: ModuleId, recordId?: string | null) => void;
  setSelectedRecordId: (id: string | null) => void;

  displayCurrency: CurrencyCode;
  setDisplayCurrency: (c: CurrencyCode) => void;
  formatMoney: (amount: number, sourceCurrency?: CurrencyCode) => string;

  currentUser: TeamMember;
  setCurrentUserId: (id: string) => void;

  empresas: Empresa[];
  setEmpresas: React.Dispatch<React.SetStateAction<Empresa[]>>;
  contactos: Contacto[];
  setContactos: React.Dispatch<React.SetStateAction<Contacto[]>>;
  oportunidades: Oportunidad[];
  setOportunidades: React.Dispatch<React.SetStateAction<Oportunidad[]>>;
  cotizaciones: Cotizacion[];
  setCotizaciones: React.Dispatch<React.SetStateAction<Cotizacion[]>>;
  productos: Producto[];
  setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  actividades: Actividad[];
  setActividades: React.Dispatch<React.SetStateAction<Actividad[]>>;
  pedidos: Pedido[];
  setPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>;
  ventas: Venta[];
  setVentas: React.Dispatch<React.SetStateAction<Venta[]>>;
  casosPostventa: CasoPostventa[];
  setCasosPostventa: React.Dispatch<React.SetStateAction<CasoPostventa[]>>;
  documentos: Documento[];
  setDocumentos: React.Dispatch<React.SetStateAction<Documento[]>>;
  automatizaciones: Automatizacion[];
  setAutomatizaciones: React.Dispatch<React.SetStateAction<Automatizacion[]>>;

  pipelineStages: PipelineStageConfig[];
  setPipelineStages: React.Dispatch<React.SetStateAction<PipelineStageConfig[]>>;
  customFields: CustomFieldDef[];
  setCustomFields: React.Dispatch<React.SetStateAction<CustomFieldDef[]>>;
  savedViews: SavedViewConfig[];
  setSavedViews: React.Dispatch<React.SetStateAction<SavedViewConfig[]>>;

  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  roles: RoleDef[];
  setRoles: React.Dispatch<React.SetStateAction<RoleDef[]>>;
  teams: TeamDef[];
  setTeams: React.Dispatch<React.SetStateAction<TeamDef[]>>;
  catalogs: typeof INITIAL_CATALOGS;
  setCatalogs: React.Dispatch<React.SetStateAction<typeof INITIAL_CATALOGS>>;
  orgSettings: OrgSettings;
  setOrgSettings: React.Dispatch<React.SetStateAction<OrgSettings>>;

  moduleConfigs: ModuleConfigItem[];
  setModuleConfigs: React.Dispatch<React.SetStateAction<ModuleConfigItem[]>>;
  formLayouts: FormLayoutConfig[];
  setFormLayouts: React.Dispatch<React.SetStateAction<FormLayoutConfig[]>>;
  sheetTabs: SheetTabConfig[];
  setSheetTabs: React.Dispatch<React.SetStateAction<SheetTabConfig[]>>;

  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  auditLogs: AuditLogEntry[];
  addAuditLog: (modulo: string, accion: AuditLogEntry['accion'], detalle: string) => void;

  notify: (title: string, description?: string, tone?: ToastMessage['tone']) => void;
  quickCreate: QuickCreatePreset | null;
  openQuickCreate: (entity: QuickCreateEntity, preset?: Omit<QuickCreatePreset, 'entity'>) => void;
  closeQuickCreate: () => void;

  getEmpresaName: (id?: string) => string;
  getContactoName: (id?: string) => string;
  getUser: (id?: string) => TeamMember | undefined;
}

const CRMContext = createContext<CRMContextValue | null>(null);

const INITIAL_MODULE_CONFIGS: ModuleConfigItem[] = [
  { id: 'empresas', label: 'Empresas', enabled: true, description: 'Cuentas empresariales, RUT y sucursales' },
  { id: 'contactos', label: 'Contactos', enabled: true, description: 'Directorio de personas y tomadores de decisión' },
  { id: 'oportunidades', label: 'Oportunidades', enabled: true, description: 'Pipeline comercial y proyecciones' },
  { id: 'cotizaciones', label: 'Cotizaciones', enabled: true, description: 'Presupuestos comerciales con IVA y versiones' },
  { id: 'pedidos', label: 'Pedidos', enabled: true, description: 'Órdenes de pedido y preparación' },
  { id: 'ventas', label: 'Ventas', enabled: true, description: 'Registro de ventas y DTE asociados' },
  { id: 'productos', label: 'Productos y servicios', enabled: true, description: 'Catálogo de productos, servicios y suscripciones' },
  { id: 'actividades', label: 'Actividades y Calendario', enabled: true, description: 'Llamadas, reuniones, tareas y visitas' },
  { id: 'postventa', label: 'Postventa', enabled: true, description: 'Tickets de soporte, garantías y requerimientos' },
  { id: 'documentos', label: 'Documentos', enabled: true, description: 'Central documental por entidad y carpetas' },
  { id: 'reportes', label: 'Reportes y Analítica', enabled: true, description: 'Centro de reportería ejecutiva' },
  { id: 'automatizaciones', label: 'Automatizaciones', enabled: true, description: 'Constructor visual de flujos comerciales' },
];

const INITIAL_FORM_LAYOUTS: FormLayoutConfig[] = [
  {
    module: 'empresas',
    sections: [
      {
        id: 'sec-gen',
        title: '1. Información general',
        visible: true,
        fields: [
          { key: 'razonSocial', label: 'Razón social', required: true, visible: true, helpText: 'Nombre legal registrado en el SII.' },
          { key: 'nombreComercial', label: 'Nombre comercial', required: true, visible: true },
          { key: 'rut', label: 'RUT empresa', required: true, visible: true, helpText: 'Validación automática dígito verificador.' },
          { key: 'industria', label: 'Industria', required: true, visible: true },
          { key: 'sitioWeb', label: 'Sitio web', required: false, visible: true },
        ],
      },
      {
        id: 'sec-dir',
        title: '3. Dirección en Chile',
        visible: true,
        fields: [
          { key: 'region', label: 'Región', required: true, visible: true },
          { key: 'provincia', label: 'Provincia', required: false, visible: true },
          { key: 'comuna', label: 'Comuna', required: true, visible: true },
          { key: 'direccion', label: 'Dirección', required: true, visible: true },
        ],
      },
      {
        id: 'sec-com',
        title: '4. Información comercial',
        visible: true,
        fields: [
          { key: 'responsableId', label: 'Responsable', required: true, visible: true },
          { key: 'segmento', label: 'Segmento', required: true, visible: true },
          { key: 'potencialCLP', label: 'Potencial anual CLP', required: false, visible: true },
        ],
      },
    ],
  },
  {
    module: 'contactos',
    sections: [
      {
        id: 'sec-per',
        title: '1. Información personal',
        visible: true,
        fields: [
          { key: 'nombre', label: 'Nombre', required: true, visible: true },
          { key: 'apellido', label: 'Apellido', required: true, visible: true },
          { key: 'cargo', label: 'Cargo', required: true, visible: true },
          { key: 'rut', label: 'RUT (opcional)', required: false, visible: true },
        ],
      },
      {
        id: 'sec-con',
        title: '2. Canales de contacto',
        visible: true,
        fields: [
          { key: 'email', label: 'Email corporativo', required: true, visible: true },
          { key: 'telefono', label: 'Teléfono fijo', required: false, visible: true },
          { key: 'movil', label: 'Teléfono móvil / WhatsApp', required: false, visible: true },
        ],
      },
    ],
  },
  {
    module: 'oportunidades',
    sections: [
      {
        id: 'sec-opp',
        title: '1. Datos de oportunidad',
        visible: true,
        fields: [
          { key: 'nombre', label: 'Nombre oportunidad', required: true, visible: true },
          { key: 'empresaId', label: 'Empresa', required: true, visible: true },
          { key: 'etapaId', label: 'Etapa pipeline', required: true, visible: true },
          { key: 'monto', label: 'Monto estimado', required: true, visible: true },
          { key: 'fechaCierreEstimada', label: 'Fecha cierre estimada', required: true, visible: true },
        ],
      },
    ],
  },
];

const INITIAL_SHEET_TABS: SheetTabConfig[] = [
  {
    module: 'empresas',
    tabs: [
      { id: 'resumen', label: 'Resumen', visible: true },
      { id: 'contactos', label: 'Contactos', visible: true },
      { id: 'oportunidades', label: 'Oportunidades', visible: true },
      { id: 'cotizaciones', label: 'Cotizaciones', visible: true },
      { id: 'pedidos', label: 'Pedidos', visible: true },
      { id: 'ventas', label: 'Ventas', visible: true },
      { id: 'actividades', label: 'Actividades', visible: true },
      { id: 'documentos', label: 'Documentos', visible: true },
      { id: 'postventa', label: 'Postventa', visible: true },
      { id: 'historial', label: 'Historial', visible: true },
    ],
  },
  {
    module: 'contactos',
    tabs: [
      { id: 'resumen', label: 'Resumen', visible: true },
      { id: 'actividades', label: 'Actividades', visible: true },
      { id: 'oportunidades', label: 'Oportunidades', visible: true },
      { id: 'cotizaciones', label: 'Cotizaciones', visible: true },
      { id: 'documentos', label: 'Documentos', visible: true },
      { id: 'historial', label: 'Historial', visible: true },
    ],
  },
  {
    module: 'oportunidades',
    tabs: [
      { id: 'resumen', label: 'Resumen', visible: true },
      { id: 'actividades', label: 'Actividades', visible: true },
      { id: 'cotizaciones', label: 'Cotizaciones', visible: true },
      { id: 'productos', label: 'Productos', visible: true },
      { id: 'documentos', label: 'Documentos', visible: true },
      { id: 'historial', label: 'Historial', visible: true },
    ],
  },
];

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('CLP');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [currentUserId, setCurrentUserId] = useState<string>('usr-1');

  const [empresas, setEmpresas] = useState<Empresa[]>(INITIAL_EMPRESAS);
  const [contactos, setContactos] = useState<Contacto[]>(INITIAL_CONTACTOS);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>(INITIAL_OPORTUNIDADES);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(INITIAL_COTIZACIONES);
  const [productos, setProductos] = useState<Producto[]>(INITIAL_PRODUCTOS);
  const [actividades, setActividades] = useState<Actividad[]>(INITIAL_ACTIVIDADES);
  const [pedidos, setPedidos] = useState<Pedido[]>(INITIAL_PEDIDOS);
  const [ventas, setVentas] = useState<Venta[]>(INITIAL_VENTAS);
  const [casosPostventa, setCasosPostventa] = useState<CasoPostventa[]>(INITIAL_POSTVENTA);
  const [documentos, setDocumentos] = useState<Documento[]>(INITIAL_DOCUMENTOS);
  const [automatizaciones, setAutomatizaciones] = useState<Automatizacion[]>(INITIAL_AUTOMATIZACIONES);

  const [pipelineStages, setPipelineStages] = useState<PipelineStageConfig[]>(INITIAL_PIPELINE_STAGES);
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>(INITIAL_CUSTOM_FIELDS);
  const [savedViews, setSavedViews] = useState<SavedViewConfig[]>(INITIAL_SAVED_VIEWS);
  const [roles, setRoles] = useState<RoleDef[]>(INITIAL_ROLES);
  const [teams, setTeams] = useState<TeamDef[]>(INITIAL_TEAMS);
  const [catalogs, setCatalogs] = useState(INITIAL_CATALOGS);
  const [orgSettings, setOrgSettings] = useState<OrgSettings>(INITIAL_ORG_SETTINGS);

  const [moduleConfigs, setModuleConfigs] = useState<ModuleConfigItem[]>(INITIAL_MODULE_CONFIGS);
  const [formLayouts, setFormLayouts] = useState<FormLayoutConfig[]>(INITIAL_FORM_LAYOUTS);
  const [sheetTabs, setSheetTabs] = useState<SheetTabConfig[]>(INITIAL_SHEET_TABS);

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [quickCreate, setQuickCreate] = useState<QuickCreatePreset | null>(null);

  const currentUser = teamMembers.find((u) => u.id === currentUserId) || teamMembers[0];

  const notify = useCallback(
    (title: string, description?: string, tone: ToastMessage['tone'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    []
  );

  const navigateTo = useCallback((module: ModuleId, recordId: string | null = null) => {
    setActiveModule(module);
    setSelectedRecordId(recordId);
  }, []);

  const addAuditLog = useCallback(
    (modulo: string, accion: AuditLogEntry['accion'], detalle: string) => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const fecha = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setAuditLogs((prev) => [
        {
          id: `aud-${Date.now()}`,
          fecha,
          usuarioId: currentUserId,
          modulo,
          accion,
          detalle,
          ip: '190.161.44.12',
        },
        ...prev,
      ]);
    },
    [currentUserId]
  );

  const formatMoney = useCallback(
    (amount: number, sourceCurrency: CurrencyCode = 'CLP') => {
      const rates = {
        CLP: 1,
        UF: orgSettings.valorUF,
        USD: orgSettings.valorUSD,
        EUR: orgSettings.valorEUR,
      };
      if (sourceCurrency === displayCurrency) {
        return formatCurrency(amount, displayCurrency);
      }
      const inCLP = convertToCLP(amount, sourceCurrency, rates);
      const converted = convertFromCLP(inCLP, displayCurrency, rates);
      return formatCurrency(converted, displayCurrency);
    },
    [displayCurrency, orgSettings.valorEUR, orgSettings.valorUF, orgSettings.valorUSD]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const openQuickCreate = useCallback(
    (entity: QuickCreateEntity, preset?: Omit<QuickCreatePreset, 'entity'>) => {
      setQuickCreate({ entity, ...preset });
    },
    []
  );

  const closeQuickCreate = useCallback(() => setQuickCreate(null), []);

  const getEmpresaName = useCallback(
    (id?: string) => empresas.find((e) => e.id === id)?.nombreComercial || '—',
    [empresas]
  );

  const getContactoName = useCallback(
    (id?: string) => {
      const c = contactos.find((x) => x.id === id);
      return c ? `${c.nombre} ${c.apellido}` : '—';
    },
    [contactos]
  );

  const getUser = useCallback(
    (id?: string) => teamMembers.find((u) => u.id === id),
    [teamMembers]
  );

  return (
    <CRMContext.Provider
      value={{
        activeModule,
        selectedRecordId,
        navigateTo,
        setSelectedRecordId,
        displayCurrency,
        setDisplayCurrency,
        formatMoney,
        currentUser,
        setCurrentUserId,
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
        actividades,
        setActividades,
        pedidos,
        setPedidos,
        ventas,
        setVentas,
        casosPostventa,
        setCasosPostventa,
        documentos,
        setDocumentos,
        automatizaciones,
        setAutomatizaciones,
        pipelineStages,
        setPipelineStages,
        customFields,
        setCustomFields,
        savedViews,
        setSavedViews,
        teamMembers,
        setTeamMembers,
        roles,
        setRoles,
        teams,
        setTeams,
        catalogs,
        setCatalogs,
        orgSettings,
        setOrgSettings,
        moduleConfigs,
        setModuleConfigs,
        formLayouts,
        setFormLayouts,
        sheetTabs,
        setSheetTabs,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        auditLogs,
        addAuditLog,
        notify,
        quickCreate,
        openQuickCreate,
        closeQuickCreate,
        getEmpresaName,
        getContactoName,
        getUser,
      }}
    >
      {children}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </CRMContext.Provider>
  );
};

export function useCRM(): CRMContextValue {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM debe utilizarse dentro de CRMProvider');
  return ctx;
}
