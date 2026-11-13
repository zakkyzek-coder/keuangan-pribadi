# Setup GitHub Pages dan Supabase

## 1. Konfigurasi Supabase

Frontend sudah diatur menggunakan Supabase project `KeuanganPribadi` dan publishable key. Kunci ini memang digunakan dari browser; jangan pernah menggantinya dengan `service_role` atau secret key.

## 2. Aktifkan GitHub Pages

1. Buka repository [keuangan-pribadi](https://github.com/zakkyzek-coder/keuangan-pribadi).
2. Pilih **Settings → Pages**.
3. Pada **Build and deployment**, pilih **Deploy from a branch**.
4. Pilih branch `main`, folder `/(root)`, lalu simpan.
5. Tunggu deployment selesai. Alamat situsnya:
   `https://zakkyzek-coder.github.io/keuangan-pribadi/`

File frontend adalah `index.html`; modul data cloud ada di `cloud-app.js` di root repository.

## 3. Setel URL Auth di Supabase

Di project Supabase, buka [Authentication → URL Configuration](https://supabase.com/dashboard/project/oygogokxwmdcmaaccevc/auth/url-configuration).

- **Site URL:** `https://zakkyzek-coder.github.io/keuangan-pribadi/`
- **Redirect URLs:** tambahkan `https://zakkyzek-coder.github.io/keuangan-pribadi/`
- Untuk pengujian lokal, bila diperlukan, tambahkan `http://localhost:5500/**` dan akses melalui local web server, bukan `file://`.

URL redirect harus cocok dengan alamat situs yang benar-benar digunakan.

## 4. Uji alur aplikasi

Gunakan data uji, bukan data keuangan sensitif, sampai pengujian selesai.

1. Buka URL GitHub Pages dan buat akun dengan email yang kamu kontrol.
2. Jika **Confirm email** aktif, buka email konfirmasi dan ikuti tautannya.
3. Masuk dan pastikan status hijau menyebut bahwa aplikasi tersambung ke Supabase.
4. Buat satu transaksi uji, misalnya pemasukan Rp100.000 dan pengeluaran Rp25.000.
5. Muat ulang halaman; transaksi seharusnya tetap ada. Coba masuk ke akun yang sama dari browser/perangkat lain untuk memastikan sinkronisasi.
6. Tambahkan satu anggaran, satu catatan utang/piutang, dan satu aset uji; cek juga setelah refresh.
7. Uji akun pengguna kedua dengan data dummy: pengguna kedua tidak boleh dapat melihat data pengguna pertama.
8. Uji ekspor CSV serta backup JSON. Untuk menguji restore, gunakan data uji saja; restore mengganti data akun dan proses yang terhenti bisa membuat data tidak lengkap.

## 5. Status penyimpanan

Operasi transaksi, anggaran, utang/piutang, dan aset sudah terhubung ke tabel Supabase. Rekening dan kategori dasar dibuat otomatis saat pengguna pertama kali masuk. RLS diaktifkan untuk tujuh tabel dan kebijakannya membatasi akses dengan `user_id` pengguna yang sedang login.

Batasan antarmuka saat ini: belum ada form tambah/edit rekening, transaksi transfer antar-rekening, atau pembayaran sebagian utang/piutang. Jangan gunakan sebagai satu-satunya catatan keuangan tanpa backup berkala.

## Troubleshooting

- **Situs tidak bisa dibuka:** cek **Settings → Pages** di GitHub dan pastikan deployment selesai.
- **Email konfirmasi kembali ke URL yang salah:** cek **Site URL** dan **Redirect URLs** di Supabase.
- **Status gagal memuat data:** salin pesan error yang muncul (jangan sertakan password atau token), lalu gunakan pesan tersebut untuk diagnosis.
- **Izin ditolak atau error RLS:** jangan mematikan RLS; perbaiki kebijakan akses yang sesuai.
- **Perubahan situs belum muncul:** pastikan commit terbaru sudah ada di `main`, tunggu deployment, lalu lakukan hard refresh.