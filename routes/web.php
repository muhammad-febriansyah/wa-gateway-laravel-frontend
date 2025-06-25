<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::prefix('whatsapp')->name('whatsapp.')->group(function () {
    Route::get('/status', [HomeController::class, 'index'])->name('status'); // Jika index() juga menangani status
    Route::post('/connect', [HomeController::class, 'connect'])->name('connect');
    Route::post('/disconnect', [HomeController::class, 'disconnect'])->name('disconnect');
    Route::get('/get-groups', [HomeController::class, 'getGroups'])->name('getGroups');

    Route::post('/send-personal', [HomeController::class, 'sendPersonalMessage'])->name('sendPersonal');
    Route::post('/send-group', [HomeController::class, 'sendGroupMessage'])->name('sendGroup');
});
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
