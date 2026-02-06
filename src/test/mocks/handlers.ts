import { http, HttpResponse } from 'msw';

export const handlers = [
  // n8n workflows - dynamic based on project_id query param
  http.get('/api/v1/n8n/workflows', ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    // Empty state
    if (projectId === 'empty-project') {
      return HttpResponse.json({ workflows: [] });
    }

    // Error state
    if (projectId === 'error-project') {
      return new HttpResponse(null, { status: 500 });
    }

    // Single workflow
    if (projectId === 'single-workflow-project') {
      return HttpResponse.json({
        workflows: [
          {
            workflow_id: 'wf1',
            workflow_name: 'Test Workflow 1',
            last_execution: '2026-01-28T10:00:00Z',
            execution_count_24h: 100,
            success_rate_24h: 95.0,
            avg_duration_ms: 2000,
            total_ai_calls_24h: 50,
            total_tokens_24h: 10000,
            total_cost_24h: 1.23,
          },
        ],
      });
    }

    // Default: two workflows
    return HttpResponse.json({
      workflows: [
        {
          workflow_id: 'wf1',
          workflow_name: 'Test Workflow 1',
          last_execution: '2026-01-28T10:00:00Z',
          execution_count_24h: 100,
          success_rate_24h: 95.0,
          avg_duration_ms: 2000,
          total_ai_calls_24h: 50,
          total_tokens_24h: 10000,
          total_cost_24h: 1.23,
        },
        {
          workflow_id: 'wf2',
          workflow_name: 'Test Workflow 2',
          last_execution: '2026-01-28T11:00:00Z',
          execution_count_24h: 50,
          success_rate_24h: 98.0,
          avg_duration_ms: 1500,
          total_ai_calls_24h: 25,
          total_tokens_24h: 5000,
          total_cost_24h: 0.67,
        },
      ],
    });
  }),

  // n8n workflow detail
  http.get('/api/v1/n8n/workflows/:id', ({ params }) => {
    // Error state
    if (params.id === 'error-workflow') {
      return new HttpResponse(null, { status: 500 });
    }

    return HttpResponse.json({
      workflow_id: params.id,
      workflow_name: 'Test Workflow',
      last_execution: '2026-01-28T10:00:00Z',
      execution_count_24h: 100,
      success_rate_24h: 95.0,
      avg_duration_ms: 2000,
      total_ai_calls_24h: 50,
      total_tokens_24h: 10000,
      total_cost_24h: 1.23,
      executions: [
        {
          execution_id: 'exec-123',
          workflow_id: params.id as string,
          started_at: '2026-01-28T10:00:00Z',
          ended_at: '2026-01-28T10:00:02Z',
          duration_ms: 2000,
          status: 'success' as const,
          mode: 'webhook',
          total_tokens: 239,
          cost_usd: 0.0089,
        },
      ],
      ai_nodes: [
        {
          node_id: 'node-1',
          node_name: 'OpenAI GPT-4',
          model: 'gpt-4',
          vendor: 'openai',
          call_count: 50,
          prompt_tokens: 5000,
          completion_tokens: 5000,
          avg_latency_ms: 1500,
        },
      ],
    });
  }),

  // n8n workflow executions
  http.get('/api/v1/n8n/workflows/:id/executions', () => {
    return HttpResponse.json([
      {
        execution_id: 'exec-123',
        workflow_id: 'wf-123',
        started_at: '2026-01-28T10:00:00Z',
        finished_at: '2026-01-28T10:00:02Z',
        duration_ms: 2000,
        status: 'success',
        mode: 'webhook',
      },
    ]);
  }),

  // n8n execution timeline
  http.get('/api/v1/n8n/executions/:id/timeline', ({ params }) => {
    return HttpResponse.json({
      execution_id: params.id,
      total_duration_ms: 2000,
      nodes: [
        {
          node_id: 'node-1',
          node_name: 'Webhook',
          node_type: 'webhook',
          start_offset_ms: 0,
          duration_ms: 100,
          status: 'success',
          is_ai_node: false,
        },
        {
          node_id: 'node-2',
          node_name: 'OpenAI',
          node_type: 'llm',
          start_offset_ms: 100,
          duration_ms: 1800,
          status: 'success',
          is_ai_node: true,
        },
      ],
    });
  }),

  // Multi-agent executions
  http.get('/api/v1/multi-agent/executions', () => {
    return HttpResponse.json([
      {
        execution_id: 'exec1',
        trace_id: 'trace-1',
        framework: 'crewai',
        service_name: 'test-crew',
        status: 'success',
        started_at: '2026-01-28T10:00:00Z',
        duration_ms: 5000,
        num_agents: 3,
        total_cost_usd: 0.5,
        total_tokens: 1000,
      },
      {
        execution_id: 'exec2',
        trace_id: 'trace-2',
        framework: 'autogen',
        service_name: 'test-autogen',
        status: 'success',
        started_at: '2026-01-28T11:00:00Z',
        duration_ms: 3000,
        num_agents: 2,
        total_cost_usd: 0.3,
        total_tokens: 600,
      },
    ]);
  }),

  // Multi-agent execution detail
  http.get('/api/v1/multi-agent/executions/:id', ({ params }) => {
    return HttpResponse.json({
      execution: {
        execution_id: params.id,
        framework: 'crewai',
        service_name: 'test-crew',
        status: 'success',
        started_at: '2026-01-28T10:00:00Z',
        duration_ms: 5000,
        num_agents: 3,
        total_cost_usd: 0.5,
        total_tokens: 1000,
      },
      agents: [
        {
          agent_id: 'agent-1',
          agent_name: 'Researcher',
          role: 'Research',
          invocations: 2,
          total_duration_ms: 3000,
          total_tokens: 500,
        },
      ],
      tasks: [
        {
          task_id: 'task-1',
          description: 'Research AI trends',
          status: 'completed',
          assigned_agent: 'Researcher',
        },
      ],
      delegations: [],
    });
  }),

  // Multi-agent agent graph
  http.get('/api/v1/multi-agent/executions/:id/graph', () => {
    return HttpResponse.json({
      nodes: [
        {
          id: 'agent-1',
          name: 'Researcher',
          role: 'Research',
          type: 'agent',
        },
      ],
      edges: [],
    });
  }),

  // Multi-agent agent performance
  http.get('/api/v1/multi-agent/analytics/agent-performance', () => {
    return HttpResponse.json([
      {
        agent_name: 'researcher',
        framework: 'crewai',
        total_invocations: 10,
        avg_duration_ms: 2000,
        success_rate: 0.95,
        total_tokens: 500,
        total_cost_usd: 0.25,
      },
      {
        agent_name: 'writer',
        framework: 'crewai',
        total_invocations: 8,
        avg_duration_ms: 1500,
        success_rate: 0.98,
        total_tokens: 400,
        total_cost_usd: 0.20,
      },
    ]);
  }),

  // Projects (with query params support)
  http.get('http://localhost:8000/api/v1/projects', ({ request }) => {
    return HttpResponse.json([
      {
        project_id: 'default',
        name: 'Default Project',
        description: 'Default test project',
        webhook_url: 'http://localhost:8787/webhook',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        trace_count_24h: 150,
        workflow_count: 2,
      },
    ]);
  }),

  // Projects (relative path for different base URL configurations)
  http.get('/api/v1/projects', () => {
    return HttpResponse.json([
      {
        project_id: 'default',
        name: 'Default Project',
        description: 'Default test project',
        webhook_url: 'http://localhost:8787/webhook',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        trace_count_24h: 150,
        workflow_count: 2,
      },
    ]);
  }),

  // Project detail
  http.get('/api/v1/projects/:id', ({ params }) => {
    return HttpResponse.json({
      project_id: params.id,
      name: 'Default Project',
      created_at: '2026-01-01T00:00:00Z',
    });
  }),

  // Create project
  http.post('/api/v1/projects', async ({ request }) => {
    const body = await request.json() as { name: string };
    return HttpResponse.json({
      project_id: 'new-project-123',
      name: body.name,
      created_at: new Date().toISOString(),
    });
  }),

  // Auth endpoints (mock - no real auth in tests)
  http.post('/api/v1/auth/login', () => {
    return HttpResponse.json({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        projectId: 'default',
      },
      token: 'mock-jwt-token',
    });
  }),

  http.post('/api/v1/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),
];
