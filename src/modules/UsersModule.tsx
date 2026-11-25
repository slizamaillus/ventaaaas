import React, { useMemo, useState } from 'react';
import {
  Edit3,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { TeamMember, UserRole } from '../types/crm';
import { Avatar, Badge, Button, Card, EmptyState, IconButton } from '../components/ds/primitives';
import { CurrencyInput, FormSection, Input, SearchInput, Select, Textarea, Toggle } from '../components/ds/forms';
import { MetricCard, Modal, Table } from '../components/ds/data';

interface UsersManagementPanelProps {
  embedded?: boolean;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'Vendedor', label: 'Vendedor' },
  { value: 'Administrador', label: 'Administrador' },
];

const getInitials = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'US';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const UsersManagementPanel: React.FC<UsersManagementPanelProps> = ({ embedded = false }) => {
  const {
    teamMembers,
    setTeamMembers,
    teams,
    setTeams,
    currentUser,
    formatMoney,
    notify,
    addAuditLog,
  } = useCRM();

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TeamMember['status']>('all');

  // Create / Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    cargo: string;
    team: string;
    phone: string;
    monthlyQuotaCLP: number;
    status: TeamMember['status'];
  }>({
    name: '',
    email: '',
    role: 'Vendedor',
    cargo: 'Ejecutivo Comercial',
    team: teams[0]?.name || 'Grandes Cuentas',
    phone: '+56 9 ',
    monthlyQuotaCLP: 35000000,
    status: 'Activo',
  });

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteData, setInviteData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    cargo: string;
    team: string;
    message: string;
  }>({
    name: '',
    email: '',
    role: 'Vendedor',
    cargo: 'Ejecutivo Comercial',
    team: teams[0]?.name || 'Grandes Cuentas',
    message: '',
  });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teamMembers.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !(u.cargo || '').toLowerCase().includes(q) &&
        !u.team.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [teamMembers, query, roleFilter, statusFilter]);

  const adminCount = teamMembers.filter((u) => u.role === 'Administrador').length;
  const sellerCount = teamMembers.filter((u) => u.role === 'Vendedor').length;
  const activeCount = teamMembers.filter((u) => u.status === 'Activo').length;
  const invitedCount = teamMembers.filter((u) => u.status === 'Invitado').length;

  const syncTeamMembership = (userId: string, teamName: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        const hasMember = t.memberIds.includes(userId);
        if (t.name === teamName && !hasMember) {
          return { ...t, memberIds: [...t.memberIds, userId] };
        }
        if (t.name !== teamName && hasMember) {
          return { ...t, memberIds: t.memberIds.filter((id) => id !== userId) };
        }
        return t;
      })
    );
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormError('');
    setFormData({
      name: '',
      email: '',
      role: 'Vendedor',
      cargo: 'Ejecutivo Comercial',
      team: teams[0]?.name || 'Grandes Cuentas',
      phone: '+56 9 ',
      monthlyQuotaCLP: 35000000,
      status: 'Activo',
    });
    setFormOpen(true);
  };

  const openEditModal = (u: TeamMember) => {
    setEditingUser(u);
    setFormError('');
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      cargo: u.cargo || '',
      team: u.team,
      phone: u.phone,
      monthlyQuotaCLP: u.monthlyQuotaCLP,
      status: u.status,
    });
    setFormOpen(true);
  };

  const openInviteModal = () => {
    setInviteError('');
    setInviteData({
      name: '',
      email: '',
      role: 'Vendedor',
      cargo: 'Ejecutivo Comercial',
      team: teams[0]?.name || 'Grandes Cuentas',
      message: '',
    });
    setInviteOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail) {
      setFormError('Debes ingresar nombre completo y email corporativo.');
      return;
    }
    const emailConflict = teamMembers.find(
      (u) => u.email.toLowerCase() === trimmedEmail && u.id !== editingUser?.id
    );
    if (emailConflict) {
      setFormError('Ya existe un usuario registrado con ese email.');
      return;
    }

    if (editingUser) {
      if (editingUser.role === 'Administrador' && formData.role !== 'Administrador' && adminCount <= 1) {
        setFormError('Debe existir al menos un usuario con rol Administrador.');
        return;
      }
      setTeamMembers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: trimmedName,
                email: trimmedEmail,
                role: formData.role,
                cargo: formData.cargo.trim() || undefined,
                team: formData.team,
                phone: formData.phone.trim() || '+56 9 0000 0000',
                monthlyQuotaCLP: Number(formData.monthlyQuotaCLP) || 0,
                status: formData.status,
                initials: getInitials(trimmedName),
              }
            : u
        )
      );
      syncTeamMembership(editingUser.id, formData.team);
      addAuditLog('Usuarios', 'Edición', `Actualizó usuario ${trimmedName} (${formData.role})`);
      notify('Usuario actualizado', `${trimmedName} · Rol: ${formData.role}`);
    } else {
      const newId = `usr-${Date.now()}`;
      const created: TeamMember = {
        id: newId,
        name: trimmedName,
        email: trimmedEmail,
        role: formData.role,
        cargo: formData.cargo.trim() || undefined,
        team: formData.team,
        initials: getInitials(trimmedName),
        status: formData.status,
        phone: formData.phone.trim() || '+56 9 0000 0000',
        monthlyQuotaCLP: Number(formData.monthlyQuotaCLP) || 30000000,
      };
      setTeamMembers((prev) => [...prev, created]);
      syncTeamMembership(newId, formData.team);
      addAuditLog('Usuarios', 'Creación', `Creó usuario ${trimmedName} con rol ${formData.role}`);
      notify('Usuario creado', `${trimmedName} (${formData.role})`);
    }
    setFormOpen(false);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = inviteData.name.trim();
    const trimmedEmail = inviteData.email.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail) {
      setInviteError('Ingresa el nombre completo y correo electrónico del invitado.');
      return;
    }
    if (teamMembers.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      setInviteError('Ese correo ya pertenece a un usuario existente.');
      return;
    }
    const newId = `usr-${Date.now()}`;
    const invited: TeamMember = {
      id: newId,
      name: trimmedName,
      email: trimmedEmail,
      role: inviteData.role,
      cargo: inviteData.cargo.trim() || undefined,
      team: inviteData.team,
      initials: getInitials(trimmedName),
      status: 'Invitado',
      phone: '+56 9 0000 0000',
      monthlyQuotaCLP: inviteData.role === 'Administrador' ? 50000000 : 30000000,
    };
    setTeamMembers((prev) => [...prev, invited]);
    syncTeamMembership(newId, inviteData.team);
    addAuditLog('Usuarios', 'Creación', `Invitó a ${trimmedEmail} con rol ${inviteData.role}`);
    notify('Invitación enviada', `${trimmedEmail} invitado como ${inviteData.role}`);
    setInviteOpen(false);
  };

  const handleQuickRoleChange = (user: TeamMember, nextRole: UserRole) => {
    if (user.role === nextRole) return;
    if (user.role === 'Administrador' && nextRole !== 'Administrador' && adminCount <= 1) {
      notify('Acción restringida', 'Debe haber al menos un Administrador activo en la plataforma.', 'warning');
      return;
    }
    setTeamMembers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
    addAuditLog('Usuarios', 'Edición', `Cambió el rol de ${user.name} de ${user.role} a ${nextRole}`);
    notify('Rol actualizado', `${user.name} ahora es ${nextRole}`);
  };

  const handleRequestDelete = (user: TeamMember) => {
    if (user.id === currentUser.id) {
      notify('No permitido', 'No puedes eliminar el usuario con sesión activa.', 'warning');
      return;
    }
    if (user.role === 'Administrador' && adminCount <= 1) {
      notify('No permitido', 'Debe permanecer al menos un Administrador en la organización.', 'warning');
      return;
    }
    setDeleteTarget(user);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setTeamMembers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setTeams((prev) =>
      prev.map((t) => ({ ...t, memberIds: t.memberIds.filter((id) => id !== deleteTarget.id) }))
    );
    addAuditLog('Usuarios', 'Eliminación', `Eliminó al usuario ${deleteTarget.name} (${deleteTarget.email})`);
    notify('Usuario eliminado', deleteTarget.name, 'warning');
    setDeleteTarget(null);
  };

  const statusTone = (status: TeamMember['status']) => {
    if (status === 'Activo') return 'success';
    if (status === 'Invitado') return 'blue';
    return 'neutral';
  };

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" leftIcon={<Send className="w-3.5 h-3.5" />} onClick={openInviteModal}>
        Invitar usuario
      </Button>
      <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openCreateModal}>
        Crear usuario
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Usuarios</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Crea, edita, invita o elimina usuarios y define sus permisos como Vendedor o Administrador.
            </p>
          </div>
          {headerActions}
        </div>
      )}

      {!embedded && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total de usuarios"
            value={String(teamMembers.length)}
            subtitle={`${activeCount} activos actualmente`}
          />
          <MetricCard
            label="Administradores"
            value={String(adminCount)}
            subtitle="Control total y configuración"
          />
          <MetricCard
            label="Vendedores"
            value={String(sellerCount)}
            subtitle="Gestión comercial y cartera"
          />
          <MetricCard
            label="Invitaciones pendientes"
            value={String(invitedCount)}
            subtitle="Esperando activación"
          />
        </div>
      )}

      <Card
        title={embedded ? '3. Gestión de Usuarios' : 'Directorio de usuarios y roles'}
        subtitle={
          embedded
            ? 'Crea, edita, elimina o invita usuarios asignando rol Vendedor o Administrador'
            : `${filtered.length} usuario(s) mostrados`
        }
        actions={embedded ? headerActions : undefined}
      >
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
            <div className="sm:col-span-2">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Buscar por nombre, email, cargo o equipo..."
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
              options={[
                { value: 'all', label: 'Todos los roles' },
                { value: 'Administrador', label: 'Administrador' },
                { value: 'Vendedor', label: 'Vendedor' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | TeamMember['status'])}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'Activo', label: 'Activo' },
                { value: 'Invitado', label: 'Invitado' },
                { value: 'Inactivo', label: 'Inactivo' },
              ]}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Sin usuarios que coincidan"
              description="Ajusta los filtros o crea un nuevo usuario."
              actionLabel="Crear usuario"
              onAction={openCreateModal}
            />
          ) : (
            <Table
              data={filtered}
              columns={[
                {
                  key: 'name',
                  header: 'Usuario',
                  sortable: true,
                  render: (u) => (
                    <div className="flex items-center gap-2.5">
                      <Avatar src={u.avatar} name={u.name} initials={u.initials} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 text-xs truncate">{u.name}</span>
                          {u.id === currentUser.id && <Badge tone="blue">Sesión actual</Badge>}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'cargo',
                  header: 'Cargo / Equipo',
                  render: (u) => (
                    <div>
                      <div className="text-xs font-medium text-slate-800">{u.cargo || '—'}</div>
                      <div className="text-[11px] text-slate-500">{u.team}</div>
                    </div>
                  ),
                },
                {
                  key: 'role',
                  header: 'Rol',
                  render: (u) => (
                    <select
                      aria-label={`Rol de ${u.name}`}
                      value={u.role}
                      onChange={(e) => handleQuickRoleChange(u, e.target.value as UserRole)}
                      onClick={(e) => e.stopPropagation()}
                      className={`border rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-700/20 ${
                        u.role === 'Administrador'
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Vendedor">Vendedor</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  ),
                },
                {
                  key: 'quota',
                  header: 'Meta mensual',
                  align: 'right',
                  render: (u) => (
                    <span className="font-mono tabular-nums text-xs text-slate-700">
                      {formatMoney(u.monthlyQuotaCLP)}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (u) =>
                    u.status === 'Invitado' ? (
                      <div className="flex items-center gap-2">
                        <Badge tone={statusTone(u.status)}>Invitado</Badge>
                        <button
                          type="button"
                          onClick={() => {
                            setTeamMembers((prev) =>
                              prev.map((x) => (x.id === u.id ? { ...x, status: 'Activo' } : x))
                            );
                            notify('Usuario activado', `${u.name} ahora está Activo`);
                          }}
                          className="text-[11px] font-medium text-blue-700 hover:underline cursor-pointer"
                        >
                          Activar
                        </button>
                      </div>
                    ) : (
                      <Toggle
                        checked={u.status === 'Activo'}
                        label={u.status}
                        onChange={(val) => {
                          setTeamMembers((prev) =>
                            prev.map((x) => (x.id === u.id ? { ...x, status: val ? 'Activo' : 'Inactivo' } : x))
                          );
                          addAuditLog('Usuarios', 'Edición', `${val ? 'Activó' : 'Desactivó'} al usuario ${u.name}`);
                          notify(`Usuario ${val ? 'activado' : 'desactivado'}`, u.name, 'info');
                        }}
                      />
                    ),
                },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: (u) => (
                    <div className="inline-flex items-center gap-1">
                      <IconButton label={`Editar ${u.name}`} size="sm" onClick={() => openEditModal(u)}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </IconButton>
                      <IconButton
                        label={`Eliminar ${u.name}`}
                        size="sm"
                        onClick={() => handleRequestDelete(u)}
                        className="hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconButton>
                    </div>
                  ),
                },
              ]}
              rowActions={(u) => [
                {
                  label: 'Editar usuario',
                  icon: <Edit3 className="w-3.5 h-3.5" />,
                  onClick: () => openEditModal(u),
                },
                {
                  label: u.role === 'Administrador' ? 'Cambiar rol a Vendedor' : 'Cambiar rol a Administrador',
                  icon: <ShieldCheck className="w-3.5 h-3.5" />,
                  onClick: () =>
                    handleQuickRoleChange(u, u.role === 'Administrador' ? 'Vendedor' : 'Administrador'),
                },
                ...(u.status === 'Invitado'
                  ? [
                      {
                        label: 'Reenviar invitación',
                        icon: <Send className="w-3.5 h-3.5" />,
                        onClick: () => notify('Invitación reenviada', u.email, 'info'),
                      },
                    ]
                  : []),
                {
                  label: 'Eliminar usuario',
                  icon: <Trash2 className="w-3.5 h-3.5" />,
                  danger: true,
                  dividerBefore: true,
                  onClick: () => handleRequestDelete(u),
                },
              ]}
            />
          )}
        </div>
      </Card>

      {/* Create / Edit User Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingUser ? `Editar usuario: ${editingUser.name}` : 'Crear nuevo usuario'}
        subtitle="Define los datos de acceso y el rol en illus Ventas"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="user-form">
              {editingUser ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSaveUser} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {formError}
            </div>
          )}
          <FormSection title="Identidad y acceso">
            <Input
              label="Nombre completo"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Carolina Herrera"
            />
            <Input
              label="Email corporativo"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="c.herrera@empresa.cl"
            />
            <Select
              label="Rol en plataforma"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={ROLE_OPTIONS}
              hint={
                formData.role === 'Administrador'
                  ? 'Acceso completo a configuración, usuarios y datos.'
                  : 'Acceso comercial a clientes, oportunidades y ventas.'
              }
            />
            <Select
              label="Estado"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TeamMember['status'] })}
              options={[
                { value: 'Activo', label: 'Activo' },
                { value: 'Inactivo', label: 'Inactivo' },
                { value: 'Invitado', label: 'Invitado' },
              ]}
            />
            <Input
              label="Cargo"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              placeholder="Ej: Ejecutivo Comercial Senior"
            />
            <Select
              label="Equipo comercial"
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              options={teams.map((t) => ({ value: t.name, label: t.name }))}
            />
            <Input
              label="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+56 9 8000 0000"
            />
            <CurrencyInput
              label="Meta mensual (CLP)"
              value={formData.monthlyQuotaCLP}
              currency="CLP"
              onChange={(val) => setFormData({ ...formData, monthlyQuotaCLP: val })}
              onCurrencyChange={() => {}}
            />
          </FormSection>
        </form>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invitar usuario a illus Ventas"
        subtitle="Se enviará una invitación por correo electrónico con acceso asignado"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="invite-user-form" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
              Enviar invitación
            </Button>
          </>
        }
      >
        <form id="invite-user-form" onSubmit={handleSendInvite} className="space-y-3">
          {inviteError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {inviteError}
            </div>
          )}
          <Input
            label="Nombre completo"
            required
            value={inviteData.name}
            onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
            placeholder="Ej: Felipe Morales"
          />
          <Input
            label="Email corporativo"
            required
            type="email"
            value={inviteData.email}
            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
            placeholder="f.morales@empresa.cl"
          />
          <Select
            label="Rol asignado"
            required
            value={inviteData.role}
            onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as UserRole })}
            options={ROLE_OPTIONS}
          />
          <Input
            label="Cargo"
            value={inviteData.cargo}
            onChange={(e) => setInviteData({ ...inviteData, cargo: e.target.value })}
            placeholder="Ej: Ejecutivo de Ventas"
          />
          <Select
            label="Equipo"
            value={inviteData.team}
            onChange={(e) => setInviteData({ ...inviteData, team: e.target.value })}
            options={teams.map((t) => ({ value: t.name, label: t.name }))}
          />
          <Textarea
            label="Mensaje de bienvenida (opcional)"
            value={inviteData.message}
            onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
            placeholder="Te invitamos a sumarte al equipo comercial en illus Ventas."
          />
        </form>
      </Modal>

      {/* Delete User Confirmation */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar usuario"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Eliminar usuario
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Confirmas que deseas eliminar a <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) de la plataforma? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
};

export const UsersModule: React.FC = () => {
  return <UsersManagementPanel embedded={false} />;
};
