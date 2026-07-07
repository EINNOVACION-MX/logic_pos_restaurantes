package mx.einnovacion.swiftsalepos;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.os.Build;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

/**
 * Talks directly to 58/80mm ESC/POS thermal receipt printers (e.g. MERION PT-B1) over classic
 * Bluetooth SPP. These printers don't implement Android's Print Framework (android.print), so
 * they never show up in the system print dialog used by ReceiptPrinterPlugin — this plugin
 * opens an RFCOMM socket directly to the paired device and writes raw ESC/POS bytes built on
 * the JS side (see src/lib/escpos.ts).
 *
 * Only bonded (already paired via Android Settings) devices are listed — no discovery/scan is
 * performed, so no location permission is required, just BLUETOOTH_CONNECT (Android 12+).
 */
@CapacitorPlugin(
    name = "BluetoothPrinter",
    permissions = {
        @Permission(strings = { Manifest.permission.BLUETOOTH_CONNECT }, alias = "bluetooth")
    }
)
public class BluetoothPrinterPlugin extends Plugin {

    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private boolean needsRuntimePermission() {
        // BLUETOOTH_CONNECT only exists (and is only enforced) on Android 12+; on older
        // versions the manifest-declared BLUETOOTH/BLUETOOTH_ADMIN permissions are enough.
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
            && getPermissionState("bluetooth") != PermissionState.GRANTED;
    }

    @PluginMethod
    public void listPairedDevices(PluginCall call) {
        if (needsRuntimePermission()) {
            requestPermissionForAlias("bluetooth", call, "listPairedDevicesCallback");
            return;
        }
        doListPairedDevices(call);
    }

    @PermissionCallback
    private void listPairedDevicesCallback(PluginCall call) {
        if (needsRuntimePermission()) {
            call.reject("Se necesita permiso de Bluetooth para ver las impresoras emparejadas.");
            return;
        }
        doListPairedDevices(call);
    }

    private void doListPairedDevices(PluginCall call) {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            call.reject("Este dispositivo no tiene Bluetooth.");
            return;
        }
        if (!adapter.isEnabled()) {
            call.reject("El Bluetooth está apagado. Actívalo e intenta de nuevo.");
            return;
        }
        try {
            Set<BluetoothDevice> bonded = adapter.getBondedDevices();
            JSArray devices = new JSArray();
            for (BluetoothDevice device : bonded) {
                JSObject d = new JSObject();
                d.put("name", device.getName());
                d.put("address", device.getAddress());
                devices.put(d);
            }
            JSObject ret = new JSObject();
            ret.put("devices", devices);
            call.resolve(ret);
        } catch (SecurityException ex) {
            call.reject("Permiso de Bluetooth denegado.");
        }
    }

    @PluginMethod
    public void printEscPos(PluginCall call) {
        if (needsRuntimePermission()) {
            requestPermissionForAlias("bluetooth", call, "printEscPosCallback");
            return;
        }
        doPrint(call);
    }

    @PermissionCallback
    private void printEscPosCallback(PluginCall call) {
        if (needsRuntimePermission()) {
            call.reject("Se necesita permiso de Bluetooth para imprimir.");
            return;
        }
        doPrint(call);
    }

    private void doPrint(PluginCall call) {
        String address = call.getString("address");
        String base64Data = call.getString("data");
        if (address == null || address.isEmpty() || base64Data == null || base64Data.isEmpty()) {
            call.reject("Falta la dirección de la impresora o el contenido a imprimir.");
            return;
        }

        new Thread(() -> {
            BluetoothSocket socket = null;
            try {
                BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
                if (adapter == null || !adapter.isEnabled()) {
                    call.reject("El Bluetooth está apagado o no disponible.");
                    return;
                }
                BluetoothDevice device = adapter.getRemoteDevice(address);
                socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                adapter.cancelDiscovery();
                socket.connect();

                byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                OutputStream out = socket.getOutputStream();
                out.write(bytes);
                out.flush();

                JSObject ret = new JSObject();
                ret.put("value", true);
                call.resolve(ret);
            } catch (Exception ex) {
                call.reject("No se pudo imprimir en la impresora Bluetooth: " + ex.getMessage());
            } finally {
                if (socket != null) {
                    try {
                        socket.close();
                    } catch (Exception ignored) {
                    }
                }
            }
        }).start();
    }
}
