// FIX: Add explicit types to the array to ensure a consistent object shape.
export const bloodTests: { name: string; price: number; label?: string }[] = [
  { name: "Colesterolo Totale", price: 7 },
  { name: "Trigliceridi", price: 6 },
  { name: "Profilo Lipidico Completo", price: 20 },
  { name: "Profilo Glucidico Completo", price: 20 },
  { name: "Vitamina D", price: 20 },
  { name: "Proteina C Reattiva", price: 6 },
  { name: "Esame Urine", price: 10 }
];

// FIX: Add explicit types to the array to ensure a consistent object shape.
export const otherTests: { name: string; price: number; label?: string }[] = [
  { name: "Skin Analysis", price: 10 },
  { name: "Skin Check (Dermatology)", price: 30 },
  { name: "Valutazione Training", price: 0, label: "da concordare" },
  { name: "Analisi DNA e Genomiche", price: 130 },
  { name: "Cortisolo Salivare", price: 15 },
  { name: "Test ed Analisi del Sonno", price: 0, label: "compresa nel pacchetto" },
  { name: "Test dello Stress", price: 0, label: "compreso nel pacchetto" },
  { name: "Polisonnografia", price: 0, label: "da concordare" },
  { name: "Pletismografia", price: 0, label: "da concordare" },
  { name: "Metabolica (func. tiroide, ecc)", price: 0, label: "da concordare" },
  { name: "Body Composition", price: 40 },
  { name: "HRV", price: 0, label: "compresa nel pacchetto" },
  { name: "Intestino e Microbioma", price: 199 },
  { name: "Valutazione Osteopatica", price: 50 },
  { name: "Dietetica Intolleranze", price: 150 },
  { name: "ECG", price: 35 },
  { name: "Holter Pressorio", price: 60 },
  { name: "Holter ECG", price: 70 },
];
