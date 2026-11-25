import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Shield,
  Trash2,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { CustomFieldDef, CurrencyCode } from '../types/crm';
import { Badge, Button, Card, IconButton } from '../components/ds/primitives';
import { Checkbox, FormSection, Input, RUTInput, Select, Toggle } from '../components/ds/forms';
import { Modal, Table } from '../components/ds/data';
import { REGIONES_CHILE, getComunasByRegionAndProvincia } from '../data/chileGeo';
import { UsersManagementPanel } from './UsersModule';

type SettingsSection =
  | 'general'
  | 'empresa'
  | 'usuarios'
  | 'roles'
  | 'equipos'
  | 'campos'
  | 'modulos'
  | 'etiquetas'
  | 'catalogos'
  | 'pipelines'
  | 'cotizaciones'
  | 'notificaciones'
  | 'seguridad'
  | 'auditoria'
  | 'personalizacion';

const SETTINGS_NAV: { id: SettingsSection; label: string }[] = [
  { id: 'general', label: '1. Configuración General' },
  { id: 'empresa', label: '2. Empresa Emisora' },
  { id: 'usuarios', label: '3. Usuarios' },
  { id: 'roles', label: '4. Roles y Permisos' },
  { id: 'equipos', label: '5. Equipos Comerciales' },
  { id: 'campos', label: '6. Campos Personalizados' },
  { id: 'modulos', label: '7. Módulos Activos' },
  { id: 'etiquetas', label: '8. Etiquetas y Categorías' },
  { id: 'catalogos', label: '9. Catálogos' },
  { id: 'pipelines', label: '10. Pipelines y Etapas' },
  { id: 'cotizaciones', label: '11. Cotizaciones e Impuestos' },
  { id: 'notificaciones', label: '12. Notificaciones' },
  { id: 'seguridad', label: '13. Seguridad' },
  { id: 'auditoria', label: '14. Auditoría' },
  { id: 'personalizacion', label: '15. Personalización Visual' },
];

const FIELD_TYPES: CustomFieldDef['type'][] = [
  'Texto',
  'Texto largo',
  'Número',
  'Moneda',
  'Porcentaje',
  'Fecha',
  'Fecha y hora',
  'Booleano',
  'Checkbox',
  'Selector',
  'Multi selector',
  'Email',
  'Teléfono',
  'URL',
  'RUT',
  'Relación',
];

export const SettingsModule: React.FC = () => {
  const {
    orgSettings,
    setOrgSettings,
    roles,
    setRoles,
    teams,
    customFields,
    setCustomFields,
    moduleConfigs,
    setModuleConfigs,
    catalogs,
    setCatalogs,
    pipelineStages,
    setPipelineStages,
    auditLogs,
    addAuditLog,
    notify,
    navigateTo,
    getUser,
  } = useCRM();

  const [section, setSection] = useState<SettingsSection>('general');
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || 'role-admin');

  const [cfModalOpen, setCfModalOpen] = useState(false);
  const [cfForm, setCfForm] = useState<Omit<CustomFieldDef, 'id'>>({
    module: 'empresas',
    label: '',
    key: '',
    type: 'Texto',
    required: false,
    defaultValue: '',
    section: 'Información adicional',
    visible: true,
    order: customFields.length + 1,
    helpText: '',
  });

  const [newTag, setNewTag] = useState('');
  const [catalogTab, setCatalogTab] = useState<'industrias' | 'fuentes' | 'motivosPerdida'>('industrias');
  const [newCatalogVal, setNewCatalogVal] = useState('');
  const [newStageName, setNewStageName] = useState('');

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const togglePermission = (mod: string, perm: 'read' | 'create' | 'edit' | 'delete' | 'export' | 'admin') => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === activeRole.id
          ? {
              ...r,
              permissions: {
                ...r.permissions,
                [mod]: { ...r.permissions[mod], [perm]: !r.permissions[mod]?.[perm] },
              },
            }
          : r
      )
    );
  };

  const moveStage = (idx: number, dir: -1 | 1) => {
    const sorted = pipelineStages.slice().sort((a, b) => a.order - b.order);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    [sorted[idx], sorted[target]] = [sorted[target], sorted[idx]];
    setPipelineStages(sorted.map((s, i) => ({ ...s, order: i + 1 })));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Configuración y Administración</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Control total de parámetros chilenos, usuarios, roles, campos dinámicos, pipelines y auditoría.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigateTo('personalizacion')}>
          Ir a Estudio de Personalización UI
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Settings Left Menu */}
        <Card className="lg:col-span-3" title="Categorías" noPadding>
          <div className="p-2 space-y-0.5 max-h-[70vh] overflow-y-auto">
            {SETTINGS_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  section === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Settings Panel */}
        <div className="lg:col-span-9 space-y-5">
          {section === 'general' && (
            <Card
              title="1. Configuración General y Regional (Chile)"
              actions={
                <Button size="sm" onClick={() => { addAuditLog('Configuración', 'Configuración', 'Actualizó preferencias generales'); notify('Configuración guardada'); }}>
                  Guardar cambios
                </Button>
              }
            >
              <FormSection title="Parámetros de plataforma">
                <Input label="Nombre de la organización" value={orgSettings.nombreOrganizacion} onChange={(e) => setOrgSettings({ ...orgSettings, nombreOrganizacion: e.target.value })} />
                <Input label="Nombre de la plataforma" value={orgSettings.nombrePlataforma} onChange={(e) => setOrgSettings({ ...orgSettings, nombrePlataforma: e.target.value })} />
                <Select label="Idioma" value={orgSettings.idioma} onChange={(e) => setOrgSettings({ ...orgSettings, idioma: e.target.value })} options={[{ value: 'es-CL (Español de Chile)', label: 'es-CL (Español de Chile)' }, { value: 'es-ES (Español)', label: 'es-ES (Español)' }]} />
                <Select label="Zona horaria" value={orgSettings.zonaHoraria} onChange={(e) => setOrgSettings({ ...orgSettings, zonaHoraria: e.target.value })} options={[{ value: 'America/Santiago (UTC-3)', label: 'America/Santiago (UTC-3)' }, { value: 'America/Punta_Arenas (UTC-3)', label: 'America/Punta_Arenas (UTC-3)' }]} />
                <Select label="Moneda predeterminada" value={orgSettings.monedaPredeterminada} onChange={(e) => setOrgSettings({ ...orgSettings, monedaPredeterminada: e.target.value as CurrencyCode })} options={['CLP', 'UF', 'USD', 'EUR'].map((m) => ({ value: m, label: m }))} />
                <Select label="Formato de fechas" value={orgSettings.formatoFecha} onChange={(e) => setOrgSettings({ ...orgSettings, formatoFecha: e.target.value })} options={[{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Chileno)' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }]} />
                <Input label="Valor UF referencial (CLP)" type="number" value={orgSettings.valorUF} onChange={(e) => setOrgSettings({ ...orgSettings, valorUF: Number(e.target.value) || 38250 })} className="font-mono" />
                <Input label="Valor USD referencial (CLP)" type="number" value={orgSettings.valorUSD} onChange={(e) => setOrgSettings({ ...orgSettings, valorUSD: Number(e.target.value) || 965 })} className="font-mono" />
              </FormSection>
            </Card>
          )}

          {section === 'empresa' && (
            <Card title="2. Datos de Empresa Emisora" actions={<Button size="sm" onClick={() => notify('Datos corporativos actualizados')}>Guardar</Button>}>
              <FormSection title="Identificación tributaria">
                <Input label="Razón social" value={orgSettings.razonSocial} onChange={(e) => setOrgSettings({ ...orgSettings, razonSocial: e.target.value })} />
                <Input label="Nombre comercial" value={orgSettings.nombreComercial} onChange={(e) => setOrgSettings({ ...orgSettings, nombreComercial: e.target.value })} />
                <RUTInput label="RUT empresa" value={orgSettings.rut} onChange={(r) => setOrgSettings({ ...orgSettings, rut: r })} />
                <Input label="Sitio web" value={orgSettings.sitioWeb} onChange={(e) => setOrgSettings({ ...orgSettings, sitioWeb: e.target.value })} />
                <Select label="Región" value={orgSettings.region} onChange={(e) => setOrgSettings({ ...orgSettings, region: e.target.value })} options={REGIONES_CHILE.map((r) => ({ value: r, label: r }))} />
                <Select label="Comuna" value={orgSettings.comuna} onChange={(e) => setOrgSettings({ ...orgSettings, comuna: e.target.value })} options={getComunasByRegionAndProvincia(orgSettings.region).map((c) => ({ value: c, label: c }))} />
                <Input label="Dirección" value={orgSettings.direccion} onChange={(e) => setOrgSettings({ ...orgSettings, direccion: e.target.value })} />
                <Input label="Teléfono" value={orgSettings.telefono} onChange={(e) => setOrgSettings({ ...orgSettings, telefono: e.target.value })} />
              </FormSection>
            </Card>
          )}

          {section === 'usuarios' && <UsersManagementPanel embedded />}

          {section === 'roles' && (
            <Card title="4. Roles y Matriz de Permisos" subtitle="Control granular por módulo y acción">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                      activeRole.id === r.id ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mb-4">{activeRole.description}</p>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold text-slate-700">Módulo</th>
                      <th className="px-3 py-2.5 text-center">Lectura</th>
                      <th className="px-3 py-2.5 text-center">Creación</th>
                      <th className="px-3 py-2.5 text-center">Edición</th>
                      <th className="px-3 py-2.5 text-center">Eliminación</th>
                      <th className="px-3 py-2.5 text-center">Exportación</th>
                      <th className="px-3 py-2.5 text-center">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(activeRole.permissions).map(([mod, perms]) => (
                      <tr key={mod} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium capitalize text-slate-900">{mod}</td>
                        {(['read', 'create', 'edit', 'delete', 'export', 'admin'] as const).map((pk) => (
                          <td key={pk} className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(perms[pk])}
                              onChange={() => togglePermission(mod, pk)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-700 cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {section === 'equipos' && (
            <Card title="5. Equipos Comerciales">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((t) => (
                  <div key={t.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                      <Badge tone="blue">{t.memberIds.length} miembros</Badge>
                    </div>
                    <p className="text-xs text-slate-500">Foco territorial: {t.regionFocus}</p>
                    <p className="text-xs text-slate-600">Líder: <strong>{getUser(t.leaderId)?.name}</strong></p>
                    <p className="text-xs font-mono text-slate-700">Meta mensual: $ {t.targetCLP.toLocaleString('es-CL')}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {section === 'campos' && (
            <Card
              title="6. Editor de Campos Personalizados"
              subtitle="Agrega atributos propios a Empresas, Contactos, Oportunidades, Cotizaciones, Productos y Postventa"
              actions={
                <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setCfModalOpen(true)}>
                  Crear campo
                </Button>
              }
            >
              <Table
                data={customFields}
                columns={[
                  { key: 'label', header: 'Etiqueta', render: (f) => <span className="font-medium text-slate-900">{f.label}</span> },
                  { key: 'module', header: 'Módulo', render: (f) => <span className="capitalize text-xs">{f.module}</span> },
                  { key: 'type', header: 'Tipo', render: (f) => <Badge tone="neutral">{f.type}</Badge> },
                  { key: 'required', header: 'Obligatorio', render: (f) => (f.required ? 'Sí' : 'No') },
                  {
                    key: 'visible',
                    header: 'Visible',
                    render: (f) => (
                      <Toggle
                        checked={f.visible}
                        onChange={(v) => setCustomFields((prev) => prev.map((x) => (x.id === f.id ? { ...x, visible: v } : x)))}
                      />
                    ),
                  },
                ]}
                rowActions={(f) => [
                  { label: 'Eliminar campo', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => setCustomFields((prev) => prev.filter((x) => x.id !== f.id)) },
                ]}
              />
            </Card>
          )}

          {section === 'modulos' && (
            <Card title="7. Activación y Visibilidad de Módulos" subtitle="Activa o desactiva módulos en la navegación global de illus Ventas">
              <div className="divide-y divide-slate-100">
                {moduleConfigs.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{m.label}</div>
                      <div className="text-xs text-slate-500">{m.description}</div>
                    </div>
                    <Toggle
                      checked={m.enabled}
                      label={m.enabled ? 'Activo' : 'Oculto'}
                      onChange={(val) => {
                        setModuleConfigs((prev) => prev.map((x) => (x.id === m.id ? { ...x, enabled: val } : x)));
                        notify(`${m.label} ${val ? 'activado' : 'ocultado'} en el menú`, undefined, 'info');
                      }}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {section === 'etiquetas' && (
            <Card title="8. Etiquetas y Categorías">
              <div className="flex gap-2 mb-4">
                <Input placeholder="Nueva etiqueta..." value={newTag} onChange={(e) => setNewTag(e.target.value)} />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!newTag.trim()) return;
                    setCatalogs((p) => ({
                      ...p,
                      etiquetas: [...p.etiquetas, { id: `tag-${Date.now()}`, name: newTag.trim(), color: 'blue' }],
                    }));
                    setNewTag('');
                    notify('Etiqueta agregada');
                  }}
                >
                  Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {catalogs.etiquetas.map((t) => (
                  <div key={t.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <span className="font-medium text-slate-800">{t.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCatalogs((p) => ({ ...p, etiquetas: p.etiquetas.filter((x) => x.id !== t.id) }))
                      }
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {section === 'catalogos' && (
            <Card title="9. Catálogos Configurables">
              <div className="flex gap-2 mb-4">
                {[
                  { id: 'industrias' as const, label: 'Industrias' },
                  { id: 'fuentes' as const, label: 'Fuentes de origen' },
                  { id: 'motivosPerdida' as const, label: 'Motivos de pérdida' },
                ].map((c) => (
                  <Button key={c.id} size="xs" variant={catalogTab === c.id ? 'primary' : 'outline'} onClick={() => setCatalogTab(c.id)}>
                    {c.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 mb-4">
                <Input placeholder="Agregar nuevo elemento..." value={newCatalogVal} onChange={(e) => setNewCatalogVal(e.target.value)} />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!newCatalogVal.trim()) return;
                    setCatalogs((p) => ({ ...p, [catalogTab]: [...p[catalogTab], newCatalogVal.trim()] }));
                    setNewCatalogVal('');
                    notify('Catálogo actualizado');
                  }}
                >
                  Añadir
                </Button>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {catalogs[catalogTab].map((val) => (
                  <div key={val} className="px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-800">{val}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCatalogs((p) => ({ ...p, [catalogTab]: p[catalogTab].filter((x) => x !== val) }))
                      }
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {section === 'pipelines' && (
            <Card title="10. Configuración de Pipelines y Etapas" subtitle="Ordena etapas, define probabilidades y agrega nuevas fases">
              <div className="flex gap-2 mb-4">
                <Input placeholder="Nombre de nueva etapa..." value={newStageName} onChange={(e) => setNewStageName(e.target.value)} />
                <Button
                  size="sm"
                  onClick={() => {
                    if (!newStageName.trim()) return;
                    setPipelineStages((prev) => [
                      ...prev,
                      { id: `stg-${Date.now()}`, name: newStageName.trim(), probability: 50, color: 'blue', order: prev.length + 1 },
                    ]);
                    setNewStageName('');
                    notify('Etapa agregada al pipeline');
                  }}
                >
                  Agregar etapa
                </Button>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {pipelineStages
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((stg, idx) => (
                    <div key={stg.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="font-mono text-xs text-slate-400 shrink-0">#{idx + 1}</span>
                        <input
                          type="text"
                          value={stg.name}
                          onChange={(e) =>
                            setPipelineStages((prev) =>
                              prev.map((x) => (x.id === stg.id ? { ...x, name: e.target.value } : x))
                            )
                          }
                          aria-label={`Nombre de columna ${stg.name}`}
                          className="w-full max-w-xs border border-transparent hover:border-slate-300 focus:border-blue-700 focus:bg-white bg-transparent rounded-md px-2 py-1 text-sm font-medium text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={stg.probability}
                          onChange={(e) =>
                            setPipelineStages((prev) =>
                              prev.map((x) => (x.id === stg.id ? { ...x, probability: Number(e.target.value) || 0 } : x))
                            )
                          }
                          className="w-16 border border-slate-300 rounded-md px-2 py-1 text-xs font-mono text-right"
                        />
                        <span className="text-xs text-slate-500">%</span>
                        <IconButton label="Subir" size="sm" disabled={idx === 0} onClick={() => moveStage(idx, -1)}>
                          <ArrowUp className="w-3.5 h-3.5" />
                        </IconButton>
                        <IconButton label="Bajar" size="sm" disabled={idx === pipelineStages.length - 1} onClick={() => moveStage(idx, 1)}>
                          <ArrowDown className="w-3.5 h-3.5" />
                        </IconButton>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {section === 'cotizaciones' && (
            <Card title="11. Configuración de Cotizaciones e Impuestos" actions={<Button size="sm" onClick={() => notify('Parámetros de cotización guardados')}>Guardar</Button>}>
              <FormSection title="Folios e impuestos chilenos">
                <Input label="Prefijo folios cotización" value={orgSettings.folioCotizacionPrefijo} onChange={(e) => setOrgSettings({ ...orgSettings, folioCotizacionPrefijo: e.target.value })} className="font-mono" />
                <Input label="Prefijo folios pedido" value={orgSettings.folioPedidoPrefijo} onChange={(e) => setOrgSettings({ ...orgSettings, folioPedidoPrefijo: e.target.value })} className="font-mono" />
                <Input label="IVA por defecto (%)" type="number" value={orgSettings.ivaPorDefecto} onChange={(e) => setOrgSettings({ ...orgSettings, ivaPorDefecto: Number(e.target.value) || 19 })} className="font-mono" />
              </FormSection>
            </Card>
          )}

          {section === 'notificaciones' && (
            <Card title="12. Preferencias de Notificaciones y Alertas">
              <div className="space-y-3">
                {[
                  'Notificar cuando un cliente visualiza una cotización',
                  'Alerta 3 días antes del vencimiento de cotizaciones',
                  'Notificación instantánea al asignar un caso de postventa Urgente',
                  'Resumen diario de tareas pendientes a las 08:30 hrs (America/Santiago)',
                ].map((label, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                    <span className="text-sm text-slate-700">{label}</span>
                    <Toggle checked={true} onChange={() => notify('Preferencia actualizada')} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {section === 'seguridad' && (
            <Card title="13. Seguridad y Control de Acceso">
              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <Shield className="w-5 h-5 text-blue-700 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900">Políticas de sesión activa</div>
                    <p className="mt-0.5">Expiración automática por inactividad a los 60 minutos y registro IP en auditoría.</p>
                  </div>
                </div>
                <Checkbox checked={true} onChange={() => {}} label="Exigir autenticación multifactor (2FA) para administradores" />
                <Checkbox checked={true} onChange={() => {}} label="Registrar exportaciones masivas en historial de auditoría" />
              </div>
            </Card>
          )}

          {section === 'auditoria' && (
            <Card title="14. Registro de Auditoría" subtitle="Historial reciente de cambios en illus Ventas">
              <Table
                data={auditLogs}
                columns={[
                  { key: 'fecha', header: 'Fecha y hora', render: (a) => <span className="font-mono text-xs">{a.fecha}</span> },
                  { key: 'usr', header: 'Usuario', render: (a) => getUser(a.usuarioId)?.name || 'Sistema' },
                  { key: 'mod', header: 'Módulo', render: (a) => a.modulo },
                  { key: 'acc', header: 'Acción', render: (a) => <Badge tone="neutral">{a.accion}</Badge> },
                  { key: 'det', header: 'Detalle', render: (a) => <span className="text-xs text-slate-700">{a.detalle}</span> },
                  { key: 'ip', header: 'IP', render: (a) => <span className="font-mono text-xs text-slate-400">{a.ip}</span> },
                ]}
              />
            </Card>
          )}

          {section === 'personalizacion' && (
            <Card title="15. Personalización de Experiencia y Apariencia">
              <p className="text-sm text-slate-600 mb-4">
                Configura columnas de tablas, vistas predeterminadas (Tablero, Tabla, Lista, Calendario), campos obligatorios de formularios y pestañas de fichas desde el estudio visual.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigateTo('personalizacion')}>Abrir Estudio de Personalización UI</Button>
                <Button variant="outline" onClick={() => navigateTo('design-system')}>Ver Design System</Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Custom Field Modal */}
      <Modal
        open={cfModalOpen}
        onClose={() => setCfModalOpen(false)}
        title="Crear campo personalizado"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCfModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!cfForm.label.trim()) return;
                const key = cfForm.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
                setCustomFields((prev) => [...prev, { ...cfForm, id: `cf-${Date.now()}`, key }]);
                setCfModalOpen(false);
                notify('Campo personalizado creado', `${cfForm.label} disponible en ${cfForm.module}.`);
              }}
            >
              Guardar campo
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Nombre visible del campo" required value={cfForm.label} onChange={(e) => setCfForm({ ...cfForm, label: e.target.value })} placeholder="Ej: N° Licitación Mercado Público" />
          <Select
            label="Módulo destino"
            value={cfForm.module}
            onChange={(e) => setCfForm({ ...cfForm, module: e.target.value as CustomFieldDef['module'] })}
            options={['empresas', 'contactos', 'oportunidades', 'cotizaciones', 'productos', 'postventa'].map((m) => ({ value: m, label: m }))}
          />
          <Select
            label="Tipo de dato"
            value={cfForm.type}
            onChange={(e) => setCfForm({ ...cfForm, type: e.target.value as CustomFieldDef['type'] })}
            options={FIELD_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <Input label="Sección del formulario" value={cfForm.section} onChange={(e) => setCfForm({ ...cfForm, section: e.target.value })} />
          <Input label="Texto de ayuda" value={cfForm.helpText || ''} onChange={(e) => setCfForm({ ...cfForm, helpText: e.target.value })} />
          <div className="flex items-end pb-2">
            <Checkbox checked={cfForm.required} onChange={(v) => setCfForm({ ...cfForm, required: v })} label="Campo obligatorio" />
          </div>
        </div>
      </Modal>
    </div>
  );
};
