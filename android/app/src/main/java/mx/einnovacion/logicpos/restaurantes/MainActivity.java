package mx.einnovacion.logicpos.restaurantes;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ReceiptPrinterPlugin.class);
        registerPlugin(BluetoothPrinterPlugin.class);
        registerPlugin(EscPosPrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
