import { authFetch } from "@/helpers/server-fetch.helper";
import { getCookie } from "cookies-next";
import { useEffect } from "react";
import { FiEye } from "react-icons/fi";

export default function CommunicationModal({ isModalOpen, setIsModalOpen, communication }) {
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [isModalOpen]);

    const handleMarkAsRead = async () => {
        const jwtToken = getCookie("factura-token");
        try {
            const response = await authFetch(
                "PATCH",
                `notifications/${communication.uuid}`,
                { read: 1, notified: 1 },
                jwtToken
            );
            if (response.ok) {
                setIsModalOpen();
            } else {
                alert("Error actualizando el estado de la notificacion en el servidor");
            }
        } catch (error) {
            console.error("Error enviando la solicitud:", error);
        }
    }

    if (!isModalOpen) return null;

    return (
        <div
            className={`fixed inset-0 flex justify-center bg-black bg-opacity-50 z-50 overflow-y-hidden`}
        >
            <div className="bg-background text-black p-12 rounded-lg shadow-lg w-full max-w-3xl relative my-auto overflow-y-auto max-h-[90vh]">
                <div className="text-center mb-16">
                    <h3 className="text-5xl font-bold text-yellow-500">Comunicado</h3>
                </div>
                <div className="flex flex-col">
                    <h3 className="text-3xl font-bold text-black mb-11">{communication.subject}</h3>
                    <h5 className="text-xl font-bold text-black mb-4">Contenido:</h5>
                    <p className="mb-9">{communication.content}</p>
                    <h5 className="text-xl font-bold text-black mb-4">Archivo:</h5>
                    {communication.documentUri ? (
                        <a
                            href={communication.documentUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-4"
                        >
                            <button
                                className="ml-auto hover:text-yellow-500 text-xs"
                            >
                                <FiEye size={26} />
                            </button>
                        </a>
                    ) : (
                        <p className="mb-4">No hay ningun archivo disponible.</p>
                    )

                    }
                    <div className="flex">
                        <button
                            onClick={handleMarkAsRead}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition ml-auto"
                        >
                            Marcar como leído
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

