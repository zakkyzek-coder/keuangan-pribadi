# Keuangan Pribadi

Aplikasi web personal finance berbasis HTML, CSS, JavaScript, dan Supabase. Frontend dirancang untuk GitHub Pages.

## Fitur saat ini
- Daftar akun, masuk, keluar, dan sesi melalui Supabase Auth.
- Rekening awal otomatis dibuat saat pengguna pertama kali masuk.
- Pencatatan transaksi pemasukan dan pengeluaran ke tabel Supabase.
- Ringkasan saldo, transaksi terbaru, anggaran bulanan, laporan per bulan.
- Catatan utang/piutang dan daftar aset.
- Ekspor transaksi CSV, backup JSON versi 2, dan pemulihan backup.
- Tampilan responsif untuk desktop dan ponsel.

## Status integrasi
Transaksi, anggaran, utang/piutang, dan aset sudah dihubungkan ke tabel Supabase dengan query berdasarkan pengguna aktif. Data tidak lagi hanya disimpan di localStorage. Tabel menggunakan Row Level Security (RLS) sehingga akun hanya boleh mengakses baris miliknya sendiri.

**Sebelum menyimpan data keuangan nyata, lakukan pengujian end-to-end**: login, buat transaksi uji, refresh halaman, login dari browser/perangkat lain, dan pastikan akun kedua tidak dapat melihat data akun pertama. Pengujian browser langsung tetap perlu dilakukan setelah GitHub Pages aktif.

Panduan konfigurasi dan pengujian: lihat [SETUP.md](SETUP.md).

## Teknologi
- GitHub Pages (frontend statis)
- Supabase Auth + PostgreSQL
- Supabase JavaScript SDK v2 melalui CDN
- RLS dengan batas akses per `user_id`

## Batasan versi saat ini
- Rekening awal dibuat otomatis, tetapi antarmuka tambah/edit rekening belum tersedia.
- Form transaksi saat ini mencatat pemasukan dan pengeluaran; transfer antar-rekening belum tersedia.
- Pembayaran sebagian utang/piutang belum ada di antarmuka.
- Pemulihan backup mengganti data akun. Gunakan hanya dengan file backup yang valid dan jangan menghentikan proses.

## Keamanan
Frontend hanya menggunakan **Supabase publishable key**. Jangan pernah menaruh `service_role` key atau Supabase secret key di frontend, GitHub, atau browser.