# Deployment Guide (Cloudflare)

## Opsi 1: Menggunakan Cloudflare Pages (Rekomendasi)
Ini adalah cara terbaik untuk men-deploy aplikasi React (Vite).
Jalankan perintah ini di terminal Anda:
```bash
npm run deploy:pages
```

## Opsi 2: Menggunakan Cloudflare Workers
Jika Anda benar-benar harus menggunakan Cloudflare Workers (dengan domain `.workers.dev`), jalankan perintah ini:
```bash
npm run deploy:worker
```
*(Catatan: Anda akan diminta untuk login ke akun Cloudflare Anda jika belum).*
