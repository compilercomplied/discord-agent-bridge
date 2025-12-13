export interface IOrchestratorService {
  submitTask(taskDescription: string): Promise<Response>;
}

export class OrchestratorService implements IOrchestratorService {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async submitTask(taskDescription: string): Promise<Response> {
    return fetch(`${this.baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: taskDescription }),
    });
  }
}
