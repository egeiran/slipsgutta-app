# Testbrukere

For å teste innloggingssystemet, kan du legge til testbrukere direkte i Supabase-databasen.

## SQL for å legge til testbrukere

Kjør følgende SQL i Supabase SQL Editor:

```sql
-- Legg til testbruker 1
INSERT INTO public.profiles (username, display_name, password, role)
VALUES ('eivind', 'Eivind', 'test123', 'admin');

-- Legg til testbruker 2
INSERT INTO public.profiles (username, display_name, password, role)
VALUES ('ole', 'Ole', 'test123', 'member');

-- Legg til testbruker 3  
INSERT INTO public.profiles (username, display_name, password, role)
VALUES ('per', 'Per', 'test123', 'member');
```

## Testinnlogging

Bruk en av følgende kombinasjoner for å logge inn:

- **Brukernavn:** `eivind`, **Passord:** `test123` (admin)
- **Brukernavn:** `ole`, **Passord:** `test123` (medlem)
- **Brukernavn:** `per`, **Passord:** `test123` (medlem)

## Viktig sikkerhetsnotat

⚠️ **ADVARSEL**: Dette systemet lagrer passord i klartekst, noe som **IKKE** er trygt for produksjon!

For et produksjonssystem bør du:
1. Bruke Supabase Auth i stedet for egendefinert autentisering
2. Eller implementere bcrypt/scrypt for passord-hashing
3. Aktivere HTTPS for all kommunikasjon
4. Implementere rate limiting på innloggingsforsøk
5. Legge til two-factor authentication

Dette er kun ment som en enkel demo for testing.
