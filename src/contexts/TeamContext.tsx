import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTeams, Team } from '../api/teams';

interface TeamContextType {
  currentTeam: Team | null;
  teams: Team[];
  isLoading: boolean;
  error: Error | null;
  selectTeam: (teamId: string) => void;
  refreshTeams: () => void;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const {
    data: teams = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    staleTime: 5 * 60 * 1000,
  });

  const [currentTeamId, setCurrentTeamId] = useState<string | null>(() => {
    return localStorage.getItem('prela_current_team');
  });

  const currentTeam =
    teams.find((t) => t.id === currentTeamId) || teams[0] || null;

  const selectTeam = (teamId: string) => {
    setCurrentTeamId(teamId);
    localStorage.setItem('prela_current_team', teamId);

    // Invalidate team-dependent queries
    queryClient.invalidateQueries({ queryKey: ['team-members'] });
    queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
    queryClient.invalidateQueries({ queryKey: ['team-projects'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  useEffect(() => {
    if (!currentTeamId && teams.length > 0) {
      selectTeam(teams[0].id);
    }
  }, [teams, currentTeamId]);

  const refreshTeams = () => {
    refetch();
  };

  return (
    <TeamContext.Provider
      value={{
        currentTeam,
        teams,
        isLoading,
        error: error as Error | null,
        selectTeam,
        refreshTeams,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within TeamProvider');
  }
  return context;
}
