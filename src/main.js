import {
  ArrowUpRight, Camera, Check, Copy, Eye, GitBranch, MapPin, Menu, Music2, Pause, Play,
  Send, ShieldCheck, Sparkles, Trash2, Video, Volume2, VolumeX, createIcons,
} from 'lucide';
import { profile, projects, themes } from './config.js';
import {
  deleteGuestbook, deleteProject, getAdminSnapshot, getGuestbook, getProjects,
  getViewCount, moderateGuestbook, recordLinkClick, recordView, saveProject, submitGuestbook, supabase,
} from './supabase.js';
import './styles.css';

const app = document.querySelector('#app');
const iconNames = { github: 'git-branch', instagram: 'camera', youtube: 'video', x: 'arrow-up-right', discord: 'sparkles' };
const icon = (name, size = 18) => `<i data-lucide="${iconNames[name] || name}" width="${size}" height="${size}"></i>`;
let currentTheme = localStorage.getItem('vishwakesh-theme') || 'winter';
let animationEnabled = localStorage.getItem('vishwakesh-animation') !== 'off';
let soundEnabled = localStorage.getItem('vishwakesh-sound') === 'on';
let entered = sessionStorage.getItem('vishwakesh-entered') === 'true';
let music;

const nav = () => `<header class="nav"><a class="wordmark" href="/" data-link>V/<span>ME</span></a><nav class="nav-links"><a href="/" data-link>Home</a><a href="/projects" data-link>Projects</a><a href="/guestbook" data-link>Guestbook</a><a href="/about" data-link>About</a></nav><button class="icon-btn menu-btn" aria-label="Toggle navigation">${icon('menu')}</button></header>`;
const footer = () => `<footer><span>© ${new Date().getFullYear()} Vishwakesh</span><span class="footer-dot"></span><span>Built with intention.</span></footer>`;
const controls = () => `<div class="controls"><button class="control-btn" data-action="music" aria-label="Music player">${icon('music-2')}</button><a class="control-btn" href="/themes" data-link aria-label="Themes">${icon('sparkles')}</a><button class="control-btn ${animationEnabled ? 'is-active' : ''}" data-action="animation" aria-label="Toggle animation">${icon('eye')}</button><button class="control-btn ${soundEnabled ? 'is-active' : ''}" data-action="sound" aria-label="Toggle sound">${icon(soundEnabled ? 'volume-2' : 'volume-x')}</button></div>`;
const musicPanel = () => `<aside class="music-panel" id="music-panel" aria-label="Music player"><div class="music-cover">${icon('music-2', 26)}</div><div class="music-details"><strong>${profile.music.title}</strong><small>${profile.music.artist}</small><input type="range" min="0" max="100" value="0" data-music-progress aria-label="Track progress" /><div class="music-times"><span data-music-current>0:00</span><span data-music-duration>0:00</span></div></div><div class="music-actions"><button data-music-toggle aria-label="Play">${icon('play')}</button><button data-music-mute aria-label="Mute">${icon('volume-2')}</button></div><audio preload="metadata" src="${profile.music.src}" data-music-audio></audio></aside>`;
const socialLinks = () => Object.entries(profile.socials).filter(([, url]) => url).map(([name, url]) => `<a class="social-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${name}">${icon(name)}</a>`).join('');
const entrance = () => `<section class="entrance ${entered ? 'is-hidden' : ''}" id="entrance"><canvas id="snow-canvas"></canvas><div class="entrance-content"><span class="eyebrow">A small corner of the internet</span><button class="enter-button" data-action="enter">Click to enter <span>↗</span></button><span class="enter-hint">Press Enter or Space</span></div><button class="skip-btn" data-action="enter">Skip intro</button></section>`;

function home() {
  return `${entrance()}<main class="site-shell ${entered ? 'is-visible' : ''}">${nav()}<section class="hero"><div><span class="eyebrow">DIGITAL IDENTITY / 001</span><h1>Building ideas<br /><em>into reality.</em></h1><p class="hero-lede">A personal space for the things I make, explore, and care about.</p><div class="hero-actions"><a class="button button-primary" href="/about" data-link>Discover more ${icon('arrow-up-right', 16)}</a><a class="text-link" href="/projects" data-link>View projects <span>→</span></a></div></div><div class="profile-wrap"><div class="profile-card"><div class="card-glow"></div><div class="profile-top"><div class="avatar"><img src="${profile.avatar}" alt="${profile.name}" onerror="this.style.display='none'" /><span>V</span></div><span class="status"><i></i> Available for ideas</span></div><h2>${profile.name}</h2><p class="username">${profile.username}</p><p class="bio">${profile.bio}</p><div class="roles">${profile.roles.map(role => `<span>${role}</span>`).join('')}</div><div class="location">${icon('map-pin', 14)} ${profile.location}</div><div class="card-divider"></div><div class="profile-bottom"><div class="socials">${socialLinks()}</div>${profile.discord ? `<button class="copy-discord" data-action="copy" data-copy="${profile.discord}">${icon('copy', 15)} Copy Discord</button>` : ''}</div></div><div class="profile-meta"><span>${icon('eye', 14)} <strong>—</strong> profile views</span><span>Last updated recently</span></div></div></section><section class="statement section"><span class="section-number">01 /</span><div><p class="section-kicker">THE PERSON BEHIND THE PIXELS</p><h2>Curiosity is the<br /><em>starting point.</em></h2></div><p class="section-text">I like turning loose thoughts into tangible things. From digital products to communities, each project is an opportunity to learn something new and leave a mark that feels useful.</p></section><section class="mini-grid section"><a class="feature-tile" href="/projects" data-link><span class="tile-icon">${icon('sparkles')}</span><span class="tile-label">Currently building</span><strong>Ideas worth shipping <span>↗</span></strong></a><a class="feature-tile" href="/guestbook" data-link><span class="tile-icon">${icon('send')}</span><span class="tile-label">Leave a note</span><strong>Sign the guestbook <span>↗</span></strong></a></section>${footer()}</main>${controls()}${musicPanel()}`;
}

const frame = (title, kicker, content, extras = '') => `<main class="site-shell is-visible">${nav()}<section class="page-header"><span class="eyebrow">${kicker}</span><h1>${title}</h1></section>${content}${footer()}</main>${controls()}${extras}`;
const safe = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

async function projectsPage() {
  let data = projects;
  try { const remote = await getProjects(); if (remote?.length) data = remote; } catch {}
  return frame('Things in motion.', '02 / SELECTED WORK', `<section class="projects-grid">${data.map((p, i) => `<article class="project-card ${p.is_featured || p.featured ? 'featured' : ''}"><div class="project-art"><span>0${i + 1}</span><div class="project-mark">${safe(p.name[0])}</div><span class="project-status">${safe(p.status)}</span></div><div class="project-info"><div><span class="project-category">${safe(p.category)}</span><h2>${safe(p.name)}</h2></div><p>${safe(p.description)}</p><div class="project-links">${p.website_url ? `<a href="${safe(p.website_url)}" target="_blank" rel="noopener">Visit ${icon('arrow-up-right', 14)}</a>` : '<span>Details soon</span>'}${p.repository_url ? `<a href="${safe(p.repository_url)}" target="_blank" rel="noopener">Repository ${icon('git-branch', 14)}</a>` : ''}</div></div></article>`).join('')}</section>`);
}

async function guestbookPage() {
  let entries = []; let error = '';
  try { entries = await getGuestbook(); } catch { error = 'Guestbook entries are temporarily unavailable.'; }
  return frame('Leave a trace.', '03 / GUESTBOOK', `<section class="guestbook-layout"><div class="guestbook-intro"><p>Found something interesting here? Leave a note. Every thoughtful message is welcome.</p><div class="privacy-note">${icon('shield-check', 16)} Messages are reviewed before appearing publicly.</div></div><form class="guestbook-form" id="guestbook-form"><label>Display name<input name="display_name" maxlength="60" required placeholder="How should we call you?" /></label><label>Message<textarea name="message" maxlength="500" required placeholder="Say something kind..."></textarea><span class="char-count">0 / 500</span></label><button class="button button-primary" type="submit">Send message ${icon('send', 16)}</button><p class="form-feedback" aria-live="polite"></p></form><div class="entries">${error ? `<p class="empty-state">${error}</p>` : entries.length ? entries.map(e => `<article class="entry"><div class="entry-avatar">${safe(e.display_name[0].toUpperCase())}</div><div><div class="entry-meta"><strong>${safe(e.display_name)}</strong><time>${new Date(e.created_at).toLocaleDateString()}</time></div><p>${safe(e.message)}</p></div></article>`).join('') : '<p class="empty-state">Be the first to leave a note.</p>'}</div></section>`);
}

const aboutPage = () => frame('A little context.', '04 / ABOUT', `<section class="about-content"><div><p class="large-copy">The internet is more interesting when it feels human.</p></div><div class="about-copy"><p>Hey, I’m Vishwakesh — a developer, creator, and entrepreneur who enjoys making the gap between an idea and reality a little smaller.</p><p>This site is a living snapshot of what I’m exploring right now. It will change as the work does.</p><div class="about-signoff">— Vishwakesh</div></div></section>`);
const themesPage = () => frame('Set the atmosphere.', '05 / THEMES', `<section class="theme-grid">${Object.entries(themes).map(([key, t]) => `<button class="theme-card ${currentTheme === key ? 'selected' : ''}" data-theme="${key}"><span class="theme-preview theme-${key}"><i></i><b></b></span><span class="theme-card-copy"><strong>${t.label}</strong><small>${t.note}</small></span><span class="theme-check">${currentTheme === key ? '✓' : ''}</span></button>`).join('')}</section><div class="theme-reset"><button class="text-link" data-action="reset-theme">Reset to Winter <span>↻</span></button></div>`);

function adminLogin() {
  return `<section class="admin-auth"><div class="admin-auth-card"><span class="tile-icon">${icon('shield-check', 28)}</span><h2>Admin access</h2><p>Sign in with the protected Supabase administrator account.</p><form id="admin-login-form"><label>Email<input type="email" name="email" required autocomplete="username" /></label><label>Password<input type="password" name="password" required autocomplete="current-password" /></label><button class="button button-primary" type="submit">Sign in ${icon('arrow-up-right', 16)}</button><p class="form-feedback" aria-live="polite"></p></form></div></section>`;
}

function adminDashboard(snapshot) {
  const views = snapshot.views || [];
  const sessions = new Set(views.map(view => view.session_id)).size;
  const pages = Object.entries(views.reduce((all, view) => ({ ...all, [view.page_path]: (all[view.page_path] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  return `<section class="admin-dashboard"><div class="admin-toolbar"><p>Signed in as administrator.</p><button class="text-link" data-action="logout">Sign out <span>↗</span></button></div><div class="metric-grid"><div class="metric"><small>Total views</small><strong>${views.length}</strong></div><div class="metric"><small>Unique sessions</small><strong>${sessions}</strong></div><div class="metric"><small>Pending messages</small><strong>${snapshot.pending.length}</strong></div><div class="metric"><small>Link clicks</small><strong>${snapshot.clicks.length}</strong></div></div><div class="admin-columns"><section class="admin-panel"><div class="panel-heading"><h2>Projects</h2><button class="button button-small" data-action="new-project">Add project</button></div><div class="admin-list">${snapshot.projects.map(p => `<article class="admin-row"><div><strong>${safe(p.name)}</strong><small>${safe(p.status)} · ${safe(p.category)}</small></div><button class="icon-btn danger" data-delete-project="${p.id}" aria-label="Delete ${safe(p.name)}">${icon('trash-2', 15)}</button></article>`).join('') || '<p class="empty-state">No projects yet.</p>'}</div><form id="project-form" class="project-form hidden"><input type="hidden" name="id" /><input name="name" required maxlength="80" placeholder="Project name" /><input name="category" required maxlength="50" placeholder="Category" /><input name="status" required maxlength="50" placeholder="Status" /><textarea name="description" maxlength="500" placeholder="Description"></textarea><input name="website_url" type="url" placeholder="Website URL (optional)" /><input name="repository_url" type="url" placeholder="Repository URL (optional)" /><button class="button button-primary" type="submit">Save project</button><p class="form-feedback"></p></form></section><section class="admin-panel"><div class="panel-heading"><h2>Moderation</h2></div><div class="admin-list">${snapshot.pending.map(e => `<article class="admin-row moderation-row"><div><strong>${safe(e.display_name)}</strong><small>${safe(e.message)}</small></div><div class="row-actions"><button class="button button-small" data-approve="${e.id}">Approve</button><button class="icon-btn danger" data-delete-entry="${e.id}" aria-label="Delete message">${icon('trash-2', 15)}</button></div></article>`).join('') || '<p class="empty-state">No pending messages.</p>'}</div></section><section class="admin-panel"><div class="panel-heading"><h2>Popular pages</h2></div><div class="admin-list">${pages.map(([path, count]) => `<div class="admin-row"><strong>${safe(path)}</strong><span>${count}</span></div>`).join('') || '<p class="empty-state">No analytics recorded yet.</p>'}</div></section></div></section>`;
}

async function adminPage() {
  if (!supabase) return frame('Private dashboard.', 'ADMIN / CONFIGURATION REQUIRED', `<section class="admin-placeholder"><div class="empty-state"><span class="tile-icon">${icon('shield-check')}</span><h2>Supabase is not configured</h2><p>Add the environment variables and run the SQL migration before using protected admin tools.</p></div></section>`);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return frame('Private dashboard.', 'ADMIN / AUTHENTICATED AREA', adminLogin());
  try { return frame('Control room.', 'ADMIN / OVERVIEW', adminDashboard(await getAdminSnapshot())); } catch (error) { return frame('Control room.', 'ADMIN / ERROR', `<section class="admin-placeholder"><p class="empty-state">${safe(error.message)}</p></section>`); }
}

async function render() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  if (path === '/') app.innerHTML = home();
  else if (path === '/projects') app.innerHTML = await projectsPage();
  else if (path === '/guestbook') app.innerHTML = await guestbookPage();
  else if (path === '/about') app.innerHTML = aboutPage();
  else if (path === '/themes') app.innerHTML = themesPage();
  else if (path === '/admin') app.innerHTML = await adminPage();
  else { history.replaceState({}, '', '/'); return render(); }
  document.body.dataset.theme = currentTheme;
  createIcons({ icons: { ArrowUpRight, Camera, Check, Copy, Eye, GitBranch, MapPin, Menu, Music2, Pause, Play, Send, ShieldCheck, Sparkles, Trash2, Video, Volume2, VolumeX } });
  bind(); recordView(path).catch(() => {}); if (path === '/') { snow(); getViewCount().then(count => { const target = document.querySelector('.profile-meta strong'); if (target && count !== null) target.textContent = count.toLocaleString(); }).catch(() => {}); }
}

function bind() {
  document.querySelectorAll('[data-link]').forEach(a => a.addEventListener('click', event => { const href = a.getAttribute('href'); if (href?.startsWith('/')) { event.preventDefault(); history.pushState({}, '', href); render(); } }));
  document.querySelectorAll('a[target="_blank"]').forEach(a => a.addEventListener('click', () => { try { recordLinkClick(a.getAttribute('aria-label') || 'external', new URL(a.href).hostname).catch(() => {}); } catch {} }));
  document.querySelector('.menu-btn')?.addEventListener('click', () => document.querySelector('.nav-links')?.classList.toggle('open'));
  document.querySelectorAll('[data-theme]').forEach(button => button.addEventListener('click', () => { currentTheme = button.dataset.theme; localStorage.setItem('vishwakesh-theme', currentTheme); document.body.dataset.theme = currentTheme; render(); }));
  document.querySelector('[data-action="reset-theme"]')?.addEventListener('click', () => { currentTheme = 'winter'; localStorage.setItem('vishwakesh-theme', currentTheme); render(); });
  document.querySelectorAll('[data-action="enter"]').forEach(button => button.addEventListener('click', enter));
  document.querySelector('[data-action="music"]')?.addEventListener('click', () => document.querySelector('#music-panel')?.classList.toggle('open'));
  document.querySelector('[data-action="animation"]')?.addEventListener('click', () => { animationEnabled = !animationEnabled; localStorage.setItem('vishwakesh-animation', animationEnabled ? 'on' : 'off'); document.body.classList.toggle('reduced-effects', !animationEnabled); });
  document.querySelector('[data-action="sound"]')?.addEventListener('click', () => { soundEnabled = !soundEnabled; localStorage.setItem('vishwakesh-sound', soundEnabled ? 'on' : 'off'); if (music) music.audio.muted = !soundEnabled; render(); });
  document.querySelector('[data-action="copy"]')?.addEventListener('click', async event => { await navigator.clipboard.writeText(event.currentTarget.dataset.copy); event.currentTarget.innerHTML = `${icon('check', 15)} Copied`; setTimeout(() => { event.currentTarget.innerHTML = `${icon('copy', 15)} Copy Discord`; createIcons(); }, 1800); });
  bindGuestbook(); bindMusic(); bindAdmin();
}

function bindGuestbook() {
  const form = document.querySelector('#guestbook-form'); const text = form?.querySelector('textarea');
  text?.addEventListener('input', () => { form.querySelector('.char-count').textContent = `${text.value.length} / 500`; });
  form?.addEventListener('submit', async event => { event.preventDefault(); const feedback = form.querySelector('.form-feedback'); const data = new FormData(form); const name = String(data.get('display_name')).trim(); const message = String(data.get('message')).trim(); if (name.length < 2 || message.length < 3) { feedback.textContent = 'Please add a name and a little more detail.'; return; } feedback.textContent = 'Sending…'; try { await submitGuestbook(name, message); form.reset(); feedback.textContent = 'Thanks — your message is awaiting approval.'; } catch (error) { feedback.textContent = error.message; } });
}

function bindMusic() {
  const audio = document.querySelector('[data-music-audio]'); if (!audio) return;
  music = { audio }; const toggle = document.querySelector('[data-music-toggle]'); const progress = document.querySelector('[data-music-progress]');
  const format = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  audio.addEventListener('loadedmetadata', () => { document.querySelector('[data-music-duration]').textContent = format(audio.duration); });
  audio.addEventListener('timeupdate', () => { progress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0; document.querySelector('[data-music-current]').textContent = format(audio.currentTime); });
  audio.addEventListener('error', () => { document.querySelector('#music-panel').classList.add('music-missing'); document.querySelector('#music-panel').querySelector('.music-details small').textContent = 'Add public/assets/music/track.mp3'; });
  toggle.addEventListener('click', async () => { if (audio.paused) { try { await audio.play(); toggle.innerHTML = icon('pause'); } catch { toggle.innerHTML = icon('play'); } } else { audio.pause(); toggle.innerHTML = icon('play'); } createIcons(); });
  document.querySelector('[data-music-mute]').addEventListener('click', event => { audio.muted = !audio.muted; event.currentTarget.innerHTML = icon(audio.muted ? 'volume-x' : 'volume-2'); createIcons(); });
  progress.addEventListener('input', () => { if (audio.duration) audio.currentTime = (Number(progress.value) / 100) * audio.duration; });
}

async function bindAdmin() {
  const login = document.querySelector('#admin-login-form');
  login?.addEventListener('submit', async event => { event.preventDefault(); const feedback = login.querySelector('.form-feedback'); const data = new FormData(login); feedback.textContent = 'Signing in…'; const { error } = await supabase.auth.signInWithPassword({ email: data.get('email'), password: data.get('password') }); if (error) feedback.textContent = error.message; else render(); });
  document.querySelector('[data-action="logout"]')?.addEventListener('click', async () => { await supabase.auth.signOut(); render(); });
  document.querySelectorAll('[data-approve]').forEach(button => button.addEventListener('click', async () => { await moderateGuestbook(button.dataset.approve, true); render(); }));
  document.querySelectorAll('[data-delete-entry]').forEach(button => button.addEventListener('click', async () => { await deleteGuestbook(button.dataset.deleteEntry); render(); }));
  document.querySelectorAll('[data-delete-project]').forEach(button => button.addEventListener('click', async () => { await deleteProject(button.dataset.deleteProject); render(); }));
  document.querySelector('[data-action="new-project"]')?.addEventListener('click', () => document.querySelector('#project-form')?.classList.toggle('hidden'));
  document.querySelector('#project-form')?.addEventListener('submit', async event => { event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)); try { await saveProject(data); render(); } catch (error) { form.querySelector('.form-feedback').textContent = error.message; } });
}

function enter() { entered = true; sessionStorage.setItem('vishwakesh-entered', 'true'); document.querySelector('.entrance')?.classList.add('is-hidden'); document.querySelector('.site-shell')?.classList.add('is-visible'); }
function snow() { const canvas = document.querySelector('#snow-canvas'); if (!canvas || !animationEnabled || matchMedia('(prefers-reduced-motion: reduce)').matches) return; const context = canvas.getContext('2d'); let particles = []; let frame; const resize = () => { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); particles = Array.from({ length: Math.min(90, innerWidth / 14) }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: Math.random() * 2 + .5, s: Math.random() * .5 + .2, d: (Math.random() - .5) * .3 })); }; const tick = () => { context.clearRect(0, 0, innerWidth, innerHeight); context.fillStyle = 'rgba(184,219,255,.55)'; particles.forEach(p => { p.y += p.s; p.x += p.d; if (p.y > innerHeight) p.y = -4; context.beginPath(); context.arc(p.x, p.y, p.r, 0, Math.PI * 2); context.fill(); }); frame = requestAnimationFrame(tick); }; resize(); tick(); addEventListener('resize', resize); document.addEventListener('visibilitychange', () => document.hidden ? cancelAnimationFrame(frame) : tick()); }

addEventListener('popstate', render);
addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && !entered && document.querySelector('.entrance')) { event.preventDefault(); enter(); } });
render();
