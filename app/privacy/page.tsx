export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 24px", fontFamily: "sans-serif", lineHeight: 1.6 }}>
      <h1>Política de Privacidad</h1>
      <p><strong>Gastos Familiares</strong> es una aplicación de uso personal y privado.</p>

      <h2>Datos recopilados</h2>
      <p>La app accede a tu cuenta de Google para:</p>
      <ul>
        <li>Autenticar tu identidad mediante Google OAuth</li>
        <li>Leer correos de notificaciones bancarias de tu Gmail (solo lectura)</li>
      </ul>

      <h2>Uso de los datos</h2>
      <p>Los datos se usan exclusivamente para registrar gastos familiares. No se comparten con terceros ni se usan con fines comerciales.</p>

      <h2>Almacenamiento</h2>
      <p>Los tokens de acceso se almacenan de forma encriptada. No se guarda el contenido de tus correos, solo la información de los gastos extraída.</p>

      <h2>Contacto</h2>
      <p>Para consultas: <a href="mailto:nicoaguirrealende@gmail.com">nicoaguirrealende@gmail.com</a></p>
    </main>
  );
}
