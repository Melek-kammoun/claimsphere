const API_URL = 'http://localhost:4000';

async function getAuthHeaders() {
  const session = JSON.parse(localStorage.getItem('sb-session') ?? '{}');
  const token = session?.access_token ?? '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getAllContracts() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/contracts`, { headers });
  return res.json();
}

export async function getContractsByUser(userId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/contracts/user/${userId}`, { headers });
  return res.json();
}

export async function createContract(data: any) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/contracts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateContract(id: number, data: any) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/contracts/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteContract(id: number) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/contracts/${id}`, {
    method: 'DELETE',
    headers,
  });
  return res.json();
}