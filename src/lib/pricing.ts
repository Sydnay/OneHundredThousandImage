export const PRICE_PER_CELL = 10; // ₽ per cell
export const CURRENCY = 'RUB';

/** Total price in rubles for a given cell count. */
export function priceForCells(cells: number): number {
  return cells * PRICE_PER_CELL;
}

/** Format a ruble amount like "1 250 ₽". */
export function formatRub(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}
