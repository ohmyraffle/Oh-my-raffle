// Oh My Raffle! — client-only prototype
(function(){
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const storeKey = 'omr:v1';

  const state = load() || { raffles: [], purchases: [], entries: [], winners: {} };
  let admin = false;

  // Tabs
  $$('.tab').forEach(btn => btn.addEventListener('click', () => {
    $$('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.panel').forEach(p => p.classList.remove('active'));
    $('#' + btn.dataset.tab).classList.add('active');
    if(btn.dataset.tab === 'sell') refreshSellSelect();
    if(btn.dataset.tab === 'dashboard') refreshDashboard();
  }));

  // Admin Toggle
  $('#adminToggle').addEventListener('change', (e) => {
    admin = !!e.target.checked;
    $('#adminActions').classList.toggle('hidden', !admin);
    $$('.admin-only').forEach(el => el.classList.toggle('hidden', !admin));
  });

  // Create
  $('#createForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const raffle = {
      id: crypto.randomUUID(),
      title: fd.get('title').trim(),
      description: fd.get('description').trim(),
      price: Number(fd.get('price')) || 0,
      cap: Number(fd.get('cap')) || 0,
      endAt: new Date(fd.get('endAt')).toISOString(),
      createdAt: new Date().toISOString(),
      active: true,
    };
    state.raffles.push(raffle);
    persist();
    $('#createMsg').textContent = 'Raffle saved.';
    e.target.reset();
    listRaffles();
    refreshSellSelect();
    refreshDashboard();
  });

  function listRaffles(){
    const container = $('#raffleList');
    container.innerHTML = '';
    if(!state.raffles.length){
      container.innerHTML = '<p class="card">No raffles yet.</p>';
      return;
    }
    state.raffles.slice().reverse().forEach(r => {
      const sold = state.entries.filter(en => en.raffleId === r.id).length;
      const pct = r.cap ? Math.min(100, Math.round((sold / r.cap)*100)) : 0;
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong>${r.title}</strong>
            <div class="badge">£${r.price.toFixed(2)}</div>
            <div class="badge">${sold}/${r.cap} sold</div>
            <div class="badge">Ends ${new Date(r.endAt).toLocaleString()}</div>
          </div>
          <div style="min-width:200px">
            <div class="progress"><div style="width:${pct}%"></div></div>
          </div>
        </div>
        <p>${r.description || ''}</p>
      `;
      container.appendChild(card);
    });
  }

  // Sell
  function refreshSellSelect(){
    const sel = $('#sellRaffleSelect');
    sel.innerHTML = '';
    state.raffles.filter(r => r.active).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id; opt.textContent = r.title;
      sel.appendChild(opt);
    });
  }

  $('#sellForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const raffleId = $('#sellRaffleSelect').value;
    const r = state.raffles.find(rr => rr.id === raffleId);
    if(!r){ alert('Select a raffle'); return; }
    const qty = Math.max(1, Number($('#qty').value)||1);
    const sold = state.entries.filter(en => en.raffleId === raffleId).length;
    if (r.cap && sold + qty > r.cap){
      alert('Not enough tickets left.'); return;
    }
    const purchase = {
      id: crypto.randomUUID(),
      raffleId,
      name: $('#buyerName').value.trim(),
      email: $('#buyerEmail').value.trim(),
      qty,
      createdAt: new Date().toISOString(),
      total: qty * r.price
    };
    state.purchases.push(purchase);
    for(let i=0;i<qty;i++){
      state.entries.push({
        id: crypto.randomUUID(),
        raffleId,
        purchaseId: purchase.id,
        name: purchase.name,
        email: purchase.email,
        createdAt: purchase.createdAt
      });
    }
    persist();
    $('#sellMsg').textContent = `Added ${qty} ticket(s) for ${purchase.name}.`;
    $('#sellForm').reset();
    listLatestPurchases();
    refreshDashboard();
  });

  function listLatestPurchases(){
    const box = $('#latestPurchases');
    const items = state.purchases.slice(-5).reverse();
    if(!items.length){ box.innerHTML = ''; return; }
    box.innerHTML = '<h3>Recent</h3>';
    items.forEach(p => {
      const div = document.createElement('div');
      div.className = 'card';
      div.textContent = `${new Date(p.createdAt).toLocaleString()} — ${p.name} bought ${p.qty} (£${p.total.toFixed(2)})`;
      box.appendChild(div);
    });
  }

  // Dashboard
  function refreshDashboard(){
    const sel = $('#dashRaffleSelect');
    sel.innerHTML = '';
    state.raffles.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id; opt.textContent = r.title;
      sel.appendChild(opt);
    });
    buildDash();
  }

  $('#dashRaffleSelect').addEventListener('change', buildDash);

  function buildDash(){
    const raffleId = $('#dashRaffleSelect').value || (state.raffles[0]?.id || null);
    if(!raffleId){
      $('#dashSummary').innerHTML = '<p class="card">No raffles yet.</p>';
      $('#entries').innerHTML = '';
      return;
    }
    $('#dashRaffleSelect').value = raffleId;
    const r = state.raffles.find(x => x.id === raffleId);
    const entries = state.entries.filter(e => e.raffleId === raffleId);
    const sold = entries.length;
    const gross = sold * r.price;
    const pct = r.cap ? Math.min(100, Math.round((sold / r.cap)*100)) : 0;
    $('#dashSummary').innerHTML = `
      <div class="card">
        <strong>${r.title}</strong>
        <div class="badge">£${r.price.toFixed(2)} per ticket</div>
        <div class="badge">${sold}/${r.cap} sold</div>
        <div class="badge">Gross £${gross.toFixed(2)}</div>
        <div>Ends ${new Date(r.endAt).toLocaleString()}</div>
        <div class="progress" style="margin-top:8px"><div style="width:${pct}%"></div></div>
      </div>
    `;
    const container = $('#entries');
    container.innerHTML = '<h3>Entries</h3>';
    if(!entries.length){
      container.innerHTML += '<p class="card">No entries yet.</p>';
    } else {
      entries.slice(-100).reverse().forEach((en, idx) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.textContent = `${new Date(en.createdAt).toLocaleString()} — ${en.name} (${en.email})`;
        container.appendChild(div);
      });
    }
    const w = state.winners[raffleId];
    if(w){
      $('#winnerBlock').classList.remove('hidden');
      $('#winnerCard').textContent = `${w.name} — ${w.email}`;
    } else {
      $('#winnerBlock').classList.add('hidden');
      $('#winnerCard').textContent = '';
    }
  }

  // Draw winner
  $('#drawBtn').addEventListener('click', () => {
    const raffleId = $('#dashRaffleSelect').value;
    const entries = state.entries.filter(e => e.raffleId === raffleId);
    if(!entries.length){ alert('No entries.'); return; }
    const idx = Math.floor(Math.random() * entries.length);
    const win = entries[idx];
    state.winners[raffleId] = { name: win.name, email: win.email, entryId: win.id, drawnAt: new Date().toISOString() };
    persist();
    buildDash();
    alert(`Winner: ${win.name} (${win.email})`);
  });

  $('#resetWinnerBtn').addEventListener('click', () => {
    const raffleId = $('#dashRaffleSelect').value;
    delete state.winners[raffleId];
    persist();
    buildDash();
  });

  // CSV exports
  function toCSV(rows){
    const headers = Object.keys(rows[0] || {});
    const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h]??'')).join(',')));
    return lines.join('\n');
  }
  function download(filename, text){
    const blob = new Blob([text], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  }

  $('#exportEntriesBtn').addEventListener('click', () => {
    const raffleId = $('#dashRaffleSelect').value;
    const rows = state.entries.filter(e => e.raffleId === raffleId);
    if(!rows.length){ alert('No entries.'); return; }
    download('entries.csv', toCSV(rows));
  });

  $('#exportPurchasesBtn').addEventListener('click', () => {
    const raffleId = $('#dashRaffleSelect').value;
    const rows = state.purchases.filter(p => p.raffleId === raffleId);
    if(!rows.length){ alert('No purchases.'); return; }
    download('purchases.csv', toCSV(rows));
  });

  function persist(){ localStorage.setItem(storeKey, JSON.stringify(state)); }
  function load(){ try { return JSON.parse(localStorage.getItem(storeKey)); } catch(e){ return null; } }

  listRaffles();
  refreshSellSelect();
  refreshDashboard();
  $('#y').textContent = new Date().getFullYear();
})();
