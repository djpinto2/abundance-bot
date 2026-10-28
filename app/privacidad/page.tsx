export const metadata = { title: "Política de privacidad · ABUNDANCE Bot" };

export default function Privacidad() {
  return (
    <main className="legal">
      <h1>Política de privacidad</h1>
      <p className="muted">Última actualización: octubre de 2026</p>

      <h2>Quiénes somos</h2>
      <p>
        ABUNDANCE Productions ofrece servicios de DJ, sonido e iluminación para
        eventos, y clases de DJ en Buenos Aires, Argentina. Este asistente de
        WhatsApp responde consultas y toma pedidos de presupuesto.
      </p>

      <h2>Qué datos recopilamos</h2>
      <ul>
        <li>Tu número de teléfono y nombre de perfil de WhatsApp.</li>
        <li>
          Los datos que nos das en la conversación: fecha, lugar, cantidad de
          invitados y tipo de evento, servicio elegido, disponibilidad horaria o
          el mensaje que nos dejes.
        </li>
      </ul>

      <h2>Para qué los usamos</h2>
      <p>
        Solo para responder tu consulta, armarte un presupuesto y contactarte
        sobre ese pedido. No vendemos ni compartimos tus datos con terceros con
        fines comerciales.
      </p>

      <h2>Dónde se guardan</h2>
      <p>
        Los mensajes se procesan a través de la plataforma de WhatsApp Business
        de Meta. Los pedidos se guardan en una base de datos protegida a la que
        solo accede ABUNDANCE Productions.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés pedir en cualquier momento que borremos tus datos o consultar qué
        información tenemos sobre vos, escribiendo a{" "}
        <a href="mailto:djpintoarg@gmail.com">djpintoarg@gmail.com</a>.
      </p>

      <p><a href="/">← Volver</a></p>
    </main>
  );
}
