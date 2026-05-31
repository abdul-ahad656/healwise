import { SymptomHistoryEntry } from '@/services/symptomService';
import { MedicineHistoryEntry } from '@/services/medicineService';

let selectedSymptom: SymptomHistoryEntry | null = null;
let selectedMedicine: MedicineHistoryEntry | null = null;

export function setSelectedSymptomEntry(entry: SymptomHistoryEntry) {
  selectedSymptom = entry;
}

export function peekSelectedSymptomEntry(): SymptomHistoryEntry | null {
  return selectedSymptom;
}

export function clearSelectedSymptomEntry() {
  selectedSymptom = null;
}

export function setSelectedMedicineEntry(entry: MedicineHistoryEntry) {
  selectedMedicine = entry;
}

export function peekSelectedMedicineEntry(): MedicineHistoryEntry | null {
  return selectedMedicine;
}

export function clearSelectedMedicineEntry() {
  selectedMedicine = null;
}
