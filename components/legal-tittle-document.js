import React from "react";

const LegalTittleDocument = ({ formData, documentType }) => {
    return (
        <div className="legal-document-container">
            <div className="bg-white w-[210mm] min-h-[297mm] mx-auto" style={{ fontFamily: 'Times New Roman, serif' }}>
                <div className="px-16 py-12">
                    <h2 className="text-lg mb-7 text-center text-black">
                        CONTRATO DE ARRENDAMIENTO
                    </h2>

                    <p className="font-sans text-sm mb-7">En {formData.signatureProvince}, a {formData.signatureDate}</p>

                    <h2 className="text-lg mb-7 text-center text-black">
                        REUNIDOS
                    </h2>

                    <p className="w-full font-sans text-base">De una parte,</p>
                    {formData.oldOwner.type === 'Particular' ? (
                        <p className="w-full mb-7 font-sans text-base">
                            Don/Doña {formData.oldOwner.data.name} {formData.oldOwner.data.surnames}, mayor de edad, ciudadano/a de {formData.oldOwner.data.nationality}, con domicilio en {formData.oldOwner.data.address}, {formData.oldOwner.data.zipcode} {formData.oldOwner.data.province} {formData.oldOwner.data.populace}, y {formData.oldOwner.data.documentType} número {formData.oldOwner.data.nationalId}, cuya copia del mismo queda incorporado como Anexo al final de este contrato. Actúa en su propio nombre y representación, (en adelante, el/los "Propietario/s").
                        </p>
                    ) : (
                        <p className="w-full mb-7 font-sans text-base">
                            La sociedad {formData.oldOwner.data.companyName}, con CIF {formData.oldOwner.data.cif}, y dirección social en {formData.oldOwner.data.fiscalAddress}. Actúa en su propio nombre y representación, (en adelante, el/los "Propietario/s").
                        </p>
                    )}

                    <p className="w-full font-sans text-base">De otra parte,</p>
                    {formData.newOwner.type === 'Particular' ? (
                        <p className="w-full mb-7 font-sans text-base">
                            Don/Doña {formData.newOwner.data.name} {formData.oldOwner.data.surnames}, mayor de edad, ciudadano/a de {formData.newOwner.data.nationality}, con domicilio en {formData.newOwner.data.address}, {formData.newOwner.data.zipcode} {formData.newOwner.data.province} {formData.newOwner.data.populace}, y {formData.newOwner.data.documentType} número {formData.newOwner.data.nationalId}, cuya copia del mismo queda incorporado como Anexo al final de este contrato. Actúa en su propio nombre y representación, (en adelante, el/los "Inquilino/s").
                        </p>
                    ) : (
                        <p className="w-full mb-7 font-sans text-base">
                            {formData.newOwner.data.representativeName} con DNI {formData.newOwner.data.representativeNationalId} en representación de la sociedad {formData.newOwner.data.companyName} con CIF {formData.newOwner.data.cif}, y dirección social en {formData.newOwner.data.fiscalAddress}. Actúa en su propio nombre y representación, (en adelante, el/los "Inquilino/s").
                        </p>
                    )}

                    <p className="w-full mb-7 font-sans text-base">El Propietario y el Inquilino serán denominados conjuntamente como las "Partes".</p>

                    <p className="w-full mb-7 text-base" style={{ fontFamily: 'Times New Roman, serif' }}>Ambas partes en la calidad con la que actúan, se reconocen recíprocamente capacidad jurídica para contratar y obligarse y en especial para el otorgamiento del presente CONTRATO DE ARRENDAMIENTO DE VIVIENDA, y </p>

                    <h2 className="text-lg mb-7 text-center text-black">
                        EXPONEN
                    </h2>

                    <p className="w-full font-sans text-base mb-7">
                        1º. - Que el Propietario/a, es propietario/a de la vivienda situada en {formData.oldOwner.data.address} {formData.newOwner.data.zipcode} {formData.newOwner.data.province} {formData.newOwner.data.populace}:
                    </p>

                    <p className="w-full font-sans text-base mb-7 ml-8">
                        - Certificado de eficiencia energética: Se adjunta fotocopia del certificado como anexo al final del presente contrato.
                    </p>

                    <p className="w-full font-sans text-base mb-7">
                        El Propietario manifiesta expresamente que el Inmueble cumple con todos los requisitos y condiciones necesarias para ser destinado a satisfacer las necesidades del Inquilino.
                    </p>

                    <p className="w-full font-sans text-base mb-7">
                        (En adelante, la vivienda y sus dependencias descritas, conjuntamente, el "Inmueble").
                    </p>

                    <p className="w-full font-sans text-base mb-7">
                        2º.- Que el Inquilino, manifiesta su interés en tomar en arrendamiento el citado Inmueble descrito en el Expositivo 1º, para su uso propio (y, en su caso, el de su familia) como vivienda habitual y permanente.
                    </p>

                    <p className="w-full font-sans text-base mb-7">
                        3º.- Ambas partes libremente reconocen entender y aceptar el presente CONTRATO DE ARRENDAMIENTO (el "Contrato"), conforme a las disposiciones de la Ley 29/1994 de 24 de noviembre de Arrendamientos Urbanos (la "LAU"), reconociéndose mutuamente capacidad jurídica para suscribirlo, con sujeción a las siguientes:
                    </p>

                    <h2 className="text-lg mb-7 text-center text-black">
                        CLAUSULAS
                    </h2>

                    <h2 className="text-lg mb-7 text-black">
                        PRIMERA: OBJETO
                    </h2>

                    <p className="w-full font-sans text-base mb-3">
                        1.1.    El Propietario arrienda al Inquilino, que acepta en este acto, el Inmueble descrito en el Expositivo 1º, que el Inquilino acepta en este acto.
                    </p>

                    <p className="w-full font-sans text-base">
                        1.2.    El Inquilino se compromete a usar dicho Inmueble exclusivamente como vivienda del Inquilino y de su familia directa, en su caso.
                    </p>

                </div>
            </div>
        </div>
    )
}
export default LegalTittleDocument;