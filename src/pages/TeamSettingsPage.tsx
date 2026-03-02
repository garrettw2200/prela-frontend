import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchTeamMembers,
  fetchInvitations,
  updateTeam,
  updateMemberRole,
  removeMember,
  revokeInvitation,
  createTeam,
} from '../api/teams';
import { InviteModal } from '../components/teams/InviteModal';
import { PlanUsageCard } from '../components/PlanUsageCard';

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    member: 'bg-green-100 text-green-800',
    viewer: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[role] || colors.viewer}`}>
      {role}
    </span>
  );
}

export function TeamSettingsPage() {
  const { currentTeam, refreshTeams } = useTeam();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const teamId = currentTeam?.id;
  const isAdmin = currentTeam?.role === 'admin' || currentTeam?.role === 'owner';

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => fetchTeamMembers(teamId!),
    enabled: !!teamId,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ['team-invitations', teamId],
    queryFn: () => fetchInvitations(teamId!),
    enabled: !!teamId && isAdmin,
  });

  const updateTeamMutation = useMutation({
    mutationFn: () => updateTeam(teamId!, { name: editName }),
    onSuccess: () => {
      refreshTeams();
      setIsEditing(false);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateMemberRole(teamId!, userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeMember(teamId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(teamId!, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: () => createTeam({ name: newTeamName }),
    onSuccess: () => {
      refreshTeams();
      setIsCreateOpen(false);
      setNewTeamName('');
    },
  });

  if (!currentTeam) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Settings</h1>
        <p className="text-gray-500">No team selected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your team members and settings
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Create Team
        </button>
      </div>

      {/* Team info */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <button
                onClick={() => updateTeamMutation.mutate()}
                disabled={updateTeamMutation.isPending || !editName.trim()}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentTeam.name}
              </h2>
              <RoleBadge role={currentTeam.role} />
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditName(currentTeam.name);
                    setIsEditing(true);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Edit
                </button>
              )}
            </div>
          )}
          <div className="text-sm text-gray-500">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Plan & Usage */}
      <PlanUsageCard />

      {/* Members */}
      <div className="rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Members</h3>
          {isAdmin && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Invite Member
            </button>
          )}
        </div>

        {membersLoading ? (
          <div className="px-6 py-4 text-sm text-gray-500">Loading...</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  {member.profile_image_url ? (
                    <img
                      src={member.profile_image_url}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                      {(member.full_name || member.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {member.full_name || member.email}
                      {member.user_id === user?.id && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </div>
                    {member.full_name && (
                      <div className="text-xs text-gray-500">{member.email}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isAdmin && member.role !== 'owner' && member.user_id !== user?.id ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        updateRoleMutation.mutate({
                          userId: member.user_id,
                          role: e.target.value,
                        })
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <RoleBadge role={member.role} />
                  )}

                  {isAdmin && member.role !== 'owner' && member.user_id !== user?.id && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${member.full_name || member.email} from the team?`)) {
                          removeMemberMutation.mutate(member.user_id);
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {isAdmin && invitations.length > 0 && (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-base font-semibold text-gray-900">
              Pending Invitations
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {inv.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    Invited as {inv.role}
                    {inv.invited_by_name && ` by ${inv.invited_by_name}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    Expires {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : ''}
                  </span>
                  <button
                    onClick={() => revokeInvitationMutation.mutate(inv.id)}
                    className="text-xs text-red-600 hover:text-red-500"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      {isInviteOpen && (
        <InviteModal
          teamId={teamId!}
          onClose={() => setIsInviteOpen(false)}
        />
      )}

      {/* Create team modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75"
            onClick={() => setIsCreateOpen(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Create Team
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newTeamName.trim()) createTeamMutation.mutate();
                }}
              >
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team name
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                    autoFocus
                    placeholder="My Team"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {createTeamMutation.isError && (
                  <div className="mb-4 rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-800">
                      {(createTeamMutation.error as Error)?.message || 'Failed to create team'}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTeamMutation.isPending || !newTeamName.trim()}
                    className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createTeamMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
