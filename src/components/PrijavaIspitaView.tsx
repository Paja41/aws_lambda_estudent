import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  CheckCircle, 
  Info, 
  ClipboardCheck, 
  Layers, 
  BookOpen, 
  Award, 
  AlertTriangle,
  HelpCircle
} from "lucide-react";
import { Calendar } from "./Calendar";
import { FonLogo } from "./FonLogo";
import { Exam } from "../models/Exam";
import { useTheme } from "../context/ThemeContext";
import { posaljiPrijavu } from "../services/prijavaApi";

export type PeriodType = "druga-kolokvijumska" | "junski-rok" | "julski-rok";

interface PrijavaIspitaViewProps {
  studentName: string;
  studentIndex: string;
  accountBalance: number;
  setAccountBalance: React.Dispatch<React.SetStateAction<number>>;
  registeredExamsKeys: Record<string, boolean>;
  setRegisteredExamsKeys: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  addPaymentRecord: (type: string, amount: string) => void;
  onRegisterExam?: (exam: any) => void;
}


export const ROSTERS: Record<PeriodType, Exam[]> = {
  "druga-kolokvijumska": [
    { id: "mat1", name: "Matematika 1", code: "322001", espb: 6, date: "12.06.2026.", baseRegistrations: 1, price: 0 },
    { id: "prog1", name: "Programiranje 1", code: "220031", espb: 6, date: "15.06.2026.", baseRegistrations: 1, price: 0 },
    { id: "mat2", name: "Matematika 2", code: "322011", espb: 6, date: "14.06.2026.", baseRegistrations: 0, price: 0 },
    { id: "eko", name: "Ekonomija", code: "322002", espb: 6, date: "18.06.2026.", baseRegistrations: 2, price: 0 },
    { id: "stat", name: "Statistika", code: "220013", espb: 6, date: "17.06.2026.", baseRegistrations: 1, price: 0 },
  ],
  "junski-rok": [
    { id: "mat1", name: "Matematika 1", code: "322001", espb: 6, date: "20.06.2026.", baseRegistrations: 1, price: 1000 },
    { id: "prog1", name: "Programiranje 1", code: "220031", espb: 6, date: "22.06.2026.", baseRegistrations: 0, price: 1000 },
    { id: "mat2", name: "Matematika 2", code: "322011", espb: 6, date: "24.06.2026.", baseRegistrations: 2, price: 1000 },
    { id: "eko", name: "Ekonomija", code: "322002", espb: 6, date: "26.06.2026.", baseRegistrations: 1, price: 1000 },
    { id: "stat", name: "Statistika", code: "220013", espb: 6, date: "28.06.2026.", baseRegistrations: 1, price: 1000 },
  ],
  "julski-rok": [
    { id: "mat1", name: "Matematika 1", code: "322001", espb: 6, date: "05.08.2025.", baseRegistrations: 1, price: 1000 },
    { id: "prog1", name: "Programiranje 1", code: "220031", espb: 6, date: "04.08.2025.", baseRegistrations: 1, price: 1000 },
    { id: "mat2", name: "Matematika 2", code: "322011", espb: 6, date: "03.08.2025.", baseRegistrations: 0, price: 1000 },
    { id: "eko", name: "Ekonomija", code: "322002", espb: 6, date: "29.07.2025.", baseRegistrations: 2, price: 1000 },
    { id: "stat", name: "Statistika", code: "220013", espb: 6, date: "28.07.2025.", baseRegistrations: 1, price: 1000 },
  ]
};

export function PrijavaIspitaView({
  studentName,
  studentIndex,
  accountBalance,
  setAccountBalance,
  registeredExamsKeys,
  setRegisteredExamsKeys,
  addPaymentRecord,
  onRegisterExam
}: PrijavaIspitaViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType | null>(null);
  const { isDarkMode } = useTheme();
  
  
  const [confirmExam, setConfirmExam] = useState<Exam | null>(null);
  const [balanceErrorExam, setBalanceErrorExam] = useState<Exam | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const getPeriodLabel = (type: PeriodType) => {
    switch (type) {
      case "druga-kolokvijumska": return "Druga kolokvijumska nedelja";
      case "junski-rok": return "Junski ispitni rok";
      case "julski-rok": return "Julski ispitni rok";
    }
  };

  const getCompositeKey = (period: PeriodType, examId: string) => {
    return `${period}-${examId}`;
  };

  const handlePrijaviClick = (exam: Exam) => {
    if (!selectedPeriod) return;
    const isRegistered = registeredExamsKeys[getCompositeKey(selectedPeriod, exam.id)];
    if (isRegistered) return;

    
    if (exam.price > 0 && accountBalance < exam.price) {
      setBalanceErrorExam(exam);
    } else {
      setConfirmExam(exam);
    }
  };

  const handleConfirmRegistration = () => {
    if (!selectedPeriod || !confirmExam) return;

    const key = getCompositeKey(selectedPeriod, confirmExam.id);
    const price = confirmExam.price;

    setRegisteredExamsKeys(prev => ({
      ...prev,
      [key]: true
    }));

    if (onRegisterExam) {
      onRegisterExam({
        id: key,
        name: confirmExam.name,
        espb: confirmExam.espb,
        time: `${confirmExam.date} 9h`,
        location: confirmExam.price > 0 ? "Amfiteatar 1" : "Kabinet 52",
        isInitial: false,
        periodLabel: getPeriodLabel(selectedPeriod),
        price: confirmExam.price
      });
    }

    if (price > 0) {
      setAccountBalance(prev => Math.max(0, prev - price));
      
      addPaymentRecord(`Prijava ispita: ${confirmExam.name} (${getPeriodLabel(selectedPeriod)})`, `-${price}`);
    } else {
      
      addPaymentRecord(`Prijava kolokvijuma: ${confirmExam.name} (Slobodan unos)`, "0");
    }

    void posaljiPrijavu({
      studentName,
      studentIndex,
      examKey: `${getPeriodLabel(selectedPeriod)}-${confirmExam.name}`,
      examName: confirmExam.name,
      examCode: confirmExam.code,
      espb: confirmExam.espb,
      periodLabel: getPeriodLabel(selectedPeriod),
      date: confirmExam.date,
      location: confirmExam.price > 0 ? "Amfiteatar 1" : "Kabinet 52",
      price: confirmExam.price,
    });

    setSuccessInfo(`Uspešno ste prijavili predmet: **${confirmExam.name}** za **${getPeriodLabel(selectedPeriod)}**!`);
    setConfirmExam(null);

    setTimeout(() => {
      setSuccessInfo(null);
    }, 5000);
  };

  const formatBalance = (val: number) => {
    return val.toLocaleString("sr-RS", { minimumFractionDigits: 2 }) + " RSD";
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn select-none">
      
      {}
      {successInfo && (
        <div className={`border rounded-2xl p-4 text-xs font-semibold flex items-center gap-3 animate-fadeIn text-left shadow-sm ${
          isDarkMode ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" : "bg-emerald-50 border-emerald-300 text-emerald-800"
        }`}>
          <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0">
            <CheckCircle size={16} />
          </div>
          <div className="flex-1">
            <p className="font-bold">Prijava potvrđena</p>
            <p className={`font-normal mt-0.5 ${isDarkMode ? "text-emerald-400" : "text-emerald-750/95"}`}>
              {successInfo.split("**").map((part, i) => i % 2 === 1 ? <strong key={i} className={isDarkMode ? "font-bold text-white shadow-sm":"font-bold text-emerald-950"}>{part}</strong> : part)}
            </p>
          </div>
        </div>
      )}

      {}
      <AnimatePresence mode="wait">
        {!selectedPeriod ? (
          <motion.div
            key="selection-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6 w-full text-center animate-fadeIn"
          >
            {}
            <div className={`rounded-2xl shadow p-6 flex flex-col items-center gap-2 text-center border transition-all duration-300 ${
              isDarkMode 
                ? "bg-[#1E293B]/80 text-white border-slate-705/30 shadow-black/25" 
                : "bg-white border-slate-200 text-slate-800"
            }`}>
              <div className={`p-3 rounded-2xl mb-1 ${
                isDarkMode ? "bg-blue-950/50 text-[#5E97F6]" : "bg-blue-50 text-[#1E4C9A]"
              }`}>
                <ClipboardCheck size={32} />
              </div>
              <h2 className={`text-xl font-extrabold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Prijava ispitnih rokova i kolokvijuma</h2>
              <p className={`text-xs max-w-xl leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Dobrodošli u modul za prijavu ispita. Pre pristupa listi predmeta, molimo odaberite aktivan rok u kom želite da polažete predispitne obaveze ili ispite:
              </p>
              
              <div className={`mt-2 px-4 py-2 border rounded-xl flex items-center gap-2 text-xs font-bold ${
                isDarkMode ? "bg-[#121927]/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700"
              }`}>
                <span>Tekuće stanje na Vašem računu:</span>
                <span className={`text-sm font-bold ${isDarkMode ? "text-amber-400" : "text-[#1E4C9A]"}`}>{formatBalance(accountBalance)}</span>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              
              {}
              <div 
                onClick={() => setSelectedPeriod("druga-kolokvijumska")}
                className={`border-2 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group text-center ${
                  isDarkMode 
                    ? "bg-[#1E293B]/85 border-transparent hover:border-amber-400/50 text-white" 
                    : "bg-white border-transparent hover:border-blue-500/50 text-slate-900"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="flex justify-center items-center mb-4 w-full">
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold tracking-wider rounded-full uppercase">OTVORENO</span>
                  </div>
                  <h3 className={`font-extrabold text-sm group-hover:text-amber-400 transition-colors ${
                    isDarkMode ? "text-white group-hover:text-amber-400" : "text-slate-900 group-hover:text-[#1E4C9A]"
                  }`}>Druga kolokvijumska nedelja</h3>
                  <p className={`text-xs mt-2 leading-relaxed text-center ${isDarkMode ? "text-slate-400/90" : "text-slate-500"}`}>
                    Prijava predispitnih obaveza i drugih kolokvijuma. Položite predmete preko kolokvijuma pre zvaničnih rokova.
                  </p>
                </div>
                <div className={`mt-6 pt-3 border-t flex items-center justify-center gap-2.5 text-xs font-bold w-full ${
                  isDarkMode ? "border-slate-800 text-slate-300" : "border-slate-100 text-slate-700"
                }`}>
                  <span>Cena prijave:</span>
                  <span className="text-emerald-400 font-extrabold font-mono">0 RSD (Besplatno)</span>
                </div>
              </div>

              {}
              <div 
                onClick={() => setSelectedPeriod("junski-rok")}
                className={`border-2 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group text-center ${
                  isDarkMode 
                    ? "bg-[#1E293B]/85 border-transparent hover:border-amber-400/50 text-white" 
                    : "bg-white border-transparent hover:border-blue-500/50 text-slate-900"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="flex justify-center items-center mb-4 w-full">
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold tracking-wider rounded-full uppercase">OTVORENO</span>
                  </div>
                  <h3 className={`font-extrabold text-sm group-hover:text-amber-400 transition-colors ${
                    isDarkMode ? "text-white group-hover:text-amber-400" : "text-slate-900 group-hover:text-[#1E4C9A]"
                  }`}>Junski ispitni rok</h3>
                  <p className={`text-xs mt-2 leading-relaxed text-center ${isDarkMode ? "text-slate-400/90" : "text-slate-500"}`}>
                    Prvi redovni letnji ispitni rok. Obavezna prijava svih ispita za junsku seriju polaganja.
                  </p>
                </div>
                <div className={`mt-6 pt-3 border-t flex items-center justify-center gap-2.5 text-xs font-bold w-full ${
                  isDarkMode ? "border-slate-800 text-slate-300" : "border-slate-100 text-slate-700"
                }`}>
                  <span>Cena prijave:</span>
                  <span className={isDarkMode ? "text-amber-200 font-bold":"text-slate-900"}>1.000 RSD / ispit</span>
                </div>
              </div>

              {}
              <div 
                className={`border-2 rounded-2xl p-5 shadow-sm opacity-60 flex flex-col justify-between text-center select-none cursor-not-allowed relative ${
                  isDarkMode 
                    ? "bg-slate-900/60 border-slate-800/80 text-slate-500" 
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="flex justify-center items-center mb-4 w-full">
                    <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-extrabold tracking-wider rounded-full uppercase">ZATVORENO</span>
                  </div>
                  <h3 className={`font-extrabold text-sm ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>Julski ispitni rok</h3>
                  <p className={`text-xs mt-2 leading-relaxed text-center ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}>
                    Drugi redovni letnji ispitni rok. Idealna šansa za polaganje pre polaska na letnji raspust.
                  </p>
                </div>
                <div className={`mt-6 pt-3 border-t flex items-center justify-center gap-2.5 text-xs font-bold w-full ${
                  isDarkMode ? "border-slate-800 text-slate-600" : "border-slate-100 text-slate-400"
                }`}>
                  <span>Cena prijave:</span>
                  <span className="font-mono">1.000 RSD / ispit</span>
                </div>
              </div>

            </div>

            <div className={`rounded-xl border p-4 font-medium text-xs text-left flex gap-2.5 items-start ${
              isDarkMode 
                ? "bg-[#111a30] border-slate-800/85 text-slate-400" 
                : "bg-blue-50 border-blue-200/50 text-slate-600"
            }`}>
              <Info size={16} className={`shrink-0 mt-0.5 ${isDarkMode ? "text-[#5E97F6]" : "text-[#1E4C9A]"}`} />
              <div>
                <p className={`font-bold mb-0.5 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Savet za finansije:</p>
                Za ispite koji imaju naknadu (Junski i Julski), sredstva će automatski biti skinuta sa Vašeg unetog stanja na finansijskoj kartici. Ukoliko nemate dovoljno novca, nalog možete doplatiti u svakom momentu na kartici <strong className={isDarkMode ? "text-[#5E97F6]" : "text-[#1E4C9A]"}>Stanje na računu</strong>.
              </div>
            </div>

          </motion.div>
        ) : (
          
          <motion.div
            key="list-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch lg:min-h-[calc(100vh-210px)]"
          >
            {}
            <div className={`col-span-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl shadow border transition-all duration-300 ${
              isDarkMode 
                ? "bg-[#1E293B]/80 border-slate-705/30 text-white shadow-black/25" 
                : "bg-white border-slate-200 text-slate-800"
            }`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedPeriod(null)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                    isDarkMode 
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700" 
                      : "bg-white hover:bg-slate-100 text-slate-500 hover:text-black border-slate-200"
                  }`}
                  title="Izaberi drugi rok"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="text-left">
                  <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider">ODABRANI ISPITNI ROK</span>
                  <h2 className={`text-md font-extrabold leading-none mt-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{getPeriodLabel(selectedPeriod)}</h2>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="text-right text-xs">
                  <span className={isDarkMode ? "text-slate-400" : "text-slate-400"}>Stanje računa: </span>
                  <span className={`font-bold font-mono text-xs ${isDarkMode ? "text-amber-400" : "text-[#1E4C9A]"}`}>{formatBalance(accountBalance)}</span>
                </div>
                <button
                  onClick={() => setSelectedPeriod(null)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isDarkMode ? "bg-slate-800 hover:bg-slate-750 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                  }`}
                >
                  Promeni rok
                </button>
              </div>
            </div>

            {}
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div className={`rounded-2xl p-6 shadow border transition-all duration-300 ${
                isDarkMode ? "bg-[#1E293B]/80 text-white border-slate-705/30 shadow-black/35" : "bg-white border-slate-200"
              }`}>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 mb-4">
                  <ClipboardCheck size={16} className={isDarkMode ? "text-[#5E97F6]" : "text-[#1E4C9A]"} />
                  Lista raspoloživih predmeta za prijavu
                </h3>

                {}
                <div className="hidden md:block w-full overflow-x-auto select-none rounded border border-black/30">
                  <table className={`w-full min-w-[580px] border-collapse text-xs ${
                    isDarkMode ? "bg-[#141c2c] text-slate-100" : "bg-white text-slate-900"
                  }`}>
                    <thead>
                      <tr className={`border-b ${
                        isDarkMode ? "bg-[#162135] border-slate-800 text-slate-200" : "bg-[#f8fafc] border-black"
                      }`}>
                        <th className={`border font-extrabold text-center py-3.5 px-4 uppercase tracking-wider text-xs ${isDarkMode ? "border-slate-800 bg-[#162135]" : "border-black bg-slate-50"}`}>Predmet</th>
                        <th className={`border font-extrabold text-center py-3.5 px-3 uppercase tracking-wider text-xs ${isDarkMode ? "border-slate-800 bg-[#162135]" : "border-black bg-slate-50"}`}>Šifra</th>
                        <th className={`border font-extrabold text-center py-3.5 px-3 uppercase tracking-wider text-xs text-center ${isDarkMode ? "border-slate-800 bg-[#162135]" : "border-black bg-slate-50"}`}>ESPB</th>
                        <th className={`border font-extrabold text-center py-3.5 px-4 uppercase tracking-wider text-xs ${isDarkMode ? "border-slate-800 bg-[#162135]" : "border-black bg-slate-50"}`}>Datum polaganja</th>
                        <th className={`border font-extrabold text-center py-3.5 px-3 uppercase tracking-wider text-xs ${isDarkMode ? "border-slate-800 bg-[#162135]" : "border-black bg-slate-50"}`}>Broj prijava</th>
                        <th className={`border font-extrabold text-center py-3.5 px-4 uppercase tracking-wider text-xs ${isDarkMode ? "border-slate-800 bg-[#162135]" : "border-black bg-slate-50"}`}>Prijavite ispit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ROSTERS[selectedPeriod].map((exam) => {
                        const isRegistered = registeredExamsKeys[getCompositeKey(selectedPeriod, exam.id)];
                        return (
                          <tr 
                            key={exam.id}
                            className={`transition-colors duration-150 border-b ${
                              isRegistered 
                                ? (isDarkMode ? "bg-emerald-950/20 hover:bg-emerald-950/30 border-slate-800/80" : "bg-emerald-50/35 hover:bg-emerald-50/50 border-[#000]/40") 
                                : (isDarkMode ? "hover:bg-[#1f2c41] border-slate-800/85 bg-slate-900/10" : "hover:bg-slate-50/60 border-black/50")
                            }`}
                          >
                            <td className={`border py-4 px-4 text-left font-bold text-[12.5px] ${isDarkMode ? "border-slate-800 text-slate-200" : "border-black text-slate-800"}`}>
                              {exam.name}
                            </td>
                            <td className={`border py-4 px-3 text-center font-mono font-medium text-xs ${isDarkMode ? "border-slate-800 text-slate-400" : "border-black text-slate-600"}`}>
                              {exam.code}
                            </td>
                            <td className={`border py-4 px-3 text-center font-mono text-xs font-semibold ${isDarkMode ? "border-slate-800 text-slate-300" : "border-black text-slate-700"}`}>
                              {exam.espb}
                            </td>
                            <td className={`border py-4 px-4 text-center font-mono text-xs ${isDarkMode ? "border-slate-800 text-slate-300" : "border-black text-slate-700"}`}>
                              {exam.date}
                            </td>
                            <td className={`border py-4 px-3 text-center font-mono text-xs font-semibold ${isDarkMode ? "border-slate-800 text-slate-250" : "border-black text-slate-850"}`}>
                              {exam.baseRegistrations + (isRegistered ? 1 : 0)}
                            </td>
                            <td className={`border py-4 px-4 text-center ${isDarkMode ? "border-slate-800" : "border-black"}`}>
                              {isRegistered ? (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg border ${
                                  isDarkMode 
                                    ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40" 
                                    : "bg-emerald-100 text-emerald-800 border-emerald-300"
                                }`}>
                                  <CheckCircle size={11} className="stroke-[2.5]" />
                                  Prijavljen
                                </span>
                              ) : (
                                <button
                                  onClick={() => handlePrijaviClick(exam)}
                                  className={`px-4 py-1.5 border hover:active:scale-95 text-xs font-bold font-sans tracking-wide transition-all cursor-pointer shadow-sm rounded ${
                                    isDarkMode 
                                      ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-amber-400 hover:text-slate-900 hover:border-amber-400" 
                                      : "bg-slate-100 border-slate-400 text-slate-800 hover:bg-[#1E4C9A] hover:text-white hover:border-[#1E4C9A]"
                                  }`}
                                >
                                  Prijavi
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {}
                <div className="block md:hidden space-y-4">
                  {ROSTERS[selectedPeriod].map((exam) => {
                    const isRegistered = registeredExamsKeys[getCompositeKey(selectedPeriod, exam.id)];
                    return (
                      <div 
                        key={exam.id}
                        className={`rounded-xl border p-4 transition-all duration-300 shadow-sm ${
                          isRegistered 
                            ? (isDarkMode ? "bg-emerald-955/15 border-emerald-800/80 text-emerald-100" : "bg-emerald-50/50 border-emerald-200 text-slate-800") 
                            : (isDarkMode ? "bg-[#141c2c]/75 border-slate-800 text-slate-100" : "bg-slate-50/50 border-slate-200 text-slate-800")
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="text-left">
                            <h4 className="font-extrabold text-sm leading-snug">{exam.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              <span>Šifra: {exam.code}</span>
                              <span>•</span>
                              <span>{exam.espb} ESPB</span>
                            </div>
                          </div>
                          <div>
                            {isRegistered ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Prijavljen
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePrijaviClick(exam)}
                                className={`px-3 py-1 border hover:active:scale-95 text-[11px] font-bold tracking-wide transition-all rounded shadow-sm cursor-pointer ${
                                  isDarkMode 
                                    ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-amber-400 hover:text-slate-900 hover:border-amber-400" 
                                    : "bg-white border-slate-300 text-slate-800 hover:bg-[#1E4C9A] hover:text-white hover:border-[#1E4C9A]"
                                }`}
                              >
                                Prijavi
                              </button>
                            )}
                          </div>
                        </div>

                        <div className={`mt-3 pt-2.5 border-t flex justify-between items-center text-xs ${
                          isDarkMode ? "border-slate-800/70 text-slate-400" : "border-slate-200 text-slate-500"
                        }`}>
                          <div className="text-left">
                            <span className="font-medium text-[11px]">Datum polaganja:</span>
                            <div className="font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5">{exam.date}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-[11px]">Prijave:</span>
                            <div className="font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5">{exam.baseRegistrations + (isRegistered ? 1 : 0)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`mt-4 flex gap-2 items-start text-left text-[11px] border rounded-xl p-3.5 ${
                  isDarkMode 
                    ? "bg-[#111a30] border-slate-800/85 text-slate-450" 
                    : "bg-slate-50 border-slate-150 text-gray-500"
                }`}>
                  <Info size={15} className={`mt-0.5 shrink-0 ${isDarkMode ? "text-amber-400" : "text-[#1E4C9A]"}`} />
                  <div>
                    <p className={`font-bold mb-0.5 ${isDarkMode ? "text-slate-200" : "text-slate-850"}`}>Napomene o proceduri prijave:</p>
                    <p className="leading-relaxed">
                      Sve prijave se odmah evidentiraju u bazi Fakulteta Organizacionih Nauka. Ispiti se u roku mogu odjaviti najkasnije 2 radna dana pre polaganja, nakon čega se sredstva vraćaju na studentovu karticu.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {}
            <div className="lg:col-span-4 flex flex-col gap-6 self-stretch w-full max-w-[340px] mx-auto lg:mr-0 lg:ml-auto animate-fadeIn">
              <Calendar />
              
              <div className="flex-grow" />
              
              <div className={`flex flex-col gap-1 items-center justify-center rounded-2xl shadow p-6 min-h-[140px] border transition-all duration-300 w-full ${
                isDarkMode ? "bg-[#1E293B]/80 border-slate-700/60 shadow-black/25" : "bg-white border text-slate-800 border-slate-200"
              }`}>
                <div className="max-w-[140px] w-full flex items-center justify-center opacity-90">
                  <FonLogo />
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {confirmExam && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border text-left flex flex-col transition-all duration-300 ${
                isDarkMode 
                  ? "bg-[#1E293B] border-slate-705/30 text-white shadow-black/45" 
                  : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  isDarkMode ? "bg-blue-950/60 text-[#5E97F6]" : "bg-blue-50 text-[#1E4C9A]"
                }`}>
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h3 className={`font-extrabold text-[15px] leading-snug ${isDarkMode ? "text-white" : "text-slate-900"}`}>Potvrda prijave ispita</h3>
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Da li ste sigurni da želite da prijavite polaganje predmeta:
                  </p>
                  <p className={`text-sm font-extrabold mt-2 border-l-4 pl-3 ${
                    isDarkMode ? "text-amber-400 border-amber-400" : "text-[#1E4C9A] border-[#1E4C9A]"
                  }`}>
                    {confirmExam.name} ({confirmExam.code})
                  </p>
                  <p className={`text-xs mt-3 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Za rok: <strong className={isDarkMode ? "text-slate-200 font-bold":"text-slate-800 font-bold"}>{selectedPeriod && getPeriodLabel(selectedPeriod)}</strong>
                  </p>
                </div>
              </div>

              <div className={`mt-5 pt-3.5 border-t flex items-center justify-between text-xs font-bold ${
                isDarkMode ? "border-slate-800 text-slate-300" : "border-slate-100 text-slate-800"
              }`}>
                <span>Cena prijave ispita:</span>
                <span className={`font-mono text-sm ${isDarkMode ? "text-amber-400 font-extrabold":"text-[#1E4C9A]"}`}>{confirmExam.price === 0 ? "Bez naknade (0 RSD)" : `${confirmExam.price.toLocaleString("sr-RS")} RSD`}</span>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setConfirmExam(null)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                    isDarkMode 
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white" 
                      : "bg-slate-100 hover:bg-slate-250 text-slate-700 border-slate-200"
                  }`}
                >
                  Odustani
                </button>
                <button
                  onClick={handleConfirmRegistration}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-amber-400 hover:bg-amber-500 text-slate-950" 
                      : "bg-[#1E4C9A] hover:bg-blue-800 text-white"
                  }`}
                >
                  Potvrdi prijavu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {balanceErrorExam && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border text-left flex flex-col transition-all duration-300 ${
                isDarkMode 
                  ? "bg-[#1E293B] border-slate-705/30 text-white shadow-black/45" 
                  : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl shrink-0">
                  <AlertTriangle size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className={`font-extrabold text-[15px] leading-snug ${isDarkMode ? "text-white" : "text-slate-900"}`}>Nedovoljno sredstava na računu</h3>
                  <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Nažalost, nemate dovoljno raspoloživog salda za prijavu ispita <strong className={isDarkMode ? "text-white":"text-slate-800"}>{balanceErrorExam.name}</strong>.
                  </p>
                </div>
              </div>

              <div className={`mt-4 border rounded-xl p-3.5 space-y-2 text-xs ${
                isDarkMode ? "bg-[#111a2f] border-slate-800" : "bg-slate-50 border-slate-100"
              }`}>
                <div className={`flex justify-between ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  <span>Cena prijave ispita:</span>
                  <span className={`font-bold font-mono ${isDarkMode ? "text-slate-250" : "text-slate-800"}`}>{balanceErrorExam.price.toLocaleString("sr-RS")} RSD</span>
                </div>
                <div className={`flex justify-between font-bold ${isDarkMode ? "text-amber-400" : "text-[#1E4C9A]"}`}>
                  <span>Vaš trenutni saldo:</span>
                  <span className="font-mono">{formatBalance(accountBalance)}</span>
                </div>
              </div>

              <p className={`text-[10px] mt-3 leading-relaxed ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                *Izvršite uplatu ili proknjižite sredstva popunjavanjem virmana u sekciji "Stanje na računu" kako biste dopunili Vašu finansijsku karticu.
              </p>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setBalanceErrorExam(null)}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                    isDarkMode 
                      ? "bg-amber-405 bg-slate-800 hover:bg-slate-700 text-white" 
                      : "bg-slate-800 hover:bg-slate-900 text-white"
                  }`}
                >
                  U redu, zatvori
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
