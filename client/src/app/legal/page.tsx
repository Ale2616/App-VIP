export default function LegalPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-gray-300">
      <div className="max-w-4xl mx-auto px-8 py-16 mt-10">
        <h1 className="text-3xl font-bold mb-8 text-white">
          Términos y Condiciones / DMCA
        </h1>

        <div className="space-y-6 leading-relaxed">
          <p>
            El contenido publicado en App VIP es proporcionado estrictamente con
            fines informativos, educativos y de prueba.
          </p>

          <div>
            <h2 className="text-white font-semibold mb-2">
              Renuncia de Responsabilidad
            </h2>
            <p>
              App VIP no aloja, almacena ni distribuye ningún archivo,
              aplicación o juego en sus propios servidores. Todos los enlaces
              proporcionados son recopilados de internet y apuntan a servicios
              de alojamiento de terceros sobre los cuales no tenemos ningún
              control ni jurisdicción.
            </p>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-2">Política DMCA</h2>
            <p>
              Respetamos los derechos de propiedad intelectual. Si eres el
              desarrollador o propietario de los derechos de autor de algún
              contenido enlazado en este sitio y deseas que sea retirado, por
              favor contáctanos directamente a través de nuestro canal oficial
              de Telegram para procesar la eliminación de los enlaces.
            </p>
          </div>

          <p>
            El uso de cualquier software descargado a través de sitios de
            terceros es responsabilidad única y exclusiva del usuario final.
          </p>
        </div>
      </div>
    </main>
  );
}
