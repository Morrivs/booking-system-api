export const bookingExpiredTemplate = (data: {
  propertyTitle: string;
}) => {

  return `
  <h2>Reserva expirada</h2>

  <p>Tu solicitud de reserva para <b>${data.propertyTitle}</b> expiró.</p>
  `;
};