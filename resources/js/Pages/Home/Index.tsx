import HomeLayout from "@/Layouts/HomeLayout";
import React, { useEffect, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { toast, Toaster } from "sonner";
import axios from "axios";

interface IndexProps {
    waStatus: "connected" | "waiting_for_scan" | "disconnected" | "error";
    waQr: string | null;
    waUser: string | null;
    waName: string | null;
    waDisplayMessage: string;
    waError: string | null;
}

export default function Index({
    waStatus,
    waQr,
    waUser,
    waName,
    waDisplayMessage,
    waError,
}: IndexProps) {
    const [currentStatus, setCurrentStatus] = useState(waStatus);
    const [currentQr, setCurrentQr] = useState(waQr);
    const [currentDisplayMessage, setCurrentDisplayMessage] =
        useState(waDisplayMessage);
    const [currentError, setCurrentError] = useState(waError);
    const [currentUser, setCurrentUser] = useState(waUser);
    const [currentName, setCurrentName] = useState(waName);

    const [groups, setGroups] = useState<any[]>([]);
    const [fetchingGroups, setFetchingGroups] = useState(false);

    const {
        data: individualMessageData,
        setData: setIndividualMessageData,
        reset: resetIndividualMessageForm,
    } = useForm({
        to: "",
        message: "",
        file_dikirim: null as File | null,
    });
    const [sendingIndividualMessage, setSendingIndividualMessage] =
        useState(false);
    const [individualMessageFormErrors, setIndividualMessageFormErrors] =
        useState<any>({});

    const {
        data: groupMessageData,
        setData: setGroupMessageData,
        reset: resetGroupMessageForm,
    } = useForm({
        id_group: "",
        message: "",
        file_dikirim: null as File | null,
    });
    const [sendingGroupMessage, setSendingGroupMessage] = useState(false);
    const [groupMessageFormErrors, setGroupMessageFormErrors] = useState<any>(
        {}
    );

    useEffect(() => {
        setCurrentStatus(waStatus);
        setCurrentQr(waQr);
        setCurrentDisplayMessage(waDisplayMessage);
        setCurrentError(waError);
        setCurrentUser(waUser);
        setCurrentName(waName);
    }, [waStatus, waQr, waDisplayMessage, waError, waUser, waName]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (currentStatus === "waiting_for_scan") {
            intervalId = setInterval(() => {
                router.reload({
                    only: [
                        "waStatus",
                        "waQr",
                        "waDisplayMessage",
                        "waUser",
                        "waName",
                        "waError",
                    ],
                });
            }, 5000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [currentStatus]);

    const handleSendIndividualMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingIndividualMessage(true);
        setIndividualMessageFormErrors({});

        const formData = new FormData();
        formData.append("to", individualMessageData.to);
        if (individualMessageData.message) {
            formData.append("message", individualMessageData.message);
        }
        if (individualMessageData.file_dikirim) {
            formData.append("file_dikirim", individualMessageData.file_dikirim);
        }

        try {
            const response = await axios.post(
                route("whatsapp.sendPersonal"),
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            toast.success("Pesan individu berhasil dikirim!");
            resetIndividualMessageForm();
        } catch (error: any) {
            console.error("Error sending individual message:", error);
            if (error.response?.status === 422) {
                setIndividualMessageFormErrors(error.response.data.errors);
                toast.error("Validasi gagal. Periksa kembali input Anda.");
            } else {
                toast.error(
                    "Gagal mengirim pesan individu: " +
                        (error.response?.data?.message || error.message)
                );
            }
        } finally {
            setSendingIndividualMessage(false);
        }
    };

    const handleSendGroupMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingGroupMessage(true);
        setGroupMessageFormErrors({});

        const formData = new FormData();
        formData.append("id_group", groupMessageData.id_group);
        if (groupMessageData.message) {
            formData.append("message", groupMessageData.message);
        }
        if (groupMessageData.file_dikirim) {
            formData.append("file_dikirim", groupMessageData.file_dikirim);
        }

        try {
            const response = await axios.post(
                route("whatsapp.sendGroup"),
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Accept: "application/json",
                    },
                }
            );
            toast.success("Pesan grup berhasil dikirim!");
            resetGroupMessageForm();
        } catch (error: any) {
            console.error("Error sending group message:", error);
            if (error.response?.status === 422) {
                setGroupMessageFormErrors(error.response.data.errors);
                toast.error("Validasi gagal. Periksa kembali input Anda.");
            } else {
                toast.error(
                    "Gagal mengirim pesan grup: " +
                        (error.response?.data?.message || error.message)
                );
            }
        } finally {
            setSendingGroupMessage(false);
        }
    };

    const handleConnect = () => {
        toast.info("Mencoba menghubungkan WhatsApp...");
        axios
            .post(route("whatsapp.connect"))
            .then((response) => {
                toast.success("Permintaan koneksi berhasil dikirim!");
                router.reload();
            })
            .catch((error) => {
                console.error("Error connecting:", error);
                toast.error(
                    "Gagal terhubung: " +
                        (error.response?.data?.message || error.message)
                );
            });
    };

    const handleDisconnect = () => {
        toast.promise(
            new Promise((resolve, reject) => {
                if (
                    window.confirm(
                        "Anda yakin ingin memutuskan koneksi? Sesi akan dihapus dan Anda perlu scan QR lagi."
                    )
                ) {
                    axios
                        .post(route("whatsapp.disconnect"))
                        .then((response) => {
                            resolve("Koneksi WhatsApp berhasil diputus.");
                            router.reload();
                        })
                        .catch((error) => {
                            reject(
                                "Gagal memutuskan koneksi: " +
                                    (error.response?.data?.message ||
                                        error.message)
                            );
                        });
                } else {
                    reject("Pembatalan oleh pengguna.");
                }
            }),
            {
                loading: "Memutuskan koneksi...",
                success: (data) => data,
                error: (error) => error,
            }
        );
    };

    const handleFetchGroups = async () => {
        setFetchingGroups(true);
        try {
            const response = await axios.get(route("whatsapp.getGroups"));
            const data = response.data;
            if (data.success) {
                setGroups(data.data);
                toast.success("Daftar grup berhasil dimuat!");
            } else {
                toast.error("Gagal memuat grup: " + data.error);
                console.error("Error fetching groups:", data.error);
            }
        } catch (error: any) {
            console.error("Error fetching groups:", error);
            toast.error(
                "Terjadi kesalahan saat memuat daftar grup: " +
                    (error.response?.data?.message || error.message)
            );
        } finally {
            setFetchingGroups(false);
        }
    };

    return (
        <HomeLayout>
            <Head title="WA Gateway" />
            <section className="container min-h-screen py-20 space-y-5">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Status WhatsApp Gateway
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {currentDisplayMessage}
                    </p>

                    <div className="flex items-center space-x-2 mb-4">
                        <span
                            className={`h-3 w-3 rounded-full ${
                                currentStatus === "connected"
                                    ? "bg-green-500"
                                    : currentStatus === "waiting_for_scan"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                            }`}
                        ></span>
                        <span className="font-medium capitalize">
                            Status: {currentStatus.replace(/_/g, " ")}
                        </span>
                    </div>

                    {currentStatus === "connected" &&
                        currentUser &&
                        currentName && (
                            <div className="mt-2 text-sm text-gray-600">
                                <p>
                                    Terhubung sebagai:{" "}
                                    <span className="font-semibold">
                                        {currentName}
                                    </span>{" "}
                                    (
                                    <span className="break-all">
                                        {currentUser}
                                    </span>
                                    )
                                </p>
                            </div>
                        )}

                    {currentStatus === "waiting_for_scan" && currentQr && (
                        <div className="mt-4 flex flex-col items-center">
                            <p className="text-sm text-gray-600 mb-2">
                                Pindai QR Code ini dengan WhatsApp Anda:
                            </p>
                            <img
                                src={currentQr}
                                alt="QR Code"
                                className="w-64 h-64 border border-gray-300 rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                QR Code akan otomatis diperbarui setiap 5 detik.
                            </p>
                        </div>
                    )}

                    {(currentStatus === "disconnected" ||
                        currentStatus === "error") && (
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleConnect}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            >
                                Connect WhatsApp
                            </button>
                        </div>
                    )}

                    {currentStatus === "connected" && (
                        <div className="mt-4">
                            <button
                                onClick={handleDisconnect}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                            >
                                Disconnect WhatsApp
                            </button>
                        </div>
                    )}

                    {currentError && (
                        <div className="mt-4 text-red-600">
                            <p>Error: {currentError}</p>
                        </div>
                    )}
                </div>

                {currentStatus === "connected" && (
                    <>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                Kirim Pesan ke Individu (Teks & Media)
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Kirim pesan teks atau lampiran file ke nomor
                                individu.
                            </p>

                            <form
                                onSubmit={handleSendIndividualMessage}
                                className="space-y-4"
                            >
                                <div>
                                    <label
                                        htmlFor="toInput"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Nomor Tujuan (contoh: 081234567890 atau
                                        6281234567890)
                                    </label>
                                    <input
                                        id="toInput"
                                        type="text"
                                        value={individualMessageData.to}
                                        onChange={(e) =>
                                            setIndividualMessageData(
                                                "to",
                                                e.target.value
                                            )
                                        }
                                        placeholder="081234567890"
                                        required
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                    {individualMessageFormErrors.to && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {individualMessageFormErrors.to}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="individualMessageText"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Pesan (Opsional jika kirim file)
                                    </label>
                                    <textarea
                                        id="individualMessageText"
                                        value={individualMessageData.message}
                                        onChange={(e) =>
                                            setIndividualMessageData(
                                                "message",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Tulis pesan Anda di sini..."
                                        rows={4}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    ></textarea>
                                    {individualMessageFormErrors.message && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {
                                                individualMessageFormErrors.message
                                            }
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="individualFileInput"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Lampirkan File (Opsional)
                                    </label>
                                    <input
                                        id="individualFileInput"
                                        type="file"
                                        onChange={(e) =>
                                            setIndividualMessageData(
                                                "file_dikirim",
                                                e.target.files
                                                    ? e.target.files[0]
                                                    : null
                                            )
                                        }
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {individualMessageFormErrors.file_dikirim && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {
                                                individualMessageFormErrors.file_dikirim
                                            }
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ukuran maks: 20MB. Format: JPG, PNG,
                                        GIF, MP3, MP4, PDF, DOCX, dll.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={sendingIndividualMessage}
                                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendingIndividualMessage
                                        ? "Mengirim..."
                                        : "Kirim Pesan Individu"}
                                </button>
                            </form>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                Kirim Pesan ke Grup (Teks & Media)
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Kirim pesan teks atau lampiran file ke grup.
                            </p>
                            <form
                                onSubmit={handleSendGroupMessage}
                                className="space-y-4"
                            >
                                <div>
                                    <label
                                        htmlFor="idGroupInput"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        ID Grup (contoh: 1234567890-123456@g.us)
                                    </label>
                                    <input
                                        id="idGroupInput"
                                        type="text"
                                        value={groupMessageData.id_group}
                                        onChange={(e) =>
                                            setGroupMessageData(
                                                "id_group",
                                                e.target.value
                                            )
                                        }
                                        placeholder="1234567890-123456@g.us"
                                        required
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                    {groupMessageFormErrors.id_group && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {groupMessageFormErrors.id_group}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="groupMessageText"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Pesan (Opsional jika kirim file)
                                    </label>
                                    <textarea
                                        id="groupMessageText"
                                        value={groupMessageData.message}
                                        onChange={(e) =>
                                            setGroupMessageData(
                                                "message",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Tulis pesan Anda di sini..."
                                        rows={4}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    ></textarea>
                                    {groupMessageFormErrors.message && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {groupMessageFormErrors.message}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="groupFileInput"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Lampirkan File (Opsional)
                                    </label>
                                    <input
                                        id="groupFileInput"
                                        type="file"
                                        onChange={(e) =>
                                            setGroupMessageData(
                                                "file_dikirim",
                                                e.target.files
                                                    ? e.target.files[0]
                                                    : null
                                            )
                                        }
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {groupMessageFormErrors.file_dikirim && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {
                                                groupMessageFormErrors.file_dikirim
                                            }
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ukuran maks: 20MB. Format: JPG, PNG,
                                        GIF, MP3, MP4, PDF, DOCX, dll.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={sendingGroupMessage}
                                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sendingGroupMessage
                                        ? "Mengirim..."
                                        : "Kirim Pesan Grup"}
                                </button>
                            </form>
                        </div>
                    </>
                )}

                {currentStatus === "connected" && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            Daftar Grup Terhubung
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Lihat daftar grup yang terhubung dengan WhatsApp
                            Anda.
                        </p>
                        <button
                            onClick={handleFetchGroups}
                            disabled={fetchingGroups}
                            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                        >
                            {fetchingGroups ? "Memuat..." : "Muat Daftar Grup"}
                        </button>

                        {groups.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {groups.map((group) => (
                                    <li key={group.id} className="py-2">
                                        <p className="font-medium text-gray-800">
                                            {group.name}
                                        </p>
                                        <p className="text-sm text-gray-600 break-all">
                                            ID: {group.id}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Anggota: {group.participants}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !fetchingGroups && (
                                <p className="text-gray-500">
                                    Belum ada grup yang dimuat. Klik "Muat
                                    Daftar Grup".
                                </p>
                            )
                        )}
                    </div>
                )}
            </section>
            <Toaster position="bottom-right" richColors />
        </HomeLayout>
    );
}
