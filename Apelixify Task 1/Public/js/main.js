// base script (client)
async function api(path, opts={}) {
  const res = await fetch(path, opts);
  return res.json();
}

async function fetchCurrent() {
  const j = await api('/auth');
  if (!j.user) return window.location.href = '/login.html';
  const u = j.user;
  document.getElementById('myAvatar').src = u.avatar || 'https://via.placeholder.com/120';
  document.getElementById('pName').innerText = u.display_name || u.username;
  document.getElementById('pUsername').innerText = '@' + u.username;
}

async function loadFeed(){
  const j = await api('/get_posts');
  const posts = j.posts || [];
  const feed = document.getElementById('feed');
  feed.innerHTML = '';
  posts.forEach(p => addPostToFeed(p));
}

function addPostToFeed(p){
  const likedClass = p.liked ? 'liked' : '';
  const mediaHtml = p.media_url ? (p.media_type === 'image' ? `<div class="post-media"><img src="${p.media_url}" alt=""></div>` : `<div class="post-media"><video controls src="${p.media_url}"></video></div>`) : '';
  const commentsPreview = (p.comments||[]).map(c=>`<div class="comment"><strong>@${c.username}</strong> ${escapeHtml(c.content)}</div>`).join('');
  const html = `
    <div class="card">
      <div class="meta">
        <img src="${p.avatar||'https://via.placeholder.com/120'}">
        <div>
          <div class="name">${p.display_name || p.username}</div>
          <div class="muted">@${p.username} · ${new Date(p.created_at).toLocaleString()}</div>
        </div>
      </div>
      <div style="margin-top:8px">${escapeHtml(p.caption||'')}</div>
      ${mediaHtml}
      <div class="actions">
        <button class="heart like-btn ${likedClass}" data-id="${p.id}">${p.liked ? '❤️' : '🤍'} ${p.like_count || 0}</button>
        <button class="btn open-post" data-id="${p.id}">Comments (${p.comment_count || 0})</button>
        <button class="btn share-btn" data-id="${p.id}">Share</button>
      </div>
      <div class="comments">${commentsPreview}</div>
    </div>
  `;
  feed.insertAdjacentHTML('afterbegin', html);

  const card = feed.querySelector('.card');
  card.querySelector('.like-btn').addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.id;
    await fetch('/like', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ post_id: id }) });
    await loadFeed();
  });
  card.querySelector('.open-post').addEventListener('click', (e) => openPostModal(e.currentTarget.dataset.id));
  card.querySelector('.share-btn').addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.id;
    const url = location.origin + '/index.html?post=' + id;
    if (navigator.share) navigator.share({title:'Check this post', url});
    else window.open('https://wa.me/?text=' + encodeURIComponent(url), '_blank');
  });
}

function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

document.getElementById('postBtn').addEventListener('click', async () => {
  try {
    const caption = document.getElementById('caption').value.trim();
    const mediaEl = document.getElementById('media');
    const form = new FormData();
    form.append('caption', caption);
    if (mediaEl.files.length) form.append('media', mediaEl.files[0]);
    const res = await fetch('/create_post', { method: 'POST', body: form });
    const j = await res.json();
    if (!j.ok) return alert(j.error || 'Upload failed');
    // show immediate post if returned
    if (j.post) addPostToFeed(j.post);
    document.getElementById('caption').value = '';
    document.getElementById('media').value = '';
    await loadFeed();
  } catch (err) { console.error(err); alert('Error: '+err.message); }
});

const notifBtn = document.getElementById('notifBtn');
const notifList = document.getElementById('notifList');

notifBtn.addEventListener('click', async () => {
  if (notifList.style.display === 'block') { notifList.style.display = 'none'; return; }
  const j = await api('/my_posts');
  const arr = j.posts || [];
  notifList.innerHTML = arr.map(p => `
    <div class="nitem">
      <div style="flex:1">
        <div style="font-weight:700">${escapeHtml(p.caption||'(no caption)')}</div>
        <div style="font-size:12px;color:var(--muted)">${new Date(p.created_at).toLocaleString()}</div>
      </div>
      <div><button class="btn open-post" data-id="${p.id}">Open</button></div>
    </div>
  `).join('');
  notifList.style.display = 'block';
  notifList.querySelectorAll('.open-post').forEach(b => b.addEventListener('click', (e) => { notifList.style.display='none'; openPostModal(e.currentTarget.dataset.id); }));
});

async function openPostModal(id){
  const j = await api('/get_posts.php?id=' + encodeURIComponent(id));
  if (j.error) return alert(j.error);
  const p = j.post;
  const mediaHtml = p.media_url ? (p.media_type === 'image' ? `<img src="${p.media_url}" style="max-width:100%;border-radius:10px">` : `<video controls src="${p.media_url}" style="max-width:100%;border-radius:10px"></video>`) : '';
  const commentsHtml = (p.comments||[]).map(c=>`<div class="comment"><strong>@${c.username}</strong> ${escapeHtml(c.content)}</div>`).join('');
  const html = `
    <div style="display:flex;gap:12px;align-items:center">
      <img src="${p.avatar||'https://via.placeholder.com/120'}" style="width:56px;height:56px;border-radius:10px;object-fit:cover">
      <div><div style="font-weight:700">${p.display_name||p.username}</div><div style="color:var(--muted)">@${p.username} · ${new Date(p.created_at).toLocaleString()}</div></div>
      <div style="margin-left:auto"><button id="closeModal" class="btn" style="background:#111;color:#fff">Close</button></div>
    </div>
    <div style="margin-top:12px">${escapeHtml(p.caption||'')}</div>
    <div style="margin-top:12px">${mediaHtml}</div>
    <div style="margin-top:8px" class="actions">
      <button id="modalLike" class="heart">${p.liked? '❤️' : '🤍'} ${p.like_count}</button>
      <button id="modalShare" class="btn">Share</button>
    </div>
    <div style="margin-top:12px"><h4>Comments</h4><div id="modalComments">${commentsHtml}</div>
      <div style="margin-top:8px;display:flex;gap:8px">
        <input id="modalCommentInput" placeholder="Write a comment..." style="flex:1;padding:8px;border-radius:8px;border:1px solid #e6e9ee">
        <button id="modalCommentSend" class="btn">Send</button>
      </div>
    </div>
  `;
  const modal = document.getElementById('modal');
  modal.innerHTML = html;
  document.getElementById('modalBack').style.display = 'flex';
  document.getElementById('closeModal').addEventListener('click', ()=> document.getElementById('modalBack').style.display='none');

  document.getElementById('modalLike').addEventListener('click', async ()=>{
    await fetch('/like', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ post_id:id })});
    await openPostModal(id);
    await loadFeed();
  });

  document.getElementById('modalCommentSend').addEventListener('click', async ()=>{
    const v = document.getElementById('modalCommentInput').value.trim();
    if (!v) return;
    await fetch('/add_comment', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ post_id:id, content: v })});
    await openPostModal(id);
    await loadFeed();
  });

  document.getElementById('modalShare').addEventListener('click', ()=>{
    const url = location.origin + '/index.html?post=' + id;
    if (navigator.share) navigator.share({ title:'Check this post', url });
    else window.open('https://wa.me/?text=' + encodeURIComponent(url), '_blank');
  });
}

document.getElementById('logoutBtn').addEventListener('click', async ()=>{
  await fetch('/auth/logout', { method:'POST' });
  location.href = '/login.html';
});

window.addEventListener('load', async ()=>{
  await fetchCurrent();
  await loadFeed();
  const params = new URLSearchParams(location.search);
  const pid = params.get('post');
  if (pid) openPostModal(pid);
});
