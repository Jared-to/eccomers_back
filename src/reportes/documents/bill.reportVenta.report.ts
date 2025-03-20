import type { TDocumentDefinitions, StyleDictionary, Content } from 'pdfmake/interfaces';
import { Pedido } from 'src/pedidos/entities/pedido.entity';
import { Venta } from 'src/ventas/entities/venta.entity';

// Función para formatear la fecha
const formatDate = (value: string | Date): string => {
  const date = new Date(value);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
};

// Estilos 
const styles: StyleDictionary = {
  header: { fontSize: 12, bold: true, alignment: 'center', margin: [0, 2] },
  subHeader: { fontSize: 10, bold: true, alignment: 'center', margin: [0, 3] },
  bodyText: { fontSize: 8, margin: [0, 1] },
  boldText: { fontSize: 8, bold: true },
  highlightText: { fontSize: 9, bold: true },
  tableHeader: { bold: true, fontSize: 7, alignment: 'center' },
  tableRow: { fontSize: 7, alignment: 'center' },
  totalRow: { bold: true, fontSize: 7, alignment: 'right' },
  footer: { fontSize: 8, alignment: 'center', margin: [0, 3] },
};

// Función para generar el recibo
export const ReciboPedidoVenta = (pedido: Venta): TDocumentDefinitions => {
  const pedidoProductos = pedido.detalles.map((detalle, index) => ({
    No: index + 1,
    Unidad: detalle.unidad_medida || 'No especificada',
    Codigo: detalle.producto?.sku || 'Sin código',
    Producto: detalle.producto?.alias || 'Producto sin alias',
    Precio: detalle.precio,
    Cantidad: detalle.cantidad,
    Total: detalle.subtotal,
  }));

  // Función para generar contenido del recibo
  const ReciboPedido = (title: string): Content[] => [
    {
      columns: [
        { image: 'src/images/blessBurguerLogo.png', width: 30, margin: [0, 0, 10, 0] },
        { text: title, style: 'header', alignment: 'center', width: '*' },
      ],
      margin: [0, 0, 0, 5],
    },
    {
      columns: [
        {
          width: '70%',
          stack: [
            { text: `Cliente: ${pedido.cliente.nombre || 'Cliente desconocido'}`, style: 'bodyText' },
            { text: `Fecha: ${formatDate(pedido.fecha)}`, style: 'bodyText' },
            { text: `Forma de Entrega: Sucursal`, style: 'bodyText' },
          ],
          margin: [0, 0, 0, 2],
        },
        {
          width: '30%',
          stack: [
            { text: `Orden No.: ${pedido.codigo}`, style: 'highlightText', alignment: 'left', margin: [-10, 0, 0, 0] },
            { text: `Pago: ${pedido.tipo_pago}`, style: 'bodyText', alignment: 'left', margin: [-10, 0, 0, 0] },
          ],
          margin: [0, 0, 0, 2],
        },
      ],
    },
    { text: 'Detalles del Pedido', style: 'subHeader', margin: [0, 3] },
    {
      layout: 'lightHorizontalLines',
      table: {
        widths: ['40%', '20%', '20%', '20%'],
        headerRows: 1,
        body: [
          [
            { text: 'Producto', style: 'tableHeader' },
            { text: 'Precio', style: 'tableHeader' },
            { text: 'Cant', style: 'tableHeader' },
            { text: 'Total', style: 'tableHeader' },
          ],
          ...pedidoProductos.map((product) => [
            { text: product.Producto, style: 'tableRow', alignment: 'left' },
            { text: `${product.Precio.toFixed(2)} Bs.`, style: 'tableRow', alignment: 'center' },
            { text: product.Cantidad.toString(), style: 'tableRow', alignment: 'center' },
            { text: `${product.Total.toFixed(2)} Bs.`, style: 'tableRow', alignment: 'right' },
          ]),
          [
            { text: 'Total Neto', colSpan: 3, alignment: 'right', style: 'totalRow' },
            {}, {},
            { text: `${pedido.total.toFixed(2)} Bs.`, style: 'totalRow' },
          ],
        ],
      },
      margin: [0, 5],
    },
    { text: 'Gracias por su compra!', style: 'footer', margin: [0, 3] },
  ];

  return {
    defaultStyle: { fontSize: 8, margin: [0, 2] },
    pageSize: { width: 250, height: 210 },
    pageMargins: [10, 10, 10, 10],
    content: [
      ...ReciboPedido('BlessBurguer'),
    ] as Content[],
    styles: styles,
  };
};
