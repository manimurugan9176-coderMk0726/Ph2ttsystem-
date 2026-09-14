// =========================================================
// MediTrack Pro - Core Engine (Immediate Fail-Safe Engine)
// =========================================================
let currentViewRole = "Doctor";
let activeFilter = "all";
let activeDeptView = "ward";
let pharmaFilter = "pending";
let activePayingPatientId = null;

// Cross-Floor Broadcaster
let hospitalChannel = null;
try {
  if ('BroadcastChannel' in window) {
    hospitalChannel = new BroadcastChannel('meditrack_hospital_sync');
    hospitalChannel.onmessage = (event) => {
      if (event.data && event.data.action === "update") {
        loadDataFromStorage();
        refresh(false);
      }
    };
  }
} catch (e) {
  console.log("BroadcastChannel not supported", e);
}

window.addEventListener('storage', (e) => {
  if (e.key === "clinical_patient_records") {
    loadDataFromStorage();
    refresh(false);
  }
});

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
    pharmaStatus: "Pending",
    billAmount: 1850,
    billStatus: "Unpaid",
    rxTime: "Today 09:30 AM",
    history: [
      { date: "2026-09-10", staff: "Dr. Arvind (Cardiology)", rx: "Tab Metformin 500mg BD, Tab Glimepiride 1mg OD.", notes: "FBS stable. Keep daily sugar log." }
    ]
  },
  {
    id: 102,
    name: "Murugan S",
    age: 58,
    gender: "Male",
    blood: "O+",
    phone: "9840123456",
    bed: "Floor 2 - ICU 02",
    assignedDoctor: "Dr. Arvind (Cardiology)",
    assignedNurse: "Nurse Anita (ICU Care)",
    diagnosis: "Acute Hypertension & Angina",
    vitals: { bp: "175/115", pulse: "108", spo2: "93%" },
    status: "Critical",
    nextVisit: "2026-09-18",
    pharmaStatus: "Pending",
    billAmount: 5600,
    billStatus: "Unpaid",
    rxTime: "Today 10:15 AM",
    history: [
      { date: "2026-09-12", staff: "Dr. Arvind (Cardiology)", rx: "Inj Nitroglycerin IV infusion 5mcg/min, Tab Amlodipine 5mg.", notes: "Nurse Anita to monitor vitals every 30 mins." }
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
    pharmaStatus: "Dispensed",
    billAmount: 12400,
    billStatus: "Paid",
    rxTime: "Yesterday",
    history: [
      { date: "2026-09-01", staff: "Dr. Suresh (Orthopedics)", rx: "Tab Cefixime 200mg BD, Tab Paracetamol 650mg TDS.", notes: "Cleared for full discharge." }
    ]
  }
];

let doctorsList = [];
let nursesList = [];
let patients = [];

function loadDataFromStorage() {
  try {
    const sDoc = JSON.parse(localStorage.getItem("meditrack_doctors") || "null");
    doctorsList = (Array.isArray(sDoc) && sDoc.length > 0) ? sDoc : defaultDoctors.slice();

    const sNur = JSON.parse(localStorage.getItem("meditrack_nurses") || "null");
    nursesList = (Array.isArray(sNur) && sNur.length > 0) ? sNur : defaultNurses.slice();

    const sPat = JSON.parse(localStorage.getItem("clinical_patient_records") || "null");
    patients = (Array.isArray(sPat) && sPat.length > 0) ? sPat : seedRecords.slice();
  } catch (err) {
    doctorsList = defaultDoctors.slice();
    nursesList = defaultNurses.slice();
    patients = seedRecords.slice();
  }
}

// Initial Load
loadDataFromStorage();

function populateStaffDropdowns() {
  const docSelect = document.getElementById("activeDoctor");
  const nurseSelect = document.getElementById("activeNurse");
  const formNurseSelect = document.getElementById("pAssignedNurse");

  if (!docSelect || !nurseSelect) return;

  const prevDoc = docSelect.value;
  const prevNurse = nurseSelect.value;

  docSelect.innerHTML = "";
  nurseSelect.innerHTML = "";
  if (formNurseSelect) formNurseSelect.innerHTML = "";

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

    if (formNurseSelect) {
      const opt2 = document.createElement("option");
      opt2.value = nur;
      opt2.innerText = nur;
      formNurseSelect.appendChild(opt2);
    }
  });

  if (prevDoc && doctorsList.includes(prevDoc)) docSelect.value = prevDoc;
  if (prevNurse && nursesList.includes(prevNurse)) {
    nurseSelect.value = prevNurse;
    if (formNurseSelect) formNurseSelect.value = prevNurse;
  }
}

function switchDepartmentView(view) {
  activeDeptView = view;
  const wardSec = document.getElementById("wardSection");
  const pharmaSec = document.getElementById("pharmacySection");
  const patientSec = document.getElementById("patientPortalSection");
  const dutyGroup = document.getElementById("dutyControlsGroup");

  const tabWard = document.getElementById("tabWardView");
  const tabPharma = document.getElementById("tabPharmaView");
  const tabPatient = document.getElementById("tabPatientView");

  if (tabWard) tabWard.classList.toggle("active", view === "ward");
  if (tabPharma) tabPharma.classList.toggle("active", view === "pharmacy");
  if (tabPatient) tabPatient.classList.toggle("active", view === "patient");

  if (view === "pharmacy") {
    if (wardSec) wardSec.style.display = "none";
    if (pharmaSec) pharmaSec.style.display = "block";
    if (patientSec) patientSec.style.display = "none";
    if (dutyGroup) dutyGroup.style.display = "flex";
    renderPharmacyQueue();
  } else if (view === "patient") {
    if (wardSec) wardSec.style.display = "none";
    if (pharmaSec) pharmaSec.style.display = "none";
    if (patientSec) patientSec.style.display = "block";
    if (dutyGroup) dutyGroup.style.display = "none";
    lookupPatientRecord();
  } else {
    if (wardSec) wardSec.style.display = "grid";
    if (pharmaSec) pharmaSec.style.display = "none";
    if (patientSec) patientSec.style.display = "none";
    if (dutyGroup) dutyGroup.style.display = "flex";
    render(getFilteredList());
  }
}

function setPharmaQueueFilter(filter) {
  pharmaFilter = filter;
  const pPending = document.getElementById("pharmaFilterPending");
  const pDispensed = document.getElementById("pharmaFilterDispensed");
  const pAll = document.getElementById("pharmaFilterAll");
  if (pPending) pPending.classList.toggle("active", filter === "pending");
  if (pDispensed) pDispensed.classList.toggle("active", filter === "dispensed");
  if (pAll) pAll.classList.toggle("active", filter === "all");
  renderPharmacyQueue();
}

function openStaffModal() { 
  const m = document.getElementById("staffModal");
  if (m) m.style.display = "flex"; 
}

function closeStaffModal() { 
  const m = document.getElementById("staffModal");
  if (m) m.style.display = "none"; 
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

  if (role === "Doctor") document.getElementById("activeDoctor").value = formattedTitle;
  else document.getElementById("activeNurse").value = formattedTitle;

  handleDutyChange();
  alert(`${role} ${formattedTitle} added successfully!`);
}

function switchRoleView(role) {
  currentViewRole = role;
  const docBtn = document.getElementById("btnRoleDoctor");
  const nurseBtn = document.getElementById("btnRoleNurse");
  if (docBtn) docBtn.classList.toggle("active", role === "Doctor");
  if (nurseBtn) nurseBtn.classList.toggle("active", role === "Nurse");
  render(getFilteredList());
}

function handleDutyChange() {
  checkClinicalAlerts();
  render(getFilteredList());
}

function setRosterFilter(filter) {
  activeFilter = filter;
  const fAll = document.getElementById("fAll");
  const fMine = document.getElementById("fMine");
  const fIcu = document.getElementById("fIcu");
  const fUnpaid = document.getElementById("fUnpaid");
  if (fAll) fAll.classList.toggle("active", filter === "all");
  if (fMine) fMine.classList.toggle("active", filter === "mine");
  if (fIcu) fIcu.classList.toggle("active", filter === "icu");
  if (fUnpaid) fUnpaid.classList.toggle("active", filter === "unpaid");
  render(getFilteredList());
}

function checkClinicalAlerts() {
  const alertBar = document.getElementById("alertBar");
  const alertMsg = document.getElementById("alertMessage");
  if (!alertMsg) return;

  const criticalPatients = patients.filter(p => {
    if (p.status === "Critical") return true;
    const spo2Val = parseInt(p.vitals?.spo2 || "100", 10);
    const pulseVal = parseInt(p.vitals?.pulse || "80", 10);
    return spo2Val < 94 || pulseVal > 105;
  });

  const pendingPharma = patients.filter(p => p.pharmaStatus === "Pending");

  if (criticalPatients.length > 0) {
    const alertNames = criticalPatients.map(p => `${p.name} (${p.bed})`).join(", ");
    alertMsg.innerHTML = `<strong>EMERGENCY ALERT:</strong> Critical Vitals for: <span style="color:#fff;">${alertNames}</span>`;
    if (alertBar) alertBar.classList.add("danger");
  } else if (pendingPharma.length > 0) {
    alertMsg.innerHTML = `<strong>PHARMACY QUEUE:</strong> ${pendingPharma.length} patient prescriptions waiting at Ground Floor.`;
    if (alertBar) alertBar.classList.remove("danger");
  } else {
    alertMsg.innerHTML = `<strong>ALL CLEAR:</strong> Inpatient floor, pharmacy queue and online billing operational.`;
    if (alertBar) alertBar.classList.remove("danger");
  }
}

function createPatient(e) {
  e.preventDefault();
  const docElem = document.getElementById("activeDoctor");
  const nurseElem = document.getElementById("pAssignedNurse");
  const attendingDoctor = docElem ? docElem.value : "Attending Doctor";
  const assignedNurse = nurseElem ? nurseElem.value : "Staff Nurse";
  const rawTreatment = document.getElementById("treatment").value.trim();
  const billAmountVal = parseFloat(document.getElementById("pBillAmount")?.value) || 0;
  const billStatusVal = document.getElementById("pBillStatus")?.value || "Unpaid";

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
    pharmaStatus: "Pending",
    billAmount: billAmountVal,
    billStatus: billStatusVal,
    rxTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    history: [
      {
        date: new Date().toISOString().split("T")[0],
        staff: attendingDoctor,
        rx: rawTreatment,
        notes: `Admitted by ${assignedNurse}. Bill: ₹${billAmountVal}.`
      }
    ]
  };

  patients.unshift(newPatient);
  syncData();
  e.target.reset();
  alert(`✅ Patient Admission Complete!\n• Sent to Pharmacy Queue\n• Bill: ₹${billAmountVal}`);
}

function appendRx(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;

  const docElem = document.getElementById("activeDoctor");
  const nurseElem = document.getElementById("activeNurse");
  const staff = currentViewRole === "Doctor" ? (docElem ? docElem.value : "Doctor") : (nurseElem ? nurseElem.value : "Nurse");
  const newRx = prompt(`Enter New Prescription / Medicine for ${p.name}:`);
  if (!newRx || !newRx.trim()) return;

  p.history.unshift({
    date: new Date().toISOString().split("T")[0],
    staff: staff,
    rx: newRx.trim(),
    notes: "Prescription update."
  });

  p.pharmaStatus = "Pending";
  p.rxTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  syncData();
  alert(`✅ Prescription updated & routed to Ground Floor Pharmacy!`);
}

function markAsDispensed(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;

  if (confirm(`Pharmacist: Confirm medicines handed over for ${p.name}?`)) {
    p.pharmaStatus = "Dispensed";
    p.history.unshift({
      date: new Date().toISOString().split("T")[0],
      staff: "Ground Floor Pharmacy Counter",
      rx: "MEDICINES DISPENSED TO PATIENT / ATTENDER",
      notes: `Handed over at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
    });
    syncData();
  }
}

function openOnlinePaymentModal(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;

  activePayingPatientId = id;
  const payAmtElem = document.getElementById("modalPayAmount");
  const patInfoElem = document.getElementById("modalPatientInfo");
  if (payAmtElem) payAmtElem.innerText = `₹${(p.billAmount || 0).toLocaleString('en-IN')}`;
  if (patInfoElem) patInfoElem.innerText = `Patient: ${p.name} | Bed: ${p.bed} | Phone: ${p.phone}`;

  const upiId = "hospitalcare@upi"; 
  const payeeName = "City Care Hospital";
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${p.billAmount}&cu=INR&tn=${encodeURIComponent('Hospital Bill ' + p.name)}`;

  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  const qrImg = document.getElementById("upiQrImage");
  if (qrImg) qrImg.src = qrApi;

  const pModal = document.getElementById("paymentModal");
  if (pModal) pModal.style.display = "flex";
}

function closePaymentModal() {
  const pModal = document.getElementById("paymentModal");
  if (pModal) pModal.style.display = "none";
  activePayingPatientId = null;
}

function confirmOnlinePayment() {
  if (!activePayingPatientId) return;
  const p = patients.find(item => item.id === activePayingPatientId);
  if (!p) return;

  p.billStatus = "Paid";
  p.history.unshift({
    date: new Date().toISOString().split("T")[0],
    staff: "Online Patient Payment Gateway",
    rx: `HOSPITAL BILL PAID ONLINE (₹${p.billAmount})`,
    notes: `Paid via UPI QR at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
  });

  syncData();
  closePaymentModal();
  alert(`🎉 Payment Verified! Bill for ${p.name} marked as PAID.`);
  if (activeDeptView === "patient") lookupPatientRecord();
}

function lookupPatientRecord() {
  const inputElem = document.getElementById("patientLookupInput");
  const query = (inputElem ? inputElem.value : "").trim().toLowerCase();
  const container = document.getElementById("patientLookupResult");
  if (!container) return;

  container.innerHTML = "";

  let matched = patients;
  if (query) {
    matched = patients.filter(p => p.phone.includes(query) || p.name.toLowerCase().includes(query));
  }

  if (matched.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">No records found matching this mobile number or name.</div>';
    return;
  }

  matched.forEach(p => {
    const latestRx = p.history.find(h => h.rx && !h.rx.includes("DISPENSED") && !h.rx.includes("PAID")) || p.history[0] || { rx: "N/A" };
    const isPaid = p.billStatus === "Paid";

    const div = document.createElement("div");
    div.className = "patient-card";
    div.style.borderColor = isPaid ? "var(--success)" : "var(--patient-accent)";
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <h3 style="color:#fff; font-size:1.3rem;">
          <i class="fa-solid fa-hospital-user" style="color:var(--patient-accent); margin-right:6px;"></i>
          ${p.name} <span style="font-size:0.85rem; color:var(--text-muted);">(${p.age}y, ${p.gender})</span>
        </h3>
        <span class="badge-bill ${isPaid ? 'paid' : 'unpaid'}">
          ${isPaid ? 'Hospital Bill: PAID' : 'Bill: PAYMENT PENDING'}
        </span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;">
        <div><strong>Location:</strong> <span style="color:var(--primary);">${p.bed}</span></div>
        <div><strong>Doctor:</strong> ${p.assignedDoctor}</div>
      </div>

      <div class="bill-highlight-box" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="font-size:0.8rem; color:var(--text-muted);">Hospital Inpatient Bill:</div>
          <div style="font-size:1.6rem; font-weight:800; color:#fff; font-family:var(--font-mono);">
            ₹${(p.billAmount || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          ${!isPaid ? `
            <button type="button" class="btn-act pay" style="font-size:0.95rem; padding:8px 18px;" onclick="openOnlinePaymentModal(${p.id})">
              <i class="fa-solid fa-qrcode"></i> Pay Bill Online (UPI)
            </button>
          ` : `
            <button type="button" class="btn-act" style="color:var(--success); border-color:var(--success);" onclick="printBillReceipt(${p.id})">
              <i class="fa-solid fa-receipt"></i> Print Paid Receipt
            </button>
          `}
        </div>
      </div>

      <div class="pharma-rx-box">
        <div style="color:var(--pharmacy-accent); font-weight:bold; font-size:0.85rem; margin-bottom:4px;">
          <i class="fa-solid fa-pills"></i> Doctor Prescribed Medicines:
        </div>
        <div style="color:#fff; font-size:0.95rem; font-weight:600; white-space:pre-line;">
          ${latestRx.rx}
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function printBillReceipt(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Hospital Bill Receipt - ${p.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
          .hdr { border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; }
          .receipt-badge { background: #dcfce7; color: #15803d; border: 1px solid #15803d; padding: 4px 12px; font-weight: bold; border-radius: 4px; display: inline-block; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
          th { background: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <h2>🩺 City Care Multi-Speciality Hospital</h2>
          <p>Official Patient Bill Receipt</p>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>Receipt:</strong> REC-${p.id}<br>
            <strong>Patient:</strong> ${p.name}<br>
            <strong>Ward / Bed:</strong> ${p.bed}
          </div>
          <div><span class="receipt-badge">PAID ONLINE</span></div>
        </div>
        <table>
          <tr><th>Description</th><th>Amount</th></tr>
          <tr><td>Inpatient Care, Nursing & Doctor Charges</td><td>₹${(p.billAmount || 0).toLocaleString('en-IN')}</td></tr>
          <tr><th>Total Amount:</th><th>₹${(p.billAmount || 0).toLocaleString('en-IN')}</th></tr>
        </table>
        <script>window.onload = function() { window.print(); };<\/script>
      </body>
    </html>
  `);
  win.document.close();
}

function exportDataToCSV() {
  if (patients.length === 0) return alert("No patient data available.");

  let csvContent = "data:text/csv;charset=utf-8,ID,Name,Age,Gender,Blood,Phone,Bed,Doctor,Nurse,Diagnosis,BP,Pulse,SpO2,BillAmount,BillStatus\n";

  patients.forEach(p => {
    csvContent += [
      p.id, `"${p.name}"`, p.age, p.gender, p.blood, `"${p.phone}"`, `"${p.bed}"`,
      `"${p.assignedDoctor}"`, `"${p.assignedNurse}"`, `"${p.diagnosis}"`,
      `"${p.vitals.bp}"`, `"${p.vitals.pulse}"`, `"${p.vitals.spo2}"`,
      p.billAmount, p.billStatus
    ].join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `MediTrack_Records_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printSlip(id) {
  const p = patients.find(item => item.id === id);
  if (!p) return;

  const latest = p.history.find(h => h.rx && !h.rx.includes("DISPENSED") && !h.rx.includes("PAID")) || p.history[0] || { rx: "N/A" };
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Prescription Slip - ${p.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
          .hdr { border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px; }
          .rx-box { border: 1px solid #99f6e4; padding: 18px; border-radius: 8px; margin: 20px 0; background: #f0fdfa; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <h2>🩺 City Care Multi-Speciality Hospital</h2>
          <p>Prescription Sheet</p>
        </div>
        <p><strong>Patient:</strong> ${p.name} | <strong>Location:</strong> ${p.bed} | <strong>Doctor:</strong> ${p.assignedDoctor}</p>
        <div class="rx-box">
          <h3>℞ Prescribed Medications:</h3>
          <p style="font-size:16px; font-weight:bold; color:#0f766e; white-space:pre-line;">${latest.rx}</p>
        </div>
        <script>window.onload = function() { window.print(); };<\/script>
      </body>
    </html>
  `);
  win.document.close();
}

function deletePatient(id) {
  if (currentViewRole !== "Doctor") return alert("Permission Denied: Only Doctors can delete records!");
  if (confirm("Delete this patient record?")) {
    patients = patients.filter(item => item.id !== id);
    syncData();
  }
}

function getFilteredList() {
  const searchInput = document.getElementById("search");
  const q = (searchInput ? searchInput.value : "").toLowerCase();
  const nurseSelect = document.getElementById("activeNurse");
  const activeNurse = nurseSelect ? nurseSelect.value : "";

  return patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(q) ||
      p.diagnosis.toLowerCase().includes(q) ||
      p.bed.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.assignedNurse.toLowerCase().includes(q) ||
      p.assignedDoctor.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (activeFilter === "mine") return p.assignedNurse === activeNurse;
    if (activeFilter === "icu") return p.bed.toLowerCase().includes("icu");
    if (activeFilter === "unpaid") return p.billStatus === "Unpaid";

    return true;
  });
}

function filterData() { render(getFilteredList()); }

function syncData() {
  localStorage.setItem("clinical_patient_records", JSON.stringify(patients));
  if (hospitalChannel) {
    try { hospitalChannel.postMessage({ action: "update" }); } catch(e){}
  }
  refresh(true);
}

function refresh(shouldCheck = true) {
  const pendingCount = patients.filter(p => p.pharmaStatus === "Pending").length;
  const unpaidBills = patients.filter(p => p.billStatus === "Unpaid").length;

  const cTotal = document.getElementById("cTotal");
  const cActive = document.getElementById("cActive");
  const cPharma = document.getElementById("cPharmaPending");
  const pCount1 = document.getElementById("pharmaPendingCount");
  const pCount2 = document.getElementById("pharmaTabPendingCount");
  const cBills = document.getElementById("cBillsUnpaid");
  const cDisc = document.getElementById("cDischarged");

  if (cTotal) cTotal.innerText = patients.length;
  if (cActive) cActive.innerText = patients.filter(p => p.status === "Ongoing").length;
  if (cPharma) cPharma.innerText = pendingCount;
  if (pCount1) pCount1.innerText = pendingCount;
  if (pCount2) pCount2.innerText = pendingCount;
  if (cBills) cBills.innerText = unpaidBills;
  if (cDisc) cDisc.innerText = patients.filter(p => p.status === "Recovered").length;

  if (shouldCheck) checkClinicalAlerts();

  if (activeDeptView === "pharmacy") {
    renderPharmacyQueue();
  } else if (activeDeptView === "patient") {
    lookupPatientRecord();
  } else {
    render(getFilteredList());
  }
}

function render(list) {
  const box = document.getElementById("patientList");
  if (!box) return;

  box.innerHTML = "";

  if (!list || list.length === 0) {
    box.innerHTML = '<div style="text-align:center; padding:35px; color:var(--text-muted);">No clinical records found.</div>';
    return;
  }

  list.forEach(p => {
    let sc = "ongoing";
    if (p.status === "Critical") sc = "critical";
    if (p.status === "Recovered") sc = "recovered";

    const delBtn = currentViewRole === "Doctor" 
      ? `<button class="btn-del" title="Delete Record" onclick="deletePatient(${p.id})"><i class="fa-solid fa-trash-can"></i></button>`
      : "";

    const spo2Num = parseInt(p.vitals?.spo2 || "100", 10);
    const pulseNum = parseInt(p.vitals?.pulse || "80", 10);
    const spo2Class = spo2Num < 94 ? "danger" : "normal";
    const pulseClass = (pulseNum > 105 || pulseNum < 55) ? "danger" : "normal";

    const pharmaBadge = p.pharmaStatus === "Pending"
      ? `<span class="badge-pharma pending"><i class="fa-solid fa-clock"></i> Pharmacy: Pending</span>`
      : `<span class="badge-pharma ready"><i class="fa-solid fa-check-circle"></i> Pharmacy: Dispensed</span>`;

    const billBadge = p.billStatus === "Paid"
      ? `<span class="badge-bill paid"><i class="fa-solid fa-check-double"></i> Bill: Paid (₹${p.billAmount})</span>`
      : `<span class="badge-bill unpaid"><i class="fa-solid fa-triangle-exclamation"></i> Bill: Unpaid (₹${p.billAmount})</span>`;

    let histHtml = "";
    p.history.forEach((h, i) => {
      histHtml += `
        <div style="padding:8px; margin-top:6px; background:rgba(6,20,19,0.9); border-radius:6px; border-left:3px solid var(--primary); font-size:0.85rem;">
          <div style="display:flex; justify-content:space-between; color:#ccfbf1; font-weight:600; font-size:0.8rem;">
            <span>${h.date} (${h.staff})</span>
            <span style="color:var(--primary);">#${p.history.length - i}</span>
          </div>
          <div style="margin-top:4px; color:#fff;">${h.rx}</div>
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
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          ${billBadge}
          ${pharmaBadge}
          <span class="badge ${sc}">${p.status}</span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.85rem; color:var(--text-muted);">
        <div><i class="fa-solid fa-droplet" style="color:var(--danger);"></i> Blood: <strong style="color:#fff;">${p.blood}</strong></div>
        <div><i class="fa-solid fa-phone"></i> Phone: <strong style="color:#fff;">${p.phone}</strong></div>
        <div><i class="fa-solid fa-bed"></i> Bed: <strong style="color:var(--primary);">${p.bed}</strong></div>
        <div><i class="fa-solid fa-clock"></i> Next: <strong style="color:#fff;">${p.nextVisit}</strong></div>
      </div>

      <div class="care-team-bar">
        <span>Doctor: <strong>${p.assignedDoctor || "Unassigned"}</strong></span>
        <span>Nurse: <strong>${p.assignedNurse || "Unassigned"}</strong></span>
      </div>

      <div class="vitals-bar">
        <span>BP: <strong>${p.vitals?.bp || "N/A"}</strong></span>
        <span>Pulse: <span class="vital-pill ${pulseClass}">${p.vitals?.pulse || "N/A"} bpm</span></span>
        <span>SpO2: <span class="vital-pill ${spo2Class}">${p.vitals?.spo2 || "N/A"}</span></span>
      </div>

      <div class="action-btn-row">
        <button class="btn-act rx" onclick="appendRx(${p.id})"><i class="fa-solid fa-plus"></i> Add Rx</button>
        <button class="btn-act pay" onclick="openOnlinePaymentModal(${p.id})"><i class="fa-solid fa-qrcode"></i> Pay Bill</button>
        <button class="btn-act" onclick="printSlip(${p.id})"><i class="fa-solid fa-print"></i> Slip</button>
      </div>
    `;
    box.appendChild(card);
  });
}

function renderPharmacyQueue() {
  const box = document.getElementById("pharmacyQueueList");
  if (!box) return;

  box.innerHTML = "";
  const searchInput = document.getElementById("pharmaSearch");
  const q = (searchInput ? searchInput.value : "").toLowerCase();

  let queueList = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.bed.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (pharmaFilter === "pending") return p.pharmaStatus === "Pending";
    if (pharmaFilter === "dispensed") return p.pharmaStatus === "Dispensed";
    return true;
  });

  if (queueList.length === 0) {
    box.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">No prescriptions in this queue.</div>';
    return;
  }

  queueList.forEach(p => {
    const latestRxEntry = p.history.find(h => h.rx && !h.rx.includes("DISPENSED") && !h.rx.includes("PAID")) || p.history[0] || { rx: "No medications specified." };
    const isPending = p.pharmaStatus === "Pending";

    const card = document.createElement("div");
    card.className = `patient-card`;
    card.style.borderLeftColor = isPending ? "var(--warning)" : "var(--success)";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div>
          <h3 style="color:#fff; font-size:1.2rem;">${p.name} <span style="font-size:0.85rem; color:var(--text-muted);">(${p.bed})</span></h3>
          <div style="font-size:0.85rem; color:var(--text-dim);">Phone: ${p.phone} | Doctor: ${p.assignedDoctor}</div>
        </div>
        <span class="badge-pharma ${isPending ? 'pending' : 'ready'}">
          ${isPending ? 'Dispense Pending' : 'Dispensed'}
        </span>
      </div>

      <div class="pharma-rx-box">
        <div style="color:var(--pharmacy-accent); font-weight:bold; font-size:0.85rem;">℞ Prescribed Medicines:</div>
        <div style="font-size:1rem; color:#fff; font-weight:600; white-space:pre-line; padding:4px 0;">${latestRxEntry.rx}</div>
      </div>

      <div class="action-btn-row">
        ${isPending ? `
          <button class="btn-act pharma-dispense" onclick="markAsDispensed(${p.id})">
            <i class="fa-solid fa-hand-holding-medical"></i> Hand Over Medicines
          </button>
        ` : `
          <button class="btn-act" style="color:var(--success);" onclick="markAsDispensed(${p.id})">
            <i class="fa-solid fa-rotate-left"></i> Re-verify
          </button>
        `}
        <button class="btn-act" onclick="printSlip(${p.id})"><i class="fa-solid fa-print"></i> Print Slip</button>
      </div>
    `;
    box.appendChild(card);
  });
}

// Immediate Fail-Safe Bootstrapper
function bootSystem() {
  loadDataFromStorage();
  populateStaffDropdowns();
  refresh(true);
}

// Run immediately & also attach listener (covers both conditions)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootSystem);
} else {
  bootSystem();
}

// Fallback timer to guarantee execution
setTimeout(bootSystem, 300);
setInterval(checkClinicalAlerts, 15000);
