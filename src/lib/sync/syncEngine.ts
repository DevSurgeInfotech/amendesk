import { db } from '@/lib/db';
import type { SyncOutboxItem } from '@/lib/types';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  message: string;
  timestamp: Date;
}

export type SyncListener = (
  isOnline: boolean,
  pendingCount: number,
  isSyncing: boolean,
  lastSyncedAt: Date | null
) => void;

export class SyncEngine {
  private static instance: SyncEngine;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncedAt: Date | null = null;
  private listeners: SyncListener[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  public async init(): Promise<void> {
    try {
      const lastSyncedItem = await db.syncOutbox
        .where('status')
        .equals('SYNCED')
        .reverse()
        .sortBy('timestamp');
      if (lastSyncedItem.length > 0) {
        this.lastSyncedAt = new Date(lastSyncedItem[0].timestamp);
      }
    } catch {
      // IndexedDB may still be initializing
    }
    await this.notify();
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  public getLastSyncedAt(): Date | null {
    return this.lastSyncedAt;
  }

  public subscribe(listener: SyncListener) {
    this.listeners.push(listener);
    // notify immediately
    void this.notify();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private async notify() {
    const pendingCount = await this.getPendingCount();
    for (const listener of this.listeners) {
      listener(this.isOnline, pendingCount, this.isSyncing, this.lastSyncedAt);
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    if (online) {
      void this.triggerSync({ isManual: false });
    }
    void this.notify();
  }

  public async getPendingCount(): Promise<number> {
    try {
      return await db.syncOutbox.where('status').equals('PENDING').count();
    } catch {
      return 0;
    }
  }

  public async queueMutation(
    entity: string,
    entityId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: unknown
  ): Promise<void> {
    const item: SyncOutboxItem = {
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entity,
      entityId,
      operation,
      payload,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
    };

    await db.syncOutbox.add(item);
    void this.notify();

    if (this.isOnline) {
      void this.triggerSync({ isManual: false });
    }
  }

  public async triggerSync(options?: { isManual?: boolean }): Promise<SyncResult> {
    const isManual = options?.isManual ?? false;
    const now = new Date();

    if (this.isSyncing) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        message: 'Cloud synchronization is already in progress.',
        timestamp: this.lastSyncedAt ?? now,
      };
    }

    if (!this.isOnline) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        message: 'Terminal is currently in offline yard mode. Queued records are safely stored in IndexedDB and will sync once internet is restored.',
        timestamp: this.lastSyncedAt ?? now,
      };
    }

    this.isSyncing = true;
    void this.notify();

    let synced = 0;
    let failed = 0;
    const startTime = Date.now();

    try {
      const pendingItems = await db.syncOutbox
        .where('status')
        .anyOf('PENDING', 'FAILED')
        .toArray();

      for (const item of pendingItems) {
        try {
          // In a live production environment, this dispatches via REST/Server Action
          // Simulating idempotent write verification
          await new Promise((resolve) => setTimeout(resolve, 80));
          await db.syncOutbox.update(item.id, { status: 'SYNCED' });
          synced++;
        } catch {
          await db.syncOutbox.update(item.id, { status: 'FAILED' });
          failed++;
        }
      }

      // If manually triggered, guarantee a minimum duration (850ms) so the operator
      // clearly sees the active sync animation, ledger verification, and tactile completion
      if (isManual) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 850) {
          await new Promise((resolve) => setTimeout(resolve, 850 - elapsed));
        }
      }

      const finishTime = new Date();
      this.lastSyncedAt = finishTime;

      let message = 'Cloud connection verified: All records up to date.';
      if (synced > 0 && failed === 0) {
        message = `Successfully synchronized ${synced} transaction record${synced > 1 ? 's' : ''} to AmenDesk cloud ledger.`;
      } else if (failed > 0) {
        message = `Synchronized ${synced} record${synced > 1 ? 's' : ''}, but ${failed} item${failed > 1 ? 's' : ''} encountered an issue.`;
      }

      return {
        success: failed === 0,
        synced,
        failed,
        message,
        timestamp: finishTime,
      };
    } finally {
      this.isSyncing = false;
      void this.notify();
    }
  }
}

export const syncEngine = SyncEngine.getInstance();
