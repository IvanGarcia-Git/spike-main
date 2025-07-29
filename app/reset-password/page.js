"use client"
import React, { useState,useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function NewPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [userUuid, setUserUuid] = useState('');

  useEffect(() => {
      const queryParams = new URLSearchParams(window.location.search);
      const token = queryParams.get("token");

      setUserUuid(token)
    }, []);

  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      setNewPassword('');
      setConfirmPassword('');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/reset-password/${userUuid}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newPassword, confirmPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage('Error al restablecer la contraseña');
        return;
      }
      alert('Contraseña actualizada con éxito');
    } catch (error) {
      setErrorMessage('Error al conectar con el servidor');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="bg-foreground shadow-md rounded-lg p-20 max-w-lg w-full">
        <h2 className="text-3xl text-black font-bold text-center text-primary mb-8">
          Restablecer contraseña
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-black mb-2" htmlFor="newPassword">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Introduce una contraseña..."
                className="w-full text-black px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={toggleNewPasswordVisibility}
                aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
              >
                {!showNewPassword ? <FaEyeSlash color='grey' /> : <FaEye color='grey' />}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-black font-semibold mb-2" htmlFor="confirmPassword">
              Confirmar contraseña
            </label>
            <div className="relative mb-6">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Introduce de nuevo la contraseña..."
                className="w-full text-black px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
              >
                {!showConfirmPassword ? <FaEyeSlash color='grey' /> : <FaEye color='grey' />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className={`block font-semibold text-red-500 mb-7`}>{errorMessage}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#faca15] text-black py-3 rounded-full font-semibold hover:bg-gray-300 transition-colors duration-200"
          >
            Restablecer contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewPasswordPage;

