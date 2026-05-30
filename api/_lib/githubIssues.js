const defaultRepo = 'P4ND4907/panda-notes-private-intake';

export function getPrivateIntakeRepo() {
  return process.env.PRIVATE_INTAKE_REPO || defaultRepo;
}

export function parseRepo(repo = getPrivateIntakeRepo()) {
  const [owner, name] = repo.split('/');
  if (!owner || !name) throw new Error('invalid_private_intake_repo');
  return { owner, repo: name, fullName: `${owner}/${name}` };
}

export async function createPrivateIssue({ title, body, labels = [] }, fetchImpl = fetch) {
  const token = process.env.PRIVATE_INTAKE_GITHUB_TOKEN;
  if (!token) throw new Error('missing_private_intake_github_token');
  const repo = parseRepo();
  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/issues`,
    {
      method: 'POST',
      body: JSON.stringify({ title, body, labels })
    },
    token,
    fetchImpl
  );
  return response;
}

export async function findIssueByMarker(marker, fetchImpl = fetch) {
  const token = process.env.PRIVATE_INTAKE_GITHUB_TOKEN;
  if (!token) throw new Error('missing_private_intake_github_token');
  const repo = parseRepo();
  const query = encodeURIComponent(`repo:${repo.fullName} "${marker}" in:body`);
  const result = await githubRequest(`/search/issues?q=${query}&per_page=1`, {}, token, fetchImpl);
  return result.items?.[0] || null;
}

async function githubRequest(path, options = {}, token, fetchImpl) {
  const response = await fetchImpl(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(data.message || `github_request_failed_${response.status}`);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}
