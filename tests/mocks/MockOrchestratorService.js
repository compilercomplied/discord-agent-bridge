export class MockOrchestratorService {
    async submitTask(taskDescription) {
        console.log(`[MockOrchestrator] Received task: ${taskDescription}`);
        // Simulate a successful 202 Accepted response
        return new Response(null, { status: 202 });
    }
}
//# sourceMappingURL=MockOrchestratorService.js.map