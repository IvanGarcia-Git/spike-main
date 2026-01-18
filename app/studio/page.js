"use client";

import { useState } from "react";
import { ContractForm } from "@/components/contract-form";
import { ContractPreview } from "@/components/contract-preview";
import { contractTemplate } from "@/helpers/contract-template";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const flattenObject = (obj, parentKey = '', res = {}) => {
  for(let key in obj){
    if(obj.hasOwnProperty(key)){
      const propName = parentKey ? parentKey + '_' + key : key;
      if(typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)){
        flattenObject(obj[key], propName, res);
      } else {
        res[propName] = obj[key];
      }
    }
  }
  return res;
}

// Función para reemplazar los marcadores de posición en la plantilla
const fillTemplate = (template, data) => {
  let content = template;

  const flattenedData = flattenObject(data);

  if (data.partyA) {
    flattenedData.partyA_type_is_empresa = data.partyA.type === 'empresa';
  }
  if (data.partyB) {
    flattenedData.partyB_type_is_empresa = data.partyB.type === 'empresa';
  }

  if (flattenedData.general_fechaInicio && flattenedData.general_fechaInicio instanceof Date) {
    flattenedData.general_fechaInicio_formatted = format(flattenedData.general_fechaInicio, "PPP", { locale: es });
  } else {
    flattenedData.general_fechaInicio_formatted = undefined;
  }

  // Procesar bloques condicionales
  content = content.replace(/{{#if (.*?)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g, (match, conditionKey, ifContent, elseContent) => {
    const key = conditionKey.trim();
    return flattenedData[key] ? ifContent : elseContent;
  });

  // Procesar marcadores de posición simples
  content = content.replace(/{{(.*?)}}/g, (match, key) => {
    const trimmedKey = key.trim();

    // Handle special formatted fields first
    if (trimmedKey === 'general_fechaInicio_formatted') {
        const isFilled = !!flattenedData.general_fechaInicio_formatted;
        const displayValue = isFilled ? flattenedData.general_fechaInicio_formatted : '[Fecha]';
        const fieldClass = isFilled ? 'field-completed' : 'field-pending';
        return `<span data-field-id="general_fechaInicio" class="${fieldClass}">${displayValue}</span>`;
    }
    if (trimmedKey === 'general_ciudad') {
       const isFilled = !!flattenedData.general_ciudad;
       const displayValue = isFilled ? flattenedData.general_ciudad : '[Ciudad]';
       const fieldClass = isFilled ? 'field-completed' : 'field-pending';
       return `<span data-field-id="general_ciudad" class="${fieldClass}">${displayValue}</span>`;
    }


    const value = flattenedData[trimmedKey];
    const isFilled = value !== undefined && value !== null && value !== '';
    const displayValue = isFilled ? String(value) : `[${trimmedKey}]`;
    const fieldClass = isFilled ? 'field-completed' : 'field-pending';


    return `<span data-field-id="${trimmedKey}" class="${fieldClass}">${displayValue}</span>`;
  });

  return content;
};


export default function Studio() {
  const [initialContractContent] = useState(contractTemplate);
  const [liveContractContent, setLiveContractContent] = useState(() => fillTemplate(contractTemplate, {}));

  const [companyLogo, setCompanyLogo] = useState(null);

  const [focusedField, setFocusedField] = useState(null);

  const handleFormDataChange = (data) => {
    const filled = fillTemplate(initialContractContent, data);
    setLiveContractContent(filled);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <span className="material-icons-outlined text-primary mr-3">edit_document</span>
            Contratos Colaboración
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Crea y personaliza contratos de colaboración de forma interactiva
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form Panel */}
          <div className="lg:col-span-2 no-print">
            <div className="sticky top-6">
              <div className="neumorphic-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                    <span className="material-icons-outlined text-primary mr-2">description</span>
                    Datos del Contrato
                  </h2>
                </div>
                <div className="overflow-y-auto max-h-[calc(100vh-16rem)] pr-2">
                  <ContractForm
                    onDataChange={handleFormDataChange}
                    setFocusedField={setFocusedField}
                    onLogoChange={setCompanyLogo}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-3">
            <div className="neumorphic-card p-6 rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center no-print">
                  <span className="material-icons-outlined text-primary mr-2">preview</span>
                  Vista Previa del Contrato
                </h2>
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
                <ContractPreview
                  content={liveContractContent}
                  setContent={setLiveContractContent}
                  focusedField={focusedField}
                  companyLogo={companyLogo}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
