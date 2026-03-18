export const bookingCancelledTemplate = (data: {
  propertyTitle: string;
}) => {

  return `
  <h2>Reserva cancelada</h2>

  <p>La reserva en <b>${data.propertyTitle}</b> fue cancelada.</p>
  `;
};