"use client";

import { useState } from "react";
import {
  FiChevronDown as ChevronDown,
  FiEdit2 as Edit,
  FiPlus as Plus,
  FiTrash2 as Trash2,
  FiArrowUp as ArrowUp,
  FiArrowDown as ArrowDown,
} from "react-icons/fi";
import { format, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/perfil/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/perfil/table";
import { getCookie } from "cookies-next";
import { useEffect } from "react";

export default function NominasSection({ userInfo, userGroupId }) {
  const [payrolls, setPayrolls] = useState([]);

  useEffect(() => {
    if (!userInfo?.id) {
      setPayrolls([]);
      return;
    }

    async function loadPayrolls() {
      const jwtToken = getCookie("factura-token");
      let url = `${process.env.NEXT_PUBLIC_API_URL}/payrolls/${userInfo.id}`;

      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        });

        if (!res.ok) {
          console.error("Error fetching payrolls:", res.statusText);
          alert("Error al cargar las nóminas.");
          return;
        }

        const data = await res.json();

        const transformedPayrolls = data.map((payrollFromApi) => ({
          ...payrollFromApi,
          amount: parseFloat(payrollFromApi.qty),
        }));

        setPayrolls(transformedPayrolls);
      } catch (err) {
        console.error("Network error loading nóminas:", err);
        alert("Error de red al intentar cargar las nóminas.");
      }
    }

    loadPayrolls();
  }, [userInfo]);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [isNewPayrollOpen, setIsNewPayrollOpen] = useState(false);
  const [isEditPayrollOpen, setIsEditPayrollOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [newPayrollDate, setNewPayrollDate] = useState(new Date());
  const [newPayrollAmount, setNewPayrollAmount] = useState("");
  const [newPayrollState, setNewPayrollState] = useState("pendiente");
  const [averagePeriod, setAveragePeriod] = useState("3");
  const sortedPayrolls = [...payrolls].sort((a, b) => new Date(b.date) - new Date(a.date));
  const filteredPayrolls = showAll
    ? sortedPayrolls
    : sortedPayrolls.filter(
        (p) => differenceInMonths(new Date(), new Date(p.date)) < parseInt(averagePeriod, 10)
      );

  function calculateAverage() {
    const months = parseInt(averagePeriod, 10);
    const newPayrollMixingSameMonths = sortedPayrolls.reduce((acc, curr) => {
      const monthYear = formatMonthYear(curr.date);
      if (!acc[monthYear]) {
        acc[monthYear] = {
          amount: 0,
          count: 0,
        };
      }
      acc[monthYear].amount += curr.amount;
      acc[monthYear].count += 1;
      return acc;
    }, {});
    const relevant = Object.values(newPayrollMixingSameMonths).slice(0, months);
    if (!relevant.length) return 0;
    const sum = relevant.reduce((acc, p) => acc + p.amount, 0);
    return Math.round(sum / relevant.length);
  }

  function clampPct(pct) {
    return Math.min(Math.abs(pct), 100);
  }

  function pctToDegrees(pct) {
    return clampPct(pct) * 3.6;
  }

  function calculatePercentageChange() {
    if (sortedPayrolls.length < 2) return 0;
    const payrollsGroupedByMonth = sortedPayrolls.reduce((acc, curr) => {
      const monthYear = formatMonthYear(curr.date);
      if (!acc[monthYear]) {
        acc[monthYear] = {
          amount: 0,
          count: 0,
        };
      }
      acc[monthYear].amount += curr.amount;
      acc[monthYear].count += 1;
      return acc;
    }, {});

    const monthsArray = Object.values(payrollsGroupedByMonth || {});
    if (monthsArray.length < 2) return 0;

    const latestAmount = monthsArray[0]?.amount;
    const previousAmount = monthsArray[1]?.amount;

    if (!latestAmount || !previousAmount || previousAmount === 0) return 0;
    return ((latestAmount - previousAmount) / previousAmount) * 100;
  }

  function formatMonthYear(d) {
    return format(new Date(d), "MMMM yy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase());
  }

  function toInputDate(date) {
    if (!date) return "";

    const d = date instanceof Date ? date : new Date(date);

    if (Number.isNaN(d.getTime())) return "";

    return d.toISOString().slice(0, 10);
  }

  const percentageChange = calculatePercentageChange();
  const dialDegrees = pctToDegrees(percentageChange);
  const dialColor = percentageChange >= 0 ? "border-t-green-500" : "border-t-red-500";
  const average = calculateAverage();

  const handleAddPayroll = async (userIdForPayroll) => {
    const jwtToken = getCookie("factura-token");

    if (!userIdForPayroll) {
      alert("Error: No se ha especificado un usuario para la nómina.");
      console.error("handleAddPayroll Error: userIdForPayroll is missing.");
      return;
    }

    const formattedDate = new Date(newPayrollDate).toISOString().split("T")[0];
    const payrollData = {
      userId: Number(userIdForPayroll),
      date: formattedDate,
      qty: parseFloat(newPayrollAmount),
      state: newPayrollState,
    };

    if (!payrollData.date || isNaN(payrollData.qty) || payrollData.qty <= 0 || !payrollData.state) {
      alert("Por favor, complete todos los campos de la nómina correctamente.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payrolls/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(payrollData),
      });

      if (response.ok) {
        const createdPayrollFromAPI = await response.json();

        const newPayrollForState = {
          id: createdPayrollFromAPI.id,
          uuid: createdPayrollFromAPI.uuid,
          date: createdPayrollFromAPI.date,
          amount: parseFloat(createdPayrollFromAPI.qty),
          state: createdPayrollFromAPI.state,
          userId: createdPayrollFromAPI.userId,
        };

        setPayrolls((prevPayrolls) => [newPayrollForState, ...prevPayrolls]);
        setIsNewPayrollOpen(false);

        setNewPayrollDate(new Date());
        setNewPayrollAmount("");
        setNewPayrollState("pendiente");
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error desconocido al crear la nómina." }));
        alert(`Error al crear la nómina: ${errorData.message || response.statusText}`);
        console.error("Server error response:", errorData);
      }
    } catch (error) {
      console.error("Error en la solicitud para crear la nómina:", error);
      alert("Error de red o conexión al intentar crear la nómina.");
    }
  };

  function openEditDialog(p) {
    setSelectedPayroll(p);
    setNewPayrollDate(p.date);
    setNewPayrollAmount(p.amount.toString());
    setNewPayrollState(p.state);
    setIsEditPayrollOpen(true);
  }

  async function handleEditPayroll(uuid) {
    const jwtToken = getCookie("factura-token");
    if (!jwtToken) {
      alert("Sesión expirada. Vuelve a iniciar sesión.");
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL}/payrolls/${uuid}`;

    const formattedDate = new Date(newPayrollDate).toISOString().split("T")[0];

    const payrollData = {
      date: formattedDate,
      qty: parseFloat(newPayrollAmount),
      state: newPayrollState,
    };

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(payrollData),
      });

      if (!response.ok) {
        const { message } = await response.json().catch(() => ({}));
        alert(message || "Error al editar la nómina.");
        return;
      }

      setPayrolls((prev) =>
        prev.map((p) =>
          p.uuid === uuid
            ? {
                ...p,
                date: newPayrollDate,
                amount: parseFloat(newPayrollAmount),
                state: newPayrollState,
              }
            : p
        )
      );
    } catch (error) {
      console.error("Network error:", error);
      alert("Error de red o conexión al intentar editar la nómina.");
    } finally {
      setSelectedPayroll(null);
      setNewPayrollDate(new Date());
      setNewPayrollAmount("");
      setNewPayrollState("pendiente");
      setIsEditPayrollOpen(false);
    }
  }

  async function handleDeletePayroll(uuid) {
    const jwtToken = getCookie("factura-token");
    if (!jwtToken) {
      alert("Sesión expirada. Vuelve a iniciar sesión.");
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL}/payrolls/${uuid}`;

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        console.error("Error deleting payroll:", response.statusText);
        alert("Error al eliminar la nómina.");
        return;
      }

      setPayrolls((prev) => prev.filter((p) => p.uuid !== uuid));
    } catch (error) {
      console.error("Error en la solicitud para eliminar la nómina:", error);
      alert("Error de red o conexión al intentar eliminar la nómina.");
    }
  }

  return (
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex justify-between gap-4">
              <div className="flex gap-2 justify-between items-center">
                <CardTitle>Nóminas</CardTitle>
                {userGroupId === 1 && (
                  <button
                    type="button"
                    onClick={() => setIsNewPayrollOpen(true)}
                    className="flex items-center px-4 py-2 rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva nómina
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="text-sm text-black hover:text-black/80 text-right"
              >
                {showAll ? "Ver menos" : "Ver todas"}
              </button>
            </CardHeader>

            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Últimos {averagePeriod} meses
              </div>

              <Table>
                <TableHeader className="bg-background">
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Estado</TableHead>
                    {userGroupId === 1 && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayrolls.map((p) => (
                    <TableRow key={p.uuid}>
                      <TableCell className="font-medium">{formatMonthYear(p.date)}</TableCell>
                      <TableCell>{p.amount.toFixed(2)} €</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            p.state == "pagada"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {p.state == "pagada" ? "Pagada" : "Pendiente"}
                        </span>
                      </TableCell>
                      {userGroupId === 1 && (
                        <TableCell className="relative text-right">
                          <button
                            type="button"
                            className="p-2"
                            onClick={() => setOpenMenuId(openMenuId === p.uuid ? null : p.uuid)}
                          >
                            <ChevronDown className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </button>

                          {openMenuId === p.uuid && (
                            <ul
                              className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                              onMouseLeave={() => setOpenMenuId(null)}
                            >
                              <li>
                                <button
                                  onClick={() => {
                                    openEditDialog(p);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => {
                                    handleDeletePayroll(p.uuid);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </button>
                              </li>
                            </ul>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}

                  {filteredPayrolls.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={userGroupId === 1 ? 4 : 3}>
                        <div className="text-center text-gray-500">No hay nóminas disponibles.</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Sueldo medio</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-muted-foreground">En</span>
                <div className="w-[100px]">
                  <select
                    value={averagePeriod}
                    onChange={(e) => {
                      setAveragePeriod(e.target.value);
                      setShowAll(false);
                    }}
                    className="w-full cursor-pointer border border-gray-300 bg-white text-black rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Periodo
                    </option>
                    <option value="3">3 meses</option>
                    <option value="6">6 meses</option>
                    <option value="12">12 meses</option>
                  </select>
                </div>
              </div>

              <div className="relative w-48 h-48 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />

                <div
                  className={`absolute inset-0 rounded-full border-4 border-transparent ${dialColor}`}
                  style={{
                    transform: `rotate(${dialDegrees}deg)`,
                    transition: "transform 1s ease-out",
                  }}
                />

                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold">{average} €</span>
                </div>
              </div>

              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  percentageChange >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {percentageChange >= 0 ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                <span>{Math.abs(percentageChange).toFixed(1)}% Última nómina</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Nueva nómina Modal */}
      {isNewPayrollOpen && (
        <div className="fixed inset-0 lg:ml-72 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transform transition-transform duration-300 ease-in-out scale-100 opacity-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Crear nueva nómina</h3>
              <button
                type="button"
                onClick={() => setIsNewPayrollOpen(false)}
                className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 transition duration-150"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <form
              id="new-payroll-form"
              className="p-5 space-y-4 overflow-y-auto flex-grow"
              onSubmit={(e) => {
                e.preventDefault();
                handleAddPayroll(userInfo.id);
              }}
            >
              <div className="grid gap-2">
                <label
                  htmlFor="new-date"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Fecha
                </label>
                <input
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                  id="new-date"
                  type="date"
                  value={toInputDate(newPayrollDate)}
                  onChange={(e) => setNewPayrollDate(new Date(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="amount"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Cantidad (€)
                </label>
                <input
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                  id="amount"
                  type="number"
                  value={newPayrollAmount}
                  onChange={(e) => setNewPayrollAmount(e.target.value)}
                  placeholder="1200"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="state"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Estado
                </label>
                <div className="w-full">
                  <select
                    value={newPayrollState}
                    onChange={(e) => setNewPayrollState(e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>
                      Selecciona un estado
                    </option>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagada">Pagada</option>
                  </select>
                </div>
              </div>
            </form>
            <div className="flex justify-end items-center space-x-3 p-5 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setIsNewPayrollOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="new-payroll-form"
                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editar nómina Modal */}
      {isEditPayrollOpen && (
        <div className="fixed inset-0 lg:ml-72 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transform transition-transform duration-300 ease-in-out scale-100 opacity-100">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Editar nómina</h3>
              <button
                type="button"
                onClick={() => setIsEditPayrollOpen(false)}
                className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5 transition duration-150"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <form
              id="edit-payroll-form"
              className="p-5 space-y-4 overflow-y-auto flex-grow"
              onSubmit={(e) => {
                e.preventDefault();
                handleEditPayroll(selectedPayroll.uuid);
              }}
            >
              <div className="grid gap-2">
                <label
                  htmlFor="edit-date"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Fecha
                </label>
                <input
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                  id="edit-date"
                  type="date"
                  value={toInputDate(newPayrollDate)}
                  onChange={(e) => setNewPayrollDate(new Date(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="edit-amount"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Cantidad (€)
                </label>
                <input
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
                  id="edit-amount"
                  type="number"
                  value={newPayrollAmount}
                  onChange={(e) => setNewPayrollAmount(e.target.value)}
                  placeholder="1200"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="edit-state"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Estado
                </label>
                <div className="w-full">
                  <select
                    value={newPayrollState}
                    onChange={(e) => setNewPayrollState(e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>
                      Selecciona un estado
                    </option>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagada">Pagada</option>
                  </select>
                </div>
              </div>
            </form>
            <div className="flex justify-end items-center space-x-3 p-5 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setIsEditPayrollOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="edit-payroll-form"
                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
