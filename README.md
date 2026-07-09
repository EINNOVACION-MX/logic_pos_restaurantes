# LOGIC POS Restaurantes

Sistema de punto de venta (POS) para restaurantes con múltiples sucursales:
mesas, comandas, cocina/barra, caja registradora, inventario y reportes,
disponible tanto en navegador web como en aplicación móvil Android.

Es la especialización white-label de **LOGIC POS** para operación de
restaurante (a diferencia del POS de retail, orientado a mostrador y venta
directa).

## Qué hace

- **Mesas**: mapa de mesas por sucursal con su estado (libre, ocupada, por
  cobrar) y capacidad.
- **Comandas**: el Mesero abre una cuenta por mesa, agrega productos por
  rondas y las envía a cocina/barra; la comanda queda abierta y editable
  hasta que se cobra.
- **Impresión dividida por estación**: cada producto se rutea a su impresora
  de Cocina o de Barra (ESC/POS por red), además del ticket de venta para el
  cliente.
- **Ventas**: catálogo por sucursal, carrito de venta, cobro en efectivo,
  tarjeta, transferencia o crédito ("fiado"), ticket imprimible. Al cerrar
  una cuenta, la comanda se convierte en una venta y queda vinculada a su
  mesa y mesero.
- **Sucursales**: cada sucursal maneja su propio inventario y su propia caja
  registradora de forma independiente.
- **Inventario**: control de stock por sucursal, transferencias de mercancía
  entre sucursales (por ejemplo, de la Matriz a un local), con su historial
  correspondiente.
- **Caja**: apertura y cierre de turno, registro de entradas/retiros de
  efectivo, corte de caja.
- **Personal**: roles de Propietario, Encargado, Cajero y Mesero, cada uno
  con acceso según sus permisos asignados; los empleados de piso inician
  sesión con un PIN numérico rápido.
- **Auditoría**: panel de auditoría con el historial de acciones relevantes
  por sucursal (apertura/cierre de comandas, movimientos de caja, etc.).
- **Reportes**: exportación de ventas e inventario en CSV, y corte mensual en
  PDF con el detalle de ventas y movimientos de efectivo.
- **Clientes**: registro de clientes y control de saldo a crédito.

## Cómo funciona (a grandes rasgos)

1. El **Propietario** inicia sesión con su cuenta de Google y administra las
   sucursales, el catálogo, las mesas, los empleados y la configuración del
   negocio (incluyendo las impresoras de Cocina y Barra).
2. Cada **Encargado** o **Cajero** inicia sesión con un número de empleado
   asignado a su sucursal; el **Mesero** entra con un PIN numérico a una
   vista simplificada centrada en el mapa de mesas y la toma de comandas.
3. Al entrar, cada usuario ve únicamente la sucursal (o sucursales) que le
   corresponde, con su propio mapa de mesas, catálogo, caja y estadísticas.
4. El Mesero abre una mesa, agrega productos y los envía por rondas a
   cocina/barra; al terminar la visita, la cuenta se cobra y la mesa vuelve
   a quedar libre.
5. Las mesas, comandas, el inventario y la caja se sincronizan en tiempo
   real en la nube — cualquier cambio se refleja al instante en todos los
   dispositivos conectados a esa sucursal.
6. La misma cuenta funciona igual en la versión web (navegador) y en la app
   móvil (Android).
