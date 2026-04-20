<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
use Mike42\Escpos\Printer;

class PrinterController extends Controller
{
    private function getPrinter(): Printer
    {
        $connector = new WindowsPrintConnector(config('constants.printer_name', '3nStar RPT004'));

        return new Printer($connector);
    }

    /**
     * Print individual tickets (pendientes / factura).
     */
    public function printTickets(Request $request)
    {
        $request->validate([
            'facturaId' => 'required|integer',
            'localName' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.producto.codigo' => 'required|string',
            'items.*.producto.descripcion' => 'required|string',
            'items.*.producto.marca' => 'required|string',
            'items.*.estanteria_nombre' => 'required|string',
            'items.*.bodega_nombre' => 'required|string',
            'items.*.talla' => 'required|string',
            'items.*.cantidad' => 'required|integer',
            'footer' => 'nullable|string',
        ]);

        try {
            $printer = $this->getPrinter();
            $facturaId = $request->facturaId;
            $localName = $request->localName;
            $footer = $request->footer ?: config('app.name', '');
            $fecha = now()->format('d/m/Y');
            $hora = now()->format('h:i:s A');

            foreach ($request->items as $item) {
                $producto = $item['producto'];

                $printer->setJustification(Printer::JUSTIFY_CENTER);
                $printer->setEmphasis(true);

                // REF / EST / FAC line
                $printer->setJustification(Printer::JUSTIFY_LEFT);
                $line = str_pad("REF {$producto['codigo']}", 16) .
                    str_pad("EST {$item['estanteria_nombre']}", 14) .
                    "FAC {$facturaId}";
                $printer->text($line . "\n");

                // Header labels
                $printer->text(str_repeat('-', 42) . "\n");
                $printer->text(str_pad('Cant', 8) . str_pad('Descripcion', 26) . str_pad('Talla', 8, ' ', STR_PAD_LEFT) . "\n");
                $printer->text(str_repeat('-', 42) . "\n");

                // Values
                $printer->setTextSize(2, 1);
                $desc = mb_substr($producto['descripcion'], 0, 20);
                $printer->text(str_pad((string) $item['cantidad'], 4) . str_pad($desc, 22) . str_pad($item['talla'], 6, ' ', STR_PAD_LEFT) . "\n");
                $printer->setTextSize(1, 1);

                // Marca / Bodega
                $printer->setEmphasis(true);
                $printer->text(str_pad($producto['marca'], 24) . str_pad($item['bodega_nombre'], 18, ' ', STR_PAD_LEFT) . "\n");

                // Local / Fecha / Hora
                $printer->text("\n");
                $printer->text($localName . "\n");
                $printer->text("{$fecha}  {$hora}\n");

                // Barcode
                $printer->setJustification(Printer::JUSTIFY_CENTER);
                $printer->setBarcodeHeight(50);
                $printer->setBarcodeWidth(2);
                try {
                    $printer->barcode($producto['codigo'], Printer::BARCODE_CODE128);
                    $printer->text($producto['codigo'] . "\n");
                } catch (\Exception $e) {
                    $printer->text($producto['codigo'] . "\n");
                }

                // Footer banner
                $printer->text("\n");
                $printer->setEmphasis(true);
                $printer->setJustification(Printer::JUSTIFY_CENTER);
                $printer->text("========================\n");
                $printer->text("   RECOGER MUESTRA\n");
                $printer->text("========================\n");
                $printer->setEmphasis(false);

                // Footer text
                if ($footer) {
                    $printer->text($footer . "\n");
                }

                $printer->feed(2);
                $printer->cut(Printer::CUT_PARTIAL);
            }

            $printer->close();

            return response()->json(['ok' => true]);
        } catch (\Exception $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Print cuadre (settlement) receipt.
     */
    public function printCuadre(Request $request)
    {
        $request->validate([
            'facturaId' => 'required|integer',
            'localName' => 'required|string',
            'vendedor' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.producto.codigo' => 'required|string',
            'items.*.producto.descripcion' => 'required|string',
            'items.*.talla' => 'required|string',
            'items.*.cantidad' => 'required|integer',
            'items.*.precio_unitario' => 'required|numeric',
            'footer' => 'nullable|string',
        ]);

        try {
            $printer = $this->getPrinter();
            $facturaId = $request->facturaId;
            $localName = $request->localName;
            $vendedor = $request->vendedor;
            $footer = $request->footer ?: config('app.name', '');
            $fecha = now()->format('d/m/Y');
            $hora = now()->format('h:i:s a');

            $totalPares = 0;
            $totalDinero = 0;
            foreach ($request->items as $item) {
                $totalPares += $item['cantidad'];
                $totalDinero += $item['cantidad'] * $item['precio_unitario'];
            }

            $fmt = fn ($n) => '$ ' . number_format($n, 0, ',', '.');

            // Title
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setEmphasis(true);
            $printer->setTextSize(1, 2);
            $printer->text("PENDIENTES X CANCELAR\n");
            $printer->setTextSize(1, 1);
            $printer->text($localName . "\n");
            $printer->setEmphasis(false);
            $printer->text("{$fecha} {$hora}\n");

            // Factura / Vendedor
            $printer->text(str_repeat('-', 42) . "\n");
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $printer->setEmphasis(true);
            $printer->text(str_pad('FACTURA', 16) . $facturaId . "\n");
            $printer->text(str_pad('VENDEDOR', 16) . $vendedor . "\n");

            // Table header
            $printer->text(str_repeat('-', 42) . "\n");
            $printer->text(str_pad('Ref', 10) . str_pad('', 10) . str_pad('Talla', 10) . str_pad('Precio', 12, ' ', STR_PAD_LEFT) . "\n");
            $printer->text(str_repeat('-', 42) . "\n");
            $printer->setEmphasis(false);

            // Items
            foreach ($request->items as $item) {
                $desc = mb_substr($item['producto']['descripcion'], 0, 42);
                $printer->setEmphasis(true);
                $printer->text($desc . "\n");
                $printer->setEmphasis(false);
                $printer->text(
                    str_pad($item['producto']['codigo'], 10) .
                    str_pad('', 10) .
                    str_pad($item['talla'], 10) .
                    str_pad($fmt($item['precio_unitario']), 12, ' ', STR_PAD_LEFT) . "\n"
                );
            }

            // Subtotals
            $printer->text(str_repeat('-', 42) . "\n");
            $printer->setEmphasis(true);
            $printer->text(str_pad('SUBTOTAL', 28) . str_pad($fmt($totalDinero), 14, ' ', STR_PAD_LEFT) . "\n");
            $printer->text(str_pad('PARES', 28) . str_pad((string) $totalPares, 14, ' ', STR_PAD_LEFT) . "\n");

            // Grand total
            $printer->text(str_repeat('=', 42) . "\n");
            $printer->setTextSize(1, 2);
            $printer->text(str_pad('TOTAL', 20) . str_pad($fmt($totalDinero), 22, ' ', STR_PAD_LEFT) . "\n");
            $printer->setTextSize(1, 1);
            $printer->text(str_pad('PARES', 28) . str_pad((string) $totalPares, 14, ' ', STR_PAD_LEFT) . "\n");
            $printer->setEmphasis(false);

            // Disclaimer
            $printer->text("\n");
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setEmphasis(true);
            $printer->text("Conserve el Sticker o Factura\n");
            $printer->text("para realizar cambios o\n");
            $printer->text("garantias (15) dias.\n");
            $printer->setEmphasis(false);

            // Footer
            if ($footer) {
                $printer->text("\n" . $footer . "\n");
            }

            $printer->feed(2);
            $printer->cut(Printer::CUT_PARTIAL);
            $printer->close();

            return response()->json(['ok' => true]);
        } catch (\Exception $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
