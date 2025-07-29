"use client";
import { authFetch, getFetch, postFetch } from "@/helpers/server-fetch.helper";
import { useState } from "react";

export default function EmailResetPasswordModal({
    isModalOpen,
    setIsModalOpen
}) {
    const [email, setEmail] = useState("");
    const [messageError, setMessageError] = useState("");
    const [userNotFound, setUserNotFound] = useState(false);

    const sendResetPasswordEmail = async (uuid, email) => {
        
        try {
            const response = await postFetch('users/send-reset-password', {uuid: uuid, email: email});

            const data = await response.json();

            if (!response.ok) {
                alert('Error al enviar el correo de restablecimiento');
            }

            return data;
        } catch (error) {
            console.error('Failed sending the email:', error.message);
            throw error;
        }
    };

    const handleSendEmail = async (event) => {
        event.preventDefault();

        if (email === '') {
            setMessageError('No se ha introducido ningún correo electrónico.')
            return;
        }

        try {
            const response = await getFetch(`users/by-email/${email}`);

            if (response.ok) {
                const user = await response.json();

                if (user) {
                    setUserNotFound(false);
                    setIsModalOpen(false);
                    sendResetPasswordEmail(user.uuid, email);
                    alert("Correo enviado con exito")
                }
                else {
                    setUserNotFound(true);
                    setMessageError("No existe usuario con este correo.")
                    setEmail('');
                }
            } else {
                alert("Usuario no encontrado");
            }
        } catch (error) {
            console.error("Error enviando la solicitud:", error);
        }

    }

    return (
        <div className={`bg-foreground text-black p-10 rounded-lg shadow-lg w-full max-w-lg`}>
            <h2 className="text-3xl text-black font-bold text-center text-primary mt-5 mb-8">
                Restablecer contraseña
            </h2>
            <p className="block text-base font-semibold text-black mb-8">
                Por favor, introduce tu correo electrónico para restablecer tu contraseña:
            </p>
            <input
                placeholder="Escribe aquí tu correo..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full text-black px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${userNotFound ? "mb-3" : "mb-12"}`}
            />
            <p className={`block text-base font-semibold text-red-500 ${messageError ? "ml-1 mb-14" : "hidden"}`}>
                {messageError}
            </p>
            <div className="flex justify-end gap-4">
                <button onClick={() => setIsModalOpen(false)} className="w-full bg-[#ff3737] text-white py-3 rounded-full font-semibold hover:bg-red-600 transition-colors duration-200">Cancelar</button>
                <button onClick={handleSendEmail} className="w-full bg-[#faca15] text-white py-3 rounded-full font-semibold hover:bg-[#ffdb58] transition-colors duration-200">Enviar</button>
            </div>
        </div>
    );
}
