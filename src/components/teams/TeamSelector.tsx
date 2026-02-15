import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTeam } from '../../contexts/TeamContext';

export function TeamSelector() {
  const { currentTeam, teams, selectTeam } = useTeam();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only show selector if user has multiple teams
  if (teams.length <= 1) {
    return null;
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (teamId: string) => {
    selectTeam(teamId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate max-w-[150px]">
          {currentTeam?.name || 'Select Team'}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="max-h-60 overflow-auto py-1" role="listbox">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleSelect(team.id)}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 ${
                  currentTeam?.id === team.id ? 'bg-indigo-50' : ''
                }`}
                role="option"
                aria-selected={currentTeam?.id === team.id}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{team.name}</div>
                  <div className="text-xs text-gray-500">{team.role}</div>
                </div>
                {currentTeam?.id === team.id && (
                  <svg
                    className="h-5 w-5 text-indigo-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 p-2">
            <Link
              to="/team"
              className="block w-full rounded-md px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              onClick={() => setIsOpen(false)}
            >
              Team Settings →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
