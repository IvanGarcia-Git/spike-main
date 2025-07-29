import { useEffect } from 'react';
import { countries } from "@/public/countries";
import LegalTittlePreview from './legal-tittle-preview';
import LegalTittleDocument from './legal-tittle-document';

const getInitialOwnerData = (type) => {
    if (type === 'Particular') {
        return {
            name: '',
            surnames: '',
            nationalId: '',
            nationality: '',
            address: '',
            zipcode: '',
            province: '',
            populace: '',
            documentType: ''
        };
    } else {
        return {
            companyName: '',
            cif: '',
            fiscalAddress: '',
            representativeName: '',
            representativeNationalId: ''
        };
    }
};

function LegalTitleForms({ formData, setFormData, currentStep, nextStep, documentType, setDocumentType, printableAreaRef }) {

    useEffect(() => {
        let typeOldOwner = formData.relationshipType.split('-')[0];
        let typeNewOwner = formData.relationshipType.split('-')[1];

        if (typeOldOwner !== formData.oldOwner.type || typeNewOwner !== formData.newOwner.type) {

            const initialOldOwnerData = getInitialOwnerData(typeOldOwner);
            const initialNewOwnerData = getInitialOwnerData(typeNewOwner);

            setFormData(prevFormData => ({
                ...prevFormData,
                oldOwner: {
                    type: typeOldOwner,
                    data: initialOldOwnerData
                },
                newOwner: {
                    type: typeNewOwner,
                    data: initialNewOwnerData
                }
            }));

        }
    }, [formData.relationshipType])


    const handleTopLevelInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleOwnerDataFieldChange = (e, ownerKey) => {
        const name = e.target.name;
        const value = e.target.value;

        if (formData[ownerKey] && formData[ownerKey].data !== undefined) {
            setFormData(prevData => ({
                ...prevData,
                [ownerKey]: {
                    ...prevData[ownerKey],
                    data: {
                        ...prevData[ownerKey].data,
                        [name]: value
                    }
                }
            }));
        }
    };

    const handleSelectChange = (e, ownerKey) => {

        const selectedType = e.target.value;
        setDocumentType(selectedType);

        if (formData[ownerKey] && formData[ownerKey].data !== undefined) {        
            setFormData(prevData => ({
                ...prevData,
                [ownerKey]: {
                    ...prevData[ownerKey],
                    data: {
                        ...prevData[ownerKey].data,
                        nationalId: "",
                        nationality: selectedType === "NIE" ? "" : "España",
                        documentType: selectedType === "NIE" ? "NIE" : "NIF /DNI",
                    }
                }
            }));
        }
    };

    const handleBlur = (event) => {
        const newValue = event.target.value;
        const isValid = countries.some((country) => country.name === newValue);

        if (!isValid) {
            handleOwnerDataFieldChange({
                target: {
                    name: "nationality",
                    value: "",
                },
            });
        }
    };

    const renderOwnerForm = (type, currentOwner, stringCurrentOwner) => {
        if (type == 'Particular') {
            return (
                <div className="space-y-4">
                    <div className="mb-4">
                        <label className="block text-black mb-2" htmlFor="name">
                            Nombre
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={currentOwner?.data?.name}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-black mb-2" htmlFor="surnames">
                            Apellidos
                        </label>
                        <input
                            type="text"
                            id="surnames"
                            name="surnames"
                            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={currentOwner?.data?.surnames}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                        />
                    </div>

                    <div className="mb-4 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-black" htmlFor="documentType">
                                Tipo de documento
                            </label>
                            <select
                                id="documentType"
                                name="documentType"
                                className="px-3 py-2 rounded bg-backgroundHoverBold text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => handleSelectChange(e, stringCurrentOwner)}
                                defaultValue={documentType}
                            >
                                <option value="NIF / DNI">NIF / DNI</option>
                                <option value="NIE">NIE</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="sr-only" htmlFor="documentInput">
                                Número de documento
                            </label>
                            <input
                                type="text"
                                id="documentInput"
                                name="nationalId"
                                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={currentOwner?.data?.nationalId}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                                placeholder="Ingrese el número"
                            />
                        </div>

                        {documentType === "NIE" && (
                            <div className="flex-2">
                                <label className="sr-only" htmlFor="nationality">
                                    Nacionalidad
                                </label>
                                <input
                                    type="text"
                                    id="nationality"
                                    name="nationality"
                                    list="countryList"
                                    className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={currentOwner?.data?.nationality}
                                    onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                                    onBlur={handleBlur}
                                    placeholder="Seleccione un país"
                                />
                                <datalist
                                    id="countryList"
                                >
                                    {countries.map((country) => (
                                        <option key={country.code} value={country.name} className="px-4 py-2 hover:bg-gray-200" />
                                    ))}
                                </datalist>
                            </div>
                        )}

                    </div>

                    <div className="mb-4">
                        <label className="block text-black mb-2" htmlFor="address">
                            Dirección
                        </label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={currentOwner?.data?.address}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                        />
                    </div>

                    <div className="mb-4 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
                        <div className="w-full sm:flex-1">
                            <label className="block text-black mb-2" htmlFor="zipcode">
                                Código Postal
                            </label>
                            <input
                                type="text"
                                id="zipcode"
                                name="zipcode"
                                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={currentOwner?.data?.zipcode}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                            />
                        </div>

                        <div className="w-full sm:flex-1">
                            <label className="block text-black mb-2" htmlFor="province">
                                Provincia
                            </label>
                            <input
                                type="text"
                                id="province"
                                name="province"
                                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={currentOwner?.data?.province}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                            />
                        </div>

                        <div className="w-full sm:flex-1">
                            <label className="block text-black mb-2" htmlFor="populace">
                                Población
                            </label>
                            <input
                                type="text"
                                id="populace"
                                name="populace"
                                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={currentOwner?.data?.populace}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                            />
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="space-y-4">
                    <div className="mb-4">
                        <label className="block text-black mb-2" htmlFor="companyName">
                            Nombre
                        </label>
                        <input
                            type="text"
                            id="companyName"
                            name="companyName"
                            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={currentOwner?.data?.companyName}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-black mb-2 mt-7" htmlFor="surnames">
                            CIF
                        </label>
                        <input
                            type="text"
                            id="cif"
                            name="cif"
                            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={currentOwner?.data?.cif}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-black mb-2 mt-7" htmlFor="fiscalAddress">
                            Dirección Fiscal
                        </label>
                        <input
                            type="text"
                            id="fiscalAddress"
                            name="fiscalAddress"
                            className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={currentOwner?.data?.fiscalAddress}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                        />
                    </div>
                     {stringCurrentOwner === 'newOwner' && (
                        <>
                        <div className="mb-4">
                            <label className="block text-black mb-2 mt-7" htmlFor="representativeName">
                                Nombre del Representante Legal
                            </label>
                            <input
                                type="text"
                                id="representativeName"
                                name="representativeName"
                                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={currentOwner?.data?.representativeName}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-black mb-2 mt-7" htmlFor="representativeNationalId">
                                DNI del Representante Legal
                            </label>
                            <input
                                type="text"
                                id="representativeNationalId"
                                name="representativeNationalId"
                                className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={currentOwner?.data?.representativeNationalId}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                            />
                        </div>
                        </>
                     )}
                </div>
            )
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="bg-background p-6 rounded-lg mb-7">
                        <div className='w-full flex flex-col items-center justify-center mt-10'>
                            <h2 className="text-xl font-semibold mb-4">Tipo De Relación Jurídica</h2>
                            <p className="mb-4">Selecciona el tipo de relación entre las partes:</p>
                        </div>
                        <div className="space-y-2 flex flex-wrap gap-10 items-center justify-around mt-20 pb-28">
                            <button className='bg-yellow-400 px-20 py-10 shadow-md hover:bg-yellow-500 rounded-md font-bold text-white hover:cursor-pointer transition duration-200 ease-in-out'
                                onClick={() => {
                                    setFormData(prevFormData => ({
                                        ...prevFormData,
                                        relationshipType: 'Particular-Particular'
                                    }));
                                    nextStep();
                                }}
                            >
                                Particular - Particular
                            </button>
                            <button className='bg-yellow-400 px-20 py-10 shadow-md hover:bg-yellow-500 rounded-md font-bold text-white hover:cursor-pointer transition duration-200 ease-in-out'
                                onClick={() => {
                                    setFormData(prevFormData => ({
                                        ...prevFormData,
                                        relationshipType: 'Particular-Empresa'
                                    }));
                                    nextStep();
                                }}
                            >
                                Particular - Empresa
                            </button>
                            <button className='bg-yellow-400 px-20 py-10 shadow-md hover:bg-yellow-500 rounded-md font-bold text-white hover:cursor-pointer transition duration-200 ease-in-out'
                                onClick={() => {
                                    setFormData(prevFormData => ({
                                        ...prevFormData,
                                        relationshipType: 'Empresa-Empresa'
                                    }));
                                    nextStep();
                                }}
                            >
                                Empresa - Empresa
                            </button>
                            <button className='bg-yellow-400 px-20 py-10 shadow-md hover:bg-yellow-500 rounded-md font-bold text-white hover:cursor-pointer transition duration-200 ease-in-out'
                                onClick={() => {
                                    setFormData(prevFormData => ({
                                        ...prevFormData,
                                        relationshipType: 'Empresa-Particular'
                                    }));
                                    nextStep();
                                }}
                            >
                                Empresa - Particular
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <form className="bg-background p-6 rounded-lg mb-7">
                        <h2 className="text-xl font-semibold mb-4">Datos del Antiguo Titular</h2>
                        {renderOwnerForm(formData.oldOwner.type, formData.oldOwner, "oldOwner")}
                    </form>
                );
            case 3:
                return (
                    <form className="bg-background p-6 rounded-lg mb-7">
                        <h2 className="text-xl font-semibold mb-4">Datos del Nuevo Titular</h2>
                        {renderOwnerForm(formData.newOwner.type, formData.newOwner, "newOwner")}
                    </form>
                );
            case 4:
                return (
                    <form className="bg-background p-6 rounded-lg mb-7">
                        <h2 className="text-xl font-semibold mb-4">Detalles de la Firma</h2>
                        <div className="space-y-4">
                            <div className="w-full sm:flex-1">
                                <label className="block text-black mb-2" htmlFor="signatureDate">
                                    Fecha de la Firma
                                </label>
                                <input
                                    type="date"
                                    id="signatureDate"
                                    name="signatureDate"
                                    className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.signatureDate}
                                    onChange={handleTopLevelInputChange}
                                />
                            </div>
                            <div className="w-full sm:flex-1">
                                <label className="block text-black mb-2 mt-7" htmlFor="signatureDate">
                                    Provincia de la Firma
                                </label>
                                <input
                                    type="text"
                                    id="signatureProvince"
                                    name="signatureProvince"
                                    className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.signatureProvince}
                                    onChange={handleTopLevelInputChange}
                                />
                            </div>
                            <div className="w-full sm:flex-1">
                                <label className="block text-black mb-2 mt-7" htmlFor="serviceAddress">
                                    Dirección del Suministro
                                </label>
                                <input
                                    type="text"
                                    id="serviceAddress"
                                    name="serviceAddress"
                                    className="w-full px-4 py-2 rounded bg-backgroundHoverBold text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.serviceAddress}
                                    onChange={handleTopLevelInputChange}
                                />
                            </div>
                        </div>
                    </form>
                );
            case 5:
                return (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Previsualización del Contrato</h2>
                        <div className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap font-sans flex flex-wrap items-center justify-center gap-4 py-10">
                            <LegalTittlePreview formData={formData} documentType={documentType} />
                        </div>
                        <div
                            ref={printableAreaRef}
                            style={{
                                position: 'absolute',
                                left: '-9999px',
                                top: '-9999px',
                                zIndex: -1,
                            }}
                        >
                            <LegalTittleDocument formData={formData} documentType={documentType} />
                        </div>
                    </div>
                );
            default:
                return <div>Paso desconocido</div>;
        }
    };

    return (
        <div className="min-h-[300px]">
            {renderStepContent()}
        </div>
    )
}

export default LegalTitleForms