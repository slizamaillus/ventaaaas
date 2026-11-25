import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  RotateCcw,
  Save,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { Badge, Button, Card, IconButton } from '../components/ds/primitives';
import { Checkbox, Input, Select, Toggle } from '../components/ds/forms';
import { Tabs } from '../components/ds/data';

export const CustomizationModule: React.FC = () => {
  const {
    savedViews,
    setSavedViews,
    formLayouts,
    setFormLayouts,
    sheetTabs,
    setSheetTabs,
    notify,
  } = useCRM();

  const [activeTab, setActiveTab] = useState('tablas');
  const [selectedViewId, setSelectedViewId] = useState(savedViews[0]?.id || 'view-emp-default');
  const [selectedFormModule, setSelectedFormModule] = useState<'empresas' | 'contactos' | 'oportunidades'>('empresas');
  const [selectedSheetModule, setSelectedSheetModule] = useState<'empresas' | 'contactos' | 'oportunidades'>('empresas');

  const currentView = savedViews.find((v) => v.id === selectedViewId) || savedViews[0];
  const currentForm = formLayouts.find((f) => f.module === selectedFormModule) || formLayouts[0];
  const currentSheet = sheetTabs.find((s) => s.module === selectedSheetModule) || sheetTabs[0];

  const moveColumn = (idx: number, dir: -1 | 1) => {
    if (!currentView) return;
    const cols = [...currentView.columns];
    const target = idx + dir;
    if (target < 0 || target >= cols.length) return;
    [cols[idx], cols[target]] = [cols[target], cols[idx]];
    setSavedViews((prev) => prev.map((v) => (v.id === currentView.id ? { ...v, columns: cols } : v)));
  };

  const duplicateView = () => {
    if (!currentView) return;
    const id = `view-${Date.now()}`;
    setSavedViews((prev) => [
      ...prev,
      { ...currentView, id, name: `${currentView.name} (Copia)`, isDefault: false, visibility: 'Equipo' },
    ]);
    setSelectedViewId(id);
    notify('Vista personalizada duplicada');
  };

  const moveSheetTab = (idx: number, dir: -1 | 1) => {
    if (!currentSheet) return;
    const arr = [...currentSheet.tabs];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSheetTabs((prev) => prev.map((s) => (s.module === currentSheet.module ? { ...s, tabs: arr } : s)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Personalización de Experiencia (No-Code)</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configura tablas, vistas guardadas, estructura de formularios y pestañas de fichas sin programar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => notify('Configuración restablecida', 'Se restauraron los valores por defecto.', 'info')}
          >
            Restablecer
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Save className="w-3.5 h-3.5" />}
            onClick={() => notify('Personalización guardada', 'Los cambios ya aplican en las vistas y fichas del CRM.')}
          >
            Guardar configuración
          </Button>
        </div>
      </div>

      <Tabs
        variant="segmented"
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'tablas', label: 'Tablas y Vistas Guardadas' },
          { id: 'formularios', label: 'Constructor de Formularios' },
          { id: 'fichas', label: 'Diseño de Fichas de Registro' },
        ]}
      />

      {/* 1. Tablas y Vistas */}
      {activeTab === 'tablas' && currentView && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-5" title="Vistas configuradas" actions={<Button size="xs" variant="outline" leftIcon={<Copy className="w-3 h-3" />} onClick={duplicateView}>Duplicar</Button>}>
            <div className="space-y-2 mb-4">
              {savedViews.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedViewId(v.id)}
                  className={`w-full text-left p-3 rounded-xl border cursor-pointer transition-colors ${
                    v.id === currentView.id ? 'border-blue-700 bg-blue-50/40' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">{v.name}</span>
                    <Badge tone="neutral">{v.viewType}</Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 capitalize">
                    Módulo: {v.module} · Visibilidad: {v.visibility}
                  </div>
                </button>
              ))}
            </div>
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <Input
                label="Nombre de vista"
                value={currentView.name}
                onChange={(e) => setSavedViews((prev) => prev.map((v) => (v.id === currentView.id ? { ...v, name: e.target.value } : v)))}
              />
              <Select
                label="Tipo de vista predeterminada"
                value={currentView.viewType}
                onChange={(e) => setSavedViews((prev) => prev.map((v) => (v.id === currentView.id ? { ...v, viewType: e.target.value as typeof v.viewType } : v)))}
                options={['Tabla', 'Tablero', 'Lista', 'Calendario'].map((t) => ({ value: t, label: t }))}
              />
              <Select
                label="Visibilidad"
                value={currentView.visibility}
                onChange={(e) => setSavedViews((prev) => prev.map((v) => (v.id === currentView.id ? { ...v, visibility: e.target.value as typeof v.visibility } : v)))}
                options={['Privada', 'Equipo', 'Organización'].map((t) => ({ value: t, label: t }))}
              />
            </div>
          </Card>

          <Card className="lg:col-span-7" title="Orden de columnas y Vista previa" subtitle={`Vista: ${currentView.name}`}>
            <div className="space-y-2 mb-5">
              {currentView.columns.map((col, idx) => (
                <div key={col} className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="font-mono font-medium text-slate-800">{idx + 1}. {col}</span>
                  <div className="flex items-center gap-1">
                    <IconButton label="Subir" size="sm" disabled={idx === 0} onClick={() => moveColumn(idx, -1)}>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </IconButton>
                    <IconButton label="Bajar" size="sm" disabled={idx === currentView.columns.length - 1} onClick={() => moveColumn(idx, 1)}>
                      <ArrowDown className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
                <Eye className="w-3.5 h-3.5" />
                <span>Vista previa de encabezados</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {currentView.columns.map((col) => (
                  <div key={col} className="px-3 py-1.5 bg-slate-100 rounded text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {col}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 2. Formularios */}
      {activeTab === 'formularios' && currentForm && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-4">
            <Card
              title="Editor de secciones y obligatoriedad"
              actions={
                <Select
                  value={selectedFormModule}
                  onChange={(e) => setSelectedFormModule(e.target.value as typeof selectedFormModule)}
                  options={[
                    { value: 'empresas', label: 'Formulario Empresas' },
                    { value: 'contactos', label: 'Formulario Contactos' },
                    { value: 'oportunidades', label: 'Formulario Oportunidades' },
                  ]}
                />
              }
            >
              <div className="space-y-5">
                {currentForm.sections.map((sec) => (
                  <div key={sec.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{sec.title}</span>
                      <Toggle
                        checked={sec.visible}
                        label="Sección visible"
                        onChange={(val) =>
                          setFormLayouts((prev) =>
                            prev.map((fl) =>
                              fl.module === currentForm.module
                                ? { ...fl, sections: fl.sections.map((s) => (s.id === sec.id ? { ...s, visible: val } : s)) }
                                : fl
                            )
                          )
                        }
                      />
                    </div>
                    <div className="divide-y divide-slate-100">
                      {sec.fields.map((fld) => (
                        <div key={fld.key} className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="font-medium text-slate-800">{fld.label}</span>
                            {fld.helpText && <p className="text-[11px] text-slate-400">{fld.helpText}</p>}
                          </div>
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={fld.required}
                              label="Obligatorio"
                              onChange={(val) =>
                                setFormLayouts((prev) =>
                                  prev.map((fl) =>
                                    fl.module === currentForm.module
                                      ? {
                                          ...fl,
                                          sections: fl.sections.map((s) =>
                                            s.id === sec.id
                                              ? { ...s, fields: s.fields.map((f) => (f.key === fld.key ? { ...f, required: val } : f)) }
                                              : s
                                          ),
                                        }
                                      : fl
                                  )
                                )
                              }
                            />
                            <Toggle
                              checked={fld.visible}
                              onChange={(val) =>
                                setFormLayouts((prev) =>
                                  prev.map((fl) =>
                                    fl.module === currentForm.module
                                      ? {
                                          ...fl,
                                          sections: fl.sections.map((s) =>
                                            s.id === sec.id
                                              ? { ...s, fields: s.fields.map((f) => (f.key === fld.key ? { ...f, visible: val } : f)) }
                                              : s
                                          ),
                                        }
                                      : fl
                                  )
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="lg:col-span-5" title="Vista previa en vivo del formulario">
            <div className="space-y-4">
              {currentForm.sections
                .filter((s) => s.visible)
                .map((sec) => (
                  <div key={sec.id} className="space-y-2.5 pb-3 border-b border-slate-100 last:border-b-0">
                    <div className="text-xs font-bold text-slate-800">{sec.title}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {sec.fields
                        .filter((f) => f.visible)
                        .map((f) => (
                          <div key={f.key} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                            <span className="font-medium text-slate-700">{f.label}</span>
                            {f.required && <span className="text-red-600 ml-0.5">*</span>}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* 3. Fichas */}
      {activeTab === 'fichas' && currentSheet && (
        <Card
          title="Personalización de Fichas de Entidad"
          subtitle="Activa, oculta o reordena pestañas visibles en las fichas de Empresas, Contactos y Oportunidades"
          actions={
            <Select
              value={selectedSheetModule}
              onChange={(e) => setSelectedSheetModule(e.target.value as typeof selectedSheetModule)}
              options={[
                { value: 'empresas', label: 'Ficha de Empresa' },
                { value: 'contactos', label: 'Ficha de Contacto' },
                { value: 'oportunidades', label: 'Ficha de Oportunidad' },
              ]}
            />
          }
        >
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {currentSheet.tabs.map((tab, idx) => (
              <div key={tab.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-900">{tab.label}</span>
                <div className="flex items-center gap-2">
                  <IconButton label="Subir" size="sm" disabled={idx === 0} onClick={() => moveSheetTab(idx, -1)}>
                    <ArrowUp className="w-3.5 h-3.5" />
                  </IconButton>
                  <IconButton label="Bajar" size="sm" disabled={idx === currentSheet.tabs.length - 1} onClick={() => moveSheetTab(idx, 1)}>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </IconButton>
                  <Toggle
                    checked={tab.visible}
                    label={tab.visible ? 'Visible' : 'Oculta'}
                    onChange={(val) =>
                      setSheetTabs((prev) =>
                        prev.map((s) =>
                          s.module === currentSheet.module
                            ? { ...s, tabs: s.tabs.map((t) => (t.id === tab.id ? { ...t, visible: val } : t)) }
                            : s
                        )
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
