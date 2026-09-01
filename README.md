# klijentske-veb-tehnologije-2024-2024-0075-prijava-kolokvijuma-i-ispita

# E-student 2026 - aplikacija za prijavu kolokvijuma i ispita
Dobrodošli na github naše aplikacije za prijavu kolokvijuma i ispita.

## Uputstvo za pokretanje aplikacije
Kako biste uspešno pokrenuli aplikaciju na svom uređaju, potrebno je da na njemu imate instaliran Node.js, koji možete
downloadovati sa [zvaničnog sajta](https://nodejs.org/en/download), na kom se takođe nalazi i uputstvo za instalaciju.

Nakon što ste klonirali repozitorijum, potrebno je da u svom Powershell terminalu ukucate komandu `npm install` kako biste
instalirali sve potrebne pakete. Nakon toga, komandom `npm run dev` pokrećete aplikaciju u svom browseru.

## Korišćene tehnologije
Za razvoj aplikacije korišćeni su:
* HTML
* CSS
* TypeScript
* React
* Session storage, MockAPI i React hooks

## Opis funkcionalnosti
Pri prvom ulazu na sajt otvara se stranica prijave, odakle ukoliko korisnik nije prijavljen može da ode na stranicu registracije.
Jednom kada je registrovan, student ima pristup svojim prijavljenim ispitima, studentskom računu, pregledu svojih predmeta i raznim drugim informacijama. Uneti podaci se čuvaju u SessionStorage u slučaju da se stranica refreshuje.

*Početna stranica* u gornjem levom uglu takođe poseduje dark mode toggle, tako da korisnici mogu lako da promene pozadinu na onu koja im više prija. Tu mogu da vide najnovija obaveštenja kao i kalendar sa bitnim datumima u datom mesecu. Sa leve strane se nalazi sidebar odakle se može doći sa bilo koje stranice na bilo koju stranicu aplikacije.

Stranica *Stanje na računu* omogućava studentu da proveri koliko novca ima na svom računu, odštampa uplatnicu, i uradi simulaciju uplate novca za brzu proveru stanja nakon uplate.
Na stranicama *prijave* i *prijavljenih ispita* student može da u određenom roku prijavi ili odjavi ispite koje želi da polaže.

Uz pomoć stranica *prikaza predmeta* i *rasporeda nastave* student može da isplanira svoju nedelju, dok na stranici položenih ispita može da vidi sve ispite koje je uspešno položio.

Jedna od najbitnijih novih funkcionalnosti je *kontakt stranica*, sa koje student može da direktno pošalje zahtev studentskoj službi vezan za razne probleme koje može da ima. U njenoj izradi je korišćen MockAPI.

U donjem levom uglu se takođe nalazi i *AI asistent*, koji pomaže studentu u navigaciji po aplikaciji i dodatnim pitanjima vezanim za studiranje.

U gornjem desnom uglu student može da klikne na svoje ime, što će ga odvesti na svoju profil stranicu gde može proveriti administrativne podatke. Pored profila je takođe i dugme za odjavu sa aplikacije.

## Nefunkcionalni zahtevi
* Osigurana je responzivnost na mobilnim uređajima
* Implementiran je dark mode
* Sprečeno je višestruko slanje istih podataka pre završetka obrade prvog slanja
* Omogućen fallback response za AI asistenta u slučaju da je API nedostupan
* U slučaju da se slika ne može prikazati, prikazuje se alternativni tekst
* Validacija podataka koji se upisuju u forme (email sadrži @, JMBG ima 13 karaktera...)

## Drvo komponenti
```text
App
└── BrowserRouter
    └── Routes
        ├── LoginPage (Ruta: /login)
        ├── RegisterPage (Ruta: /register)
        └── StudentPortal (Ruta: /portal/:tab)
            └── ThemeProvider (Upravljanje svetlom/tamnom temom)
                └── StudentPortalContent
                    ├── Banner
                    └── Glavni Sadržaj
                        ├── AiAssistant
                        ├── HomeView
                        ├── AccountBalanceView
                        ├── PrijavaIspitaView
                        ├── PrijavljeniIspitiView
                        ├── PrikazPredmetaView
                        ├── RasporedNastaveView
                        ├── PolozeniIspitiView
                        ├── ProfilStudentaView
                        └── KontaktView
```
# eStudent na AWS — Event-driven arhitektura (Lambda + S3 + SQS)

Ovaj modul prebacuje postojeći eStudent frontend na AWS i dodaje asinhroni
serverless backend za prijavu ispita/kolokvijuma. Nijedan server se ne održava
ručno — sve je pokretano događajima (event-driven).

## Tok podataka

```
┌──────────────┐     1. GET (staticki sajt)      ┌────────────────────┐
│              │◀────────────────────────────────│  S3 (frontend)     │
│   Browser    │                                 │  static hosting    │
│  (eStudent)  │                                 └────────────────────┘
│              │
│              │     2. POST /prijave (JSON)      ┌────────────────────┐
│              │────────────────────────────────▶│  API Gateway       │
└──────────────┘         202 Accepted            │  (REST)            │
                                                  └─────────┬──────────┘
                                                            │ 3. SendMessage
                                                            ▼
                                                  ┌────────────────────┐
                                                  │  SQS (red poruka)  │──▶ DLQ
                                                  └─────────┬──────────┘   (posle 3
                                                            │ 4. trigger    neuspeha)
                                                            ▼
                                                  ┌────────────────────┐
                                                  │  Lambda            │
                                                  │  process-prijava   │
                                                  └─────────┬──────────┘
                                                            │ 5. PutObject
                                                            ▼
                                                  ┌────────────────────┐
                                                  │  S3 (potvrde)      │
                                                  │  potvrde/<indeks>/ │
                                                  └────────────────────┘
```

### Koraci

1. **Statičko hostovanje (S3).** `vite build` proizvodi `dist/`, koji se sync-uje
   u `*-frontend` bucket sa uključenim *static website hosting*. Frontend se
   servira direktno iz S3, bez servera.
2. **Prijava → API Gateway.** Kada student potvrdi prijavu, frontend šalje JSON
   paket na `POST /prijave`. API Gateway je konfigurisan sa **direktnom AWS
   integracijom u SQS** (bez posredničke Lambde), pa odmah vraća `202 Accepted`.
3. **SQS red poruka.** Zahtev se ubacuje u red kao poruka. Korisnik ne čeka
   obradu — sve dalje ide asinhrono. Neuspešne poruke posle 3 pokušaja odlaze u
   **Dead-Letter Queue** radi analize.
4. **Lambda okidač.** Nova poruka automatski okida `process-prijava` Lambdu
   (SQS event source mapping, batch do 10 poruka).
5. **Trajno skladištenje (S3).** Lambda validira i obogaćuje podatke (ID potvrde,
   timestamp, status) i upisuje JSON potvrdu u zaseban privatni `*-potvrde`
   bucket, particionisano po indeksu i datumu.

## Zašto ovaj dizajn

- **Razdvajanje (decoupling).** Frontend ne zna ništa o obradi; samo „ispali"
  poruku. Ako Lambda padne ili je spora, prijave se ne gube — čekaju u redu.
- **Skalabilnost.** SQS apsorbuje nalete (npr. početak ispitnog roka), a Lambda
  se skalira paralelno po broju poruka.
- **Otpornost.** VisibilityTimeout + retry + DLQ znače da se nijedna prijava ne
  gubi tiho.
- **Bez servera.** Nema EC2/kontejnera koje treba održavati; plaća se samo po
  pozivu.

## Resursi (definisani u `template.yaml`)

| Resurs | Uloga |
|---|---|
| `FrontendBucket` (S3) | Statičko hostovanje eStudent frontenda |
| `ConfirmationsBucket` (S3) | Trajne potvrde o prijavi (privatno, versioning) |
| `PrijaveQueue` (SQS) | Glavni red za asinhronu obradu |
| `PrijaveDLQ` (SQS) | Dead-letter queue za neuspele poruke |
| `PrijaveApi` (API Gateway) | REST endpoint `POST /prijave` → SQS |
| `ProcessPrijavaFunction` (Lambda) | Obrada poruke i upis potvrde u S3 |
| IAM role | Minimalne dozvole (API→SQS SendMessage, Lambda→S3 Write) |

## Deploy

Preduslovi: **AWS CLI** i **AWS SAM CLI**, `aws configure` podešen (nalog s
dozvolama za CloudFormation/S3/SQS/Lambda/API Gateway/IAM).

```bash
# iz root-a projekta
bash cloud/deploy.sh
```

Skripta radi build Lambde, `sam deploy`, upisuje `VITE_PRIJAVE_API_URL` u
`.env.production`, gradi frontend i sync-uje `dist/` na S3. Na kraju ispiše
javni URL sajta.

### Ručno

```bash
sam build --template cloud/template.yaml
sam deploy --guided            # prvi put; zapamti podešavanja u samconfig.toml

# pročitaj outpute
aws cloudformation describe-stacks --stack-name estudent-prijave \
  --query "Stacks[0].Outputs" --output table

# stavi ApiEndpoint u .env.production, pa:
npm run build
aws s3 sync dist/ s3://estudent-prijave-frontend/ --delete
```

## Provera da radi

1. Otvori frontend URL, prijavi neki ispit.
2. U SQS konzoli vidi da poruka prođe kroz red (broj poruka skoči pa padne).
3. U CloudWatch Logs (`/aws/lambda/estudent-prijave-process`) vidi log
   `OK prijava sacuvana: ...`.
4. U `estudent-prijave-potvrde` bucketu pojavi se
   `potvrde/<indeks>/<datum>/<uuid>.json`.

```bash
aws s3 ls s3://estudent-prijave-potvrde/potvrde/ --recursive
```

## Format poruke (JSON koji frontend šalje)

```json
{
  "studentName": "Petar Petrović",
  "studentIndex": "2024-0075",
  "examKey": "junski-rok-mat1",
  "examName": "Matematika 1",
  "examCode": "322001",
  "espb": 6,
  "periodLabel": "Junski ispitni rok",
  "date": "20.06.2026.",
  "location": "Amfiteatar 1",
  "price": 1000
}
```

Obavezna polja (Lambda validacija): `studentIndex`, `examName`, `periodLabel`.

## Brisanje (da ne troši resurse)

```bash
# S3 bucketi moraju biti prazni pre brisanja stack-a
aws s3 rm s3://estudent-prijave-frontend/ --recursive
aws s3 rm s3://estudent-prijave-potvrde/ --recursive
sam delete --stack-name estudent-prijave
```