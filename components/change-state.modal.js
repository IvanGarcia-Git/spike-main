"use client";
import React from "react";
import BaseModal, { ModalActions, ModalButton, ModalSelect } from "./base-modal.component";

export default function ChangeStateModal({
  setIsStateChangeModalOpen,
  selectedStateForBatch,
  setSelectedStateForBatch,
  contractStates,
  handleBatchStateChange,
}) {
  const stateOptions = contractStates.map((state) => ({
    value: state.id.toString(),
    label: state.name,
  }));

  return (
    <BaseModal
      isOpen={true}
      onClose={() => {
        setIsStateChangeModalOpen(false);
        setSelectedStateForBatch(null);
      }}
      title="Cambiar estado"
      subtitle="Selecciona el nuevo estado para los contratos seleccionados"
      maxWidth="max-w-md"
    >
      <ModalSelect
        label="Seleccionar nuevo estado"
        id="stateSelect"
        value={selectedStateForBatch?.id?.toString() || ""}
        onChange={(e) => {
          const selectedState = contractStates.find(
            (state) => state.id === parseInt(e.target.value)
          );
          setSelectedStateForBatch(selectedState);
        }}
        options={stateOptions}
        placeholder="Selecciona un estado"
        required
      />

      <ModalActions>
        <ModalButton
          variant="ghost"
          onClick={() => {
            setIsStateChangeModalOpen(false);
            setSelectedStateForBatch(null);
          }}
        >
          Cancelar
        </ModalButton>
        <ModalButton
          variant="primary"
          onClick={handleBatchStateChange}
          icon="save"
        >
          Guardar
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
