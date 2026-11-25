import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Edit3,
  Play,
  Plus,
  Trash2,
  Workflow as WorkflowIcon,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { Automatizacion, WorkflowNode } from '../types/crm';
import { Badge, Button, Card } from '../components/ds/primitives';
import { Input, Select, Textarea, Toggle } from '../components/ds/forms';
import { Table } from '../components/ds/data';
import { formatDateCL } from '../data/chileGeo';

const TRIGGER_EVENTS = [
  'Empresa creada',
  'Contacto creado',
  'Oportunidad creada',
  'Cambio de etapa',
  'Cotización creada',
  'Cotización enviada',
  'Cotización aceptada',
  'Pedido creado',
  'Tarea creada',
  'Actividad completada',
  'Fecha próxima',
  'Registro actualizado',
];

const ACTION_TYPES = [
  'Crear tarea',
  'Crear actividad',
  'Asignar responsable',
  'Cambiar estado',
  'Cambiar etapa',
  'Agregar etiqueta',
  'Crear notificación',
  'Actualizar campos',
  'Crear registro',
];

export const AutomationsModule: React.FC = () => {
  const { automatizaciones, setAutomatizaciones, notify, getUser } = useCRM();

  const [selectedAutoId, setSelectedAutoId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [simulatingStep, setSimulatingStep] = useState<number | null>(null);

  const activeAuto = automatizaciones.find((a) => a.id === selectedAutoId) || null;
  const activeNode = activeAuto?.nodes.find((n) => n.id === selectedNodeId) || activeAuto?.nodes[0] || null;

  const createAutomation = () => {
    const id = `aut-${Date.now()}`;
    const next: Automatizacion = {
      id,
      nombre: 'Nueva automatización comercial',
      descripcion: 'Proceso automático configurable desde el constructor visual.',
      estado: 'Borrador',
      tipo: 'Comercial',
      fechaCreacion: '2026-11-25',
      ultimaEjecucion: 'Sin ejecuciones',
      ejecucionesTotales: 0,
      responsableId: 'usr-1',
      nodes: [
        { id: `n-${Date.now()}-1`, kind: 'trigger', title: 'Oportunidad creada', subtitle: 'Evento inicial en Pipeline', config: { evento: 'Oportunidad creada' } },
        { id: `n-${Date.now()}-2`, kind: 'condition', title: 'Evaluar monto o estado', subtitle: 'Condición: Monto ≥ $ 5.000.000', config: { campo: 'Monto', valor: '5000000' } },
        { id: `n-${Date.now()}-3`, kind: 'action', title: 'Crear tarea de seguimiento', subtitle: 'Asignar al ejecutivo responsable', config: { accion: 'Crear tarea' } },
        { id: `n-${Date.now()}-4`, kind: 'result', title: 'Flujo completado', subtitle: 'Notificación enviada y registrada', config: { resultado: 'Éxito' } },
      ],
    };
    setAutomatizaciones((prev) => [next, ...prev]);
    setSelectedAutoId(id);
    setSelectedNodeId(next.nodes[0].id);
    notify('Automatización creada', 'Edita los bloques en el constructor visual.');
  };

  const updateNode = (nodeId: string, patch: Partial<WorkflowNode>) => {
    if (!activeAuto) return;
    setAutomatizaciones((prev) =>
      prev.map((a) =>
        a.id === activeAuto.id
          ? { ...a, nodes: a.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)) }
          : a
      )
    );
  };

  const addActionBlock = () => {
    if (!activeAuto) return;
    const newNode: WorkflowNode = {
      id: `n-${Date.now()}`,
      kind: 'action',
      title: 'Crear notificación',
      subtitle: 'Acción adicional en rama',
      config: { accion: 'Crear notificación' },
    };
    const nodes = [...activeAuto.nodes];
    nodes.splice(Math.max(0, nodes.length - 1), 0, newNode);
    setAutomatizaciones((prev) => prev.map((a) => (a.id === activeAuto.id ? { ...a, nodes } : a)));
    setSelectedNodeId(newNode.id);
    notify('Bloque agregado', 'Nueva acción insertada en el flujo.');
  };

  const runSimulation = () => {
    if (!activeAuto) return;
    setSimulatingStep(0);
    activeAuto.nodes.forEach((_, idx) => {
      setTimeout(() => {
        setSimulatingStep(idx);
        if (idx === activeAuto.nodes.length - 1) {
          setTimeout(() => {
            setSimulatingStep(null);
            notify('Simulación completada', `Los ${activeAuto.nodes.length} bloques de "${activeAuto.nombre}" se ejecutaron correctamente.`);
          }, 700);
        }
      }, idx * 650);
    });
  };

  // WORKFLOW BUILDER VIEW
  if (activeAuto) {
    const kindMeta: Record<WorkflowNode['kind'], { label: string; border: string; bg: string }> = {
      trigger: { label: '1. Trigger / Evento inicial', border: 'border-blue-300', bg: 'bg-blue-50/60' },
      condition: { label: '2. Condición', border: 'border-amber-300', bg: 'bg-amber-50/50' },
      action: { label: '3. Acción automática', border: 'border-emerald-300', bg: 'bg-emerald-50/50' },
      result: { label: '4. Resultado', border: 'border-slate-300', bg: 'bg-slate-50' },
    };

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button size="sm" variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedAutoId(null)}>
            Volver a Automatizaciones
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Toggle
              checked={activeAuto.estado === 'Activa'}
              onChange={(val) => {
                setAutomatizaciones((prev) =>
                  prev.map((a) => (a.id === activeAuto.id ? { ...a, estado: val ? 'Activa' : 'Inactiva' } : a))
                );
                notify(val ? 'Automatización activada' : 'Automatización desactivada');
              }}
              label={activeAuto.estado === 'Activa' ? 'Activa' : 'Inactiva'}
            />
            <Button size="sm" variant="outline" leftIcon={<Play className="w-3.5 h-3.5 text-blue-700" />} onClick={runSimulation}>
              Simular flujo
            </Button>
            <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={addActionBlock}>
              Agregar acción
            </Button>
            <Button size="sm" variant="primary" onClick={() => notify('Automatización guardada', activeAuto.nombre)}>
              Guardar cambios
            </Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <Input
            label="Nombre del flujo"
            value={activeAuto.nombre}
            onChange={(e) =>
              setAutomatizaciones((prev) =>
                prev.map((a) => (a.id === activeAuto.id ? { ...a, nombre: e.target.value } : a))
              )
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Canvas */}
          <div className="lg:col-span-8 bg-[#F8FAFC] border border-slate-200 rounded-xl p-6 min-h-[480px] flex flex-col items-center">
            {activeAuto.nodes.map((node, idx) => {
              const meta = kindMeta[node.kind];
              const isSelected = activeNode?.id === node.id;
              const isSimActive = simulatingStep === idx;
              const isSimDone = simulatingStep !== null && simulatingStep > idx;

              return (
                <React.Fragment key={node.id}>
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full max-w-md bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                      isSimActive
                        ? 'border-blue-700 ring-2 ring-blue-200'
                        : isSelected
                        ? 'border-blue-700 shadow-sm'
                        : meta.border
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${meta.bg} text-slate-800`}>
                        {meta.label}
                      </span>
                      {isSimDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="text-sm font-bold text-slate-900">{node.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{node.subtitle}</div>
                  </div>
                  {idx < activeAuto.nodes.length - 1 && (
                    <div className="flex flex-col items-center my-1">
                      <div className={`w-0.5 h-6 ${isSimDone ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <div className="w-2 h-2 rotate-45 border-r border-b border-slate-400 -mt-1.5" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Node Inspector Side Panel */}
          <Card className="lg:col-span-4" title="Configuración del bloque" subtitle={activeNode?.title}>
            {activeNode ? (
              <div className="space-y-4">
                <Select
                  label="Tipo de nodo"
                  value={activeNode.kind}
                  onChange={(e) => updateNode(activeNode.id, { kind: e.target.value as WorkflowNode['kind'] })}
                  options={[
                    { value: 'trigger', label: 'Trigger / Evento inicial' },
                    { value: 'condition', label: 'Condición' },
                    { value: 'action', label: 'Acción' },
                    { value: 'result', label: 'Resultado' },
                  ]}
                />
                {activeNode.kind === 'trigger' && (
                  <Select
                    label="Evento disparador"
                    value={activeNode.title}
                    onChange={(e) => updateNode(activeNode.id, { title: e.target.value })}
                    options={TRIGGER_EVENTS.map((ev) => ({ value: ev, label: ev }))}
                  />
                )}
                {activeNode.kind === 'action' && (
                  <Select
                    label="Acción a ejecutar"
                    value={activeNode.title}
                    onChange={(e) => updateNode(activeNode.id, { title: e.target.value })}
                    options={ACTION_TYPES.map((ac) => ({ value: ac, label: ac }))}
                  />
                )}
                {(activeNode.kind === 'condition' || activeNode.kind === 'result') && (
                  <Input
                    label="Título del bloque"
                    value={activeNode.title}
                    onChange={(e) => updateNode(activeNode.id, { title: e.target.value })}
                  />
                )}
                <Textarea
                  label="Regla / Descripción"
                  value={activeNode.subtitle}
                  onChange={(e) => updateNode(activeNode.id, { subtitle: e.target.value })}
                />
                {activeAuto.nodes.length > 2 && (
                  <Button
                    size="xs"
                    variant="danger"
                    onClick={() => {
                      const remaining = activeAuto.nodes.filter((n) => n.id !== activeNode.id);
                      setAutomatizaciones((prev) =>
                        prev.map((a) => (a.id === activeAuto.id ? { ...a, nodes: remaining } : a))
                      );
                      setSelectedNodeId(remaining[0]?.id || null);
                    }}
                  >
                    Quitar bloque
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Selecciona un bloque del flujo para configurarlo.</p>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Automatizaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Constructor visual de flujos comerciales por eventos, condiciones y acciones automáticas.
          </p>
        </div>
        <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={createAutomation}>
          Crear automatización
        </Button>
      </div>

      <Table
        data={automatizaciones}
        onRowClick={(a) => {
          setSelectedAutoId(a.id);
          setSelectedNodeId(a.nodes[0]?.id || null);
        }}
        columns={[
          {
            key: 'nombre',
            header: 'Automatización',
            render: (a) => (
              <div className="flex items-start gap-2.5">
                <WorkflowIcon className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">{a.nombre}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">{a.descripcion}</div>
                </div>
              </div>
            ),
          },
          { key: 'tipo', header: 'Tipo', render: (a) => <Badge tone="neutral">{a.tipo}</Badge> },
          {
            key: 'estado',
            header: 'Estado',
            render: (a) => (
              <div onClick={(e) => e.stopPropagation()}>
                <Toggle
                  checked={a.estado === 'Activa'}
                  label={a.estado}
                  onChange={(val) => {
                    setAutomatizaciones((prev) =>
                      prev.map((x) => (x.id === a.id ? { ...x, estado: val ? 'Activa' : 'Inactiva' } : x))
                    );
                    notify(val ? 'Automatización activada' : 'Automatización pausada', a.nombre, 'info');
                  }}
                />
              </div>
            ),
          },
          { key: 'creacion', header: 'Creación', render: (a) => <span className="font-mono text-xs">{formatDateCL(a.fechaCreacion)}</span> },
          { key: 'ult', header: 'Última ejecución', render: (a) => <span className="font-mono text-xs text-slate-500">{a.ultimaEjecucion}</span> },
          { key: 'resp', header: 'Responsable', render: (a) => <span className="text-xs">{getUser(a.responsableId)?.name}</span> },
        ]}
        rowActions={(a) => [
          {
            label: 'Abrir en Workflow Builder',
            icon: <Edit3 className="w-3.5 h-3.5" />,
            onClick: () => {
              setSelectedAutoId(a.id);
              setSelectedNodeId(a.nodes[0]?.id || null);
            },
          },
          {
            label: 'Duplicar',
            icon: <Copy className="w-3.5 h-3.5" />,
            onClick: () => {
              setAutomatizaciones((prev) => [{ ...a, id: `aut-${Date.now()}`, nombre: `${a.nombre} (Copia)`, estado: 'Borrador' }, ...prev]);
              notify('Automatización duplicada');
            },
          },
          { label: 'Eliminar', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, dividerBefore: true, onClick: () => setAutomatizaciones((prev) => prev.filter((x) => x.id !== a.id)) },
        ]}
      />
    </div>
  );
};
