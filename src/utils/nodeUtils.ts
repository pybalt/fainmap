import { Theme } from '../types/theme';

/**
 * Gets the scale transformation of an HTML element
 */
export function getElementScale(element: HTMLElement | null): { scale: number } {
  if (!element) return { scale: 1 };
  
  const transform = window.getComputedStyle(element).transform;
  if (transform === 'none') return { scale: 1 };
  
  const matrix = transform.match(/^matrix\((.+)\)$/);
  if (!matrix) return { scale: 1 };
  
  const values = matrix[1].split(', ').map(parseFloat);
  // For a 2D transform matrix, the scale is at positions [0] and [3]
  // We'll use the average in case there's any skew
  const scaleX = values[0];
  const scaleY = values[3] || scaleX;
  return { scale: (scaleX + scaleY) / 2 };
}

/**
 * Gets the scale transformation of an HTML element - simplified version for backward compatibility
 */
export function getScale(element: HTMLElement | null): number {
  return getElementScale(element).scale;
}

/**
 * Get the background color based on node status
 */
export function getNodeBackgroundColor(
  status: 'pending' | 'in_progress' | 'approved',
  isEnabled: boolean,
  theme: Theme
): string {
  if (!isEnabled) {
    return 'bg-gray-200 opacity-75';
  }
  
  switch (status) {
    case 'approved':
      return 'bg-green-50';
    case 'in_progress':
      return 'bg-yellow-50';
    case 'pending':
    default:
      return theme.cardBg;
  }
}

/**
 * Get the status color for the indicator
 */
export function getStatusColor(status: 'pending' | 'in_progress' | 'approved'): string {
  switch (status) {
    case 'approved':
      return 'bg-green-500';
    case 'in_progress':
      return 'bg-yellow-500';
    case 'pending':
    default:
      return 'bg-gray-500';
  }
}

/**
 * Get the status text based on the status
 */
export function getStatusText(status: 'pending' | 'in_progress' | 'approved'): string {
  switch (status) {
    case 'approved':
      return 'Aprobada';
    case 'in_progress':
      return 'En curso';
    case 'pending':
    default:
      return 'Pendiente';
  }
} 