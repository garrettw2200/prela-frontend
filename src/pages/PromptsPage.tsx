import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import {
  listPrompts,
  getPromptHistory,
  createPrompt,
  createPromptVersion,
  promotePrompt,
  deletePrompt,
  type PromptTemplate,
  type CreatePromptRequest,
  type UpdatePromptRequest,
} from '../api/prompts';

export function PromptsPage() {
  return <PromptsPageContent />;
}

function PromptsPageContent() {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const projectId = routeProjectId ?? currentProject?.project_id ?? 'default';
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  // Fetch prompts
  const { data: promptsData, isLoading } = useQuery({
    queryKey: ['prompts', projectId],
    queryFn: () => listPrompts(projectId),
    staleTime: 60 * 1000,
  });

  // Fetch history for selected prompt
  const { data: historyData } = useQuery({
    queryKey: ['prompt-history', projectId, selectedPrompt],
    queryFn: () => getPromptHistory(projectId, selectedPrompt!),
    enabled: !!selectedPrompt,
    staleTime: 30 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (req: CreatePromptRequest) => createPrompt(projectId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts', projectId] });
      setShowCreateModal(false);
    },
  });

  const versionMutation = useMutation({
    mutationFn: ({ name, req }: { name: string; req: UpdatePromptRequest }) =>
      createPromptVersion(projectId, name, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts', projectId] });
      queryClient.invalidateQueries({ queryKey: ['prompt-history', projectId] });
      setShowVersionModal(null);
    },
  });

  const promoteMutation = useMutation({
    mutationFn: ({ name, version }: { name: string; version: number }) =>
      promotePrompt(projectId, name, { version, stage: 'production' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts', projectId] });
      queryClient.invalidateQueries({ queryKey: ['prompt-history', projectId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deletePrompt(projectId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts', projectId] });
      setSelectedPrompt(null);
    },
  });

  const prompts = promptsData?.prompts ?? [];
  const versions = historyData?.versions ?? [];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>Prompt Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
          }}
        >
          New Prompt
        </button>
      </div>

      {isLoading ? (
        <p style={{ color: '#6b7280' }}>Loading prompts...</p>
      ) : prompts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <p>No prompts yet. Create your first prompt template to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedPrompt ? '1fr 1fr' : '1fr', gap: '24px' }}>
          {/* Prompts List */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {prompts.map((p: PromptTemplate) => (
                <div
                  key={p.name}
                  onClick={() => setSelectedPrompt(p.name)}
                  style={{
                    padding: '16px', backgroundColor: 'white', borderRadius: '8px',
                    border: selectedPrompt === p.name ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{p.name}</h3>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>v{p.version}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {p.promoted_stages?.includes('production') && (
                        <span style={{
                          padding: '2px 8px', backgroundColor: '#dcfce7', color: '#166534',
                          borderRadius: '9999px', fontSize: '11px', fontWeight: 500,
                        }}>
                          production
                        </span>
                      )}
                      {p.tags?.map((tag: string) => (
                        <span key={tag} style={{
                          padding: '2px 8px', backgroundColor: '#e0e7ff', color: '#3730a3',
                          borderRadius: '9999px', fontSize: '11px',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#4b5563', fontFamily: 'monospace' }}>
                    {p.template.length > 120 ? p.template.slice(0, 120) + '...' : p.template}
                  </p>
                  {p.model && (
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Model: {p.model}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Version History Panel */}
          {selectedPrompt && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  {selectedPrompt} - History
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowVersionModal(selectedPrompt)}
                    style={{
                      padding: '6px 12px', backgroundColor: '#4f46e5', color: 'white',
                      border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
                    }}
                  >
                    New Version
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete all versions?')) deleteMutation.mutate(selectedPrompt); }}
                    style={{
                      padding: '6px 12px', backgroundColor: '#ef4444', color: 'white',
                      border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {versions.map((v: PromptTemplate) => (
                  <div key={v.version} style={{
                    padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>v{v.version}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {v.promoted_stages?.includes('production') && (
                          <span style={{
                            padding: '2px 6px', backgroundColor: '#dcfce7', color: '#166534',
                            borderRadius: '9999px', fontSize: '10px',
                          }}>
                            production
                          </span>
                        )}
                        {!v.promoted_stages?.includes('production') && (
                          <button
                            onClick={() => promoteMutation.mutate({ name: v.name, version: v.version })}
                            style={{
                              padding: '2px 8px', backgroundColor: '#f3f4f6', color: '#374151',
                              border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '11px',
                            }}
                          >
                            Promote
                          </button>
                        )}
                      </div>
                    </div>
                    {v.change_note && (
                      <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                        {v.change_note}
                      </p>
                    )}
                    <pre style={{
                      margin: '8px 0 0', padding: '8px', backgroundColor: '#f9fafb',
                      borderRadius: '4px', fontSize: '12px', whiteSpace: 'pre-wrap', overflowX: 'auto',
                    }}>
                      {v.template}
                    </pre>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {v.created_at ? new Date(v.created_at).toLocaleString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePromptModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(req) => createMutation.mutate(req)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* New Version Modal */}
      {showVersionModal && (
        <NewVersionModal
          promptName={showVersionModal}
          onClose={() => setShowVersionModal(null)}
          onSubmit={(req) => versionMutation.mutate({ name: showVersionModal, req })}
          isLoading={versionMutation.isPending}
        />
      )}
    </div>
  );
}

function CreatePromptModal({
  onClose, onSubmit, isLoading,
}: {
  onClose: () => void;
  onSubmit: (req: CreatePromptRequest) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('');
  const [model, setModel] = useState('');
  const [tags, setTags] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '500px', maxHeight: '80vh', overflow: 'auto' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>New Prompt Template</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
              placeholder="e.g., summarize-article" />
          </label>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            Template
            <textarea value={template} onChange={(e) => setTemplate(e.target.value)}
              rows={6}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', fontFamily: 'monospace', fontSize: '13px' }}
              placeholder="Use {{variable}} for template variables" />
          </label>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            Model (optional)
            <input value={model} onChange={(e) => setModel(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
              placeholder="e.g., claude-sonnet-4-20250514" />
          </label>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            Tags (comma-separated)
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
              placeholder="e.g., summarization, production" />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button onClick={onClose}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white' }}>
            Cancel
          </button>
          <button
            disabled={!name || !template || isLoading}
            onClick={() => onSubmit({
              name,
              template,
              model: model || undefined,
              tags: tags ? tags.split(',').map(t => t.trim()) : [],
            })}
            style={{
              padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white',
              border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: (!name || !template) ? 0.5 : 1,
            }}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewVersionModal({
  promptName, onClose, onSubmit, isLoading,
}: {
  promptName: string;
  onClose: () => void;
  onSubmit: (req: UpdatePromptRequest) => void;
  isLoading: boolean;
}) {
  const [template, setTemplate] = useState('');
  const [changeNote, setChangeNote] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '500px', maxHeight: '80vh', overflow: 'auto' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>New Version: {promptName}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            Template
            <textarea value={template} onChange={(e) => setTemplate(e.target.value)}
              rows={6}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', fontFamily: 'monospace', fontSize: '13px' }}
              placeholder="Updated template text" />
          </label>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>
            Change Note
            <input value={changeNote} onChange={(e) => setChangeNote(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px' }}
              placeholder="What changed in this version?" />
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <button onClick={onClose}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white' }}>
            Cancel
          </button>
          <button
            disabled={!template || isLoading}
            onClick={() => onSubmit({ template, change_note: changeNote })}
            style={{
              padding: '8px 16px', backgroundColor: '#4f46e5', color: 'white',
              border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: !template ? 0.5 : 1,
            }}
          >
            {isLoading ? 'Creating...' : 'Create Version'}
          </button>
        </div>
      </div>
    </div>
  );
}
