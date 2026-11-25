const $ = id => document.getElementById(id);
const state = { page: 1, pageSize: 8, totalPages: 1, editing: null, statuses: [], priorities: [] };
const api = async (url, options = {}) => {
  const response = await fetch('/api' + url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || 'Request failed.');
  return body;
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
function notice(message = '', error = false) { $('notice').textContent = message; $('notice').classList.toggle('error', error); }
function fillSelect(element, values, firstLabel) { element.innerHTML = (firstLabel ? '<option value="">' + firstLabel + '</option>' : '') + values.map(v => '<option>' + esc(v) + '</option>').join(''); }
async function loadMeta() {
  const meta = await api('/meta'); state.statuses = meta.statuses; state.priorities = meta.priorities;
  fillSelect($('statusFilter'), state.statuses, 'All statuses'); fillSelect($('priorityFilter'), state.priorities, 'All priorities');
  fillSelect($('statusInput'), state.statuses); fillSelect($('priorityInput'), state.priorities);
}
async function loadTasks() {
  $('taskList').innerHTML = '<div class="loading">Loading tasks…</div>';
  const params = new URLSearchParams({ page: state.page, pageSize: state.pageSize, sortBy: 'updated_at', sortOrder: 'desc' });
  if ($('searchInput').value.trim()) params.set('search', $('searchInput').value.trim());
  if ($('statusFilter').value) params.set('status', $('statusFilter').value);
  if ($('priorityFilter').value) params.set('priority', $('priorityFilter').value);
  try {
    const result = await api('/tasks?' + params);
    state.totalPages = Math.max(1, result.pagination.totalPages);
    $('pageInfo').textContent = 'Page ' + state.page + ' of ' + state.totalPages + ' · ' + result.pagination.total + ' tasks';
    $('prevPage').disabled = state.page <= 1; $('nextPage').disabled = state.page >= state.totalPages;
    $('statTotal').textContent = result.pagination.total;
    $('statProgress').textContent = '—'; $('statDone').textContent = '—';
    const counts = await Promise.all(['In Progress', 'Done'].map(status => api('/tasks?status=' + encodeURIComponent(status) + '&pageSize=1')));
    $('statProgress').textContent = counts[0].pagination.total; $('statDone').textContent = counts[1].pagination.total;
    if (!result.data.length) { $('taskList').innerHTML = '<div class="empty">No tasks found. Create a task or clear your filters.</div>'; return; }
    $('taskList').innerHTML = result.data.map(task => {
      const priorityClass = task.priority === 'High' ? 'priority-high' : task.priority === 'Low' ? 'priority-low' : '';
      return '<article class="task-card"><div class="task-main"><p class="task-title">' + esc(task.title) + '</p><p class="task-desc">' + esc(task.description || 'No description added.') + '</p><div class="chips"><span class="chip">' + esc(task.status) + '</span><span class="chip ' + priorityClass + '">' + esc(task.priority) + ' priority</span></div></div><div class="task-actions"><button class="btn secondary" data-view="' + task.id + '">View history</button><button class="btn secondary" data-edit="' + task.id + '">Edit</button><button class="btn secondary" data-delete="' + task.id + '">Delete</button></div></article>';
    }).join('');
  } catch (error) { $('taskList').innerHTML = '<div class="empty">Could not load tasks. ' + esc(error.message) + '</div>'; notice(error.message, true); }
}
function openForm(task = null) {
  state.editing = task; $('taskForm').reset(); $('formError').textContent = ''; $('titleError').textContent = '';
  $('dialogTitle').textContent = task ? 'Edit task' : 'Create a task';
  $('titleInput').value = task?.title || ''; $('descriptionInput').value = task?.description || '';
  $('priorityInput').value = task?.priority || 'Medium'; $('statusInput').value = task?.status || 'Todo';
  $('statusInput').disabled = !task;
  $('taskDialog').showModal(); $('titleInput').focus();
}
async function saveTask(event) {
  event.preventDefault(); $('saveTask').disabled = true; $('formError').textContent = ''; $('titleError').textContent = '';
  const payload = { title: $('titleInput').value, description: $('descriptionInput').value, priority: $('priorityInput').value, status: $('statusInput').value };
  try {
    if (state.editing) { payload.version = state.editing.version; await api('/tasks/' + state.editing.id, { method: 'PATCH', body: JSON.stringify(payload) }); notice('Task updated successfully.'); }
    else { await api('/tasks', { method: 'POST', body: JSON.stringify(payload) }); notice('Task created successfully.'); }
    $('taskDialog').close(); await loadTasks();
  } catch (error) { $('formError').textContent = error.message; }
  finally { $('saveTask').disabled = false; }
}
async function showDetail(id) {
  try {
    const [{ data: task }, { data: history }] = await Promise.all([api('/tasks/' + id), api('/tasks/' + id + '/activities')]);
    $('detailTitle').textContent = task.title;
    $('detailContent').innerHTML = '<div class="detail-grid"><div class="detail-box"><small>Status</small><strong>' + esc(task.status) + '</strong></div><div class="detail-box"><small>Priority</small><strong>' + esc(task.priority) + '</strong></div><div class="detail-box"><small>Created</small><strong>' + new Date(task.created_at).toLocaleString() + '</strong></div><div class="detail-box"><small>Last updated</small><strong>' + new Date(task.updated_at).toLocaleString() + '</strong></div></div><p>' + esc(task.description || 'No description.') + '</p><label>Change status<select id="detailStatus">' + state.statuses.map(s => '<option ' + (s === task.status ? 'selected' : '') + '>' + esc(s) + '</option>').join('') + '</select></label><div class="detail-actions"><button class="btn primary" id="changeStatus">Update status</button><button class="btn secondary" id="detailEdit">Edit task</button><button class="btn secondary" id="detailDelete">Delete task</button></div><h3>Activity history</h3><div class="timeline">' + (history.length ? history.map(item => '<div class="timeline-item"><strong>' + esc(item.action.replace('_', ' ')) + '</strong><p>' + esc(JSON.stringify(item.new_value || item.old_value || {})) + '</p><small>' + new Date(item.created_at).toLocaleString() + '</small></div>').join('') : '<p class="muted">No activity recorded yet.</p>') + '</div>';
    $('detailDialog').showModal();
    $('changeStatus').onclick = async () => { try { await api('/tasks/' + id, { method: 'PATCH', body: JSON.stringify({ status: $('detailStatus').value, version: task.version }) }); $('detailDialog').close(); notice('Status updated and history recorded.'); await loadTasks(); } catch (e) { alert(e.message); } };
    $('detailEdit').onclick = () => { $('detailDialog').close(); openForm(task); };
    $('detailDelete').onclick = async () => { if (!confirm('Delete "' + task.title + '"? This action cannot be undone.')) return; try { await api('/tasks/' + id, { method: 'DELETE' }); $('detailDialog').close(); notice('Task deleted. The delete event was recorded.'); await loadTasks(); } catch (e) { alert(e.message); } };
  } catch (error) { notice(error.message, true); }
}
$('taskForm').addEventListener('submit', saveTask);
$('newTaskBtn').onclick = () => openForm();
$('closeDialog').onclick = $('cancelDialog').onclick = () => $('taskDialog').close();
$('closeDetail').onclick = () => $('detailDialog').close();
$('taskList').addEventListener('click', async event => {
  const button = event.target.closest('button'); if (!button) return;
  const id = Number(button.dataset.view || button.dataset.edit || button.dataset.delete);
  if (button.dataset.view) return showDetail(id);
  try {
    if (button.dataset.edit) { const { data } = await api('/tasks/' + id); openForm(data); }
    if (button.dataset.delete && confirm('Delete this task? The activity record will be retained.')) { await api('/tasks/' + id, { method: 'DELETE' }); notice('Task deleted.'); await loadTasks(); }
  } catch (error) { notice(error.message, true); }
});
['statusFilter', 'priorityFilter'].forEach(id => $(id).addEventListener('change', () => { state.page = 1; loadTasks(); }));
let searchTimer; $('searchInput').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { state.page = 1; loadTasks(); }, 250); });
$('clearFilters').onclick = () => { $('searchInput').value = ''; $('statusFilter').value = ''; $('priorityFilter').value = ''; state.page = 1; loadTasks(); };
$('prevPage').onclick = () => { if (state.page > 1) { state.page--; loadTasks(); } };
$('nextPage').onclick = () => { if (state.page < state.totalPages) { state.page++; loadTasks(); } };
$('themeToggle').onclick = () => { document.body.classList.toggle('dark'); localStorage.setItem('flowdesk-theme', document.body.classList.contains('dark') ? 'dark' : 'light'); };
if (localStorage.getItem('flowdesk-theme') === 'dark') document.body.classList.add('dark');
(async () => { try { await loadMeta(); await loadTasks(); } catch (error) { notice(error.message, true); } })();
