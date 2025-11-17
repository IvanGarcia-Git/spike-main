"use client";

import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import PageHeader from "@/components/page-header.component";

export default function Perfil() {
  const [activeTab, setActiveTab] = useState("info-personal");
  const [userData, setUserData] = useState({
    nombre: "Admin 2 Prueba",
    usuario: "admin",
    telefono: "-",
    correo: "test@test.com",
    numeroCuenta: "-",
    antiguedad: "0 días",
    fechaIngreso: "1/1/1970",
    turno: "dark_mode",
    horario: "-",
    horasSemana: "0h/sem",
    rol: "Agente",
  });

  return (
    <div className="p-6">
      <PageHeader title="Perfil" />

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Profile Picture and Navigation */}
        <div className="col-span-12 lg:col-span-4 flex flex-col items-center">
          {/* Profile Picture */}
          <div className="neumorphic-card rounded-full p-2 mb-4">
            <div className="w-32 h-32 rounded-full neumorphic-card-inset flex items-center justify-center">
              <span className="material-icons-outlined text-7xl text-slate-400">
                person
              </span>
            </div>
          </div>

          {/* User Name and Role */}
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {userData.nombre}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            {userData.rol}
          </p>

          {/* Navigation Tabs */}
          <div className="w-full space-y-3">
            <div
              onClick={() => setActiveTab("info-personal")}
              className={`neumorphic-card p-4 text-center font-medium cursor-pointer ${
                activeTab === "info-personal"
                  ? ""
                  : ""
              }`}
            >
              Inform. personal
            </div>
            <div
              onClick={() => setActiveTab("ausencias")}
              className="neumorphic-card-inset p-4 text-center text-slate-600 dark:text-slate-400 font-medium cursor-pointer hover:shadow-neumorphic-light dark:hover:shadow-neumorphic-dark"
            >
              Ausencias
            </div>
            <div
              onClick={() => setActiveTab("nominas")}
              className="neumorphic-card-inset p-4 text-center text-slate-600 dark:text-slate-400 font-medium cursor-pointer hover:shadow-neumorphic-light dark:hover:shadow-neumorphic-dark"
            >
              Nóminas
            </div>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Personal Information Card */}
          <div className="neumorphic-card p-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Nombre
                </label>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {userData.nombre}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Usuario
                </label>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {userData.usuario}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Teléfono
                </label>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {userData.telefono}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Correo
                </label>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {userData.correo}
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Nº Cuenta
                </label>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {userData.numeroCuenta}
                </p>
              </div>
            </div>
          </div>

          {/* Antigüedad Card */}
          <div className="neumorphic-card p-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Antigüedad en la empresa
            </h3>
            <p className="text-2xl font-bold text-primary">
              {userData.antiguedad}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {userData.fechaIngreso}
            </p>
          </div>

          {/* Turno and Horario Cards */}
          <div className="grid grid-cols-2 gap-6">
            <div className="neumorphic-card p-6">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Turno
              </h3>
              <div className="w-12 h-12 rounded-full neumorphic-card-inset flex items-center justify-center">
                <span className="material-icons-outlined text-primary text-3xl">
                  {userData.turno}
                </span>
              </div>
            </div>
            <div className="neumorphic-card p-6">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Horario
              </h3>
              <p className="text-lg font-medium text-slate-800 dark:text-slate-200">
                {userData.horario}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {userData.horasSemana}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
