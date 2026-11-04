import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
const guestbookFunctionUrl = import.meta.env.VITE_GUESTBOOK_FUNCTION_URL;

export async function recordView(path) {
  if (!supabase) return;
  let session = localStorage.getItem('vishwakesh-session');
  const created = Number(localStorage.getItem('vishwakesh-session-created') || 0);
  if (!session || !created || Date.now() - created > 7 * 24 * 60 * 60 * 1000) {
    session = crypto.randomUUID();
    localStorage.setItem('vishwakesh-session', session);
    localStorage.setItem('vishwakesh-session-created', String(Date.now()));
  }
  const referrer = document.referrer ? new URL(document.referrer).hostname : null;
  await supabase.from('page_views').insert({ page_path: path, session_id: session, referrer_domain: referrer });
}

export async function getViewCount() {
  if (!supabase) return null;
  const { count, error } = await supabase.from('page_views').select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count;
}

export async function recordLinkClick(link_name, destination_domain) {
  if (!supabase) return;
  await supabase.from('link_clicks').insert({ link_name, destination_domain });
}

export async function getProjects() {
  if (!supabase) return null;
  const { data, error } = await supabase.from('projects').select('*').order('display_order');
  if (error) throw error;
  return data;
}

export async function getGuestbook() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('guestbook').select('id,display_name,message,created_at').eq('is_approved', true).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data;
}

export async function submitGuestbook(display_name, message) {
  if (!supabase) throw new Error('Guestbook backend is not configured yet.');
  if (guestbookFunctionUrl) {
    const response = await fetch(guestbookFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name, message }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Unable to submit your message.');
    return;
  }
  const { error } = await supabase.from('guestbook').insert({ display_name, message });
  if (error) throw error;
}

export async function getAdminSnapshot() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in.');
  const [projectsResult, pendingResult, viewsResult, clicksResult] = await Promise.all([
    supabase.from('projects').select('*').order('display_order'),
    supabase.from('guestbook').select('*').eq('is_approved', false).order('created_at', { ascending: false }),
    supabase.from('page_views').select('page_path,session_id,referrer_domain,created_at').order('created_at', { ascending: false }).limit(1000),
    supabase.from('link_clicks').select('link_name,destination_domain,created_at').order('created_at', { ascending: false }).limit(1000),
  ]);
  for (const result of [projectsResult, pendingResult, viewsResult, clicksResult]) if (result.error) throw result.error;
  return { projects: projectsResult.data, pending: pendingResult.data, views: viewsResult.data, clicks: clicksResult.data };
}

export async function saveProject(project) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const payload = { ...project, updated_at: new Date().toISOString() };
  const result = project.id ? await supabase.from('projects').update(payload).eq('id', project.id) : await supabase.from('projects').insert(payload);
  if (result.error) throw result.error;
}

export async function deleteProject(id) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

export async function moderateGuestbook(id, approved) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('guestbook').update({ is_approved: approved }).eq('id', id);
  if (error) throw error;
}

export async function deleteGuestbook(id) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('guestbook').delete().eq('id', id);
  if (error) throw error;
}
