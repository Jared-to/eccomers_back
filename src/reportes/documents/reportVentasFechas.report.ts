import { StyleDictionary, TDocumentDefinitions } from 'pdfmake/interfaces';
import { Venta } from 'src/ventas/entities/venta.entity';

const formatDate = (value: string | Date): string => {
  if (!value) return 'Fecha no especificada'; // Evita fechas vacías

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return ''; // Maneja fechas incorrectas
  }

  date.setDate(date.getDate() + 1);

  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Estilos mejorados
const styles: StyleDictionary = {
  header: {
    fontSize: 24,
    bold: true,
    color: '#2C3E50',
    margin: [0, 10, 0, 10],
  },
  subHeader: {
    fontSize: 16,
    color: '#2980B9',
    bold: true,
    margin: [0, 5],
  },
  bodyText: {
    fontSize: 10,
    margin: [0, 5],
  },
  boldText: {
    fontSize: 10,
    bold: true,
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
  totalRow: {
    bold: true,
    fontSize: 10,
    fillColor: '#34495E',
    color: 'white',
    alignment: 'right',
  },
  footer: {
    fontSize: 8,
    color: '#7F8C8D',
    alignment: 'center',
    margin: [0, 10],
  },
  pageNumber: {
    fontSize: 8,
    color: '#7F8C8D',
    alignment: 'center',
  },
};

// Generación del Reporte de Ventas
export const ReportVentas = (ventas: Venta[], fechaInicio: string, fechaFin: string): TDocumentDefinitions => {

  // Convertir fechas a formato legible
  const fechaInicioFormatted = formatDate(fechaInicio);
  const fechaFinFormatted = formatDate(fechaFin);

  // Calcular totales
  const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);

  return {
    defaultStyle: {},
    pageSize: 'A4',
    header: [
      {
        columns: [
          {
            text: 'Reporte de Ventas',
            style: 'header',
            alignment: 'center',
          },
        ],
      },
    ],
    footer: (currentPage, pageCount) => ({
      text: `Página ${currentPage} de ${pageCount}`,
      style: 'pageNumber',
    }),
    content: [
      { text: `Periodo del reporte: ${fechaInicioFormatted || 'Todas las Ventas'} - ${fechaFinFormatted || ''}`, style: 'subHeader', alignment: 'center', margin: [0, 0, 0, 10] },
      { text: 'Información de Ventas', style: 'subHeader' },
      {
        layout: 'lightHorizontalLines',
        table: {
          widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto'],
          headerRows: 1,
          body: [
            // Encabezado de la tabla
            [
              { text: 'Código', style: 'tableHeader' },
              { text: 'Cliente', style: 'tableHeader' },
              { text: 'Modalidad', style: 'tableHeader' },
              { text: 'Fecha', style: 'tableHeader' },
              { text: 'Subtotal', style: 'tableHeader' },
              { text: 'Descuento', style: 'tableHeader' },
              { text: 'Total', style: 'tableHeader' },
            ],
            // Filas de las ventas
            ...ventas.map(venta => [
              { text: `${venta.codigo}`, style: 'tableRow' },
              { text: `${venta.cliente?.nombre || 'Cliente desconocido'}`, style: 'tableRow' },
              { text: `${venta.tipo_pago}`, style: 'tableRow' },
              {
                text: `${new Date(venta.fecha).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}`, style: 'tableRow'
              },
              { text: `${venta.subtotal.toFixed(2)} Bs.`, style: 'tableRow' },
              { text: `${(venta.subtotal - venta.total).toFixed(2)} Bs.`, style: 'tableRow' },
              { text: `${venta.total.toFixed(2)} Bs.`, style: 'tableRow' },
            ]),
            [
              { text: 'Total de Ventas', colSpan: 6, alignment: 'right', style: 'totalRow' }, {}, {}, {}, {}, {},
              { text: `${totalVentas.toFixed(2)} Bs.`, style: 'totalRow', alignment: 'right' }
            ],
          ],
        },
      },
    ],
    styles: styles,
  };
};