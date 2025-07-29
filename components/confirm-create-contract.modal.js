export default function ConfirmContractModal({
    duplicatedCustomers,
    openDuplicityModal,
    setOpenDuplicityModal,
    confirmCreation
}) {
    return (
        <div
            className={`bg-foreground text-black p-6 rounded-lg shadow-lg w-full max-w-lg ${openDuplicityModal ? "" : "hidden"
                }`}
        >
            <h2 className="text-xl font-bold mb-4 text-black text-center">Duplicidad detectada</h2>
            <p className="p-5">Se encontraron clientes con datos similares. <b>¿Deseas crear este contrato?</b></p>
            <ul className="ml-5 list-disc list-inside">
                {duplicatedCustomers.map((customer) => (
                    <li key={customer.uuid} className="bg-gray-100 hover:bg-gray-200 text-lg text-gray-800 p-2 rounded-md shadow-sm mb-3">
                        <span className="w-4 h-4 rounded-full bg-black"></span>
                        {customer.name} {customer.surnames}
                    </li>
                ))}
            </ul>
            <div className="flex justify-between items-center mt-10">
                <button className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-700 w-56" onClick={() => setOpenDuplicityModal(false)}>Cancelar</button>
                <button className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover w-56" onClick={confirmCreation}>Confirmar</button>
            </div>
        </div>
    )

}