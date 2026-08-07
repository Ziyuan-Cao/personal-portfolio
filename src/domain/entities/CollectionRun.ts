export type CollectionRunStatus = "RUNNING" | "SUCCESS" | "FAILED" | "NOT_MODIFIED";

export interface CollectionRun {
  id: string;
  sourceId: string;
  startedAt: string;
  completedAt: string | null;
  status: CollectionRunStatus;
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  duplicateCount: number;
  errorCount: number;
  errorMessage: string | null;
}
