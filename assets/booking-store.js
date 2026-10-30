/* Rabbit Tarot — booking storage.
   Cloud mode (assets/firebase-config.js filled in): Cloud Firestore through its REST API, no SDK.
   Access is enforced by firestore.rules: slots are locked atomically, contact details are write-only.
   Demo mode (no config): localStorage on this device only.
   Both modes expose the same async API: taken(date, readers, hours), create(booking, contact), get(code), cancel(code). */
(function(){
  const CFG = window.RT_FIREBASE || {};
  const CLOUD = !!(CFG.projectId && CFG.apiKey);
  // one document per (date, time, reader); its existence is the lock that prevents double booking
  const slotId = (date, time, reader) => `${date}_${time.replace(':', '')}_${reader}`;

  class SlotTakenError extends Error {
    constructor(){ super('SLOT_TAKEN'); this.name = 'SlotTakenError'; }
  }

  /* ---------- demo: localStorage with in-memory fallback ---------- */
  const KEY = 'rt_bookings';
  let mem = [], useMem = false;
  const local = {
    all(){
      if(useMem) return mem.slice();
      let raw;
      try{ raw = localStorage.getItem(KEY); }catch(e){ useMem = true; return mem.slice(); }
      try{ const v = JSON.parse(raw || '[]'); return Array.isArray(v) ? v.filter(b => b && typeof b.code === 'string') : []; }
      catch(e){ return []; }   // malformed data: start clean, next save() overwrites it
    },
    save(v){
      mem = v.slice();
      if(useMem) return;
      try{ localStorage.setItem(KEY, JSON.stringify(v)); }catch(e){ useMem = true; }
    }
  };
  function seeded(str){ let h = 0; for(const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

  const demo = {
    mode: 'demo',
    async taken(date, readers, hours){
      const s = new Set();
      local.all().forEach(b => {
        if(b.date !== date || b.status === 'cancelled') return;
        // legacy bookings saved with reader 'any' block every reader for that slot
        (b.reader === 'any' ? readers : [b.reader]).forEach(r => s.add(`${b.time}_${r}`));
      });
      // demo occupancy so the calendar doesn't look empty; stable per day/reader/slot
      readers.forEach(r => hours.forEach(t => { if(seeded(date + r + t) % 10 < 3) s.add(`${t}_${r}`); }));
      return s;
    },
    async create(b, contact){
      const all = local.all();
      if(all.some(x => x.code === b.code || (x.date === b.date && x.time === b.time && x.reader === b.reader && x.status !== 'cancelled')))
        throw new SlotTakenError();
      all.push({...b, ...contact, status: 'confirmed', created: Date.now()});
      local.save(all);
    },
    async get(code){
      const b = local.all().find(x => x.code === code);
      return b ? {...b, displayName: b.displayName || b.name} : null;
    },
    async cancel(code){
      const all = local.all(), b = all.find(x => x.code === code);
      if(!b) throw new Error('NOT_FOUND');
      b.status = 'cancelled'; local.save(all);
    }
  };

  /* ---------- cloud: Cloud Firestore REST ---------- */
  const ROOT = `projects/${CFG.projectId}/databases/(default)/documents`;
  const BASE = `https://firestore.googleapis.com/v1/${ROOT}`;
  const docName = path => `${ROOT}/${path}`;
  const enc = v => typeof v === 'number' ? {integerValue: String(v)}
                 : v instanceof Date ? {timestampValue: v.toISOString()}
                 : {stringValue: String(v)};
  const fields = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, enc(v)]));
  const dec = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) =>
    [k, 'integerValue' in v ? Number(v.integerValue) : v.stringValue ?? v.timestampValue ?? v.booleanValue ?? null]));
  // server-side timestamps; the rules require created/updated/cancelledAt == request.time
  const stamp = (...paths) => paths.map(fieldPath => ({fieldPath, setToServerValue: 'REQUEST_TIME'}));

  async function api(path, body){
    const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(CFG.apiKey)}`;
    const res = await fetch(url, body ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)} : {});
    if(res.status === 404 && !body) return null;
    const data = await res.json().catch(() => ({}));
    if(!res.ok){
      const e = new Error(data.error?.message || `HTTP ${res.status}`);
      e.status = data.error?.status; e.http = res.status;
      throw e;
    }
    return data;
  }

  const cloud = {
    mode: 'cloud',
    async taken(date){
      const rows = await api(':runQuery', {structuredQuery: {
        from: [{collectionId: 'slots'}],
        where: {fieldFilter: {field: {fieldPath: 'date'}, op: 'EQUAL', value: {stringValue: date}}}
      }});
      const s = new Set();
      (rows || []).forEach(r => { if(r.document){ const d = dec(r.document.fields); s.add(`${d.time}_${d.reader}`); } });
      return s;
    },
    async create(b, contact){
      const booking = {code: b.code, svc: b.svc, mode: b.mode, reader: b.reader, requested: b.requested,
        date: b.date, time: b.time, start: new Date(`${b.date}T${b.time}:00+07:00`), dur: b.dur,
        displayName: b.displayName, status: 'confirmed'};
      try{
        // one atomic commit: booking + slot lock + private contact details
        await api(':commit', {writes: [
          {update: {name: docName(`bookings/${b.code}`), fields: fields(booking)}, currentDocument: {exists: false}, updateTransforms: stamp('created', 'updated')},
          {update: {name: docName(`slots/${slotId(b.date, b.time, b.reader)}`), fields: fields({date: b.date, time: b.time, reader: b.reader, code: b.code})}, currentDocument: {exists: false}},
          {update: {name: docName(`contacts/${b.code}`), fields: fields({code: b.code, ...contact})}, currentDocument: {exists: false}, updateTransforms: stamp('created')}
        ]});
      }catch(e){
        if(e.status === 'ALREADY_EXISTS' || e.status === 'FAILED_PRECONDITION' || e.http === 409) throw new SlotTakenError();
        throw e;
      }
    },
    async get(code){
      const d = await api(`/bookings/${encodeURIComponent(code)}`);
      return d ? dec(d.fields) : null;
    },
    async cancel(code){
      const b = await cloud.get(code);
      if(!b) throw new Error('NOT_FOUND');
      await api(':commit', {writes: [
        {update: {name: docName(`bookings/${code}`), fields: fields({status: 'cancelled'})}, updateMask: {fieldPaths: ['status']},
         currentDocument: {exists: true}, updateTransforms: stamp('updated', 'cancelledAt')},
        {delete: docName(`slots/${slotId(b.date, b.time, b.reader)}`)}
      ]});
    }
  };

  window.RTStore = Object.assign(CLOUD ? cloud : demo, {SlotTakenError, slotId});
})();
