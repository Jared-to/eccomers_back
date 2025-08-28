import { StyleDictionary, TDocumentDefinitions } from "pdfmake/interfaces";
import { Gasto } from "src/gastos/entities/gasto.entity";

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

// Generación del Reporte de Gastos
export const ReportGastos = (gastos: Gasto[], fechaInicio: string, fechaFin: string): TDocumentDefinitions => {
    // Convertir fechas a formato legible
    const fechaInicioFormatted = formatDate(fechaInicio);
    const fechaFinFormatted = formatDate(fechaFin);

    // Calcular totales
    const totalEfectivo = gastos
        .filter(gasto => gasto.tipo_pago === 'EFECTIVO')
        .reduce((sum, gasto) => sum + gasto.monto, 0);

    const totalQR = gastos
        .filter(gasto => gasto.tipo_pago === 'QR')
        .reduce((sum, gasto) => sum + gasto.monto, 0);

    const totalGeneral = gastos.reduce((sum, gasto) => sum + gasto.monto, 0);

    return {
        defaultStyle: {},
        pageSize: 'A4',
        header: [
            {
                columns: [
                    {
                        text: 'Reporte de Gastos',
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
            { text: `Periodo del reporte: ${fechaInicioFormatted} - ${fechaFinFormatted}`, style: 'subHeader', alignment: 'center', margin: [0, 0, 0, 10] },
            { text: 'Información de Gastos', style: 'subHeader' },
            {
                layout: 'lightHorizontalLines',
                table: {
                    //widths: ['15%', '15%', '25%', '15%', '15%', '15%'], // Ajuste de ancho para ocupar toda la página
                    widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto'],
                    headerRows: 1,
                    body: [
                        [
                            { text: 'Código', style: 'tableHeader' },
                            { text: 'Tipo Gasto', style: 'tableHeader' },
                            { text: 'Glosa', style: 'tableHeader' },
                            { text: 'Monto', style: 'tableHeader' },
                            { text: 'Tipo Pago', style: 'tableHeader' },
                            { text: 'Categoría', style: 'tableHeader' },
                        ],
                        ...gastos.map(gasto => [
                            { text: `${gasto.codigo}`, style: 'tableRow' },
                            { text: `${gasto.tipo}`, style: 'tableRow' },
                            { text: `${gasto.glosa}`, style: 'tableRow' },
                            { text: `${gasto.monto.toFixed(2)} Bs.`, style: 'tableRow' },
                            { text: `${gasto.tipo_pago}`, style: 'tableRow' },
                            { text: `${gasto.categoria.nombre}`, style: 'tableRow' },
                        ]),
                        // Filas de totales
                        [
                            { text: 'Total Efectivo', colSpan: 5, alignment: 'right', style: 'totalRow' }, {}, {}, {}, {},
                            { text: `${totalEfectivo.toFixed(2)} Bs.`, style: 'totalRow', alignment: 'right' }
                        ],
                        [
                            { text: 'Total QR', colSpan: 5, alignment: 'right', style: 'totalRow' }, {}, {}, {}, {},
                            { text: `${totalQR.toFixed(2)} Bs.`, style: 'totalRow', alignment: 'right' }
                        ],
                        [
                            { text: 'Total General', colSpan: 5, alignment: 'right', style: 'totalRow' }, {}, {}, {}, {},
                            { text: `${totalGeneral.toFixed(2)} Bs.`, style: 'totalRow', alignment: 'right' }
                        ],
                    ],
                },
            },
        ],
        styles: styles,
    };
};
