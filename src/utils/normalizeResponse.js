/**
 * Utilidad para normalizar respuestas de BD (snake_case → camelCase)
 * Proyecto Académico - Minimarket POS
 */

export const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

export const objectSnakeToCamel = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => objectSnakeToCamel(item));
  }
  
  if (obj instanceof Date) {
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = snakeToCamel(key);
      newObj[camelKey] = objectSnakeToCamel(obj[key]);
    }
  }
  return newObj;
};

/**
 * Middleware para normalizar todas las respuestas de BD
 */
export const normalizeBDResponse = (data) => {
  return objectSnakeToCamel(data);
};
