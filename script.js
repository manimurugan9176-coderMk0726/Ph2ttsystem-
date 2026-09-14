// =========================================================
// MediTrack Pro - Dynamic Staff Roster & Clinical Tracking
// =========================================================

let currentViewRole = "Doctor";
let nurseFilterMode = "all";

// Dynamic Clinical Staff Database in LocalStorage
const defaultDoctors = [
  "Dr. Arvind (Cardiology)",
  "Dr. Priya (General Medicine)",
  "Dr. Suresh (Orthopedics)",
  "Dr. Deepa (Pediatrics)",
  "Dr. Rajesh (Pulmonology)"
];

const defaultNurses = [
  "Nurse Anita (ICU Care)",
  "Nurse Saranya (General Ward)",
  "Nurse Kavya (Emergency)",
  "Nurse Malar (Post-Op Care)"
];

let doctorsList = JSON.parse(localStorage.getItem("meditrack_doctors")) || defaultDoctors;
let nursesList = JSON.parse(localStorage.getItem("meditrack_nurses")) || defaultNurses;

// Patient Records Database
const seedRecords = [
  {
    id: 101,
    name: "Kavitha Raj",
    age: 42,
    gender: "Female",
    blood: "B+",
    phone: "9876501234",
    bed: "Ward 3 - Bed 08",
    assignedDoctor: "Dr. Arvind (Cardiology)",
    assignedNurse: "Nurse Saranya (General Ward)",
    diagnosis: "Type 2 Diabetes Mellitus",
    vitals: { bp: "130/85", pulse: "76", spo2: "98%" },
    status: "Ongoing",
    nextVisit: "2026-09-25",
    history: [
      {
        date: "2026-09-10",
        staff: "Dr. Arvind (Cardiology)",
        rx: "Metformin 500mg BD continued.",
        notes: "FBS stable. Nurse to record vitals once per shift."
      }
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
    assignedDoctor: "Dr. Arvind (Cardiology)",
    assignedNurse: "Nurse Anita (ICU Care)",
    diagnosis: "Acute Hypertension & Angina",
    vitals: { bp: "175/115", pulse: "108", spo2: "93%" },
    status: "Critical",
    nextVisit: "2026-09-18",
    history: [
      {
        date: "2026-09-12",
        staff: "Dr. Arvind (Cardiology)",
        rx: "Emergency IV Nitroglycerin infusion running.",
        notes: "Nurse Anita to monitor every 30 mins."
      }
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
    assignedDoctor: "Dr. Suresh (Orthopedics)",
    assignedNurse: "Nurse Malar (Post-Op Care)",
    diagnosis: "Post Appendectomy",
    vitals: { bp: "118/78", pulse: "72", spo2: "99%" },
    status: "Recovered",
    nextVisit: "Discharged",
    history: [
      {
        date: "2026-09-01",
        staff: "Dr. Suresh (Orthopedics)",
        rx: "Suture line clean. Completed oral antibiotic regimen.",
        notes: "Cleared for full discharge."
      }
    ]
  }
];

let patients = JSON.parse(localStorage.getItem("clinical_patient_records")) || seedRecords;

// --- Populate Doctors & Nurses Dropdowns ---
function populateStaffDropdowns() {
  const docSelect = document.getElementById("activeDoctor");
  const nurseSelect = document.getElementById("activeNurse");
  const formNurseSelect = document.getElementById("pAssignedNurse");

  const prevDoc = docSelect.value;
  const prevNurse = nurseSelect.value;

  docSelect.innerHTML = "";
  nurseSelect.innerHTML = "";
  formNurseSelect.innerHTML = "";

  doctorsList.forEach(doc => {
    const opt = document.createElement("option");
    opt.value = doc;
    opt.innerText = doc;
    docSelect.appendChild(opt);
  });

  nursesList.forEach(nur => {
    const opt1 = document.createElement("option");
    opt1.value = nur;
    opt1.innerText = nur;
    nurseSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = nur;
    opt2.innerText = nur;
    formNurseSelect.appendChild(opt2);
  });

  if (prevDoc && doctorsList.includes(prevDoc)) docSelect.value = prevDoc;
  if (prevNurse && nursesList.includes(prevNurse)) {
    nurseSelect.value = prevNurse;
    formNurseSelect.value = prevNurse;
  }
}

// --- Modal Popup Management ---
function openStaffModal() {
  document.getElementById("staffModal").style.display = "flex";
}

function closeStaffModal() {
  document.getElementById("staffModal").style.display = "none";
}

function saveNewStaff(e) {
  e.preventDefault();
  const role = document.getElementById("newRole").value;
  const name = document.getElementById("newName").value.trim();
  const specialty = document.getElementById("newSpecialty").value.trim();

  const formattedTitle = `${name} (${specialty})`;

  if (role === "Doctor") {
    if (!doctorsList.includes(formattedTitle)) {
      doctorsList.push(formattedTitle);
      localStorage.setItem("meditrack_doctors", JSON.stringify(doctorsList));
    }
  } else {
    if (!nursesList.includes(formattedTitle)) {
      nursesList.push(formattedTitle);
      localStorage.setItem("meditrack_nurses", JSON.stringify(nursesList));
    }
  }

  populateStaffDropdowns();
  closeStaffModal();
  e.target.reset();

  if (role === "Doctor") {
    document.getElementById("activeDoctor").value = formattedTitle;
  } else {
    document.getElementById("activeNurse").value = formattedTitle;
  }

  handleDutyChange();
  alert(`${role} ${formattedTitle} added successfully to the hospital system!`);
}

// --- Duty & Filter Handlers ---
function switchRoleView(role) {
  currentViewRole = role;
  document.getElementById("btnRoleDoctor").classList.toggle("active", role === "Doctor");
  document.getElementById("btnRoleNurse").classList.toggle("active", role === "Nurse");
  render(getFilteredList());
}

function handleDutyChange() {
  checkClinicalAlerts();
  render(getFilteredList());
}

function filterByNurse(mode) {
  nurseFilterMode = mode;
  document.getElementById("filterAll").classList.toggle("active", mode === "all");
  document.getElementById("filterMine").classList.toggle("active", mode === "mine");
  render(getFilteredList());
}

// --- Real-Time Alert Engine ---
function checkClinicalAlerts() {
  const alertBar = document.getElementById("alertBar");
  const alertMsg = document.getElementById("alertMessage");

  const criticalPatients = patients.filter(p => {
    if (p.status === "Critical") return true;
    const spo2Val = parseInt(p.vitals?.spo2 || "100", 10);
    const pulseVal = parseInt(p.vitals?.pulse || "80", 10);
    return spo2Val < 94 || pulseVal > 105;
  });

  if (criticalPatients.length > 0) {
    const alertNames = criticalPatients.map(p => `${p.name} (${p.bed} - SpO2: ${p.vitals.spo2} / BP: ${p.vitals.bp})`).join(" | ");
    alertMsg.innerHTML = `<strong>EMERGENCY ALERT:</strong> Urgent attention required for: <span style="color:#fff;">${alertNames}</span>`;
    alertBar.classList.add("danger");
  } else {
    const activeDoc = document.getElementById("activeDoctor").value;
    const activeNur = document.getElementById("activeNurse").value;
    alertMsg.innerHTML = `<strong>ALL CLEAR:</strong> Vitals within stable range. Attending Doctor: <strong>${activeDoc}</strong> | Ward Nurse: <strong>${activeNur}</strong>`;
    alertBar.classList.remove("danger");
  }
}

// --- Patient CRUD Operations ---
function createPatient(e) {
  e.preventDefault();
  const attendingDoctor = document.getElementById("activeDoctor").value;
  const assignedNurse = document.getElementById("pAssignedNurse").value;

  const newPatient = {
    id: Date.now(),
    name: document.getElementById("name").value.trim(),
    age: document.getElementById("age").value,
    gender: document.getElementById("gender").value,
    blood: document.getElementById("blood").value,
    phone: document.getElementById("phone").value.trim(),
    bed: document.getElementById("bed").value.trim() || "Ward-Unallocated",
    assignedDoctor: attendingDoctor,
    assignedNurse: assignedNurse,
    vitals: {
      bp: document.getElementById("vBp").value.trim() || "120/80",
      pulse: document.getElementById("vPulse").value.trim() || "72",
      spo2: (document.getElementById("vSpo2").value.trim() || "98") + "%"
    },
    diagnosis: document.getElementById("diagnosis").value.trim(),
    status: document.getElementById("status").value,
    nextVisit: document.getElementById("date").value || "Not Scheduled",
    history: [
      {
        date: new Date().toISOString().split("T")[0],
        staff: attendingDoctor,
        rx: document.getElementById("treatment").value.trim(),
        notes: `Admitted under care of ${assignedNurse}.`
      }
    ]
  };

  patients.unshift(newPatient);
  syncData();
  e.target.reset();
  alert("Patient Admission Record Created!");
}

function appendRx(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;

  const staff = currentViewRole === "Doctor" 
    ? document.getElementById("activeDoctor").value 
    : document.getElementById("activeNurse").value;

  const newRx = prompt(`Enter Medication / Treatment Order for ${p.name}:`);
  if (!newRx || !newRx.trim()) return;

  const notes = prompt("Enter Clinical Progress Notes:") || "Routine observation check";
  
  p.history.unshift({
    date: new Date().toISOString().split("T")[0],
    staff: staff,
    rx: newRx.trim(),
    notes: notes.trim()
  });

  syncData();
}

function updateVitalsPrompt(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;

  const newBp = prompt(`Update BP for ${p.name} (Current: ${p.vitals.bp}):`, p.vitals.bp);
  const newPulse = prompt(`Update Pulse bpm for ${p.name} (Current: ${p.vitals.pulse}):`, p.vitals.pulse);
  const newSpo2 = prompt(`Update SpO2 % for ${p.name} (Current: ${p.vitals.spo2}):`, p.vitals.spo2);

  if (newBp) p.vitals.bp = newBp.trim();
  if (newPulse) p.vitals.pulse = newPulse.trim();
  if (newSpo2) p.vitals.spo2 = (newSpo2.includes("%") ? newSpo2.trim() : newSpo2.trim() + "%");

  syncData();
}

function discharge(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;

  const doctor = document.getElementById("activeDoctor").value;

  if (confirm(`Confirm clinical discharge for ${p.name}?`)) {
    p.status = "Recovered";
    p.bed = "Discharged";
    p.nextVisit = "Discharged";
    p.history.unshift({
      date: new Date().toISOString().split("T")[0],
      staff: doctor,
      rx: "Discharged. Discharge medicines & instructions given.",
      notes: "Condition stable on discharge."
    });
    syncData();
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
        <title>Prescription Slip - ${p.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
          .hdr { border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; }
          .hdr h2 { margin: 0; color: #0d9488; }
          .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .info-table td { padding: 6px 0; font-size: 14px; }
          .rx-box { border: 1px solid #99f6e4; padding: 18px; border-radius: 8px; margin: 20px 0; background: #f0fdfa; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <h2>🩺 MediTrack Pro - City Care Multi-Speciality Hospital</h2>
          <p style="margin: 4px 0 0; color: #64748b;">Clinical Inpatient Chart & Medication Sheet</p>
        </div>
        <table class="info-table">
          <tr>
            <td><strong>Patient:</strong> ${p.name}</td>
            <td><strong>Age/Gender:</strong> ${p.age}y / ${p.gender}</td>
            <td><strong>Blood Group:</strong> ${p.blood}</td>
          </tr>
          <tr>
            <td><strong>Ward / Bed:</strong> ${p.bed}</td>
            <td><strong>Contact:</strong> ${p.phone}</td>
            <td><strong>Status:</strong> ${p.status}</td>
          </tr>
          <tr>
            <td><strong>Primary Doctor:</strong> ${p.assignedDoctor}</td>
            <td colspan="2"><strong>Assigned Nurse:</strong> ${p.assignedNurse}</td>
          </tr>
          <tr>
            <td colspan="3"><strong>Diagnosis:</strong> ${p.diagnosis}</td>
          </tr>
          <tr>
            <td colspan="3"><strong>Recorded Vitals:</strong> BP: ${p.vitals?.bp || "N/A"} | Pulse: ${p.vitals?.pulse || "N/A"} bpm | SpO2: ${p.vitals?.spo2 || "N/A"}</td>
          </tr>
        </table>
        <div class="rx-box">
          <h3 style="margin-top: 0; color: #0f172a;">℞ Prescription & Doctor Orders</h3>
          <p><strong>Attending Clinician:</strong> ${latest.staff} (${latest.date})</p>
          <p><strong>Medications:</strong><br>${latest.rx}</p>
          <p><strong>Clinical Notes:</strong> ${latest.notes}</p>
        </div>
        <div class="footer">
          <div>Next Follow-up: ${p.nextVisit}</div>
          <div>Doctor's Signature: _______________________</div>
        </div>
        <script>window.onload = function() { window.print(); };<\/script>
      </body>
    </html>
  `);
  win.document.close();
}

function deletePatient(id) {
  if (currentViewRole !== "Doctor") {
    alert("Permission Denied: Only Doctors can delete clinical records!");
    return;
  }
  if (confirm("Are you sure you want to delete this patient file?")) {
    patients = patients.filter(item => item.id !== id);
    syncData();
  }
}

function getFilteredList() {
  const q = (document.getElementById("search")?.value || "").toLowerCase();
  const activeNurse = document.getElementById("activeNurse").value;

  return patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(q) ||
      p.diagnosis.toLowerCase().includes(q) ||
      p.bed.toLowerCase().includes(q) ||
      p.assignedNurse.toLowerCase().includes(q) ||
      p.assignedDoctor.toLowerCase().includes(q);

    if (nurseFilterMode === "mine") {
      return matchSearch && (p.assignedNurse === activeNurse);
    }
    return matchSearch;
  });
}

function filterData() {
  render(getFilteredList());
}

function syncData() {
  localStorage.setItem("clinical_patient_records", JSON.stringify(patients));
  refresh();
}

function refresh() {
  document.getElementById("cTotal").innerText = patients.length;
  document.getElementById("cActive").innerText = patients.filter(p => p.status === "Ongoing").length;
  document.getElementById("cCritical").innerText = patients.filter(p => p.status === "Critical").length;
  document.getElementById("cDischarged").innerText = patients.filter(p => p.status === "Recovered").length;

  checkClinicalAlerts();
  render(getFilteredList());
}

// --- Render Cards ---
function render(list) {
  const box = document.getElementById("patientList");
  if (!box) return;

  box.innerHTML = "";

  if (list.length === 0) {
    box.innerHTML = '<div style="text-align:center; padding:35px; color:var(--text-muted);">No matching clinical files found in this view.</div>';
    return;
  }

  list.forEach(p => {
    let sc = "ongoing";
    if (p.status === "Critical") sc = "critical";
    if (p.status === "Recovered") sc = "recovered";

    const delBtn = currentViewRole === "Doctor" 
      ? `<button class="btn-del" title="Doctor Delete Authorization" onclick="deletePatient(${p.id})"><i class="fa-solid fa-trash-can"></i></button>`
      : "";

    let histHtml = "";
    p.history.forEach((h, i) => {
      histHtml += `
        <div style="padding:8px; margin-top:6px; background:rgba(6,20,19,0.9); border-radius:6px; border-left:3px solid var(--primary); font-size:0.85rem;">
          <div style="display:flex; justify-content:space-between; color:#ccfbf1; font-weight:600; font-size:0.8rem;">
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
        <h4 style="color:#fff; font-size:1.15rem;">
          <i class="fa-solid fa-circle-user" style="color:var(--primary); margin-right:6px;"></i>
          ${p.name} <span style="font-size:0.82rem; color:var(--text-muted);">(${p.age}y, ${p.gender})</span>
        </h4>
        <span class="badge ${sc}">${p.status}</span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.85rem; color:var(--text-muted);">
        <div><i class="fa-solid fa-droplet" style="color:var(--danger);"></i> Blood: <strong style="color:#fff;">${p.blood}</strong></div>
        <div><i class="fa-solid fa-phone"></i> Phone: <strong style="color:#fff;">${p.phone}</strong></div>
        <div><i class="fa-solid fa-bed"></i> Bed: <strong style="color:var(--primary);">${p.bed}</strong></div>
        <div><i class="fa-solid fa-clock"></i> Next: <strong style="color:#fff;">${p.nextVisit}</strong></div>
      </div>

      <div class="care-team-bar">
        <span><i class="fa-solid fa-user-doctor" style="color:var(--mint-accent);"></i> Doctor: <strong>${p.assignedDoctor || "Unassigned"}</strong></span>
        <span><i class="fa-solid fa-user-nurse" style="color:var(--nurse-accent);"></i> Nurse: <strong>${p.assignedNurse || "Unassigned"}</strong></span>
      </div>

      <div class="vitals-bar">
        <span><i class="fa-solid fa-heart-pulse" style="color:#fb7185;"></i> BP: <strong>${p.vitals?.bp || "N/A"}</strong></span>
        <span><i class="fa-solid fa-wave-square" style="color:var(--primary);"></i> Pulse: <strong>${p.vitals?.pulse || "N/A"} bpm</strong></span>
        <span><i class="fa-solid fa-lungs" style="color:#34d399;"></i> SpO2: <strong>${p.vitals?.spo2 || "N/A"}</strong></span>
        <button onclick="updateVitalsPrompt(${p.id})" style="margin-left:auto; background:none; border:none; color:var(--primary); cursor:pointer; font-size:0.75rem; text-decoration:underline;">Update Vitals</button>
      </div>

      <div style="font-size:0.9rem; margin-bottom:10px;">
        <span style="color:var(--text-muted);">Diagnosis:</span> <strong style="color:#fff;">${p.diagnosis}</strong>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <button onclick="appendRx(${p.id})" style="background:rgba(45,212,191,0.15); border:1px solid var(--primary); color:#fff; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:0.82rem;">
          <i class="fa-solid fa-plus"></i> Add Rx / Order
        </button>
        <button onclick="printSlip(${p.id})" style="background:rgba(255,255,255,0.08); border:1px solid var(--glass-border); color:#fff; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:0.82rem;">
          <i class="fa-solid fa-print"></i> Print Slip
        </button>
        ${p.status !== "Recovered" ? `
          <button onclick="discharge(${p.id})" style="background:rgba(16,185,129,0.2); border:1px solid var(--success); color:var(--success); padding:6px 12px; border-radius:8px; cursor:pointer; font-size:0.82rem;">
            <i class="fa-solid fa-check"></i> Discharge
          </button>
        ` : ""}
      </div>

      <details style="border-top:1px dashed var(--glass-border); padding-top:6px;">
        <summary style="cursor:pointer; color:var(--primary); font-size:0.82rem; font-weight:600;">
          <i class="fa-solid fa-clock-rotate-left"></i> Treatment & Care History (${p.history.length})
        </summary>
        <div style="margin-top:6px;">${histHtml}</div>
      </details>
    `;
    box.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  populateStaffDropdowns();
  refresh();
  setInterval(checkClinicalAlerts, 20000);
});
