/**
 * Patient Health & Treatment Tracker Engine
 */
class PatientTracker {
  constructor(storageKey = 'patientRecords') {
    this.storageKey = storageKey;
  }

  // Retrieve all records from storage
  getRecords() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Save array of records back to storage
  _saveRecords(records) {
    localStorage.setItem(this.storageKey, JSON.stringify(records));
  }

  /**
   * Add a new patient entry
   * @param {Object} entry - Record fields (name, condition, treatment, status, notes)
   */
  addRecord({ patientName, condition, treatment, status = 'Ongoing', notes = '' }) {
    if (!patientName || !condition || !treatment) {
      throw new Error('Patient Name, Condition, and Treatment are required fields.');
    }

    const records = this.getRecords();
    const newRecord = {
      id: 'pt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      patientName: patientName.trim(),
      condition: condition.trim(),
      treatment: treatment.trim(),
      status: status.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    records.push(newRecord);
    this._saveRecords(records);
    return newRecord;
  }

  /**
   * Delete a record by ID
   * @param {string} id 
   */
  deleteRecord(id) {
    let records = this.getRecords();
    const filtered = records.filter(record => record.id !== id);
    if (records.length === filtered.length) {
      return false; // Record not found
    }
    this._saveRecords(filtered);
    return true;
  }

  /**
   * Update status or details of an existing record
   * @param {string} id 
   * @param {Object} updates 
   */
  updateRecord(id, updates) {
    const records = this.getRecords();
    const index = records.findIndex(record => record.id === id);

    if (index === -1) {
      throw new Error('Patient record not found.');
    }

    records[index] = { ...records[index], ...updates, updatedAt: new Date().toISOString() };
    this._saveRecords(records);
    return records[index];
  }

  /**
   * Search and filter records
   * @param {string} searchTerm - Search by name or condition
   * @param {string} statusFilter - Filter by status (e.g., 'Ongoing', 'Completed')
   */
  filterRecords(searchTerm = '', statusFilter = 'All') {
    const records = this.getRecords();
    const query = searchTerm.toLowerCase().trim();

    return records.filter(record => {
      const matchesSearch = 
        record.patientName.toLowerCase().includes(query) ||
        record.condition.toLowerCase().includes(query) ||
        record.treatment.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'All' || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }
}

// Example usage:
// const tracker = new PatientTracker();
// tracker.addRecord({ patientName: "Alex Smith", condition: "Asthma", treatment: "Albuterol Inhaler" });
// console.log(tracker.getRecords());
