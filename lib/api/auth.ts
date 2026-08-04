const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function signup(data: SignupData): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Error al crear la cuenta.');
  }
}
