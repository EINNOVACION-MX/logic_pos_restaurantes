# LOGIC POS

Sistema de punto de venta (POS) para negocios con múltiples sucursales:
catálogo de productos, ventas, caja registradora, inventario y reportes,
disponible tanto en navegador web como en aplicación móvil Android.

## Qué hace

- **Ventas**: catálogo por sucursal, carrito de venta, cobro en efectivo,
  tarjeta, transferencia o crédito ("fiado"), ticket imprimible.
- **Sucursales**: cada sucursal maneja su propio inventario y su propia caja
  registradora de forma independiente.
- **Inventario**: control de stock por sucursal, transferencias de mercancía
  entre sucursales (por ejemplo, de la Matriz a un local), con su historial
  correspondiente.
- **Caja**: apertura y cierre de turno, registro de entradas/retiros de
  efectivo, corte de caja.
- **Personal**: roles de Propietario, Encargado y Cajero, cada uno con acceso
  según sus permisos asignados.
- **Reportes**: exportación de ventas e inventario en CSV, y corte mensual en
  PDF con el detalle de ventas y movimientos de efectivo.
- **Clientes**: registro de clientes y control de saldo a crédito.

## Cómo funciona (a grandes rasgos)

1. El **Propietario** inicia sesión con su cuenta de Google y administra las
   sucursales, el catálogo, los empleados y la configuración del negocio.
2. Cada **Encargado** o **Cajero** inicia sesión con un número de empleado
   asignado a su sucursal.
3. Al entrar, cada usuario ve únicamente la sucursal (o sucursales) que le
   corresponde, con su propio catálogo, caja y estadísticas.
4. Las ventas, el inventario y la caja se sincronizan en tiempo real en la
   nube — cualquier cambio se refleja al instante en todos los dispositivos
   conectados a esa sucursal.
5. La misma cuenta funciona igual en la versión web (navegador) y en la app
   móvil (Android).
