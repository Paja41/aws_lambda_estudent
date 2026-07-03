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