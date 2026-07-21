// app/components/TareaModal.tsx

type Tarea = {
  titulo: string;
  descripcion?: string;
  fecha_entrega: string;
};

interface TareaModalProps {
  tarea: Tarea;
  onClose: () => void;
}

export default function TareaModal({ tarea, onClose }: TareaModalProps) {
  // Formateamos la fecha para mostrarla de una manera más legible
  const fechaFormateada = new Date(`${tarea.fecha_entrega}T00:00:00`).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div 
      // Fondo oscuro semitransparente
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center animate-in fade-in-25"
      onClick={onClose} // Cierra el modal al hacer clic fuera
    >
      <div 
        // Contenedor del modal
        className="bg-surface rounded-2xl shadow-2xl p-6 w-full max-w-md m-4 border border-border animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
      >
        <h2 className="text-2xl font-bold text-primary mb-2">{tarea.titulo}</h2>
        
        <div className="text-sm text-text-muted mb-4">
          <span className="font-semibold">Fecha de entrega:</span>
          {' '}
          {fechaFormateada}
        </div>

        <p className="text-text mb-6 whitespace-pre-wrap">
          {tarea.descripcion || "Esta tarea no tiene una descripción."}
        </p>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg font-bold hover:bg-teal-600 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}