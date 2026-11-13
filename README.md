# Keuangan Pribadi

Aplikasi web personal finance berbasis HTML, CSS, JavaScript, dan Supabase Auth. Frontend dirancang untuk GitHub Pages.

## Fitur prototipe
- Daftar akun, masuk, dan keluar melalui Supabase Auth.
- Ringkasan pemasukan, pengeluaran, dan arus kas berdasarkan transaksi.
- Form transaksi, anggaran bulanan, catatan utang/piutang, dan daftar aset.
- Ekspor CSV, backup JSON, dan pulihkan backup JSON.
- Tampilan responsif untuk desktop dan ponsel.

## Status penting
**Autentikasi menggunakan Supabase, tetapi data keuangan pada prototipe ini masih disimpan di localStorage browser.** Data belum disinkronkan ke tabel Supabase, jadi tidak berpindah otomatis antarperangkat. Jangan masukkan data keuangan sensitif sebelum integrasi penyimpanan dan pengujian akses per pengguna selesai.

Panduan konfigurasi: lihat [SETUP.md](SETUP.md).

## Teknologi
- GitHub Pages (frontend statis)
- Supabase Auth
- Supabase JavaScript SDK v2 melalui CDN
- Browser localStorage (prototipe data lokal)

## Keamanan
Frontend hanya boleh menggunakan **Supabase publishable key** (atau legacy anon key). Jangan pernah menaruh `service_role` key atau Supabase secret key di kode frontend, GitHub, atau browser.