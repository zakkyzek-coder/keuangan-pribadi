# Setup GitHub Pages dan Supabase

## 1. Konfigurasikan Supabase key di frontend

1. Buka project Supabase **KeuanganPribadi**.
2. Buka pengaturan API keys project dan salin **Publishable key** (biasanya diawali `sb_publishable_`). Legacy `anon` key juga ditujukan untuk aplikasi publik bila masih digunakan.
3. Di file `index.html`, cari baris:
   ```js
   const SUPABASE_PUBLISHABLE_KEY = 'TEMPEL_PUBLISHABLE_KEY_DI_SINI';
   ```
4. Ganti placeholder dengan publishable key project tersebut, lalu simpan dan commit perubahan.

**Jangan gunakan key `service_role` atau secret key `sb_secret_` di frontend.** Publishable key memang digunakan di sisi browser; perlindungan data harus datang dari Supabase Auth dan Row Level Security (RLS).

## 2. Aktifkan GitHub Pages

1. Buka repository [keuangan-pribadi](https://github.com/zakkyzek-coder/keuangan-pribadi).
2. Pilih **Settings → Pages**.
3. Pada **Build and deployment**, pilih **Deploy from a branch**.
4. Pilih branch `main`, folder `/(root)`, lalu simpan.
5. Tunggu deployment selesai. Alamat situsnya:
   `https://zakkyzek-coder.github.io/keuangan-pribadi/`

File `index.html` sudah ada di root repository agar bisa dilayani oleh GitHub Pages.

## 3. Setel URL Auth di Supabase

Di project Supabase, buka **Authentication → URL Configuration**.

- **Site URL:** `https://zakkyzek.github.io/keuangan-pribadi/`
- **Redirect URLs:** tambahkan `https://zakkyzek-coder.github.io/keuangan-pribadi/`
- Jika ingin tes lokal, tambahkan juga `http://localhost:5500/**` dan buka situs memakai local web server, bukan langsung dari `file://`.

URL redirect harus sesuai dengan alamat situs yang benar-benar dipakai. Setelah mengganti username, nama repository, atau custom domain, perbarui konfigurasi ini juga.

## 4. Uji autentikasi

1. Buka URL GitHub Pages.
2. Daftar memakai email dan password yang kamu kontrol.
3. Jika **Confirm email** aktif, buka email konfirmasi dan ikuti tautannya.
4. Kembali ke situs, lalu masuk.
5. Coba keluar dan masuk kembali.

Jika email konfirmasi membawa ke alamat yang salah, cek kembali **Site URL** dan **Redirect URLs**. Jangan bagikan password atau email konfirmasi kepada siapa pun.

## 5. Status data dan langkah berikutnya

Saat ini login dan sesi menggunakan Supabase Auth, tetapi transaksi, anggaran, utang/piutang, dan aset di contoh UI masih disimpan pada `localStorage` browser per akun/perangkat. Itu hanya prototipe, **belum sinkron antarperangkat** dan bukan pengganti penyimpanan database.

Tahap selanjutnya sebelum memakai data nyata:
1. Integrasikan CRUD ke tabel Supabase.
2. Pastikan semua tabel memiliki RLS dan kebijakan hanya mengizinkan `auth.uid() = user_id`.
3. Uji bahwa akun pengguna lain tidak dapat membaca atau mengubah data.
4. Uji backup/restore, ekspor, dan alur pemulihan akun.

## Troubleshooting singkat

- **Pesan “isi Supabase Publishable key”:** placeholder di `index.html` belum diganti.
- **Email confirmation redirect salah:** periksa Site URL dan Redirect URLs.
- **Perubahan situs belum muncul:** pastikan commit berhasil dan deployment GitHub Pages selesai; lakukan hard refresh setelah itu.
- **Muncul error izin atau RLS saat integrasi database:** jangan mematikan RLS untuk mengatasinya; perbaiki kebijakan akses yang sesuai.