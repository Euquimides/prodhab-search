// ponytail: los 4 exportadores (md, docx, pdf, json de progreso) hacían el
// mismo baile de crear un <a>, hacer click y revocar la URL. Revocar en el
// mismo tick que el click cancela la descarga en algunos navegadores
// (Firefox), así que se revoca en el siguiente tick, en un solo lugar.
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
