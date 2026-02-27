# MeetRec

MeetRec adalah aplikasi web berbasis Next.js untuk menjadwalkan, merekam, dan mentranskrip berbagai jenis meeting secara otomatis. Aplikasi ini terintegrasi dengan berbagai provider meeting seperti Google Meet dan Jitsi, serta menggunakan Recall.ai untuk kebutuhan perekaman bot dan transkripsi.

## Fitur Utama

- 🏠 **Dashboard**: Ringkasan jadwal meeting, bot aktif, dan rekaman terbaru.
- 📅 **Schedule (Jadwal)**: Integrasi dengan Google Calendar untuk melihat dan mengelola jadwal meeting yang akan datang.
- 🤖 **Bot Management**: Mengelola bot perekam (Recall.ai) yang akan bergabung ke dalam meeting secara otomatis.
- 🎥 **Jitsi Integration**: Menyelenggarakan dan bergabung langsung ke ruangan Jitsi Meet dari dalam aplikasi.
- 🔴 **Recordings**: Akses dan putar kembali hasil rekaman meeting yang telah selesai.
- 📝 **Transcripts**: Melihat hasil transkripsi teks dari meeting yang direkam.

## Tech Stack

Proyek ini dibangun menggunakan teknologi terbaru untuk memastikan performa dan Developer Experience (DX) terbaik:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI/Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Icons)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **API & Integrations**:
  - [Google APIs](https://github.com/googleapis/google-api-nodejs-client) (Calendar & Meet)
  - [Recall.ai](https://www.recall.ai/) (Meeting Recording & Transcription Bots)
  - [Jitsi Meet API](https://jitsi.org/jitsi-meet/)
- **Utilities**: `date-fns` untuk manipulasi format waktu dan tanggal.

## Prasyarat (Prerequisites)

Sebelum menjalankan aplikasi, pastikan Anda telah menginstal:

- [Node.js](https://nodejs.org/en/) (v20 atau lebih baru)
- Akun dan kredensial API untuk:
  - Google Cloud Console (OAuth 2.0 Client ID & Client Secret)
  - Recall.ai API Key
  - (Opsional) Jitsi Meet SDK / Server jika menggunakan self-hosted

## Instalasi & Menjalankan secara Lokal

1. **Clone repository ini**
   ```bash
   git clone https://github.com/Hystr1x00/MeetRec.git
   cd meeting-recording
   ```

2. **Instal dependencies**
   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

3. **Setup Environment Variables**
   Buat file `.env.local` di root direktori proyek dan tambahkan variabel yang dibutuhkan (sesuaikan dengan kredensial API Anda):
   ```env
   # Next Auth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_key

   # Google API
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Recall.ai
   RECALL_API_KEY=your_recall_api_key
   ```

4. **Jalankan development server**
   ```bash
   npm run dev
   # atau
   yarn dev
   ```

5. **Buka Aplikasi**
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

## Struktur Folder Utama

```text
src/
├── app/
│   ├── (app)/            # Halaman utama aplikasi (Dashboard, Jitsi, Bots, dll)
│   ├── api/              # API Routes (Auth, Bots, Meetings)
│   ├── login/            # Halaman Login
│   ├── globals.css       # Global styles (Tailwind)
│   └── layout.tsx        # Root layout Next.js
├── components/           # Reusable UI Components (Sidebar, dll)
├── lib/                  # Helper functions & API Clients (Google, Recall.ai, Auth)
└── types/                # TypeScript Interfaces & Types
```

## Deployment

Aplikasi Next.js ini dapat di-deploy dengan sangat mudah menggunakan [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme). Pastikan Anda mengatur semua **Environment Variables** di dashboard platform deployment pilihan Anda.

## Kontribusi

Silakan buat *Pull Request* (PR) atau buka *Issues* jika Anda menemukan bug atau ingin menambahkan fitur baru.

---
*Dibuat untuk kebutuhan perekaman meeting yang lebih cerdas.*
