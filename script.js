'use strict';
// ================================================================
// DATA  — loaded from external courses.json
// ================================================================
let deptDB = [];
let courseDB = [];

async function initData() {
  showLoader('Loading course database…');
  try {
    const res = await fetch('courses.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    deptDB = data.departments || [];
    courseDB = data.courses || [];
    console.log(`Loaded ${courseDB.length} courses from ${deptDB.length} departments.`);
  } catch(e) {
    alert('⚠ Could not load courses.json.\nMake sure it is in the SAME folder as this HTML file.\n\nError: ' + e.message);
    console.error(e);
  } finally {
    hideLoader();
  }
}

// ================================================================
// SEMESTER DEFINITIONS
// ================================================================
const SEMESTERS = [
  {label:'1st Year Odd Semester',  year:1, sem:1},
  {label:'1st Year Even Semester', year:1, sem:2},
  {label:'2nd Year Odd Semester',  year:2, sem:1},
  {label:'2nd Year Even Semester', year:2, sem:2},
  {label:'3rd Year Odd Semester',  year:3, sem:1},
  {label:'3rd Year Even Semester', year:3, sem:2},
  {label:'4th Year Odd Semester',  year:4, sem:1},
  {label:'4th Year Even Semester', year:4, sem:2},
  {label:'5th Year Even Semester', year:5, sem:1},
  {label:'5th Year Even Semester', year:5, sem:2},
];

let selectedSemester = null; // {year, sem, label}
let selectedDeptCode = null; // e.g. 'me'

// ================================================================
// LOADER
// ================================================================
function showLoader(msg) {
  document.getElementById('loadMsg').textContent = msg || 'Please wait…';
  document.getElementById('loadOverlay').classList.add('active');
}
function hideLoader() {
  document.getElementById('loadOverlay').classList.remove('active');
}

// ================================================================
// TOAST NOTIFICATIONS
// ================================================================
function showToast(msg, type='warning', duration=3500) {
  const icons = {warning:'bi-exclamation-triangle-fill', error:'bi-x-circle-fill', success:'bi-check-circle-fill', info:'bi-info-circle-fill'};
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast-msg toast-${type}`;
  el.innerHTML = `<i class="bi ${icons[type]||icons.info} toast-icon"></i><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 320);
  }, duration);
}

// ================================================================
// THEME — simple light/dark toggle; defaults to system preference
// ================================================================
const systemPrefersDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
const savedTheme = localStorage.getItem('ruet-theme'); // 'dark' | 'light' | null
let isDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;

function applyTheme(dark) {
  isDark = dark;
  const tog = document.getElementById('themeToggle');
  const lbl = document.getElementById('themeLabel');
  const mobileIcon = document.getElementById('themeIconMobile');
  tog.checked = dark;
  lbl.textContent = dark ? 'Dark' : 'Light';
  // Mobile icon: sun when light (click to go dark), moon when dark (click to go light)
  if (mobileIcon) {
    mobileIcon.innerHTML = dark
      ? '<i class="bi bi-moon-stars-fill" style="color:#a78bfa"></i>'
      : '<i class="bi bi-sun-fill" style="color:#f39c12"></i>';
  }
  dark ? document.documentElement.setAttribute('data-theme','dark')
       : document.documentElement.removeAttribute('data-theme');
  localStorage.setItem('ruet-theme', dark ? 'dark' : 'light');
}

function cycleTheme() { applyTheme(!isDark); }

applyTheme(isDark);
// Follow system if user hasn't manually set a preference
window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', e => {
  if (!localStorage.getItem('ruet-theme')) applyTheme(e.matches);
});

// ================================================================
// AUTOCOMPLETE HELPERS
// ================================================================
let activeBox = null;
let activeInput = null;

function posAC(box, input) {
  // Remove ac-open from all field-wraps first
  document.querySelectorAll('.field-wrap.ac-open').forEach(el => el.classList.remove('ac-open'));
  // Add to the parent of this input
  const wrap = input.closest('.field-wrap');
  if (wrap) wrap.classList.add('ac-open');
}

function hideAC() {
  document.querySelectorAll('.ac-box').forEach(b => { b.style.display='none'; b.innerHTML=''; });
  document.querySelectorAll('.field-wrap.ac-open').forEach(el => el.classList.remove('ac-open'));
  activeBox = null; activeInput = null;
}

// ================================================================
// DEPARTMENT AUTOCOMPLETE
// ================================================================
function onDeptInput(inp) {
  selectedDeptCode = null; // reset until user picks from dropdown
  const q = inp.value.toLowerCase().trim();
  const box = document.getElementById('deptBox');
  const hits = q ? deptDB.filter(d =>
    d.title.toLowerCase().includes(q) || d.fullName.toLowerCase().includes(q)) : deptDB;
  renderDeptAC(box, hits, inp);
}

function onDeptFocus(inp) {
  const q = inp.value.toLowerCase().trim();
  const box = document.getElementById('deptBox');
  const hits = q ? deptDB.filter(d =>
    d.title.toLowerCase().includes(q) || d.fullName.toLowerCase().includes(q)) : deptDB;
  renderDeptAC(box, hits, inp);
}

function renderDeptAC(box, hits, inp) {
  if (!hits.length) { box.style.display='none'; return; }
  box.innerHTML = '';
  hits.forEach(dept => {
    const el = document.createElement('div');
    el.className = 'ac-item';
    el.innerHTML = `<div class="ac-code">${dept.title}</div><div class="ac-sub">${dept.fullName}</div>`;
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      inp.value = dept.title;
      selectedDeptCode = dept.code;
      box.style.display = 'none'; box.innerHTML = '';
    });
    box.appendChild(el);
  });
  posAC(box, inp);
  box.style.display = 'block';
  activeBox = box; activeInput = inp;
}

// ================================================================
// SESSION / SEMESTER DROPDOWN
// ================================================================
function onSessionFocus(inp) { renderSessionAC(inp); }
function onSessionInput(inp) {
  selectedSemester = null; // reset when typing
  renderSessionAC(inp);
}

function renderSessionAC(inp) {
  const box = document.getElementById('sessionBox');
  const q = inp.value.trim().toLowerCase();
  box.innerHTML = '';
  const filtered = q
    ? SEMESTERS.filter(s => s.label.toLowerCase().includes(q))
    : SEMESTERS;
  if (!filtered.length) { box.style.display='none'; return; }
  filtered.forEach(s => {
    const el = document.createElement('div');
    el.className = 'ac-item';
    el.innerHTML = `<div class="ac-code">${s.label}</div>`;
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      inp.value = s.label;
      selectedSemester = s;
      box.style.display = 'none'; box.innerHTML = '';
    });
    box.appendChild(el);
  });
  posAC(box, inp);
  box.style.display = 'block';
  activeBox = box; activeInput = inp;
}

// ================================================================
// LOAD COURSES FOR SELECTED DEPT + SEMESTER
// ================================================================
function loadCoursesForSemester() {
  // Strictly require selectedDeptCode — must have been chosen from dropdown
  if (!selectedDeptCode) {
    showToast('Please select a Department from the dropdown first.', 'warning');
    document.getElementById('deptInput').focus();
    return;
  }
  // Strictly require selectedSemester — must have been chosen from dropdown
  if (!selectedSemester) {
    showToast('Please select an Academic Session with Semester from the dropdown first.', 'warning');
    document.getElementById('sessionInput').focus();
    return;
  }

  const year = selectedSemester.year;
  const sem  = selectedSemester.sem;

  const matched = courseDB.filter(c => {
    if (c.dept !== selectedDeptCode) return false;
    const m = c.code.match(/(\d)(\d)\d\d/);
    if (!m) return false;
    return parseInt(m[1]) === year && parseInt(m[2]) === sem;
  });

  if (!matched.length) {
    showToast(`No courses found for ${document.getElementById('deptInput').value} — ${selectedSemester.label}.`, 'error');
    return;
  }

  clearAllCourses();
  matched.forEach(c => addCourseWithData(c.code, c.title, c.credit));
  calculateTotal();
  showToast(`Loaded ${matched.length} courses for ${selectedSemester.label}.`, 'success', 2500);
  document.getElementById('courseRows').closest('.form-section')?.scrollIntoView({behavior:'smooth',block:'start'});
}

// ================================================================
// COURSE ROW MANAGEMENT
// ================================================================
let rowCount = 0;

function clearAllCourses() {
  document.getElementById('courseRows').innerHTML = '';
  document.getElementById('courseCards').innerHTML = '';
  rowCount = 0;
}

function addCourse() {
  addCourseWithData('', '', '');
}

function addCourseWithData(code, title, credit) {
  const id = rowCount++;
  addDesktopRow(id, code, title, credit);
  addMobileCard(id, code, title, credit);
  updateRemoveBtns();
  calculateTotal();
}

function addDesktopRow(id, code, title, credit) {
  const tr = document.createElement('tr');
  tr.className = 'course-row';
  tr.setAttribute('data-cid', id);
  tr.innerHTML = `
    <td><div class="field-wrap">
      <input type="text" class="form-control cno" value="${esc(code)}" placeholder="ME 2101"
        autocomplete="off" oninput="onCodeInput(this)" onfocus="onCodeFocus(this)">
      <div class="ac-box" id="codeBox-${id}"></div>
    </div></td>
    <td><div class="field-wrap">
      <input type="text" class="form-control ctitle" value="${esc(title)}" placeholder="Course Title"
        autocomplete="off" oninput="onTitleInput(this)" onfocus="onTitleFocus(this)">
      <div class="ac-box" id="titleBox-${id}"></div>
    </div></td>
    <td><input type="text" class="form-control ccredit" value="${esc(credit)}" placeholder="3.00"
      oninput="calculateTotal()"></td>
    <td><button type="button" onclick="removeCourse(${id})" class="btn btn-danger btn-sm">
      <i class="bi bi-trash"></i></button></td>`;
  document.getElementById('courseRows').appendChild(tr);
}

function addMobileCard(id, code, title, credit) {
  const num = document.querySelectorAll('#courseCards .course-card').length + 1;
  const card = document.createElement('div');
  card.className = 'course-card';
  card.setAttribute('data-cid', id);
  card.innerHTML = `
    <div class="course-card-header">
      <div class="card-num">${num}</div>
      <strong>Course ${num}</strong>
      <button type="button" onclick="removeCourse(${id})" class="btn-remove"><i class="bi bi-trash"></i></button>
    </div>
    <div class="card-fields">
      <div class="card-field"><label>Course No.</label>
        <div class="field-wrap">
          <input type="text" class="form-control cno-m" value="${esc(code)}" placeholder="ME 2101"
            autocomplete="off" oninput="onCodeInput(this)" onfocus="onCodeFocus(this)">
          <div class="ac-box" id="codeBoxM-${id}"></div>
        </div>
      </div>
      <div class="card-field"><label>Course Title</label>
        <div class="field-wrap">
          <input type="text" class="form-control ctitle-m" value="${esc(title)}" placeholder="Course Title"
            autocomplete="off" oninput="onTitleInput(this)" onfocus="onTitleFocus(this)">
          <div class="ac-box" id="titleBoxM-${id}"></div>
        </div>
      </div>
      <div class="card-field"><label>Credit</label>
        <input type="text" class="form-control ccredit-m" value="${esc(credit)}" placeholder="3.00"
          oninput="syncMobileCredit(this,${id}); calculateTotal()">
      </div>
    </div>`;
  document.getElementById('courseCards').appendChild(card);
}

function removeCourse(id) {
  document.querySelector(`tr[data-cid="${id}"]`)?.remove();
  document.querySelector(`.course-card[data-cid="${id}"]`)?.remove();
  updateRemoveBtns();
  renumberCards();
  calculateTotal();
}

function updateRemoveBtns() {
  const rows = document.querySelectorAll('#courseRows tr');
  const cards = document.querySelectorAll('#courseCards .course-card');
  const disable = rows.length <= 1;
  rows.forEach(r => { const b=r.querySelector('.btn-danger'); if(b) b.disabled=disable; });
  cards.forEach(c => { const b=c.querySelector('.btn-remove'); if(b) b.disabled=disable; });
}

function renumberCards() {
  document.querySelectorAll('#courseCards .course-card').forEach((c,i) => {
    const n = c.querySelector('.card-num'); if(n) n.textContent = i+1;
    const h = c.querySelector('.course-card-header strong'); if(h) h.textContent = `Course ${i+1}`;
  });
}

function syncMobileCredit(inp, id) {
  const row = document.querySelector(`tr[data-cid="${id}"]`);
  if (row) { const d = row.querySelector('.ccredit'); if(d) d.value = inp.value; }
}

function esc(s) { return (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

// ================================================================
// COURSE AUTOCOMPLETE
// ================================================================
function getRowCtx(input) {
  const tr = input.closest('tr');
  if (tr) {
    const id = tr.getAttribute('data-cid');
    return {
      noInp:  tr.querySelector('.cno'),
      ttInp:  tr.querySelector('.ctitle'),
      crInp:  tr.querySelector('.ccredit'),
      codeBox: document.getElementById(`codeBox-${id}`),
      titleBox: document.getElementById(`titleBox-${id}`),
      isMobile: false, id
    };
  }
  const card = input.closest('.course-card');
  if (card) {
    const id = card.getAttribute('data-cid');
    return {
      noInp:  card.querySelector('.cno-m'),
      ttInp:  card.querySelector('.ctitle-m'),
      crInp:  card.querySelector('.ccredit-m'),
      codeBox: document.getElementById(`codeBoxM-${id}`),
      titleBox: document.getElementById(`titleBoxM-${id}`),
      isMobile: true, id
    };
  }
  return {};
}

function renderCourseAC(box, hits, ctx, input) {
  if (!hits.length) { box.style.display='none'; return; }
  box.innerHTML = '';
  hits.forEach(c => {
    const el = document.createElement('div');
    el.className = 'ac-item';
    el.innerHTML = `<div class="ac-row"><span class="ac-code">${c.code}</span><span class="ac-badge">${c.credit} cr</span></div><div class="ac-sub">${c.title}</div>`;
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      if (ctx.noInp)  ctx.noInp.value  = c.code;
      if (ctx.ttInp)  ctx.ttInp.value  = c.title;
      if (ctx.crInp)  ctx.crInp.value  = c.credit;
      // sync mobile→desktop
      if (ctx.isMobile) syncCardToTable(ctx);
      box.style.display='none'; box.innerHTML='';
      calculateTotal();
    });
    box.appendChild(el);
  });
  posAC(box, input);
  box.style.display = 'block';
  activeBox = box; activeInput = input;
}

function syncCardToTable(ctx) {
  const row = document.querySelector(`tr[data-cid="${ctx.id}"]`);
  if (!row) return;
  row.querySelector('.cno').value    = ctx.noInp?.value || '';
  row.querySelector('.ctitle').value = ctx.ttInp?.value || '';
  row.querySelector('.ccredit').value= ctx.crInp?.value || '';
}

function onCodeInput(inp) {
  const q = inp.value.trim();
  const ctx = getRowCtx(inp);
  if (!ctx.codeBox) return;
  if (q.length < 2) { ctx.codeBox.style.display='none'; return; }
  const hits = courseDB.filter(c => c.code.toLowerCase().includes(q.toLowerCase())).slice(0,20);
  renderCourseAC(ctx.codeBox, hits, ctx, inp);
}

function onTitleInput(inp) {
  const q = inp.value.trim();
  const ctx = getRowCtx(inp);
  if (!ctx.titleBox) return;
  if (q.length < 2) { ctx.titleBox.style.display='none'; return; }
  const hits = courseDB.filter(c => c.title.toLowerCase().includes(q.toLowerCase())).slice(0,20);
  renderCourseAC(ctx.titleBox, hits, ctx, inp);
}

function onCodeFocus(inp)  { if(inp.value.length>=2) onCodeInput(inp); }
function onTitleFocus(inp) { if(inp.value.length>=2) onTitleInput(inp); }

// ================================================================
// TOTAL CREDIT
// ================================================================
function calculateTotal() {
  const isMobile = window.innerWidth <= 767;
  const sel = isMobile ? '.ccredit-m' : '.ccredit';
  let total = 0;
  document.querySelectorAll(sel).forEach(i => { const v=parseFloat(i.value); if(!isNaN(v)) total+=v; });
  document.getElementById('totalCredit').textContent = total.toFixed(2);
  return total;
}

// ================================================================
// COLLECT DATA
// ================================================================
function collectData() {
  const isMobile = window.innerWidth <= 767;
  const courses = [];

  if (isMobile) {
    document.querySelectorAll('#courseCards .course-card').forEach(card => {
      const id = card.getAttribute('data-cid');
      const no    = card.querySelector('.cno-m')?.value    || '';
      const title = card.querySelector('.ctitle-m')?.value || '';
      const cr    = card.querySelector('.ccredit-m')?.value|| '';
      // sync to desktop
      const row = document.querySelector(`tr[data-cid="${id}"]`);
      if (row) {
        row.querySelector('.cno').value    = no;
        row.querySelector('.ctitle').value = title;
        row.querySelector('.ccredit').value= cr;
      }
      courses.push({no, title, credit: cr});
    });
  } else {
    document.querySelectorAll('#courseRows tr').forEach(row => {
      courses.push({
        no:     row.querySelector('.cno')?.value    || '',
        title:  row.querySelector('.ctitle')?.value || '',
        credit: row.querySelector('.ccredit')?.value|| ''
      });
    });
  }

  return {
    department:  document.getElementById('deptInput').value.trim(),
    roll:        document.getElementById('rollInput').value.trim(),
    reg:         document.getElementById('regInput').value.trim(),
    name:        document.getElementById('nameInput').value.trim(),
    session:     document.getElementById('sessionInput').value.trim(),
    prevCredit:  document.getElementById('prevCreditInput').value.trim(),
    backlog:     document.getElementById('backlogInput').value.trim(),
    courses
  };
}

// ================================================================
// TEXTAREA AUTO-RESIZE
// ================================================================
function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.max(80, el.scrollHeight) + 'px';
}

// Format backlog: split by comma, group into lines of 12 words-worth of items,
// then rejoin — keeps individual course codes together, breaks display every 12 tokens
function formatBacklogDisplay(el) {
  // Only reformat on blur to avoid cursor jumping while typing
  const raw = el.value;
  const items = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (!items.length) return;
  const WORDS_PER_LINE = 12;
  const lines = [];
  let current = [];
  let wordCount = 0;
  items.forEach(item => {
    const w = item.split(/\s+/).length;
    if (wordCount + w > WORDS_PER_LINE && current.length) {
      lines.push(current.join(', '));
      current = [item];
      wordCount = w;
    } else {
      current.push(item);
      wordCount += w;
    }
  });
  if (current.length) lines.push(current.join(', '));
  el.value = lines.join(',\n');
  autoResizeTextarea(el);
}

// ================================================================
// PDF GENERATION
// ================================================================
function buildPDF(forDownload) {
  const {jsPDF} = window.jspdf;
  const d = collectData();

  const pdf = new jsPDF({orientation:'portrait', unit:'mm', format:'legal'});
  const PW = 215.9, ML = 20, MR = 20;
  const CW = PW - ML - MR; // 175.9
  const PAGE_H = 355.6;    // LEGAL height in mm
  const BOTTOM_MARGIN = 20; // don't go below this from bottom
  const MAX_Y = PAGE_H - BOTTOM_MARGIN;
  let y = 15;
  let pageNum = 1;

  const sf = (style, size) => { pdf.setFont('times', style); pdf.setFontSize(size); };

  // Check if we need a new page before drawing something of height h
  function checkPage(h) {
    if (y + h > MAX_Y) {
      pdf.addPage('legal');
      pageNum++;
      y = 15;
    }
  }

  // -- HEADER --
  y+=10;
  
  sf('normal', 12);
  pdf.text("Heaven's Light is Our Guide", PW/2, y+6, {align:'center'}); y+=9;

  sf('normal', 15);
  pdf.text('RAJSHAHI UNIVERSITY OF ENGINEERING & TECHNOLOGY, BANGLADESH', PW/2, y+6, {align:'center'}); y+=9;

  const ftX=52.5, ftW=111;
  sf('normal', 18);
  pdf.text('Course Registration/Course Adjustment Form', ftX+ftW/2, y+6, {align:'center'});
  pdf.line(ftX-3, y+8.5, ftX+ftW+4, y+8.5); y+=9;

  sf('bold', 20);
  pdf.text((d.department||'') + ' Department', PW/2, y+9, {align:'center'}); y+=12+6;

  // -- STUDENT INFO --
  sf('normal', 13);
  pdf.text('Roll No.:', ML, y+4);
  pdf.text(d.roll, ML+37, y+4, {align:'center'});
  pdf.line(ML+17, y+5, ML+57, y+5);

  pdf.text('Registration No. with Session:', ML+58, y+4);
  pdf.text(d.reg, ML+62+53+(PW-MR-ML-58-53)/2, y+4, {align:'center'});
  pdf.line(ML+62+53, y+5, PW-MR, y+5);
  y+=5+3;

  pdf.text('Name:', ML, y+4);
  pdf.text(d.name, ML+14, y+4);
  pdf.line(ML+13, y+5, PW-MR, y+5);
  y+=5+3;

  pdf.text('Academic session with Semester:', ML, y+4);
  pdf.text(d.session, ML+62, y+4);
  pdf.line(ML+62, y+5, ML+114, y+5);

  pdf.text('Previously earned credit:', ML+114, y+4);
  pdf.text(d.prevCredit, ML+161, y+4);
  pdf.line(ML+161, y+5, PW-MR, y+5);
  y+=5+5;

  // -- BACKLOG --
  // Split by comma, group into lines where word count per line <= 12
  const bItems = d.backlog ? d.backlog.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const lblW=35, valW=CW-lblW;
  sf('normal', 13);

  // Build display lines: break after every 12 words worth of course codes
  const bLines = [];
  let curLine = [], curWords = 0;
  bItems.forEach(item => {
    const w = item.split(/\s+/).length;
    if (curWords + w > 12 && curLine.length) {
      bLines.push(curLine.join(', '));
      curLine = [item]; curWords = w;
    } else {
      curLine.push(item); curWords += w;
    }
  });
  if (curLine.length) bLines.push(curLine.join(', '));

  const lineCount = Math.max(1, bLines.length);
  const lineH = 8;           // mm per line of text
  const cellPad = 4;         // top+bottom padding inside cell
  const cellH = Math.max(15, lineCount * lineH + cellPad);

  checkPage(cellH + 3);
  pdf.rect(ML, y, lblW, cellH);
  pdf.text('Course No. of',  ML+lblW/2, y+cellH*0.33, {align:'center'});
  pdf.text('Backlog Courses',ML+lblW/2, y+cellH*0.66, {align:'center'});
  pdf.rect(ML+lblW, y, valW, cellH);

  if (bLines.length === 0) {
    // empty — just blank cell
  } else if (bLines.length === 1) {
    pdf.text(bLines[0], ML+lblW+valW/2, y+cellH/2+1.5, {align:'center'});
  } else {
    // vertically center the block of lines inside the cell
    const blockH = bLines.length * lineH;
    const startY = y + (cellH - blockH) / 2 + lineH * 0.7;
    bLines.forEach((bl, i) => {
      pdf.text(bl, ML+lblW+valW/2, startY + i*lineH, {align:'center'});
    });
  }
  y += cellH + 3;

  // -- COURSES TABLE --
  checkPage(8 + 8 + 3); // header row + label row
  sf('normal', 13);
  pdf.text('Courses to be registered in this semester:', ML, y+4);
  y+=5+3;

  const cNo=35, cTi=116, cCr=25;

  // Draw table header — repeated on new pages
  function drawTableHeader() {
    pdf.rect(ML, y, cNo, 8); pdf.text('Course No.', ML+cNo/2, y+5.5, {align:'center'});
    pdf.rect(ML+cNo, y, cTi, 8); pdf.text('Course Title', ML+cNo+cTi/2, y+5.5, {align:'center'});
    pdf.rect(ML+cNo+cTi, y, cCr, 8); pdf.text('Credit', ML+cNo+cTi+cCr/2, y+5.5, {align:'center'});
    y+=8;
  }

  drawTableHeader();

  const courseRows = [...d.courses];
  while (courseRows.length < 10) courseRows.push({no:'',title:'',credit:''});

  let totalCredit = 0;
  courseRows.forEach(c => {
    const words = (c.title||'').split(' ').filter(Boolean);
    const wc = words.length;
    let rH=9, tLines=[c.title||''];
    if (wc>10) {
      rH=19;
      tLines=[words.slice(0,5).join(' '),words.slice(5,10).join(' '),words.slice(10).join(' ')].filter(l=>l);
    } else if (wc>5) {
      rH=13;
      tLines=[words.slice(0,5).join(' '),words.slice(5).join(' ')].filter(l=>l);
    }
    const cr=parseFloat(c.credit); if(!isNaN(cr)) totalCredit+=cr;

    // Page break: if row doesn't fit, add page and redraw header
    if (y + rH > MAX_Y) {
      pdf.addPage('legal');
      pageNum++;
      y = 15;
      sf('normal', 13);
      drawTableHeader();
    }

    pdf.rect(ML, y, cNo, rH);
    pdf.text(c.no||'', ML+cNo/2, y+rH/2+1.5, {align:'center'});

    pdf.rect(ML+cNo, y, cTi, rH);
    if (tLines.length===1) {
      pdf.text(tLines[0], ML+cNo+2, y+rH/2+1.5);
    } else {
      const lh=rH/tLines.length;
      tLines.forEach((tl,ti) => pdf.text(tl, ML+cNo+2, y+lh*(ti+0.65)));
    }

    pdf.rect(ML+cNo+cTi, y, cCr, rH);
    pdf.text(c.credit||'', ML+cNo+cTi+cCr/2, y+rH/2+1.5, {align:'center'});
    y+=rH;
  });

  // total row
  checkPage(9 + 8 + 60); // total row + adviser lines + signatures
  pdf.rect(ML+cNo, y, cTi, 9); pdf.text('Total Credit of this Semester', ML+cNo+cTi-2, y+6, {align:'right'});
  pdf.rect(ML+cNo+cTi, y, cCr, 9); pdf.text(totalCredit.toFixed(2), ML+cNo+cTi+cCr/2, y+6, {align:'center'});
  y+=9+8;

  // adviser lines
  sf('normal', 13);
  pdf.text("Adviser's Comment (if any)______________________________________________________", ML, y+7);
  y+=8;
  pdf.text('____________________________________________________________________________', ML, y+10);
  y+=14+10+4;

  // signatures
  checkPage(30);
  sf('normal', 13);
  pdf.text('Signature of the Student', ML, y+4); 
  pdf.line(ML, y+6, ML+44, y+6);
  pdf.text('Signature of the Adviser', ML+63, y+4); 
  pdf.line(ML+63, y+6, ML+63+45, y+6);
  pdf.text('Signature of the Controller', PW-MR-49, y+4); 
  pdf.line(PW-MR-49, y+6, PW-MR, y+6);
  y+=17;
  pdf.text('Date:', ML, y+4); y+=10;
  pdf.line(ML, y, ML+96, y);
  pdf.text('Students are asked to cross out the irrelevant Terms.', ML, y+5);

  if (forDownload) {
    const safe = d.roll ? d.roll.replace(/[^A-Za-z0-9_-]/g,'_') : Date.now();
    pdf.save(`RUET_Course_Registration_${safe}.pdf`);
    return null;
  }
  return pdf.output('bloburl');
}

function previewPDF() {
  try {
    const url = buildPDF(false);
    const mob = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (mob) window.open(url,'_blank');
    else {
      const fr = document.getElementById('pdfFrame');
      fr.style.opacity='0.5'; fr.src=url;
      fr.onload=()=>fr.style.opacity='1';
    }
  } catch(e) { alert('PDF error: '+e.message); console.error(e); }
}

function downloadPDF() {
  try { buildPDF(true); }
  catch(e) { alert('PDF error: '+e.message); console.error(e); }
}

// ================================================================
// GLOBAL CLOSE / KEYBOARD NAV
// ================================================================
document.addEventListener('click', e => {
  if (!e.target.closest('.field-wrap') && !e.target.closest('.ac-box')) hideAC();
});

document.addEventListener('focusout', e => {
  if (e.target.matches('.cno,.ctitle,.cno-m,.ctitle-m')) {
    setTimeout(() => {
      const w=e.target.closest('.field-wrap');
      if(w){const b=w.querySelector('.ac-box');if(b){b.style.display='none';b.innerHTML='';}}
    },160);
  }
}, true);

document.addEventListener('keydown', e => {
  if (!activeBox || activeBox.style.display!=='block') return;
  const items = Array.from(activeBox.querySelectorAll('.ac-item'));
  if (!items.length) return;
  let sel = items.findIndex(i=>i.classList.contains('selected'));
  if (e.key==='ArrowDown') {
    e.preventDefault();
    items.forEach(i=>i.classList.remove('selected'));
    const nx=(sel+1)%items.length; items[nx].classList.add('selected');
    items[nx].scrollIntoView({block:'nearest'});
  } else if (e.key==='ArrowUp') {
    e.preventDefault();
    items.forEach(i=>i.classList.remove('selected'));
    const pv=sel<=0?items.length-1:sel-1; items[pv].classList.add('selected');
    items[pv].scrollIntoView({block:'nearest'});
  } else if (e.key==='Enter') {
    e.preventDefault();
    if(sel>=0) items[sel].click(); else if(items.length) items[0].click();
  } else if (e.key==='Escape') { hideAC(); }
});

// ================================================================
// STUDENT INFO CACHE  (localStorage)
// ================================================================
const CACHE_KEY = 'ruet-student-cache';

function loadStudentCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveStudentToCache(roll, reg, name) {
  if (!roll && !reg && !name) return;
  let cache = loadStudentCache();
  // Remove existing entry with same roll or reg to avoid duplicates
  cache = cache.filter(s => s.roll !== roll && s.reg !== reg);
  cache.unshift({roll, reg, name, ts: Date.now()});
  // Keep max 10 entries
  cache = cache.slice(0, 10);
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function renderStudentCacheAC(triggerInput, field) {
  // field: 'roll' | 'reg' | 'name'
  const q = triggerInput.value.trim().toLowerCase();
  if (!q) { hideStudentCacheAC(); return; }
  const cache = loadStudentCache();
  const hits = cache.filter(s => s[field] && s[field].toLowerCase().includes(q));
  if (!hits.length) { hideStudentCacheAC(); return; }

  let box = document.getElementById('studentCacheBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'studentCacheBox';
    box.className = 'ac-box';
    box.style.minWidth = '260px';
    document.body.appendChild(box);
    // position absolutely relative to body — use fixed positioning
    box.style.position = 'fixed';
    box.style.zIndex = '10002';
  }

  const r = triggerInput.getBoundingClientRect();
  box.style.top   = r.bottom + 'px';
  box.style.left  = r.left   + 'px';
  box.style.width = Math.max(r.width, 260) + 'px';

  box.innerHTML = '';
  hits.forEach(s => {
    const el = document.createElement('div');
    el.className = 'ac-item';
    el.innerHTML = `
      <div class="ac-code">${s.roll||'—'}</div>
      <div class="ac-sub">${s.name||''} &nbsp;·&nbsp; ${s.reg||''}</div>`;
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      if (s.roll) document.getElementById('rollInput').value = s.roll;
      if (s.reg)  document.getElementById('regInput').value  = s.reg;
      if (s.name) document.getElementById('nameInput').value = s.name;
      hideStudentCacheAC();
    });
    box.appendChild(el);
  });
  box.style.display = 'block';
}

function hideStudentCacheAC() {
  const box = document.getElementById('studentCacheBox');
  if (box) { box.style.display='none'; box.innerHTML=''; }
}

// Wire up the three student fields
function wireStudentCacheField(inputId, field) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.addEventListener('input',  () => renderStudentCacheAC(inp, field));
  inp.addEventListener('focus',  () => { if (inp.value.trim()) renderStudentCacheAC(inp, field); });
  inp.addEventListener('blur',   () => setTimeout(hideStudentCacheAC, 160));
}

// Save cache when PDF is generated
const _origCollectData = collectData;
function collectDataWithCache() {
  const d = _origCollectData();
  if (d.roll || d.reg || d.name) {
    saveStudentToCache(d.roll, d.reg, d.name);
  }
  return d;
}
// Override collectData
window._collectDataOrig = collectData;
collectData = collectDataWithCache;

// ================================================================
// INIT
// ================================================================
addCourse();
initData();
wireStudentCacheField('rollInput', 'roll');
wireStudentCacheField('regInput',  'reg');
wireStudentCacheField('nameInput', 'name');
// Close student cache on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('#studentCacheBox') &&
      !['rollInput','regInput','nameInput'].includes(e.target.id)) {
    hideStudentCacheAC();
  }
});