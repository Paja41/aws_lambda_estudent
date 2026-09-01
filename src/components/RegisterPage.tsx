import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FonLogo } from "./FonLogo";
import { 
  Loader2, 
  CheckCircle2, 
  Upload, 
  Phone, 
  Mail, 
  FileText, 
  X
} from "lucide-react";

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterComplete?: (name: string, indexNum: string) => void;
}

const toBase64 = (file: File): Promise<string> => 
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export function RegisterPage({ onNavigateToLogin, onRegisterComplete }: RegisterPageProps) {
  
  const [firstName, setFirstName] = useState(() => sessionStorage.getItem("reg_firstName") || "");
  const [lastName, setLastName] = useState(() => sessionStorage.getItem("reg_lastName") || "");
  const [city, setCity] = useState(() => sessionStorage.getItem("reg_city") || "");
  const [phone, setPhone] = useState(() => sessionStorage.getItem("reg_phone") || "");
  const [jmbg, setJmbg] = useState(() => sessionStorage.getItem("reg_jmbg") || "");
  const [indexNum, setIndexNum] = useState(() => sessionStorage.getItem("reg_indexNum") || "");
  const [acceptedTerms, setAcceptedTerms] = useState(() => sessionStorage.getItem("reg_acceptedTerms") === "true");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("reg_firstName", firstName);
    sessionStorage.setItem("reg_lastName", lastName);
    sessionStorage.setItem("reg_city", city);
    sessionStorage.setItem("reg_phone", phone);
    sessionStorage.setItem("reg_jmbg", jmbg);
    sessionStorage.setItem("reg_indexNum", indexNum);
    sessionStorage.setItem("reg_acceptedTerms", String(acceptedTerms));
  }, [firstName, lastName, city, phone, jmbg, indexNum, acceptedTerms]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName.trim()) {
      setErrorMsg("Molimo unesite Vaše ime.");
      return;
    }
    if (!lastName.trim()) {
      setErrorMsg("Molimo unesite Vaše prezime.");
      return;
    }
    if (!city.trim()) {
      setErrorMsg("Molimo unesite Vaš grad.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Molimo unesite broj telefona.");
      return;
    }
    if (!jmbg.trim()) {
      setErrorMsg("Molimo unesite Vaš JMBG.");
      return;
    }
    if (!indexNum.trim()) {
      setErrorMsg("Molimo unesite broj indeksa.");
      return;
    }
    if (!selectedFile) {
      setErrorMsg("Molimo zakačite sliku prve dve stranice Vašeg indeksa.");
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg("Morate potvrditi da su uneti podaci ispravni i saglasiti se sa njihovim korišćenjem.");
      return;
    }

    setIsLoading(true);

    try {
      const slikaBase64 = await toBase64(selectedFile);

      const podaci = {
        ime: firstName.trim(),
        prezime: lastName.trim(),
        grad: city.trim(),
        telefon: phone.trim(),
        jmbg: jmbg.trim(),
        indeks: indexNum.trim(),
        slikaBase64: slikaBase64
      };

      // Fiksni URL generisan iz tvog API Gateway-a
      const apiUrl = "https://774f9mvryh.execute-api.eu-north-1.amazonaws.com/prod/registracija";

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(podaci)
      });

      if (!response.ok) {
        throw new Error("Greška prilikom čuvanja podataka na serveru.");
      }

      setRegSuccess(true);

      sessionStorage.removeItem("reg_firstName");
      sessionStorage.removeItem("reg_lastName");
      sessionStorage.removeItem("reg_city");
      sessionStorage.removeItem("reg_phone");
      sessionStorage.removeItem("reg_jmbg");
      sessionStorage.removeItem("reg_indexNum");
      sessionStorage.removeItem("reg_acceptedTerms");

    } catch (error) {
      console.error("Greska pri registraciji:", error);
      setErrorMsg("Došlo je do greške pri komunikaciji sa serverom. Pokušajte ponovo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1240px] px-4 md:px-0 transition-all duration-300">
      <h1 className="text-white text-[32px] font-medium tracking-wide text-center mb-5 select-none">
        Registrujte se
      </h1>

      <div className="bg-[#EDF2FA] rounded-[16px] shadow-2xl p-6 md:p-8 w-full border border-white/20 relative">
        <AnimatePresence mode="wait">
          {!regSuccess ? (
            <motion.form
              key="register-split-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-gray-700 text-[14.5px] font-semibold select-none pl-1">
                      Ime
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Petar"
                      className="w-full h-[44px] px-4 rounded-[8px] bg-white border border-slate-200 text-gray-800 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#1E4C9A]/40 focus:border-[#1E4C9A] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-gray-700 text-[14.5px] font-semibold select-none pl-1">
                      Prezime
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Petrović"
                      className="w-full h-[44px] px-4 rounded-[8px] bg-white border border-slate-200 text-gray-800 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#1E4C9A]/40 focus:border-[#1E4C9A] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-gray-700 text-[14.5px] font-semibold select-none pl-1">
                      Grad
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Beograd"
                      className="w-full h-[44px] px-4 rounded-[8px] bg-white border border-slate-200 text-gray-800 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#1E4C9A]/40 focus:border-[#1E4C9A] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-gray-700 text-[14.5px] font-semibold select-none pl-1">
                      Broj telefona
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+381"
                      className="w-full h-[44px] px-4 rounded-[8px] bg-white border border-slate-200 text-gray-800 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#1E4C9A]/40 focus:border-[#1E4C9A] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-gray-700 text-[14.5px] font-semibold select-none pl-1">
                      JMBG
                    </label>
                    <input
                      type="text"
                      maxLength={13}
                      value={jmbg}
                      onChange={(e) => setJmbg(e.target.value.replace(/\D/g, ""))}
                      placeholder="Unesite 13 cifara"
                      className="w-full h-[44px] px-4 rounded-[8px] bg-white border border-slate-200 text-gray-800 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#1E4C9A]/40 focus:border-[#1E4C9A] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-gray-700 text-[14.5px] font-semibold select-none pl-1">
                      Broj indeksa (godina upisa/broj)
                    </label>
                    <input
                      type="text"
                      value={indexNum}
                      onChange={(e) => setIndexNum(e.target.value)}
                      placeholder="2025/0001"
                      className="w-full h-[44px] px-4 rounded-[8px] bg-white border border-slate-200 text-gray-800 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#1E4C9A]/40 focus:border-[#1E4C9A] transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col text-left gap-1 mt-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                  
                  <div
                    onClick={triggerFileSelect}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`w-full py-6 px-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer select-none transition-all ${
                      selectedFile 
                        ? "border-green-500 bg-green-50/40" 
                        : isDragging
                        ? "border-[#1E4C9A] bg-[#1E4C9A]/10"
                        : "border-[#1E4C9A]/30 hover:border-[#1E4C9A] hover:bg-[#1E4C9A]/5 bg-transparent"
                    }`}
                  >
                    {!selectedFile ? (
                      <>
                        <Upload className="text-[#1E4C9A] h-6 w-6 animate-pulse" />
                        <span className="text-[#1E4C9A] font-medium text-[14.5px]">
                          Upload Additional file
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 w-full max-w-sm px-2 text-sm justify-between bg-white py-1.5 px-3 rounded border border-green-200 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-2 overflow-hidden truncate">
                          <FileText className="text-green-600 shrink-0" size={18} />
                          <span className="font-semibold text-gray-800 truncate">
                            {selectedFile.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[#4B5563] text-[12px] font-medium mt-1 leading-normal">
                    Zakačite sliku indeksa tako da se vide prve dve stranice.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 mt-3 text-left">
                  <input
                    id="accept-terms-check"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1E4C9A] focus:ring-[#1E4C9A] cursor-pointer"
                  />
                  <label 
                    htmlFor="accept-terms-check"
                    className="text-[#1F2937] text-[12.5px] font-medium leading-relaxed select-none cursor-pointer"
                  >
                    Potvrđujem da su uneti podaci ispravni i saglasan sam da se koriste.
                  </label>
                </div>

                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-xs font-semibold text-left mt-1"
                  >
                    {errorMsg}
                  </motion.div>
                )}

                <div className="flex justify-start mt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-[200px] h-[46px] rounded-[8px] bg-[#1E4C9A] text-white font-semibold text-[15px] hover:bg-[#163E75] active:scale-[0.98] transition-all flex items-center justify-center shadow-md shadow-[#1E4C9A]/20 cursor-pointer disabled:opacity-80"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin text-white" size={20} />
                    ) : (
                      "Registruj se"
                    )}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-5 h-full justify-between">
                <div className="relative w-full aspect-[4/3] sm:aspect-video lg:aspect-[4/3] rounded-lg overflow-hidden border border-slate-300 shadow bg-white flex flex-col">
                   <iframe
                    title="Lokacija Fakulteta organizacionih nauka"
                    className="w-full h-full min-h-[250px] border-0"
                    src="https://maps.google.com/maps?q=Fakultet%20organizacionih%20nauka%20Beograd%20Jove%20Ilica%20154&t=&z=16&ie=UTF8&iwloc=&output=embed"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <div className="flex flex-row flex-nowrap items-center justify-between gap-2.5 px-0.5 mt-2.5 w-full select-none">
                  <a 
                    href="tel:+381113950813"
                    className="flex items-center gap-1.5 text-gray-800 hover:text-black transition-colors shrink-0"
                  >
                    <Phone size={15} className="text-black stroke-[2.5]" />
                    <span id="fon-phone-link" className="text-[12.5px] font-bold underline underline-offset-2 tracking-tight whitespace-nowrap">
                      +381 11 3950 813
                    </span>
                  </a>

                  <a 
                    href="mailto:studentska@fon.bg.ac.rs"
                    className="flex items-center gap-1.5 text-gray-800 hover:text-black transition-colors shrink-0"
                  >
                    <Mail size={15} className="text-black stroke-[2.5]" />
                    <span id="fon-email-link" className="text-[12.5px] font-bold underline underline-offset-2 tracking-tight whitespace-nowrap">
                      studentska@fon.bg.ac.rs
                    </span>
                  </a>

                  <div className="shrink-0">
                    <FonLogo />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-12 mt-4 pt-4 border-t border-slate-300/40 text-left select-none">
                <span className="text-gray-500 text-[14.5px] font-medium whitespace-nowrap">
                  Već imate studentski nalog?{" "}
                </span>
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-[#1E4C9A] hover:text-[#2563EB] text-[14.5px] font-bold hover:underline bg-transparent border-none p-0 cursor-pointer inline whitespace-nowrap"
                >
                  Prijavite se.
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="reg-split-success-info"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <CheckCircle2 className="text-[#10B981] w-16 h-16 mb-4 animate-bounce" />
              <h2 className="text-[22px] font-semibold text-gray-800 mb-1.5">
                Dokumentacija predata i nalog uspešno konfigurisan!
              </h2>
              <p className="text-gray-500 text-[14.5px] max-w-[420px] mb-8 leading-relaxed">
                Poštovani, zahtev za registraciju studentskog naloga je uspešno zaprimljen. Podaci i indeks će biti verifikovani uskoro.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (onRegisterComplete) {
                    onRegisterComplete(`${firstName} ${lastName}`, indexNum);
                  } else {
                    onNavigateToLogin();
                  }
                }}
                className="px-8 py-3 bg-[#1E4C9A] text-white hover:bg-[#163E75] text-[15px] font-semibold rounded-lg transition-all shadow-md shadow-[#1E4C9A]/20 duration-150 cursor-pointer"
              >
                Uđi u studentski portal
              </button>

              <div className="mt-12 flex justify-center w-full">
                <FonLogo />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}