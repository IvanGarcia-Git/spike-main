export const contractTemplate = `CONTRATO DE COLABORACIÓN

En {{general_ciudad}}, a {{general_fechaInicio_formatted}}

REUNIDOS

DE UNA PARTE:
{{#if partyA_type_is_empresa}}
D./Dña. {{partyA_representanteLegal}}, con DNI {{partyA_dniRepresentante}}, en nombre y representación de la mercantil {{partyA_razonSocial}}, con CIF {{partyA_cif}} y domicilio social en {{partyA_domicilioSocial}}.
{{else}}
D./Dña. {{partyA_nombreCompleto}}, mayor de edad, con DNI {{partyA_dni}} y domicilio en {{partyA_domicilio}}.
{{/if}}
En adelante, "Parte A".

DE OTRA PARTE:
{{#if partyB_type_is_empresa}}
D./Dña. {{partyB_representanteLegal}}, con DNI {{partyB_dniRepresentante}}, en nombre y representación de la mercantil {{partyB_razonSocial}}, con CIF {{partyB_cif}} y domicilio social en {{partyB_domicilioSocial}}.
{{else}}
D./Dña. {{partyB_nombreCompleto}}, mayor de edad, con DNI {{partyB_dni}} y domicilio en {{partyB_domicilio}}.
{{/if}}
En adelante, "Parte B".

Ambas partes se reconocen mutuamente con capacidad legal suficiente para obligarse en los términos del presente contrato y, a tal efecto,

EXPONEN

I. Que la Parte A está interesada en [Descripción del interés de la Parte A].
II. Que la Parte B tiene experiencia y capacidad para [Descripción de la capacidad de la Parte B].
III. Que ambas partes están interesadas en establecer una línea de colaboración para [Objetivo de la colaboración].

Por todo ello, las partes acuerdan suscribir el presente CONTRATO DE COLABORACIÓN, que se regirá por las siguientes:

CLÁUSULAS

PRIMERA.- OBJETO DEL CONTRATO
El objeto del presente contrato es establecer los términos y condiciones de la colaboración entre las partes para la consecución del siguiente objetivo: [Objeto del Contrato].

SEGUNDA.- OBLIGACIONES DE LAS PARTES
1. Obligaciones de la Parte A:
   - [Obligación 1 de la Parte A]
   - [Obligación 2 de la Parte A]
2. Obligaciones de la Parte B:
   - [Obligación 1 de la Parte B]
   - [Obligación 2 de la Parte B]

TERCERA.- ENTRADA EN VIGOR
El presente contrato entrará en vigor el día {{general_fechaInicio_formatted}}.

CUARTA.- CONFIDENCIALIDAD
Ambas partes se comprometen a guardar la más estricta confidencialidad sobre toda la información a la que tengan acceso en virtud del presente contrato.

QUINTA.- JURISDICCIÓN Y LEY APLICABLE
Para la resolución de cualquier controversia que pudiera derivarse del presente contrato, las partes se someten a la jurisdicción de los Juzgados y Tribunales de {{general_ciudad}}, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.

Y en prueba de conformidad, las partes firman el presente contrato por duplicado en el lugar y fecha arriba indicados.
`;
