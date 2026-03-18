export const bookingConfirmedTemplate = (data: {
  propertyTitle: string;
  startDate: Date;
  endDate: Date;
}) => {

  return `
  <h2>Reserva confirmada 🎉</h2>

  <p>Tu reserva ha sido confirmada.</p>

  <p>
  Propiedad: <b>${data.propertyTitle}</b><br/>
  Desde: ${data.startDate}<br/>
  Hasta: ${data.endDate}
  </p>

  <p>Disfruta tu estadía.</p>
  `;
};