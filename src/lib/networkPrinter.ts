// Raw TCP ESC/POS printing to network thermal printers (kitchen/bar station tickets, Fase 5)
// — see android/.../EscPosPrinterPlugin.java. Android-only: a browser can't open a raw TCP
// socket to port 9100, so Web keeps window.print() untouched (no split by destination there).
import { Capacitor, registerPlugin } from '@capacitor/core';
import { uint8ToBase64 } from './escpos';

const EscPosPrinter = registerPlugin<{
  printRaw(options: { ip: string; port: number; data: string }): Promise<{ value: boolean }>;
}>('EscPosPrinter');

export const DEFAULT_ESC_POS_PORT = 9100;

// Rejects with a message safe to show directly to the user (native side already distinguishes
// "printer unreachable" from other failures) — callers print one destination at a time so one
// offline printer doesn't stop the other from receiving its ticket.
export async function printEscPosOverNetwork(ip: string | undefined, port: number | undefined, bytes: Uint8Array): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('La impresión de red solo está disponible en la app de Android.');
  }
  if (!ip) {
    throw new Error('No hay una IP configurada para esta impresora.');
  }

  await EscPosPrinter.printRaw({ ip, port: port || DEFAULT_ESC_POS_PORT, data: uint8ToBase64(bytes) });
}
