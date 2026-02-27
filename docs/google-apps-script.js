/**
 * Google Apps Script — Retiros Casa de Té
 *
 * INSTRUCCIONES:
 * 1. Abrí tu Google Sheet (o creá una nueva).
 * 2. En la primera fila (encabezados) escribí:
 *    A1: Fecha/Hora | B1: Socio | C1: Variedad | D1: A quién le paga | E1: Gramos
 * 3. Andá a Extensiones → Apps Script.
 * 4. Borrá todo el contenido del editor y pegá este código.
 *    F1: Precio
 * 5. Guardá (Ctrl+S / Cmd+S).
 * 6. Hacé click en "Implementar" (Deploy) → "Nueva implementación" (New deployment).
 * 7. Tipo: "Aplicación web" (Web app).
 * 8. Ejecutar como: "Yo" (Me).
 * 9. Quién tiene acceso: "Cualquier persona" (Anyone).
 * 10. Hacé click en "Implementar" y copiá la URL generada.
 * 11. Pegá esa URL en el archivo sråc/environments/environment.ts (y environment.prod.ts)
 *     en la propiedad googleScriptUrl.
 *
 * ¡Listo! Tu formulario Angular ahora escribe en la planilla.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    var timestamp = new Date();
    var formattedDate =
      Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');

    sheet.appendRow([
      formattedDate,
      data.socio || '',
      data.variedad || '',
      data.pagador || '',
      data.gramos || 0,
      data.precio || 0,
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'ok', message: 'Retiro registrado correctamente' })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', message: 'El servicio está funcionando' })
  ).setMimeType(ContentService.MimeType.JSON);
}
