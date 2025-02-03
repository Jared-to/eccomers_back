import type { Content, StyleDictionary, TDocumentDefinitions } from 'pdfmake/interfaces';
import { Cliente } from 'src/clientes/entities/cliente.entity';

const formatDate = (value: string | Date): string => {
  const date = new Date(value);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const styles: StyleDictionary = {
  header: {
    fontSize: 26,
    bold: true,
    color: '#34495E',
    margin: [0, 20, 0, 20],
    alignment: 'center',
  },
  subHeader: {
    fontSize: 14,
    color: '#16A085',
    bold: true,
    margin: [0, 10, 0, 20],
    alignment: 'center',
  },
  tableHeader: {
    bold: true,
    fontSize: 12,
    fillColor: '#BDC3C7',
    color: '#2C3E50',
    alignment: 'center',
    margin: [5, 5, 5, 5],
  },
  tableRow: {
    fontSize: 10,
    alignment: 'center',
    margin: [5, 5, 5, 5],
  },
  tableOddRow: {
    fontSize: 10,
    alignment: 'center',
    margin: [5, 5, 5, 5],
    fillColor: '#ECF0F1',
  },
  tableEvenRow: {
    fontSize: 10,
    alignment: 'center',
    margin: [5, 5, 5, 5],
  },
};

export const reportClients = (clientes): TDocumentDefinitions => {
  console.log(clientes);

  const tableData = clientes.map((detalle, index) => [
    { text: index + 1, style: index % 2 === 0 ? 'tableEvenRow' : 'tableOddRow' },
    { text: detalle.cliente_codigo, style: index % 2 === 0 ? 'tableEvenRow' : 'tableOddRow' },
    { text: detalle.cliente_nombre, style: index % 2 === 0 ? 'tableEvenRow' : 'tableOddRow' },
    { text: detalle.cliente_apellido, style: index % 2 === 0 ? 'tableEvenRow' : 'tableOddRow' },
    { text: detalle.cliente_direccion, style: index % 2 === 0 ? 'tableEvenRow' : 'tableOddRow' },
    { text: detalle.cliente_telefono, style: index % 2 === 0 ? 'tableEvenRow' : 'tableOddRow' },
    { text: detalle.deudaTotal || 0 + ' Bs.', style: index % 2 === 0 ? 'tableEvenRow' : 'tableOddRow' },
  ]);

  return {
    defaultStyle: {},
    pageSize: 'A4',
    header: {
      text: 'Reporte de Clientes',
      style: 'header',
    },
    content: [
      {
        text: `Clientes en ${formatDate(new Date())}`,
        style: 'subHeader',
      },
      {
        layout: 'lightHorizontalLines',
        table: {
          widths: ['auto', 'auto', '*', '*', '*', '*', '*'],
          headerRows: 1,
          body: [
            // Header row
            [
              { text: 'No.', style: 'tableHeader' },
              { text: 'Código', style: 'tableHeader' },
              { text: 'Nombre', style: 'tableHeader' },
              { text: 'Apellido', style: 'tableHeader' },
              { text: 'Dirección', style: 'tableHeader' },
              { text: 'Teléfono', style: 'tableHeader' },
              { text: 'Deuda', style: 'tableHeader' },
            ],
            // Data rows
            ...tableData,
          ],
        },
      },
    ],
    styles: styles,
  };
};
