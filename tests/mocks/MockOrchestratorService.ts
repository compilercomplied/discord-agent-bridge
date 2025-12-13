import type { IOrchestratorService } from '@/OrchestratorService.js';

export class MockOrchestratorService implements IOrchestratorService {
  async submitTask(taskDescription: string): Promise<Response> {
    console.log(`[MockOrchestrator] Received task: ${taskDescription}`);
    // Simulate a successful 202 Accepted response
    return new Response(null, { status: 202 });
  }
}
