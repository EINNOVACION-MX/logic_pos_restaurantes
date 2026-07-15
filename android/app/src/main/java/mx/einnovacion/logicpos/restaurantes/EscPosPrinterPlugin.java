package mx.einnovacion.logicpos.restaurantes;

import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;
import java.net.ConnectException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

/**
 * Sends raw ESC/POS bytes to network thermal printers (kitchen/bar station tickets, Fase 5)
 * over a plain TCP socket — port 9100 is the de-facto raw-printing port most network ESC/POS
 * printers listen on. Unlike BluetoothPrinterPlugin there's no pairing/bonding step: any
 * printer reachable on the LAN by static IP works, which is why the Cocina/Barra settings
 * capture an IP/port pair per station instead of a paired-device address. The two stations are
 * independent — a caller fires one `printRaw` per destination, so one printer being offline
 * never blocks the other.
 */
@CapacitorPlugin(name = "EscPosPrinter")
public class EscPosPrinterPlugin extends Plugin {

    private static final int CONNECT_TIMEOUT_MS = 5000;

    @PluginMethod
    public void printRaw(PluginCall call) {
        String ip = call.getString("ip");
        int port = call.getInt("port", 9100);
        String base64Data = call.getString("data");

        if (ip == null || ip.isEmpty() || base64Data == null || base64Data.isEmpty()) {
            call.reject("Falta la IP de la impresora o el contenido a imprimir.");
            return;
        }

        new Thread(() -> {
            Socket socket = null;
            try {
                byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                socket = new Socket();
                socket.connect(new InetSocketAddress(ip, port), CONNECT_TIMEOUT_MS);

                OutputStream out = socket.getOutputStream();
                out.write(bytes);
                out.flush();

                JSObject ret = new JSObject();
                ret.put("value", true);
                call.resolve(ret);
            } catch (SocketTimeoutException | ConnectException | UnknownHostException ex) {
                call.reject("La impresora en " + ip + ":" + port + " no responde. Verifica que esté encendida y conectada a la misma red.");
            } catch (Exception ex) {
                call.reject("No se pudo imprimir en " + ip + ":" + port + ": " + ex.getMessage());
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
