export const bookingCreatedTemplate = (data: {
  guestName: string;
  propertyTitle: string;
  startDate: Date;
  endDate: Date;
}) => {

  return `
  <h2>Nueva reserva</h2>

  <p>Hola,</p>

  <p>${data.guestName} ha solicitado una reserva.</p>

  <p>
  Propiedad: <b>${data.propertyTitle}</b><br/>
  Desde: ${data.startDate}<br/>
  Hasta: ${data.endDate}
  </p>

  <p>Revisa tu panel para confirmarla.</p>
  `;
};