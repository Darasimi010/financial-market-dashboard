import { validateServerEnv } from '@/lib/env';

export async function register() {
  validateServerEnv();
}
