export interface JobScheduler { start(job: () => Promise<void>): void; stop(): void; }
