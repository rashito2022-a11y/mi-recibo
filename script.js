// === FECHA AUTOMÁTICA ===
const fechaSpan = document.getElementById("fechaActual");
if (fechaSpan) {
  const hoy = new Date();
  const dia = hoy.getDate().toString().padStart(2, "0");
  const mes = (hoy.getMonth() + 1).toString().padStart(2, "0");
  const año = hoy.getFullYear();
  fechaSpan.textContent = `${dia}/${mes}/${año}`;
}

// === NÚMERO DE RECIBO AUTOMÁTICO ===
const tituloRecibo = document.getElementById("tituloRecibo");
let numeroActual = localStorage.getItem("numeroRecibo");
if (!numeroActual) {
  numeroActual = 479;
} else {
  numeroActual = parseInt(numeroActual) + 1;
}
localStorage.setItem("numeroRecibo", numeroActual);
tituloRecibo.textContent = `RECIBO #${numeroActual
  .toString()
  .padStart(4, "0")}`;

// === ELEMENTOS DESCRIPCION ===
const descripcion = document.getElementById("descripcion");
const descripcionDisplay = document.getElementById("descripcionDisplay");

// Función que ajusta altura del textarea y sincroniza el div de visualización
if (descripcion && descripcionDisplay) {
  const ajustarAltura = (el) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const sincronizarDisplay = () => {
    // Copia el valor y preserva saltos
    descripcionDisplay.textContent = descripcion.value.trim();
  };

  // Eventos
  descripcion.addEventListener("input", () => {
    ajustarAltura(descripcion);
    sincronizarDisplay();
  });

  // Al cargar la página inicializamos
  window.addEventListener("load", () => {
    ajustarAltura(descripcion);
    sincronizarDisplay();
  });
}

// === Manejo antes/después de imprimir (para que print use el div) ===
function prepararParaImpresion() {
  if (descripcion && descripcionDisplay) {
    descripcion.style.display = "none";
    descripcionDisplay.style.display = "block";
  }
}
function restaurarDespuesImpresion() {
  if (descripcion && descripcionDisplay) {
    descripcion.style.display = ""; // vuelve a la regla por defecto (visible)
    descripcionDisplay.style.display = "none";
  }
}

// Eventos para impresión en navegadores modernos
if (window.matchMedia) {
  window.matchMedia("print").addListener((mql) => {
    if (mql.matches) prepararParaImpresion();
    else restaurarDespuesImpresion();
  });
}
window.addEventListener("beforeprint", prepararParaImpresion);
window.addEventListener("afterprint", restaurarDespuesImpresion);

// Si usas el botón "Imprimir" del UI, llamamos a window.print() asegurando toggle
document.getElementById("botonImprimir").addEventListener("click", () => {
  prepararParaImpresion();
  // small timeout por si el navegador necesita tiempo para aplicar estilos
  setTimeout(() => window.print(), 100);
  // restauramos tras un tiempo prudente (en algunos navegadores afterprint no se dispara)
  setTimeout(restaurarDespuesImpresion, 1000);
});

// === DESCARGAR COMO PDF (con ajuste para que PDF use el div estático) ===
document.getElementById("descargarPDF").addEventListener("click", () => {
  const recibo = document.getElementById("recibo");
  const botones = recibo.querySelectorAll(".no-print");

  // Ocultar botones UI
  botones.forEach((b) => (b.style.display = "none"));

  // Forzar que el div de visualización esté visible y textarea oculto
  if (descripcion && descripcionDisplay) {
    // sincronizamos por si el usuario no hizo input recientemente
    descripcionDisplay.textContent = descripcion.value.trim();
    descripcion.style.display = "none";
    descripcionDisplay.style.display = "block";
  }

  // Clonar recibo para medir altura real (incluyendo el div visible)
  const clon = recibo.cloneNode(true);
  clon.style.position = "absolute";
  clon.style.left = "-9999px";
  clon.style.top = "0";
  clon.style.width = "58mm";
  document.body.appendChild(clon);

  const alturaRecibo = clon.scrollHeight * 0.264583; // px → mm
  document.body.removeChild(clon);

  const opt = {
    margin: 0,
    filename: `Recibo_${numeroActual}.pdf`,
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 5, useCORS: true },
    jsPDF: { unit: "mm", format: [58, alturaRecibo], orientation: "portrait" },
  };

  html2pdf()
    .set(opt)
    .from(recibo)
    .save()
    .then(() => {
      // Restaurar UI y textarea
      botones.forEach((b) => (b.style.display = "flex"));
      if (descripcion && descripcionDisplay) {
        descripcion.style.display = "";
        descripcionDisplay.style.display = "none";
      }
    })
    .catch((err) => {
      console.error("Error al generar PDF:", err);
      // Restaurar incluso en error
      botones.forEach((b) => (b.style.display = "flex"));
      if (descripcion && descripcionDisplay) {
        descripcion.style.display = "";
        descripcionDisplay.style.display = "none";
      }
    });
});
