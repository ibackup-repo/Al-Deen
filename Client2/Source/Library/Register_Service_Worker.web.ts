export function Register_Service_Worker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  const Register = () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((Registration) => console.log("SW geregistreerd:", Registration.scope))
      .catch((Error_Value) => console.error("SW registratie mislukt:", Error_Value));
  };

  // Het load-event kan al voorbij zijn wanneer deze code draait.
  if (document.readyState === "complete") Register();
  else window.addEventListener("load", Register);
}