"use client";
import React, { useState } from "react";
import BaseModal, { ModalActions, ModalButton, ModalSelect } from "./base-modal.component";

export default function ChangeStateModal({
  onClose,
  onSubmit,
  contractStates,
}) {
  const [selectedStateId, setSelectedStateId] = useState("");

  const stateOptions = contractStates.map((state) => ({
    value: state.id.toString(),
    label: state.name,
  }));

  const handleSave = () => {
    if (!selectedStateId) return;
    onSubmit(parseInt(selectedStateId));
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Cambiar estado"
      subtitle="Selecciona el nuevo estado para los contratos seleccionados"
      maxWidth="max-w-md"
    >
      <ModalSelect
        label="Seleccionar nuevo estado"
        id="stateSelect"
        value={selectedStateId}
        onChange={(e) => setSelectedStateId(e.target.value)}
        options={stateOptions}
        placeholder="Selecciona un estado"
        required
      />

      <ModalActions>
        <ModalButton
          variant="ghost"
          onClick={onClose}
        >
          Cancelar
        </ModalButton>
        <ModalButton
          variant="primary"
          onClick={handleSave}
          disabled={!selectedStateId}
          icon="save"
        >
          Guardar
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
