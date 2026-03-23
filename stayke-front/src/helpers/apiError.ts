/**
 * Helper para manejar errores de la API en el frontend.
 * Muestra un alert con el mensaje de error para evitar que el front se rompa.
 */
export const handleApiError = (error: unknown, context: string) => {
  console.error(`[${context}] API Error:`, error);
  
  let message = "An unexpected error occurred. Please try again later.";
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }
  
  // En el futuro esto podría ser un Toast o un modal agradable
  alert(`${context}: ${message}`);
};
