/**
 * Validates dtoIn against a schema of required and allowed keys.
 *
 * @param {object} body  - The request body or query params
 * @param {string[]} required - Keys that must be present and non-empty
 * @param {string[]} allowed  - All valid keys (required + optional)
 * @returns {{ error?: object, warning?: object }}
 */
export function validateDtoIn(body, required = [], allowed = []) {
  const allAllowed = [...new Set([...required, ...allowed])];

  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === '') {
      return {
        error: {
          code: 'invalidDtoIn',
          message: `Missing required parameter: '${key}'`,
        },
      };
    }
  }

  const unsupported = Object.keys(body).filter(k => !allAllowed.includes(k));
  if (unsupported.length > 0) {
    return { warning: { warning: 'unsupportedKeys', keys: unsupported } };
  }

  return {};
}
