import * as fs from 'fs';

/**
 * Reads a secret value from a file (e.g. Docker Swarm secret in /run/secrets/)
 * with fallback to an environment variable or default value.
 *
 * @param filePath Path to Docker secret file
 * @param envVar Environment variable value
 * @param defaultValue Fallback default value
 * @returns Resolved secret string
 */
export function readSecretOrEnv(filePath?: string, envVar?: string, defaultValue = ''): string {
  if (filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const secret = fs.readFileSync(filePath, 'utf8').trim();
        if (secret.length > 0) {
          return secret;
        }
      }
    } catch {
      // Fall back to environment variable or default
    }
  }
  return envVar !== undefined && envVar !== '' ? envVar : defaultValue;
}

