// =====================================================================
//  Lambda: process-prijava
//  Okida se na svaku novu poruku iz SQS reda (event source mapping).
//  Zadatak: validira JSON prijave studenta, obogati ga metapodacima
//  (ID potvrde, timestamp, status) i trajno sacuva kao potvrdu u S3.
// =====================================================================

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const s3 = new S3Client({});
const BUCKET = process.env.CONFIRMATIONS_BUCKET;

// Polja koja frontend salje pri prijavi (iz PrijavaIspitaView.tsx)
const REQUIRED_FIELDS = ["studentIndex", "examName", "periodLabel"];

/**
 * Validira jednu prijavu. Baca gresku ako nedostaju obavezna polja.
 */
function validatePrijava(data) {
  if (typeof data !== "object" || data === null) {
    throw new Error("Telo poruke nije validan JSON objekat.");
  }
  const missing = REQUIRED_FIELDS.filter(
    (f) => data[f] === undefined || data[f] === null || data[f] === ""
  );
  if (missing.length > 0) {
    throw new Error(`Nedostaju obavezna polja: ${missing.join(", ")}`);
  }
}

/**
 * Pravi objekat potvrde koji se cuva u S3.
 */
function buildConfirmation(data) {
  const confirmationId = randomUUID();
  const now = new Date().toISOString();
  return {
    confirmationId,
    status: "POTVRDJENO",
    processedAt: now,
    student: {
      name: data.studentName ?? null,
      index: data.studentIndex,
    },
    exam: {
      key: data.examKey ?? null,
      name: data.examName,
      code: data.examCode ?? null,
      espb: data.espb ?? null,
      period: data.periodLabel,
      date: data.date ?? null,
      location: data.location ?? null,
      price: data.price ?? 0,
    },
    source: "eStudent-portal",
  };
}

/**
 * S3 kljuc: particionisan po indeksu i datumu -> lako pretrazivanje.
 * npr. potvrde/2024-0075/2026-06-12/<uuid>.json
 */
function buildS3Key(confirmation) {
  const day = confirmation.processedAt.slice(0, 10); // YYYY-MM-DD
  const safeIndex = String(confirmation.student.index).replace(/[^\w-]/g, "_");
  return `potvrde/${safeIndex}/${day}/${confirmation.confirmationId}.json`;
}

export const handler = async (event) => {
  // Skupljamo ID-jeve poruka koje NISU uspele, da se samo one vrate u red.
  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      const payload = JSON.parse(record.body);
      validatePrijava(payload);

      const confirmation = buildConfirmation(payload);
      const key = buildS3Key(confirmation);

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: JSON.stringify(confirmation, null, 2),
          ContentType: "application/json",
          Metadata: {
            "confirmation-id": confirmation.confirmationId,
            "student-index": String(confirmation.student.index),
          },
        })
      );

      console.log(
        `OK prijava sacuvana: ${key} (student ${confirmation.student.index}, predmet ${confirmation.exam.name})`
      );
    } catch (err) {
      // Ne rusimo ceo batch - obelezavamo samo ovu poruku kao neuspelu.
      console.error(
        `GRESKA za messageId=${record.messageId}:`,
        err.message
      );
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  // Poruke iz batchItemFailures se vracaju u SQS (retry), ostale se brisu.
  // Posle maxReceiveCount (3) neuspeha, poruka odlazi u DLQ.
  return { batchItemFailures };
};
