import { db } from '@/lib/db';
import type { SyncOutboxItem } from '@/lib/types';

export class SyncEngine {
  private static instance: SyncEngine;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private listeners: Array<(isOnline: boolean, pendingCount: number) => void> = [];

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

  public subscribe(listener: (isOnline: boolean, pendingCount: number) => void) {
    this.listeners.push(listener);
    // notify immediately
    this.notify();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private async notify() {
    const pendingCount = await this.getPendingCount();
    for (const listener of this.listeners) {
      listener(this.isOnline, pendingCount);
    }
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    if (online) {
      void this.triggerSync();
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
      void this.triggerSync();
    }
  }

  public async triggerSync(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      const pendingItems = await db.syncOutbox.where('status').equals('PENDING').toArray();

      for (const item of pendingItems) {
        try {
          // In a live production environment, this dispatches via REST/Server Action
          // Simulating idempotent write verification
          await new Promise((resolve) => setTimeout(resolve, 80));
          await db.syncOutbox.update(item.id, { status: 'SYNCED' });
          synced++;
        } catch {
          failed++;
        }
      }
    } finally {
      this.isSyncing = false;
      void this.notify();
    }

    return { synced, failed };
  }
}

export const syncEngine = SyncEngine.getInstance();
