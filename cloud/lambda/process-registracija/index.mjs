import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET = process.env.BUCKET_NAME;

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { ime, prezime, grad, telefon, jmbg, indeks, slikaBase64 } = body;

    if (!indeks || !slikaBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: "Nedostaju indeks ili slika" }) };
    }

    // Pretvaramo "2025/0001" u "2025_0001" za bezbedno ime foldera
    const safeIndex = String(indeks).replace(/[^\w-]/g, "_");

    // 1. Cuvanje tekstualnih podataka
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `registracije/${safeIndex}/podaci.json`,
      Body: JSON.stringify({ ime, prezime, grad, telefon, jmbg, indeks }, null, 2),
      ContentType: "application/json"
    }));

    // 2. Dekodiranje Base64 u sliku i cuvanje
    // Brisemo onaj prefiks 'data:image/jpeg;base64,' koji browser automatski dodaje
    const base64Data = slikaBase64.replace(/^data:image\/\w+;base64,/, "");
    const slikaBuffer = Buffer.from(base64Data, "base64");

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `registracije/${safeIndex}/slika_indeksa.jpg`,
      Body: slikaBuffer,
      ContentType: "image/jpeg"
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Registracija uspešno obrađena i sačuvana!" })
    };
  } catch (err) {
    console.error("Greska pri registraciji:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};