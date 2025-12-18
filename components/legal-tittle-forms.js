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
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="name">
                            Nombre
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                            value={currentOwner?.data?.name}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                            placeholder="Introduce el nombre"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="surnames">
                            Apellidos
                        </label>
                        <input
                            type="text"
                            id="surnames"
                            name="surnames"
                            className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                            value={currentOwner?.data?.surnames}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                            placeholder="Introduce los apellidos"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-48">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="documentType">
                                Tipo de documento
                            </label>
                            <select
                                id="documentType"
                                name="documentType"
                                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                onChange={(e) => handleSelectChange(e, stringCurrentOwner)}
                                defaultValue={documentType}
                            >
                                <option value="NIF / DNI">NIF / DNI</option>
                                <option value="NIE">NIE</option>
                            </select>
                        </div>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="documentInput">
                                Número de documento
                            </label>
                            <input
                                type="text"
                                id="documentInput"
                                name="nationalId"
                                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                                value={currentOwner?.data?.nationalId}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                                placeholder="Ingrese el número"
                            />
                        </div>

                        {documentType === "NIE" && (
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="nationality">
                                    Nacionalidad
                                </label>
                                <input
                                    type="text"
                                    id="nationality"
                                    name="nationality"
                                    list="countryList"
                                    className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                                    value={currentOwner?.data?.nationality}
                                    onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                                    onBlur={handleBlur}
                                    placeholder="Seleccione un país"
                                />
                                <datalist id="countryList">
                                    {countries.map((country) => (
                                        <option key={country.code} value={country.name} />
                                    ))}
                                </datalist>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="address">
                            Dirección
                        </label>
                        <input
                            type="text"
                            id="address"
                            name="address"
                            className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                            value={currentOwner?.data?.address}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                            placeholder="Introduce la dirección completa"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="zipcode">
                                Código Postal
                            </label>
                            <input
                                type="text"
                                id="zipcode"
                                name="zipcode"
                                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                                value={currentOwner?.data?.zipcode}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                                placeholder="28001"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="province">
                                Provincia
                            </label>
                            <input
                                type="text"
                                id="province"
                                name="province"
                                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                                value={currentOwner?.data?.province}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                                placeholder="Madrid"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="populace">
                                Población
                            </label>
                            <input
                                type="text"
                                id="populace"
                                name="populace"
                                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                                value={currentOwner?.data?.populace}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                                placeholder="Madrid"
                            />
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="companyName">
                            Nombre de la Empresa
                        </label>
                        <input
                            type="text"
                            id="companyName"
                            name="companyName"
                            className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                            value={currentOwner?.data?.companyName}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                            placeholder="Nombre de la empresa"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="cif">
                            CIF
                        </label>
                        <input
                            type="text"
                            id="cif"
                            name="cif"
                            className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                            value={currentOwner?.data?.cif}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                            placeholder="A12345678"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="fiscalAddress">
                            Dirección Fiscal
                        </label>
                        <input
                            type="text"
                            id="fiscalAddress"
                            name="fiscalAddress"
                            className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                            value={currentOwner?.data?.fiscalAddress}
                            onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                            placeholder="Dirección fiscal completa"
                        />
                    </div>

                     {stringCurrentOwner === 'newOwner' && (
                        <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="representativeName">
                                Nombre del Representante Legal
                            </label>
                            <input
                                type="text"
                                id="representativeName"
                                name="representativeName"
                                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                                value={currentOwner?.data?.representativeName}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                                placeholder="Nombre del representante"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="representativeNationalId">
                                DNI del Representante Legal
                            </label>
                            <input
                                type="text"
                                id="representativeNationalId"
                                name="representativeNationalId"
                                className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                                value={currentOwner?.data?.representativeNationalId}
                                onChange={(e) => handleOwnerDataFieldChange(e, stringCurrentOwner)}
                                placeholder="12345678A"
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
                    <div className="py-8">
                        <div className='w-full flex flex-col items-center justify-center mb-12'>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center">
                                <span className="material-icons-outlined text-primary mr-2">gavel</span>
                                Tipo De Relación Jurídica
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">Selecciona el tipo de relación entre las partes</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                className='neumorphic-button p-8 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all flex flex-col items-center gap-3'
                                onClick={() => {
                                    setFormData(prevFormData => ({
                                        ...prevFormData,
                                        relationshipType: 'Particular-Particular'
                                    }));
                                    nextStep();
                                }}
                            >
                                <span className="material-icons-outlined text-5xl text-primary">person</span>
                                <span>Particular - Particular</span>
                            </button>
                            <button
                                className='neumorphic-button p-8 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all flex flex-col items-center gap-3'
                                onClick={() => {
                                    setFormData(prevFormData => ({
                                        ...prevFormData,
                                        relationshipType: 'Particular-Empresa'
                                    }));
                                    nextStep();
                                }}
                            >
                                <span className="material-icons-outlined text-5xl text-primary">business</span>
                                <span>Particular - Empresa</span>
                            </button>
                            <button
                                className='neumorphic-button p-8 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all flex flex-col items-center gap-3'
                                onClick={() => {
                                    setFormData(prevFormData => ({
                                        ...prevFormData,
                                        relationshipType: 'Empresa-Empresa'
                                    }));
                                    nextStep();
                                }}
                            >
                                <span className="material-icons-outlined text-5xl text-primary">corporate_fare</span>
                                <span>Empresa - Empresa</span>
                            </button>
                            <button
                                className='neumorphic-button p-8 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all flex flex-col items-center gap-3'
                                onClick={() => {
                                    setFormData(prevFormData => ({
                                        ...prevFormData,
                                        relationshipType: 'Empresa-Particular'
                                    }));
                                    nextStep();
                                }}
                            >
                                <span className="material-icons-outlined text-5xl text-primary">swap_horiz</span>
                                <span>Empresa - Particular</span>
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="neumorphic-card-inset p-6 rounded-xl">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
                            <span className="material-icons-outlined text-primary mr-2">person_outline</span>
                            Datos del Antiguo Titular
                        </h2>
                        {renderOwnerForm(formData.oldOwner.type, formData.oldOwner, "oldOwner")}
                    </div>
                );
            case 3:
                return (
                    <div className="neumorphic-card-inset p-6 rounded-xl">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
                            <span className="material-icons-outlined text-primary mr-2">person_add</span>
                            Datos del Nuevo Titular
                        </h2>
                        {renderOwnerForm(formData.newOwner.type, formData.newOwner, "newOwner")}
                    </div>
                );
            case 4:
                return (
                    <div className="neumorphic-card-inset p-6 rounded-xl">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
                            <span className="material-icons-outlined text-primary mr-2">edit_document</span>
                            Detalles de la Firma
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="signatureDate">
                                    Fecha de la Firma
                                </label>
                                <input
                                    type="date"
                                    id="signatureDate"
                                    name="signatureDate"
                                    className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.signatureDate}
                                    onChange={handleTopLevelInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="signatureProvince">
                                    Provincia de la Firma
                                </label>
                                <input
                                    type="text"
                                    id="signatureProvince"
                                    name="signatureProvince"
                                    className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                                    value={formData.signatureProvince}
                                    onChange={handleTopLevelInputChange}
                                    placeholder="Madrid"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor="serviceAddress">
                                    Dirección del Suministro
                                </label>
                                <input
                                    type="text"
                                    id="serviceAddress"
                                    name="serviceAddress"
                                    className="w-full px-4 py-3 neumorphic-card-inset bg-transparent text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                                    value={formData.serviceAddress}
                                    onChange={handleTopLevelInputChange}
                                    placeholder="Dirección completa del suministro"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
                            <span className="material-icons-outlined text-primary mr-2">preview</span>
                            Previsualización del Contrato
                        </h2>
                        <LegalTittlePreview formData={formData} documentType={documentType} />
                        <div
                            ref={printableAreaRef}
                            style={{
                                position: 'absolute',
                                left: '-9999px',
                                top: '0',
                                zIndex: -1,
                                width: '210mm',
                            }}
                        >
                            <LegalTittleDocument formData={formData} documentType={documentType} />
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="text-center py-12">
                        <span className="material-icons-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">error_outline</span>
                        <p className="text-slate-600 dark:text-slate-400">Paso desconocido</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-[300px]">
            {renderStepContent()}
        </div>
    )
}

export default LegalTitleForms
