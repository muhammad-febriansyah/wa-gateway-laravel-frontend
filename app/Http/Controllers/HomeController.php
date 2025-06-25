<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class HomeController extends Controller
{
    protected $gatewayBaseUrl;

    public function __construct()
    {
        $this->gatewayBaseUrl = env('WA_GATEWAY_URL', 'http://localhost:8080');
    }

    public function index()
    {
        try {
            $response = Http::timeout(10)->get("{$this->gatewayBaseUrl}/status");
            $data = $response->json();

            Log::info('WhatsApp Gateway Status Response:', $data);

            $status = $data['status'] ?? 'disconnected';
            $qrCode = $data['qrCode'] ?? null;
            $user = $data['user'] ?? null;
            $name = $data['name'] ?? null;
            $message = $data['message'] ?? null;

            if ($status === 'waiting_for_scan') {
                $displayMessage = 'Silakan scan QR Code di bawah ini untuk menghubungkan WhatsApp Anda.';
            } elseif ($status === 'connected') {
                $displayMessage = "WhatsApp Anda sudah terhubung sebagai {$name} ({$user})!";
            } else {
                $displayMessage = $message ?? 'WhatsApp Gateway tidak terhubung atau sedang mencoba menyambung. Silakan periksa log gateway.';
            }

            return Inertia::render('Home/Index', [
                'waStatus' => $status,
                'waQr' => $qrCode,
                'waUser' => $user,
                'waName' => $name,
                'waDisplayMessage' => $displayMessage,
                'waError' => null,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to connect to WhatsApp Gateway:', ['error' => $e->getMessage()]);
            return Inertia::render('Home/Index', [
                'waStatus' => 'error',
                'waQr' => null,
                'waUser' => null,
                'waName' => null,
                'waDisplayMessage' => 'Tidak dapat terhubung ke WhatsApp Gateway. Pastikan gateway berjalan. Error: ' . $e->getMessage(),
                'waError' => 'Koneksi ke gateway gagal',
            ]);
        }
    }

    public function sendPersonalMessage(Request $request)
    {
        $rules = [
            'to' => ['required', 'string'],
            'message' => ['nullable', 'string', Rule::requiredIf(function () use ($request) {
                return !$request->hasFile('file_dikirim') && empty($request->input('message'));
            })],
            'file_dikirim' => ['nullable', 'file', 'max:20480'],
        ];

        $messages = [
            'to.required' => 'Nomor penerima pribadi harus diisi.',
            'message.required_if' => 'Pesan teks kosong dan tidak ada file yang dilampirkan.',
            'file_dikirim.max' => 'Ukuran file terlalu besar (maksimal 20MB).',
        ];

        $request->validate($rules, $messages);

        $endpoint = '/send-message';
        $fullUrl = "{$this->gatewayBaseUrl}{$endpoint}";

        try {
            $payload = [
                'to' => $request->input('to'),
                'message' => $request->message,
            ];

            if ($request->hasFile('file_dikirim')) {
                $file = $request->file('file_dikirim');
                $response = Http::attach(
                    'file_dikirim',
                    file_get_contents($file->getRealPath()),
                    $file->getClientOriginalName(),
                    ['Content-Type' => $file->getMimeType()]
                )->post($fullUrl, $payload);
            } else {
                $response = Http::post($fullUrl, $payload);
            }

            if ($response->successful()) {
                Log::info('Pesan pribadi berhasil dikirim via Gateway:', [
                    'url' => $fullUrl,
                    'request_data' => $request->all(),
                    'response_body' => $response->json(),
                ]);
                return response()->json([
                    'status' => true,
                    'message' => 'Pesan pribadi berhasil dikirim',
                    'data' => $response->json()
                ]);
            } else {
                $gatewayResponse = $response->json();
                $gatewayMessage = $gatewayResponse['message'] ?? 'Kesalahan tidak diketahui dari gateway.';
                $gatewayError = $gatewayResponse['error'] ?? 'Tidak ada detail error spesifik.';

                Log::error('Gagal mengirim pesan pribadi melalui WhatsApp Gateway:', [
                    'url' => $fullUrl,
                    'request_data' => $request->all(),
                    'response_status' => $response->status(),
                    'response_body' => $response->body(),
                ]);

                return response()->json([
                    'status' => false,
                    'message' => 'Gagal mengirim pesan pribadi: ' . $gatewayMessage,
                    'error' => $gatewayError
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Pengecualian saat mengirim pesan pribadi ke WhatsApp Gateway:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Terjadi kesalahan saat mengirim pesan pribadi',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function sendGroupMessage(Request $request)
    {
        $rules = [
            'id_group' => ['required', 'string'],
            'message' => ['nullable', 'string', Rule::requiredIf(function () use ($request) {
                return !$request->hasFile('file_dikirim') && empty($request->input('message'));
            })],
            'file_dikirim' => ['nullable', 'file', 'max:20480'],
        ];

        $messages = [
            'id_group.required' => 'ID grup harus diisi.',
            'message.required_if' => 'Pesan teks kosong dan tidak ada file yang dilampirkan.',
            'file_dikirim.max' => 'Ukuran file terlalu besar (maksimal 20MB).',
        ];

        $request->validate($rules, $messages);

        $endpoint = '/send-group-message';
        $fullUrl = "{$this->gatewayBaseUrl}{$endpoint}";

        try {
            $payload = [
                'id_group' => $request->input('id_group'),
                'message' => $request->message,
            ];

            if ($request->hasFile('file_dikirim')) {
                $file = $request->file('file_dikirim');
                $response = Http::attach(
                    'file_dikirim',
                    file_get_contents($file->getRealPath()),
                    $file->getClientOriginalName(),
                    ['Content-Type' => $file->getMimeType()]
                )->post($fullUrl, $payload);
            } else {
                $response = Http::post($fullUrl, $payload);
            }

            if ($response->successful()) {
                Log::info('Pesan grup berhasil dikirim via Gateway:', [
                    'url' => $fullUrl,
                    'request_data' => $request->all(),
                    'response_body' => $response->json(),
                ]);
                return response()->json([
                    'status' => true,
                    'message' => 'Pesan grup berhasil dikirim',
                    'data' => $response->json()
                ]);
            } else {
                $gatewayResponse = $response->json();
                $gatewayMessage = $gatewayResponse['message'] ?? 'Kesalahan tidak diketahui dari gateway.';
                $gatewayError = $gatewayResponse['error'] ?? 'Tidak ada detail error spesifik.';

                Log::error('Gagal mengirim pesan grup melalui WhatsApp Gateway:', [
                    'url' => $fullUrl,
                    'request_data' => $request->all(),
                    'response_status' => $response->status(),
                    'response_body' => $response->body(),
                ]);

                return response()->json([
                    'status' => false,
                    'message' => 'Gagal mengirim pesan grup: ' . $gatewayMessage,
                    'error' => $gatewayError
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Pengecualian saat mengirim pesan grup ke WhatsApp Gateway:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Terjadi kesalahan saat mengirim pesan grup',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function connect()
    {
        try {
            $response = Http::timeout(10)->get("{$this->gatewayBaseUrl}/connect");
            $data = $response->json();
            $message = $data['message'] ?? 'Permintaan koneksi dikirim.';
            $status = $data['status'] ?? 'processing';

            return redirect()->route('home')->with('success', $message);
        } catch (\Throwable $e) {
            Log::error('Gagal memulai koneksi ke WhatsApp Gateway:', ['error' => $e->getMessage()]);
            return redirect()->route('home')->with('error', 'Gagal terhubung ke WhatsApp Gateway. Error: ' . $e->getMessage());
        }
    }

    public function disconnect()
    {
        try {
            $response = Http::post("{$this->gatewayBaseUrl}/disconnect");

            if ($response->successful()) {
                return redirect()->route('home')->with('success', 'WhatsApp berhasil diputus dan sesi dihapus. Anda dapat menghubungkan ulang.');
            } else {
                $errorDetails = $response->json('error') ?? $response->body();
                Log::error('Gagal memutuskan koneksi WhatsApp Gateway:', [
                    'response_status' => $response->status(),
                    'response_body' => $response->body(),
                ]);
                return redirect()->route('home')->with('error', 'Gagal memutuskan koneksi WhatsApp: ' . $errorDetails);
            }
        } catch (\Exception $e) {
            Log::error('Pengecualian saat memutuskan koneksi WhatsApp Gateway:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->route('home')->with('error', 'Terjadi kesalahan saat memutuskan koneksi: ' . $e->getMessage());
        }
    }

    public function getGroups()
    {
        try {
            $response = Http::timeout(10)->get("{$this->gatewayBaseUrl}/get-groups");

            if ($response->successful()) {
                return response()->json($response->json());
            } else {
                $errorDetails = $response->json('error') ?? $response->body();
                Log::error('Gagal mengambil grup dari WhatsApp Gateway:', [
                    'response_status' => $response->status(),
                    'response_body' => $response->body(),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mengambil daftar grup',
                    'error' => $errorDetails
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Pengecualian saat mengambil grup dari WhatsApp Gateway:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil daftar grup',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
