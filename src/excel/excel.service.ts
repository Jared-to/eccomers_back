import { Injectable, Type } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import * as fs from 'fs'; // Importar el módulo fs
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, DataSource, QueryRunner, Repository } from 'typeorm';
import { Inventario } from 'src/inventario/entities/inventario.entity';
import { Almacen } from 'src/almacenes/entities/almacen.entity';
import { User } from 'src/auth/entities/user.entity';

import { Producto } from 'src/productos/entities/producto.entity';
import { Categoria } from 'src/categorias/entities/categoria.entity';
import { inventarioInicial } from 'src/inventario/entities/inventario-inicial.entity';
import { MovimientosAlmacenService } from 'src/inventario/service/movimientos-almacen.service';
import { ProductosService } from 'src/productos/productos.service';
import { Venta } from 'src/ventas/entities/venta.entity';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelService {
  constructor(

    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,

    private readonly productoService: ProductosService,

    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,

    @InjectRepository(Almacen)
    private readonly almacenRepository: Repository<Almacen>,

    private readonly movimientosService: MovimientosAlmacenService,

    private readonly connection: DataSource,
  ) { }


  async procesarExcel(file: Express.Multer.File, usuarioResponsable: User) {
    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const filePath = file.path;
      const buffer = await fs.promises.readFile(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0]; // Procesar solo la primera hoja
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        throw new Error('El archivo Excel no contiene datos.');
      }

      const categoriasMap = new Map<string, Categoria>();
      const productosMap = new Map<string, Producto>();
      const almacenesMap = new Map<string, Almacen>();

      const categoriasExistentes = await this.categoriaRepository.find();
      const productosExistentes = await this.productoRepository.find({ relations: ['categoria'] });
      const almacenesExistentes = await this.almacenRepository.find();

      categoriasExistentes.forEach((categoria) =>
        categoriasMap.set(categoria.nombre.toLowerCase(), categoria)
      );

      productosExistentes.forEach((producto) =>
        productosMap.set(producto.sku, producto)
      );

      almacenesExistentes.forEach((almacen) =>
        almacenesMap.set(almacen.nombre.toLowerCase(), almacen)
      );

      const errores: string[] = [];
      let nextIncrement = productosExistentes.length + 1;

      for (const [index, row] of jsonData.entries()) {
        try {
          const categoriaNombre = row['Categoria'].toLowerCase().trim();
          const sku = row['SKU'].trim();
          const alias = row['Alias'].toLowerCase().trim();
          const descripcion = row['Descripcion'];
          const marca = row['Marca'];
          const cantidad = Number(row['Cantidad']);
          const unidadMedida = row['Unidad de Medida'];
          const precioUnitario = Number(row['Precio de Compra']);
          const precioMinimo = Number(row['Precio minimo de Venta']);
          const precioVenta = Number(row['Precio de Venta Cliente']);
          const codigoBarras = row['Codigo de Barras'];
          const almacenNombre = row['Almacen'].toLowerCase().trim();

          if (!categoriaNombre || !sku || !descripcion || isNaN(cantidad) || isNaN(precioUnitario) || isNaN(precioVenta) || !almacenNombre) {
            throw new Error(`Fila inválida en índice ${index}: Datos faltantes o incorrectos.`);
          }

          let categoria = categoriasMap.get(categoriaNombre);
          if (!categoria) {
            categoria = queryRunner.manager.create(Categoria, {
              nombre: row['Categoria'],
              descripcion: `Categoría generada automáticamente (${row['Categoria']})`,
            });
            categoria = await queryRunner.manager.save(Categoria, categoria);
            categoriasMap.set(categoriaNombre, categoria);
          }

          let producto = productosMap.get(sku);
          if (!producto) {
            const codigoProducto = `P${nextIncrement.toString().padStart(4, '0')}`; // Generar código único
            nextIncrement++; // Incrementar para el siguiente producto
            // producto = await this.productoService.createProductoExcel({
            //   alias: alias,
            //   descripcion: descripcion,
            //   sku,
            //   marca,
            //   unidad_medida: unidadMedida,
            //   categoriaId: categoria.id,
            //   codigo: codigoProducto,
            // }, queryRunner);
            productosMap.set(sku, producto);
          }
          console.log(producto);

          let almacen = almacenesMap.get(almacenNombre);
          if (!almacen) {
            almacen = queryRunner.manager.create(Almacen, {
              nombre: row['Almacen'],
            });
            almacen = await queryRunner.manager.save(Almacen, almacen);
            almacenesMap.set(almacenNombre, almacen);
          }

          const registroInicial = queryRunner.manager.create(inventarioInicial, {
            almacen_id: almacen.id,
            producto_id: producto.id,
            cantidad,
            fecha: new Date().toISOString(),
            precio_compra: precioUnitario,
            precio_venta: precioVenta,
          });
          await queryRunner.manager.save(registroInicial);

          let inventario = await queryRunner.manager.findOne(Inventario, {
            where: { almacen: almacen, product: producto },
          });

          if (!inventario) {
            inventario = queryRunner.manager.create(Inventario, {
              almacen: almacen,
              product: { id: producto.id },
              stock: cantidad,
              precio_compra: precioUnitario,
            });
          } else {
            inventario.stock += cantidad;
          }
          await queryRunner.manager.save(inventario);

          await this.movimientosService.registrarIngresoTransaccion({
            almacenId: almacen.id,
            productoId: producto.id,
            cantidad,
            descripcion: 'INVENTARIO INICIAL',
          }, queryRunner);
        } catch (error) {

          errores.push(`Error en la fila ${index + 1}: ${error.message}`);
          continue; // Continúa con la siguiente fila.
        }
      }

      await queryRunner.commitTransaction();
      return {
        message: 'Datos procesados correctamente desde el Excel.',
        errores,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Error al procesar el archivo: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async generarCodigoCliente(): Promise<string> {
    const codigoCliente = uuidv4();
    console.log(`Código Cliente Generado: ${codigoCliente}`);
    return codigoCliente;
  }
  async generarReporteVentas(ventas: Venta[]) {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Ventas');

    const estiloTitulo = {
      font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: '4F81BD' }
      },
      alignment: {
        horizontal: 'center' as ExcelJS.Alignment['horizontal'],
        vertical: 'middle' as ExcelJS.Alignment['vertical']
      }
    };

    const estiloTotal = {
      font: { bold: true, size: 12 },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'C6EFCE' }
      },
      alignment: {
        horizontal: 'center' as ExcelJS.Alignment['horizontal'],
        vertical: 'middle' as ExcelJS.Alignment['vertical']
      }
    };

    const estiloEncabezado = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: '4F81BD' }
      },
      alignment: {
        horizontal: 'center' as ExcelJS.Alignment['horizontal'],
        vertical: 'middle' as ExcelJS.Alignment['vertical']
      },
      border: {
        top: { style: 'thin' as ExcelJS.BorderStyle },
        bottom: { style: 'thin' as ExcelJS.BorderStyle },
        left: { style: 'thin' as ExcelJS.BorderStyle },
        right: { style: 'thin' as ExcelJS.BorderStyle }
      }
    };

    const estiloDato = {
      border: {
        top: { style: 'thin' as ExcelJS.BorderStyle },
        bottom: { style: 'thin' as ExcelJS.BorderStyle },
        left: { style: 'thin' as ExcelJS.BorderStyle },
        right: { style: 'thin' as ExcelJS.BorderStyle }
      },
      alignment: {
        vertical: 'middle' as ExcelJS.Alignment['vertical']
      }
    };

    // Título
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = `REPORTE DE VENTAS - Fecha: ${fechaHoy}`;
    worksheet.getCell('A1').style = estiloTitulo;

    // Total de ventas
    // Total de ventas
    const totalVentas = ventas.reduce((sum, v) => sum + v.subtotal, 0);
    worksheet.mergeCells('A3:H3');
    worksheet.getCell('A3').value = `Total de Ventas: Bs. ${totalVentas.toFixed(2)}`;
    worksheet.getCell('A3').style = estiloTotal;

    // Totales por método de pago
    const totalQR = ventas
      .filter((v) => v.tipo_pago.toLowerCase() === 'qr')
      .reduce((sum, v) => sum + v.total, 0);

    const totalEfectivo = ventas
      .filter((v) => v.tipo_pago.toLowerCase() === 'efectivo')
      .reduce((sum, v) => sum + v.total, 0);

    // Fila: Total QR
    worksheet.mergeCells('A4:H4');
    worksheet.getCell('A4').value = `Total por QR: Bs. ${totalQR.toFixed(2)}`;
    worksheet.getCell('A4').style = estiloTotal;

    // Fila: Total Efectivo
    worksheet.mergeCells('A5:H5');
    worksheet.getCell('A5').value = `Total por Efectivo: Bs. ${totalEfectivo.toFixed(2)}`;
    worksheet.getCell('A5').style = estiloTotal;


    // Encabezados
    const encabezados = [
      '#', 'Fecha', 'Cliente', 'Vendedor', 'SubTotal', 'Descuento', 'Total', 'Método de Pago', 'Número de Venta'
    ];
    worksheet.addRow([]);
    const encabezadoRow = worksheet.addRow(encabezados);
    encabezadoRow.eachCell((cell) => {
      cell.style = estiloEncabezado;
    });

    // Datos
    ventas.forEach((venta, index) => {
      const row = worksheet.addRow([
        index + 1,
        new Date(venta.fecha).toISOString().split('T')[0],
        `${venta.cliente.nombre} ${venta.cliente.apellido}`,
        venta.vendedor.fullName,
        venta.subtotal,
        venta.descuento || 0,
        venta.total,
        venta.tipo_pago,
        venta.codigo
      ]);
      row.eachCell((cell) => {
        cell.style = estiloDato;
      });
    });

    // Ajuste de columnas
    worksheet.columns = [
      { width: 5 },
      { width: 12 },
      { width: 25 },
      { width: 25 },
      { width: 15 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    const filePath = `./reporte_ventas_${fechaHoy}.xlsx`;
    await workbook.xlsx.writeFile(filePath);

    return filePath;
  }
  obtenerIdDepAndNameAlmacen(cadena: string): { idDepartamento: number | null; almacenNombre: string } {

    const cadenaMinusculas = cadena.toLowerCase();

    // Remover la palabra "almacen" (ya en minúsculas)
    const sinAlmacen = cadenaMinusculas.replace(/almacen\s*/i, '').trim();

    // Utilizar expresión regular para dividir la cadena en sus partes
    const regex = /^-?\s*(\d+)?\s*-?\s*(.+)$/;
    const match = sinAlmacen.match(regex);

    if (match) {
      const idDepartamento = match[1] ? parseInt(match[1], 10) : null; // Si hay número, convertirlo, si no, asignar null
      const almacenNombre = match[2] ? match[2].trim() : ''; // Si hay un nombre, asignarlo, si no, asignar cadena vacía
      console.log(idDepartamento);
      console.log(almacenNombre);
      return {
        idDepartamento,
        almacenNombre,
      };
    } else {
      throw new Error('No existe un nombre correcto para el almacen.');
    }
  }


}