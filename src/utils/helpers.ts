/**
 * Plays an authentic POS barcode scanner beep using Web Audio API
 */
export function playBeep(type: 'success' | 'error' | 'cash' = 'success'): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1750, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else if (type === 'error') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'cash') {
      // Pleasant dual tone for completed sale
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (err) {
    // Graceful fallback if audio context is blocked
    console.debug('Audio play not allowed or supported', err);
  }
}

/**
 * Format number to Brazilian Real Currency (R$ 0,00)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

/**
 * Format ISO date string to DD/MM/YYYY
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const [year, month, day] = isoString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

/**
 * Format ISO date string to DD/MM/YYYY HH:mm
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

/**
 * Calculate overdue days between a due date (YYYY-MM-DD) and today
 */
export function calculateOverdueDays(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = dueDateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculate fine + interest on an overdue installment
 */
export function calculateInterest(
  amount: number,
  dueDateStr: string,
  fineRate: number = 2.0, // 2%
  dailyInterestRate: number = 0.033, // 0.033% ao dia (~1% ao mes)
): { daysOverdue: number; fineAmount: number; interestAmount: number; totalDue: number } {
  const daysOverdue = calculateOverdueDays(dueDateStr);
  if (daysOverdue <= 0) {
    return { daysOverdue: 0, fineAmount: 0, interestAmount: 0, totalDue: amount };
  }

  const fineAmount = Math.round((amount * (fineRate / 100)) * 100) / 100;
  const interestAmount = Math.round((amount * ((dailyInterestRate * daysOverdue) / 100)) * 100) / 100;
  const totalDue = Math.round((amount + fineAmount + interestAmount) * 100) / 100;

  return { daysOverdue, fineAmount, interestAmount, totalDue };
}

/**
 * Generates an SVG pseudo Code 128 / EAN bar pattern string deterministically from a numeric or alphanumeric barcode
 */
export function generateBarcodeBars(code: string): boolean[] {
  const str = code || '0000000000000';
  const bars: boolean[] = [true, false, true]; // Start guard

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const pattern = (charCode * 7 + i * 13) % 16;
    for (let b = 3; b >= 0; b--) {
      bars.push(((pattern >> b) & 1) === 1);
    }
    bars.push(false); // Separator
  }

  // End guard
  bars.push(true, false, true, true);
  return bars;
}

/**
 * Generate a new unique 13-digit EAN barcode
 */
export function generateRandomEan13(prefix: string = '789'): string {
  let ean = prefix;
  while (ean.length < 12) {
    ean += Math.floor(Math.random() * 10);
  }
  // Calculate EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(ean.charAt(i), 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${ean}${checkDigit}`;
}
