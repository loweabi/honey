import { confirmSale } from '../db/sales';
import { syncQueuedSales } from './offline';

let running = false;
export async function syncOfflineSales() {
  if (running || !navigator.onLine) return;
  running = true;
  try { await syncQueuedSales(confirmSale); } finally { running = false; }
}
