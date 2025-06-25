Deskripsi GitHub: WhatsApp Gateway dengan Laravel (Revisi Terbaru)
WhatsApp Gateway ini adalah sebuah aplikasi berbasis Laravel yang berfungsi sebagai jembatan untuk mengelola dan mengirim pesan WhatsApp secara terprogram. Dengan adanya revisi terbaru, aplikasi ini kini hadir dengan peningkatan signifikan pada antarmuka pengguna dan penambahan fitur-fitur penting untuk pengalaman yang lebih mulus dan fungsionalitas yang lebih luas.

Fitur Utama yang Baru Direvisi/Ditambahkan:

Status Koneksi WhatsApp Real-time: Pantau status koneksi WhatsApp (Connected, Waiting for Scan, Disconnected, Error) langsung dari dasbor dengan indikator visual yang jelas. Dilengkapi dengan pembaruan otomatis QR Code setiap 5 detik saat menunggu pemindaian, memastikan Anda selalu memiliki QR terbaru.
Pengelolaan Sesi WhatsApp: Fitur untuk menghubungkan dan memutuskan sesi WhatsApp dengan mudah. Saat sesi terputus, data sesi akan dihapus, dan QR Code baru akan ditampilkan untuk pemindaian ulang.
Kirim Pesan Individu (Teks & Media): Kemampuan untuk mengirim pesan teks, gambar, video, atau dokumen ke nomor WhatsApp individu secara langsung dari aplikasi. Mendukung berbagai format file media dan dokumen dengan ukuran maksimal 20MB.
Kirim Pesan Grup (Teks & Media): Perluas jangkauan pesan Anda dengan mengirim pesan teks, gambar, video, atau dokumen ke grup WhatsApp yang terhubung. Ini memungkinkan komunikasi massal yang efisien untuk notifikasi, promosi, atau pengumuman.
Validasi Formulir Komprehensif: Penerapan validasi sisi klien dan sisi server yang ketat untuk setiap formulir pengiriman pesan, memberikan umpan balik kesalahan yang jelas kepada pengguna dan mencegah pengiriman data yang tidak valid.
Daftar Grup Terhubung: Fitur untuk memuat dan menampilkan daftar grup WhatsApp yang saat ini terhubung dengan akun WhatsApp Anda, lengkap dengan ID dan jumlah partisipan. Ini memudahkan identifikasi grup untuk pengiriman pesan massal.
Notifikasi Pengguna Interaktif: Integrasi dengan sonner untuk notifikasi toast yang informatif dan menarik secara visual untuk setiap aksi (sukses, error, loading), meningkatkan user experience.
Optimasi Antarmuka Pengguna: Penyesuaian pada tata letak dan gaya komponen menggunakan Tailwind CSS untuk tampilan yang lebih bersih, responsif, dan intuitif.
Teknologi yang Digunakan:

Backend: Laravel (PHP)
Frontend: React.js dengan Inertia.js
Styling: Tailwind CSS
Integrasi WhatsApp: (Sebutkan library/API yang digunakan, contoh: whatsapp-web.js atau sejenisnya jika relevan)
Notifikasi: Sonner
HTTP Client: Axios
Instalasi & Penggunaan:

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi:

Bash

# Clone repositori
git clone https://github.com/your-username/whatsapp-gateway-laravel.git

# Masuk ke direktori proyek
cd whatsapp-gateway-laravel

# Instal dependensi Composer
composer install

# Instal dependensi Node.js
npm install

# Buat file .env dan atur konfigurasi database serta WA_GATEWAY_URL
cp .env.example .env
php artisan key:generate

# Migrasi database
php artisan migrate

# Jalankan server pengembangan Laravel
php artisan serve

# Jalankan Vite untuk frontend
npm run dev
