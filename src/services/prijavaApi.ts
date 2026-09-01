// =====================================================================
//  Servis za slanje prijave ispita/kolokvijuma u AWS pipeline.
//  Frontend -> API Gateway (POST /prijave) -> SQS -> Lambda -> S3.
//
//  Endpoint se konfigurise preko .env varijable VITE_PRIJAVE_API_URL
//  (vrednost je "ApiEndpoint" output iz cloud/template.yaml).
// =====================================================================

// Ovaj interfejs opisuje JSON paket koji saljemo u red poruka.
export interface PrijavaPayload {
  studentName: string;
  studentIndex: string;
  examKey: string;        // kompozitni kljuc: `${period}-${examId}`
  examName: string;
  examCode?: string;
  espb?: number;
  periodLabel: string;
  date?: string;
  location?: string;
  price?: number;
}

const API_URL = import.meta.env.VITE_PRIJAVE_API_URL as string | undefined;

/**
 * Salje prijavu na API Gateway. Poziv je "fire-and-forget" sa aspekta
 * korisnika: API Gateway samo ubaci poruku u SQS i odmah vrati 202,
 * a stvarnu obradu radi Lambda asinhrono.
 *
 * Vraca true ako je poruka prihvacena (HTTP 2xx), inace false.
 * Nikad ne baca gresku ka UI-u da prijava lokalno prodje i bez clouda.
 */
export async function posaljiPrijavu(payload: PrijavaPayload): Promise<boolean> {
  if (!API_URL) {
    console.warn(
      "[prijavaApi] VITE_PRIJAVE_API_URL nije podesen - preskacem slanje u cloud."
    );
    return false;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("[prijavaApi] API vratio status", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[prijavaApi] Greska pri slanju prijave:", err);
    return false;
  }
}
