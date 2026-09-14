// =========================================================
// MediTrack Pro - Core Engine with Live Staff Registration
// =========================================================

let activeRole = "Doctor";

// Default Roster if empty
const defaultStaffList = [
  { id: "DOC-101", username: "doctor", pass: "1234", role: "Doctor", name: "Dr. Arvind", dept: "Cardiology" },
  { id: "NUR-201", username: "nurse", pass: "1234", role: "Nurse", name: "Nurse Anita", dept: "ICU Care" }
];

let hospitalStaff = JSON.parse(localStorage.getItem("meditrack_staff_roster")) || defaultStaffList;

// Default Patients
const defaultPatients = [
  {
    id: 101,
    name: "Kavitha Raj",
    age: 42,
    gender: "Female",
    blood: "B+",
    phone: "9876501234",
    bed: "Ward 3 - Bed 08",
    diagnosis: "Type 2 Diabetes Mellitus",
    vitals: { bp: "130/85", pulse: "76", spo2: "98%" },
    status: "Ongoing",
    nextVisit: "2026-09-25",
    history: [
      { date: "2026-09-10", staff: "Dr. Arvind (Cardiology)", rx: "Metformin 500mg BD continued.", notes: "FBS under control. Advised morning walk." }
    ]
  },
  {
    id: 102,
    name: "Murugan S",
    age: 58,
    gender: "Male",
    blood: "O+",
    phone: "9840123456",
    bed: "ICU - Bed 02",
    diagnosis: "Acute Hypertension & Angina",
    vitals: { bp: "170/110", pulse: "102", spo2: "95%" },
    status: "Critical",
    nextVisit: "2026-09-18",
    history: [
      { date: "2026-09-12", staff: "Dr. Arvind (Cardiology)", rx: "IV Nitroglycerin infusion running. Continuous BP check.", notes: "Strict ICU bed rest and sodium restriction." }
    ]
  },
  {
    id: 103,
    name: "Aakash V",
    age: 24,
    gender: "Male",
    blood: "A+",
    phone: "9123456780",
    bed: "Discharged",
    diagnosis: "Post Appendectomy",
    vitals: { bp: "118/78", pulse: "72", spo2: "99%" },
    status: "Recovered",
    nextVisit: "Discharged",
    history: [
      { date: "2026-09-01", staff: "Nurse Anita (ICU Care)", rx: "Suture line clean. Completed antibiotic course.", notes: "Fit for discharge and routine activity." }
    ]
  }
];

let patients = JSON.parse(localStorage.getItem("clinical_patient_records")) || defaultPatients;

// --- Tab Switcher (Login vs Register) ---
function switchAuthMode(mode) {
  const isLogin = mode === 'login';
  document.getElementById('loginForm').style.display = isLogin ? 'block' : 'none';
  document.getElementById('registerForm').style.display = isLogin ? 'none' : 'block';
  
  document.getElementById('tabLoginBtn').classList.toggle('active', isLogin);
  document.getElementById('tabRegBtn').classList.toggle('active', !isLogin);

  if (!isLogin) {
    generateStaffIdPreview();
  }
}

function generateStaffIdPreview() {
  const role = document.getElementById("newStaffRole").value;
  const prefix = role === "Doctor" ? "DOC" : "NUR";
  const randomNum = Math.floor(100 + Math.random() * 900);
  document.getElementById("newStaffId").value = `${prefix}-${randomNum}`;
}

// --- Add New Staff directly from Website ---
function registerNewStaff(e) {
  e.preventDefault();
  const role = document.getElementById("newStaffRole").value;
  const name = document.getElementById("newStaffName").value.trim();
  const dept = document.getElementById("newStaffDept").value.trim();
  const staffId = document.getElementById("newStaffId").value;
  const pass = document.getElementById("newStaffPass").value.trim();
  const msgElem = document.getElementById("regSuccessMsg");

  const newStaff = {
    id: staffId,
    username: staffId.toLowerCase(),
    pass: pass,
    role: role,
    name: name,
    dept: dept
  };

  hospitalStaff.push(newStaff);
  localStorage.setItem("meditrack_staff_roster", JSON.stringify(hospitalStaff));

  msgElem.innerText = `Registration Complete! Staff ID: ${staffId}`;

  setTimeout(() => {
    e.target.reset();
    msgElem.innerText = "";
    switchAuthMode('login');
    setRole(role);
    document.getElementById("loginUser").value = staffId;
  }, 1600);
}

// --- Role Selection & Login ---
function setRole(role) {
  activeRole = role;
  document.getElementById("btnDoctor").classList.toggle("active", role === "Doctor");
  document.getElementById("btnNurse").classList.toggle("active", role === "Nurse");
  document.getElementById("loginUser").placeholder = role === "Doctor" ? "e.g. DOC-101 or doctor" : "e.g. NUR-201 or nurse";
}

function doLogin(e) {
  e.preventDefault();
  const u = (document.getElementById("loginUser")?.value || "").trim().toLowerCase();
  const p = (document.getElementById("loginPass")?.value || "").trim();
  const err = document.getElementById("loginError");

  // Validate against dynamic staff list
  const user = hospitalStaff.find(s => 
    (s.username.toLowerCase() === u || s.id.toLowerCase() === u) && 
    s.pass === p && 
    s.role.toLowerCase() === activeRole.toLowerCase()
  );

  if (user) {
    sessionStorage.setItem("hospital_session_role", user.role);
    sessionStorage.setItem("hospital_session_name", `${user.name} (${user.dept})`);
    if (err) err.innerText = "";
    showDashboard();
  } else {
    if (err) err.innerText = `Invalid Staff ID or Password for ${activeRole}!`;
  }
}

function showDashboard() {
  const role = sessionStorage.getItem("hospital_session_role") || "Doctor";
  const staffName = sessionStorage.getItem("hospital_session_name") || role;

  document.getElementById("loginSec").style.display = "none";
  document.getElementById("mainSec").style.display = "block";
  document.getElementById("navRight").style.display = "flex";

  const icon = role === "Doctor" ? "fa-user-doctor" : "fa-user-nurse";
  document.getElementById("userBadge").innerHTML = `<i class="fa-solid ${icon}"></i> <span>${staffName}</span>`;

  refresh();
}

function logout() {
  sessionStorage.removeItem("hospital_session_role");
  sessionStorage.removeItem("hospital_session_name");
  document.getElementById("loginSec").style.display = "flex";
  document.getElementById("mainSec").style.display = "none";
  document.getElementById("navRight").style.display = "none";
}

// --- Patient CRUD Operations ---
function createPatient(e) {
  e.preventDefault();
  const staffName = sessionStorage.getItem("hospital_session_name") || "Attending Staff";

  const newPatient = {
    id: Date.now(),
    name: document.getElementById("name").value.trim(),
    age: document.getElementById("age").value,
    gender: document.getElementById("gender").value,
    blood: document.getElementById("blood").value,
    phone: document.getElementById("phone").value.trim(),
    bed: document.getElementById("bed").value.trim() || "Unallocated",
    vitals: {
      bp: document.getElementById("vBp").value.trim() || "120/80",
      pulse: document.getElementById("vPulse").value.trim() || "72",
      spo2: document.getElementById("vSpo2").value.trim() || "98%"
    },
    diagnosis: document.getElementById("diagnosis").value.trim(),
    status: document.getElementById("status").value,
    nextVisit: document.getElementById("date").value || "Not Scheduled",
    history: [
      {
        date: new Date().toISOString().split("T")[0],
        staff: staffName,
        rx: document.getElementById("treatment").value.trim(),
        notes: "Admission Baseline Assessment"
      }
    ]
  };

  patients.unshift(newPatient);
  sync();
  e.target.reset();
}

function appendRx(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;

  const staffName = sessionStorage.getItem("hospital_session_name") || "Attending Staff";
  const newRx = prompt(`Enter updated medication/treatment for ${p.name}:`);
  if (!newRx || !newRx.trim()) return;

  const notes = prompt("Enter observation / ward notes:") || "Routine round observation";
  
  p.history.unshift({
    date: new Date().toISOString().split("T")[0],
    staff: staffName,
    rx: newRx.trim(),
    notes: notes.trim()
  });

  sync();
}

function discharge(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;
  const staffName = sessionStorage.getItem("hospital_session_name") || "Doctor";

  if (confirm(`Confirm clinical discharge for ${p.name}?`)) {
    p.status = "Recovered";
    p.bed = "Discharged";
    p.nextVisit = "Discharged";
    p.history.unshift({
      date: new Date().toISOString().split("T")[0],
      staff: staffName,
      rx: "Discharged. Discharge medications and summary provided.",
      notes: "Patient in stable condition at discharge."
    });
    sync();
  }
}

function printSlip(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;

  const latest = p.history[0] || { rx: "N/A", date: "N/A", staff: "N/A", notes: "N/A" };
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Prescription - ${p.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
          .hdr { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          .hdr h2 { margin: 0; color: #0284c7; }
          .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .info-table td { padding: 6px 0; font-size: 14px; }
          .rx-box { border: 1px solid #cbd5e1; padding: 18px; border-radius: 8px; margin: 20px 0; background: #f8fafc; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <h2>🩺 MediTrack Pro - City Care Hospital</h2>
          <p style="margin: 4px 0 0; color: #64748b;">Clinical Inpatient & Outpatient Sheet</p>
        </div>
        <table class="info-table">
          <tr>
            <td><strong>Patient Name:</strong> ${p.name}</td>
            <td><strong>Age/Gender:</strong> ${p.age}y / ${p.gender}</td>
            <td><strong>Blood Group:</strong> ${p.blood}</td>
          </tr>
          <tr>
            <td><strong>Ward / Bed:</strong> ${p.bed}</td>
            <td><strong>Phone:</strong> ${p.phone}</td>
            <td><strong>Status:</strong> ${p.status}</td>
          </tr>
          <tr>
            <td colspan="3"><strong>Diagnosis:</strong> ${p.diagnosis}</td>
          </tr>
          <tr>
            <td colspan="3"><strong>Vitals on Admission:</strong> BP: ${p.vitals?.bp || "N/A"} | Pulse: ${p.vitals?.pulse || "N/A"} bpm | SpO2: ${p.vitals?.spo2 || "N/A"}</td>
          </tr>
        </table>
        <div class="rx-box">
          <h3 style="margin-top: 0; color: #0f172a;">℞ Prescription & Doctor Orders</h3>
          <p><strong>Prescribed By:</strong> ${latest.staff} (${latest.date})</p>
          <p><strong>Medications / Therapy:</strong><br>${latest.rx}</p>
          <p><strong>Clinical Notes:</strong> ${latest.notes}</p>
        </div>
        <div class="footer">
          <div>Next Review: ${p.nextVisit}</div>
          <div>Attending Signature: _______________________</div>
        </div>
        <script>window.onload = function() { window.print(); };<\/script>
      </body>
    </html>
  `);
  win.document.close();
}

function deletePatient(id) {
  if (sessionStorage.getItem("hospital_session_role") !== "Doctor") {
    alert("Access Denied: Only Doctors can delete medical files!");
    return;
  }
  if (confirm("Permanently delete this medical file?")) {
    patients = patients.filter(item => item.id !== id);
    sync();
  }
}

// --- Local Storage Sync & Search ---
function sync() {
  localStorage.setItem("clinical_patient_records", JSON.stringify(patients));
  refresh();
}

function filterData() {
  const q = (document.getElementById("search")?.value || "").toLowerCase();
  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.diagnosis.toLowerCase().includes(q) ||
    p.phone.includes(q) ||
    p.bed.toLowerCase().includes(q)
  );
  render(filtered);
}

function refresh() {
  document.getElementById("cTotal").innerText = patients.length;
  document.getElementById("cActive").innerText = patients.filter(p => p.status === "Ongoing").length;
  document.getElementById("cCritical").innerText = patients.filter(p => p.status === "Critical").length;
  document.getElementById("cDischarged").innerText = patients.filter(p => p.status === "Recovered").length;
  filterData();
}

// --- Render Cards ---
function render(list) {
  const box = document.getElementById("patientList");
  if (!box) return;

  box.innerHTML = "";

  if (list.length === 0) {
    box.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">No clinical files found.</div>';
    return;
  }

  const role = sessionStorage.getItem("hospital_session_role") || "Doctor";

  list.forEach(p => {
    let sc = "ongoing";
    if (p.status === "Critical") sc = "critical";
    if (p.status === "Recovered") sc = "recovered";

    const delBtn = role === "Doctor" 
      ? `<button class="btn-del" title="Delete Patient" onclick="deletePatient(${p.id})"><i class="fa-solid fa-trash-can"></i></button>`
      : "";

    let histHtml = "";
    p.history.forEach((h, i) => {
      histHtml += `
        <div style="padding:8px; margin-top:6px; background:rgba(15,23,42,0.9); border-radius:6px; border-left:3px solid var(--primary); font-size:0.85rem;">
          <div style="display:flex; justify-content:space-between; color:#cbd5e1; font-weight:600; font-size:0.8rem;">
            <span><i class="fa-regular fa-calendar-check"></i> ${h.date} (${h.staff})</span>
            <span style="color:var(--primary);">Entry #${p.history.length - i}</span>
          </div>
          <div style="margin-top:4px; color:#fff;"><strong>Rx:</strong> ${h.rx}</div>
          <div style="color:var(--text-muted); font-size:0.8rem;"><strong>Notes:</strong> ${h.notes}</div>
        </div>
      `;
    });

    const card = document.createElement("div");
    card.className = `patient-card status-${sc}`;
    card.innerHTML = `
      ${delBtn}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding-right:25px;">
        <h4 style="color:#fff; font-size:1.1rem;">
          <i class="fa-solid fa-circle-user" style="color:var(--primary); margin-right:6px;"></i>
          ${p.name} <span style="font-size:0.8rem; color:var(--text-muted);">(${p.age}y, ${p.gender})</span>
        </h4>
        <span class="badge ${sc}">${p.status}</span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.85rem; color:var(--text-muted);">
        <div><i class="fa-solid fa-droplet" style="color:var(--danger);"></i> Blood: <strong style="color:#fff;">${p.blood}</strong></div>
        <div><i class="fa-solid fa-phone"></i> Phone: <strong style="color:#fff;">${p.phone}</strong></div>
        <div><i class="fa-solid fa-bed"></i> Bed: <strong style="color:#38bdf8;">${p.bed}</strong></div>
        <div><i class="fa-solid fa-clock"></i> Next: <strong style="color:#fff;">${p.nextVisit}</strong></div>
      </div>

      <div class="vitals-bar">
        <span><i class="fa-solid fa-heart-pulse" style="color:#ef4444;"></i> BP: <strong>${p.vitals?.bp || "N/A"}</strong></span>
        <span><i class="fa-solid fa-wave-square" style="color:#38bdf8;"></i> Pulse: <strong>${p.vitals?.pulse || "N/A"} bpm</strong></span>
        <span><i class="fa-solid fa-lungs" style="color:#10b981;"></i> SpO2: <strong>${p.vitals?.spo2 || "N/A"}</strong></span>
      </div>

      <div style="font-size:0.9rem; margin-bottom:10px;">
        <span style="color:var(--text-muted);">Diagnosis:</span> <strong style="color:#fff;">${p.diagnosis}</strong>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <button onclick="appendRx(${p.id})" style="background:rgba(56,189,248,0.2); border:1px solid var(--primary); color:#fff; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem;">
          <i class="fa-solid fa-plus"></i> Add Rx
        </button>
        <button onclick="printSlip(${p.id})" style="background:rgba(255,255,255,0.1); border:1px solid var(--glass-border); color:#fff; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem;">
          <i class="fa-solid fa-print"></i> Print Slip
        </button>
        ${p.status !== "Recovered" ? `
          <button onclick="discharge(${p.id})" style="background:rgba(16,185,129,0.2); border:1px solid var(--success); color:var(--success); padding:5px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem;">
            <i class="fa-solid fa-check"></i> Discharge
          </button>
        ` : ""}
      </div>

      <details style="border-top:1px dashed var(--glass-border); padding-top:6px;">
        <summary style="cursor:pointer; color:var(--primary); font-size:0.8rem; font-weight:600;">
          <i class="fa-solid fa-clock-rotate-left"></i> History Records (${p.history.length})
        </summary>
        <div style="margin-top:6px;">${histHtml}</div>
      </details>
    `;
    box.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("hospital_session_role")) {
    showDashboard();
  }
});
