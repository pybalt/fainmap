import { useState, useCallback, useEffect } from 'react';

interface MapPosition {
  x: number;
  y: number;
}

interface UseMapControlsProps {
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  initialPosition?: MapPosition;
}

interface UseMapControlsResult {
  mapPosition: MapPosition;
  scale: number;
  isDragging: boolean;
  containerEvents: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onWheel: (e: React.WheelEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  resetView: () => void;
  setMapPosition: (position: MapPosition) => void;
  setScale: (scale: number) => void;
}

export const useMapControls = ({
  initialScale = 1,
  minScale = 0.5,
  maxScale = 2,
  initialPosition = { x: 0, y: 0 }
}: UseMapControlsProps = {}): UseMapControlsResult => {
  // Estados para el mapa
  const [mapPosition, setMapPosition] = useState<MapPosition>(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<MapPosition>({ x: 0, y: 0 });
  const [pinchDistance, setPinchDistance] = useState<number | null>(null);

  // Resetear la vista
  const resetView = useCallback(() => {
    setMapPosition(initialPosition);
    setScale(initialScale);
  }, [initialPosition, initialScale]);

  // Handler para la rueda del mouse (zoom)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY * -0.001;
    const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));
    
    // Calcular el punto de origen del zoom
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Aplicar zoom centrado en la posición del mouse
    const scaleChange = newScale / scale;
    const newPosition = {
      x: mouseX - (mouseX - mapPosition.x) * scaleChange,
      y: mouseY - (mouseY - mapPosition.y) * scaleChange
    };
    
    setScale(newScale);
    setMapPosition(newPosition);
  }, [mapPosition, scale, minScale, maxScale]);

  // Handlers para arrastrar el mapa
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Solo botón izquierdo
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - mapPosition.x, y: e.clientY - mapPosition.y });
  }, [mapPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    
    setMapPosition(newPosition);
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Calcular la distancia entre dos puntos de toque
  const getTouchDistance = useCallback((touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Handlers para eventos táctiles
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // Arrastrar con un dedo
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - mapPosition.x,
        y: e.touches[0].clientY - mapPosition.y
      });
    } else if (e.touches.length === 2) {
      // Pinch con dos dedos para zoom
      setPinchDistance(getTouchDistance(e.touches[0], e.touches[1]));
    }
  }, [mapPosition, getTouchDistance]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
      // Arrastrar con un dedo
      const newPosition = {
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      };
      
      setMapPosition(newPosition);
    } else if (e.touches.length === 2 && pinchDistance !== null) {
      // Pinch con dos dedos para zoom
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scaleFactor = currentDistance / pinchDistance;
      
      const newScale = Math.max(minScale, Math.min(maxScale, scale * scaleFactor));
      
      setPinchDistance(currentDistance);
      setScale(newScale);
    }
  }, [isDragging, dragStart, pinchDistance, scale, minScale, maxScale, getTouchDistance]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setPinchDistance(null);
  }, []);

  // Limpiar los manejadores de eventos al desmontar
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    // Agregar manejadores globales para arrastre fuera del contenedor
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchEnd]);

  // Devolver la API del hook
  return {
    mapPosition,
    scale,
    isDragging,
    containerEvents: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onWheel: handleWheel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    resetView,
    setMapPosition,
    setScale
  };
}; 