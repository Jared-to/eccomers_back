import type { Content, StyleDictionary, TDocumentDefinitions } from 'pdfmake/interfaces';
import { Venta } from 'src/ventas/entities/venta.entity';
import { Formatter } from '../helpers/formatter';
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
    fontSize: 24,
    bold: true,
    color: '#2C3E50',
    margin: [0, 10, 0, 10],
    alignment: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: '#2980B9',
    bold: true,
    margin: [0, 10],
    alignment: 'center',
  },
  tableHeader: {
    bold: true,
    fontSize: 10,
    fillColor: '#ECF0F1',
    color: '#2C3E50',
    alignment: 'center',
  },
  tableRow: {
    fontSize: 10,
    alignment: 'center',
  },
};

export const reportClients = (clientes: Cliente[]): TDocumentDefinitions => {
  const tableData = clientes.map((detalle, index) => [
    index + 1,
    detalle.codigo,
    detalle.nombre || 'Sin código',
    detalle.apellido || 'Producto desconocido',
    detalle.direccion,
    detalle.telefono,
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
        text: `Fecha: ${formatDate(new Date())}`,
        style: 'subHeader',
      },
      {
        layout: 'lightHorizontalLines',
        table: {
          widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto'],
          headerRows: 1,
          body: [
            // Header row
            [
              { text: 'No.', style: 'tableHeader' },
              { text: 'Codigo', style: 'tableHeader' },
              { text: 'Nombre', style: 'tableHeader' },
              { text: 'Apellido', style: 'tableHeader' },
              { text: 'Direccion', style: 'tableHeader' },
              { text: 'Telefono', style: 'tableHeader' },
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
