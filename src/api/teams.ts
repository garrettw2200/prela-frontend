/**
 * Teams API client
 */

import { apiClient } from './client';

// --- Types ---

export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  role: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  email: string | null;
  full_name: string | null;
  profile_image_url: string | null;
  joined_at: string | null;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_by_email: string | null;
  invited_by_name: string | null;
  created_at: string | null;
  expires_at: string | null;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  team_id: string;
  created_at: string | null;
}

export interface CreateTeamRequest {
  name: string;
}

export interface UpdateTeamRequest {
  name: string;
}

export interface InviteMemberRequest {
  email: string;
  role: string;
}

export interface UpdateMemberRoleRequest {
  role: string;
}

export interface AssignProjectRequest {
  project_id: string;
}

export interface AcceptInvitationResponse {
  team_id: string;
  team_name: string;
  role: string;
}

// --- API Functions ---

/**
 * List all teams the current user belongs to
 */
export async function fetchTeams(): Promise<Team[]> {
  const response = await apiClient.get<Team[]>('/teams');
  return response.data;
}

/**
 * Create a new team
 */
export async function createTeam(request: CreateTeamRequest): Promise<Team> {
  const response = await apiClient.post<Team>('/teams', request);
  return response.data;
}

/**
 * Get team details
 */
export async function fetchTeam(teamId: string): Promise<Team> {
  const response = await apiClient.get<Team>(`/teams/${teamId}`);
  return response.data;
}

/**
 * Update team name
 */
export async function updateTeam(teamId: string, request: UpdateTeamRequest): Promise<Team> {
  const response = await apiClient.put<Team>(`/teams/${teamId}`, request);
  return response.data;
}

/**
 * Delete a team (owner only)
 */
export async function deleteTeam(teamId: string): Promise<void> {
  await apiClient.delete(`/teams/${teamId}`);
}

/**
 * List team members
 */
export async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  const response = await apiClient.get<TeamMember[]>(`/teams/${teamId}/members`);
  return response.data;
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  teamId: string,
  userId: string,
  request: UpdateMemberRoleRequest
): Promise<TeamMember> {
  const response = await apiClient.put<TeamMember>(
    `/teams/${teamId}/members/${userId}`,
    request
  );
  return response.data;
}

/**
 * Remove a member from a team
 */
export async function removeMember(teamId: string, userId: string): Promise<void> {
  await apiClient.delete(`/teams/${teamId}/members/${userId}`);
}

/**
 * Create an invitation
 */
export async function createInvitation(
  teamId: string,
  request: InviteMemberRequest
): Promise<TeamInvitation> {
  const response = await apiClient.post<TeamInvitation>(
    `/teams/${teamId}/invitations`,
    request
  );
  return response.data;
}

/**
 * List pending invitations for a team
 */
export async function fetchInvitations(teamId: string): Promise<TeamInvitation[]> {
  const response = await apiClient.get<TeamInvitation[]>(`/teams/${teamId}/invitations`);
  return response.data;
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(teamId: string, invitationId: string): Promise<void> {
  await apiClient.delete(`/teams/${teamId}/invitations/${invitationId}`);
}

/**
 * Accept an invitation by token
 */
export async function acceptInvitation(token: string): Promise<AcceptInvitationResponse> {
  const response = await apiClient.post<AcceptInvitationResponse>(
    `/teams/invitations/${token}/accept`
  );
  return response.data;
}

/**
 * List projects assigned to a team
 */
export async function fetchTeamProjects(teamId: string): Promise<ProjectAssignment[]> {
  const response = await apiClient.get<ProjectAssignment[]>(`/teams/${teamId}/projects`);
  return response.data;
}

/**
 * Assign a project to a team
 */
export async function assignProject(
  teamId: string,
  request: AssignProjectRequest
): Promise<ProjectAssignment> {
  const response = await apiClient.post<ProjectAssignment>(
    `/teams/${teamId}/projects`,
    request
  );
  return response.data;
}

/**
 * Remove a project from a team
 */
export async function removeProject(teamId: string, projectId: string): Promise<void> {
  await apiClient.delete(`/teams/${teamId}/projects/${projectId}`);
}
