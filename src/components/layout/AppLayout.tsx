import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  DollarSign,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Headphones,
  Home,
  LayoutDashboard,
  Layers,
  Menu,
  Package,
  Palette,
  PanelLeft,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  Sliders,
  TrendingUp,
  UserCog,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import { QuickCreateEntity, useCRM } from '../../context/CRMContext';
import { CurrencyCode, ModuleId } from '../../types/crm';
import { Avatar, Badge, Breadcrumb, Button, IconButton } from '../ds/primitives';
import { Modal } from '../ds/data';

interface NavGroup {
  id: string;
  label: string;
  items: { id: ModuleId; label: string; icon: React.ReactNode }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'general',
    label: 'General',
    items: [
      { id: 'inicio', label: 'Inicio', icon: <Home className="w-4 h-4" /> },
      { id: 'dashboard', label: 'Panel de control', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    items: [
      { id: 'empresas', label: 'Empresas', icon: <Building2 className="w-4 h-4" /> },
      { id: 'contactos', label: 'Contactos', icon: <Users className="w-4 h-4" /> },
      { id: 'oportunidades', label: 'Oportunidades', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'cotizaciones', label: 'Cotizaciones', icon: <FileSpreadsheet className="w-4 h-4" /> },
      { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart className="w-4 h-4" /> },
      { id: 'ventas', label: 'Ventas', icon: <DollarSign className="w-4 h-4" /> },
    ],
  },
  {
    id: 'gestion',
    label: 'Gestión',
    items: [
      { id: 'productos', label: 'Productos y servicios', icon: <Package className="w-4 h-4" /> },
      { id: 'actividades', label: 'Actividades', icon: <Activity className="w-4 h-4" /> },
      { id: 'calendario', label: 'Calendario', icon: <Calendar className="w-4 h-4" /> },
      { id: 'tareas', label: 'Tareas', icon: <CheckSquare className="w-4 h-4" /> },
      { id: 'postventa', label: 'Postventa', icon: <Headphones className="w-4 h-4" /> },
      { id: 'documentos', label: 'Documentos', icon: <FolderOpen className="w-4 h-4" /> },
    ],
  },
  {
    id: 'analisis',
    label: 'Análisis',
    items: [
      { id: 'reportes', label: 'Reportes', icon: <FileText className="w-4 h-4" /> },
      { id: 'analitica', label: 'Analítica comercial', icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    id: 'administracion',
    label: 'Administración',
    items: [
      { id: 'usuarios', label: 'Usuarios', icon: <UserCog className="w-4 h-4" /> },
      { id: 'automatizaciones', label: 'Automatizaciones', icon: <Workflow className="w-4 h-4" /> },
      { id: 'configuracion', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
      { id: 'personalizacion', label: 'Personalización UI', icon: <Sliders className="w-4 h-4" /> },
      { id: 'design-system', label: 'Design System', icon: <Palette className="w-4 h-4" /> },
    ],
  },
];

const QUICK_CREATE_OPTIONS: { entity: QuickCreateEntity; label: string; icon: React.ReactNode }[] = [
  { entity: 'empresa', label: 'Empresa', icon: <Building2 className="w-3.5 h-3.5 text-blue-700" /> },
  { entity: 'contacto', label: 'Contacto', icon: <Users className="w-3.5 h-3.5 text-blue-700" /> },
  { entity: 'oportunidad', label: 'Oportunidad', icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-700" /> },
  { entity: 'cotizacion', label: 'Cotización', icon: <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" /> },
  { entity: 'tarea', label: 'Tarea', icon: <CheckSquare className="w-3.5 h-3.5 text-amber-700" /> },
  { entity: 'actividad', label: 'Actividad', icon: <Activity className="w-3.5 h-3.5 text-slate-700" /> },
  { entity: 'producto', label: 'Producto / Servicio', icon: <Package className="w-3.5 h-3.5 text-slate-700" /> },
  { entity: 'pedido', label: 'Pedido', icon: <ShoppingCart className="w-3.5 h-3.5 text-emerald-700" /> },
  { entity: 'postventa', label: 'Caso de postventa', icon: <Headphones className="w-3.5 h-3.5 text-red-600" /> },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeModule,
    selectedRecordId,
    navigateTo,
    displayCurrency,
    setDisplayCurrency,
    currentUser,
    setCurrentUserId,
    teamMembers,
    orgSettings,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    openQuickCreate,
    empresas,
    contactos,
    oportunidades,
    cotizaciones,
    productos,
    pedidos,
    documentos,
    moduleConfigs,
    notify,
  } = useCRM();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [activeOrgBranch, setActiveOrgBranch] = useState('Casa Matriz Santiago');
  const [helpOpen, setHelpOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const moduleLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    NAV_GROUPS.forEach((g) => g.items.forEach((it) => (map[it.id] = it.label)));
    return map;
  }, []);

  const enabledMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    moduleConfigs.forEach((m) => (map[m.id] = m.enabled));
    return map;
  }, [moduleConfigs]);

  const searchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return null;
    return {
      empresas: empresas
        .filter((e) => e.nombreComercial.toLowerCase().includes(q) || e.razonSocial.toLowerCase().includes(q) || e.rut.toLowerCase().includes(q))
        .slice(0, 3),
      contactos: contactos
        .filter((c) => `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
        .slice(0, 3),
      oportunidades: oportunidades
        .filter((o) => o.nombre.toLowerCase().includes(q))
        .slice(0, 3),
      cotizaciones: cotizaciones
        .filter((c) => c.folio.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q))
        .slice(0, 3),
      productos: productos
        .filter((p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
        .slice(0, 3),
      pedidos: pedidos
        .filter((p) => p.folio.toLowerCase().includes(q))
        .slice(0, 2),
      documentos: documentos
        .filter((d) => d.nombre.toLowerCase().includes(q))
        .slice(0, 2),
    };
  }, [globalQuery, empresas, contactos, oportunidades, cotizaciones, productos, pedidos, documentos]);

  const hasAnySearchHit =
    searchResults &&
    (searchResults.empresas.length > 0 ||
      searchResults.contactos.length > 0 ||
      searchResults.oportunidades.length > 0 ||
      searchResults.cotizaciones.length > 0 ||
      searchResults.productos.length > 0 ||
      searchResults.pedidos.length > 0 ||
      searchResults.documentos.length > 0);

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectNav = (id: ModuleId) => {
    navigateTo(id, null);
    setMobileMenuOpen(false);
  };

  const SidebarContent = (isMobile: boolean) => {
    const collapsed = !isMobile && sidebarCollapsed;
    return (
      <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
        {/* Brand + Org Selector */}
        <div className={`h-14 flex items-center justify-between px-3.5 border-b border-slate-200 shrink-0`}>
          {!collapsed ? (
            <div className="relative flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setOrgMenuOpen((o) => !o)}
                className="w-full flex items-center gap-2.5 px-1.5 py-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-left"
              >
                <img
                  src="/assets/aistudio/logo_595a16cf.png"
                  alt="illus Ventas"
                  referrerPolicy="no-referrer"
                  className="h-5 w-auto object-contain shrink-0"
                />
                <div className="min-w-0 flex-1 border-l border-slate-200 pl-2">
                  <div className="text-xs font-bold text-slate-900 tracking-tight truncate leading-tight">
                    {orgSettings.nombrePlataforma === 'illus Ventas' ? 'Ventas' : orgSettings.nombrePlataforma}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate leading-tight">
                    {activeOrgBranch}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
              {orgMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-60 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400">
                    Organización activa
                  </div>
                  {['Casa Matriz Santiago', 'Sucursal Norte — Antofagasta', 'Sucursal Sur — Concepción'].map(
                    (branch) => (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => {
                          setActiveOrgBranch(branch);
                          setOrgMenuOpen(false);
                          notify('Sucursal cambiada', branch, 'info');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer flex items-center justify-between ${
                          activeOrgBranch === branch ? 'font-semibold text-blue-700 bg-blue-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{branch}</span>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ) : (
            <img
              src="/assets/aistudio/logo_595a16cf.png"
              alt="illus Ventas"
              referrerPolicy="no-referrer"
              className="w-10 h-auto object-contain mx-auto"
            />
          )}

          {isMobile ? (
            <IconButton label="Cerrar menú" size="sm" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-4 h-4" />
            </IconButton>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Minimizar barra lateral'}
              title={sidebarCollapsed ? 'Expandir menú' : 'Minimizar menú'}
              className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(
              (item) => enabledMap[item.id] !== false
            );
            if (visibleItems.length === 0) return null;
            const isGroupCollapsed = !collapsed && collapsedGroups[group.id];

            return (
              <div key={group.id} className="space-y-1">
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wide text-slate-400 hover:text-slate-700 uppercase cursor-pointer"
                  >
                    <span>{group.label}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        isGroupCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                  </button>
                )}
                {!isGroupCollapsed && (
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const active = activeModule === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectNav(item.id)}
                          title={collapsed ? item.label : undefined}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                            active
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                          } ${collapsed ? 'justify-center px-0' : ''}`}
                        >
                          <span className="shrink-0">{item.icon}</span>
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Compact Localization */}
        {!collapsed && (
          <div className="px-3.5 py-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="truncate">{orgSettings.nombreOrganizacion}</span>
            <span className="font-mono tabular-nums text-slate-400 shrink-0">CLP · UF</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 sticky top-0 h-screen transition-[width] duration-200 ${
          sidebarCollapsed ? 'w-[68px]' : 'w-[252px]'
        } no-print`}
      >
        {SidebarContent(false)}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-[264px] h-full shadow-2xl">{SidebarContent(true)}</div>
          <div className="flex-1 bg-slate-900/40" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between gap-3 no-print">
          {/* Left: Mobile toggle + Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            <IconButton
              label="Abrir menú"
              size="md"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </IconButton>

            <div className="hidden sm:block min-w-0">
              <Breadcrumb
                items={[
                  { label: orgSettings.nombrePlataforma, onClick: () => navigateTo('dashboard') },
                  {
                    label: moduleLabelMap[activeModule] || 'Módulo',
                    onClick: selectedRecordId ? () => navigateTo(activeModule, null) : undefined,
                  },
                  ...(selectedRecordId ? [{ label: 'Ficha de registro' }] : []),
                ]}
              />
            </div>
            <span className="sm:hidden text-sm font-semibold text-slate-900 truncate">
              {moduleLabelMap[activeModule]}
            </span>
          </div>

          {/* Center: Global Search */}
          <div className="relative flex-1 max-w-md hidden md:block" ref={searchRef}>
            <div className="flex items-center bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:border-blue-700 rounded-lg px-3 h-9 transition-colors">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                type="text"
                value={globalQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Buscar empresas, RUT, contactos, folios..."
                className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {globalQuery && (
                <button
                  type="button"
                  onClick={() => setGlobalQuery('')}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {searchFocused && globalQuery.trim().length > 0 && searchResults && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-96 overflow-y-auto p-2 z-50 space-y-2">
                {!hasAnySearchHit ? (
                  <p className="text-xs text-slate-500 px-3 py-4 text-center">
                    Sin coincidencias para &ldquo;{globalQuery}&rdquo;.
                  </p>
                ) : (
                  <>
                    {searchResults.empresas.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">Empresas</div>
                        {searchResults.empresas.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onMouseDown={() => {
                              navigateTo('empresas', e.id);
                              setGlobalQuery('');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                          >
                            <span className="font-medium text-slate-800">{e.nombreComercial}</span>
                            <span className="font-mono text-slate-400">{e.rut}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.contactos.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">Contactos</div>
                        {searchResults.contactos.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => {
                              navigateTo('contactos', c.id);
                              setGlobalQuery('');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                          >
                            <span className="font-medium text-slate-800">
                              {c.nombre} {c.apellido}
                            </span>
                            <span className="text-slate-400">{c.cargo}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.oportunidades.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">Oportunidades</div>
                        {searchResults.oportunidades.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onMouseDown={() => {
                              navigateTo('oportunidades', o.id);
                              setGlobalQuery('');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                          >
                            <span className="font-medium text-slate-800 truncate">{o.nombre}</span>
                            <span className="font-mono text-blue-700 shrink-0 ml-2">
                              $ {o.monto.toLocaleString('es-CL')}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.cotizaciones.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">Cotizaciones</div>
                        {searchResults.cotizaciones.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => {
                              navigateTo('cotizaciones', c.id);
                              setGlobalQuery('');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                          >
                            <span className="font-medium text-slate-800 truncate">{c.nombre}</span>
                            <span className="font-mono text-slate-500 shrink-0 ml-2">{c.folio}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.productos.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">Productos</div>
                        {searchResults.productos.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={() => {
                              navigateTo('productos', p.id);
                              setGlobalQuery('');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                          >
                            <span className="font-medium text-slate-800 truncate">{p.nombre}</span>
                            <span className="font-mono text-slate-400">{p.sku}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.pedidos.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">Pedidos</div>
                        {searchResults.pedidos.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={() => {
                              navigateTo('pedidos', p.id);
                              setGlobalQuery('');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                          >
                            <span className="font-mono font-medium text-slate-800">{p.folio}</span>
                            <span className="text-slate-400">{p.estado}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.documentos.length > 0 && (
                      <div>
                        <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">Documentos</div>
                        {searchResults.documentos.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onMouseDown={() => {
                              navigateTo('documentos', d.id);
                              setGlobalQuery('');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                          >
                            <span className="font-medium text-slate-800 truncate">{d.nombre}</span>
                            <span className="text-slate-400">{d.tipo}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Currency, Quick Create, Notifications, Help, User */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Currency Switch */}
            <select
              aria-label="Moneda de visualización"
              value={displayCurrency}
              onChange={(e) => {
                const c = e.target.value as CurrencyCode;
                setDisplayCurrency(c);
                notify(`Moneda visual: ${c}`, 'Los montos se muestran convertidos en tiempo real.', 'info');
              }}
              className="hidden sm:block bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-semibold text-slate-700 cursor-pointer focus:border-blue-700 focus:outline-none"
            >
              <option value="CLP">CLP $</option>
              <option value="UF">UF</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>

            {/* Quick Create + */}
            <div className="relative">
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setQuickMenuOpen((o) => !o)}
              >
                <span className="hidden sm:inline">Crear</span>
              </Button>
              {quickMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400">
                    Creación rápida
                  </div>
                  {QUICK_CREATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.entity}
                      type="button"
                      onClick={() => {
                        setQuickMenuOpen(false);
                        openQuickCreate(opt.entity);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer text-left"
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <IconButton
                label="Notificaciones"
                size="md"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-700" />
                )}
              </IconButton>

              {notifOpen && (
                <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-900">
                      Notificaciones ({unreadCount})
                    </span>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-medium text-blue-700 hover:underline cursor-pointer"
                    >
                      Marcar leídas
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifOpen(false);
                          navigateTo(n.targetModule, n.targetId || null);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                          n.read ? 'opacity-70' : 'bg-blue-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900">{n.title}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-snug">{n.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Help */}
            <IconButton
              label="Ayuda y localización"
              size="md"
              onClick={() => setHelpOpen(true)}
              className="hidden sm:inline-flex"
            >
              <CircleHelp className="w-4 h-4" />
            </IconButton>

            {/* User Profile */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Avatar src={currentUser.avatar} name={currentUser.name} initials={currentUser.initials} size="sm" />
                <div className="hidden xl:block text-left leading-tight">
                  <div className="text-xs font-semibold text-slate-900">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500">{currentUser.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <div className="text-xs font-semibold text-slate-900">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                  </div>
                  <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400">
                    Simular perfil de usuario
                  </div>
                  {teamMembers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setCurrentUserId(u.id);
                        setProfileOpen(false);
                        notify('Sesión cambiada', `Operando como ${u.name} (${u.role})`, 'info');
                      }}
                      className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs hover:bg-slate-50 cursor-pointer text-left ${
                        u.id === currentUser.id ? 'bg-blue-50/50 text-blue-700 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <Avatar src={u.avatar} name={u.name} initials={u.initials} size="xs" />
                      <div className="min-w-0">
                        <div className="truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{u.role}</div>
                      </div>
                    </button>
                  ))}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigateTo('configuracion');
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Configuración de plataforma</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigateTo('design-system');
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Ver Design System</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Global Search Bar */}
        <div className="md:hidden bg-white border-b border-slate-200 px-3 py-2 no-print">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 h-9">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Buscar en illus Ventas..."
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 pb-20 lg:pb-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Quick Nav (Compact <= 15% viewport height) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex items-center justify-around h-14 px-1 no-print">
          {[
            { id: 'dashboard' as ModuleId, label: 'Panel', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'empresas' as ModuleId, label: 'Empresas', icon: <Building2 className="w-4 h-4" /> },
            { id: 'oportunidades' as ModuleId, label: 'Pipeline', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'cotizaciones' as ModuleId, label: 'Cotiz.', icon: <FileSpreadsheet className="w-4 h-4" /> },
            { id: 'actividades' as ModuleId, label: 'Agenda', icon: <Calendar className="w-4 h-4" /> },
          ].map((tab) => {
            const active = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigateTo(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-medium min-w-[56px] cursor-pointer ${
                  active ? 'text-blue-700' : 'text-slate-500'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Help Modal */}
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Centro de ayuda y localización — illus Ventas"
        subtitle="Referencia rápida del prototipo funcional B2B"
        size="md"
        footer={<Button onClick={() => setHelpOpen(false)}>Entendido</Button>}
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div>
              <div className="font-semibold text-slate-900">Zona horaria</div>
              <div className="font-mono mt-0.5">{orgSettings.zonaHoraria}</div>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Monedas activas</div>
              <div className="font-mono mt-0.5">CLP · UF ($ {orgSettings.valorUF.toLocaleString('es-CL')}) · USD · EUR</div>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Impuesto predeterminado</div>
              <div className="font-mono mt-0.5">IVA {orgSettings.ivaPorDefecto}% (Configurable)</div>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Formato de fecha</div>
              <div className="font-mono mt-0.5">{orgSettings.formatoFecha}</div>
            </div>
          </div>
          <p>
            Este prototipo interactivo conecta todos los módulos comerciales: puedes crear o editar empresas con RUT y comunas de Chile, mover oportunidades en el Tablero, emitir cotizaciones con vista previa imprimible, gestionar pedidos/ventas/postventa, diseñar automatizaciones y personalizar formularios desde Administración.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue" icon={<PanelLeft className="w-3 h-3" />}>Navegación lateral modular</Badge>
            <Badge tone="success">Conexión transversal entre entidades</Badge>
          </div>
        </div>
      </Modal>
    </div>
  );
};
