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

### Ručno (ako više voliš korak-po-korak)

```bash
sam build --template cloud/template.yaml
sam deploy --guided            # prvi put; zapamti podešavanja u samconfig.toml

# procitaj outpute
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

## Napomene za produkciju

- Za HTTPS i keširanje stavi **CloudFront** ispred frontend bucketa (S3 website
  endpoint je samo HTTP).
- Suzi CORS `Access-Control-Allow-Origin` sa `*` na konkretan domen frontenda.
- Za autentifikaciju prijava dodaj Cognito authorizer na API Gateway.
