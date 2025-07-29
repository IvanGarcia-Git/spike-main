"use client";
import React from "react";

export default function RatesPricing({ contract }) {
  if (!contract) {
    return <p className="text-black font-bold">Cargando precios...</p>;
  }

  if (contract.isDraft) {
    if (!contract.rate && !contract.telephonyData) {
      return <p className="text-black font-bold">No hay tarifas disponibles</p>;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-2 mb-4 p-2 border rounded-lg bg-foreground max-w-sm">
      {(contract.rate || contract.telephonyData) && (
        <>
          {contract.rate ? (
            <>
              <h3 className="text-lg font-bold text-black text-center mb-2">
                {contract.type === "Luz" ? "Precios Luz" : "Precios Gas"}
              </h3>

              {/* Tabla de Precios */}
              <div className="grid grid-cols-3 gap-1 text-center text-sm">
                {/* Encabezados */}
                <div className="text-black font-semibold">Pot</div>
                <div className="text-black font-semibold">Energ</div>
                <div className="text-black font-semibold">Exc</div>

                {/* Filas de valores */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <React.Fragment key={i}>
                    {/* Potencia */}
                    {contract?.rate[`powerSlot${i}`] ? (
                      <div className="text-black">{contract.rate[`powerSlot${i}`]}</div>
                    ) : (
                      <div></div>
                    )}

                    {/* Energía */}
                    {contract?.rate[`energySlot${i}`] ? (
                      <div className="text-black">{contract.rate[`energySlot${i}`]}</div>
                    ) : (
                      <div></div>
                    )}

                    {/* Excedente */}
                    {contract?.rate?.surplusSlot1 && i === 1 ? (
                      <div className="text-black">{contract?.rate?.surplusSlot1}</div>
                    ) : (
                      <div></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-black text-center mb-2">Precio telefonía</h3>
              <div className="grid grid-cols-3 gap-1 text-center text-sm">
                <div className="text-black font-semibold col-span-3">Tarifas</div>
                <ul className="col-span-3">
                  {contract.telephonyData.rates.map((rate, index) => (
                    <li key={index} className="text-black">
                      {rate.name} : {rate.finalPrice}€
                    </li>
                  ))}
                </ul>
              </div>
              {/* Precio total */}
              <div className="text-black font-bold text-center mt-2">
                Total:{" "}
                {contract.telephonyData.rates.reduce((sum, rate) => sum + rate.finalPrice, 0)}€
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
