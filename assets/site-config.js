/* Rabbit Tarot — site switches.
   RT_BOOKING_OPEN = false hides the booking flow, booking lookup and every "Đặt lịch" call to action,
   and shows a "sắp mở" notice in the booking section instead. Set to true when online booking launches. */
window.RT_BOOKING_OPEN = false;

/* Zalo contact shown in the booking section while online booking is closed.
   phone: Zalo number, e.g. '0909123456' → "Mở Zalo" opens https://zalo.me/0909123456 and the number shows under the QR.
   qr:    path to the Zalo QR image, e.g. 'assets/zalo-qr.png' (square PNG/JPG, at least 480×480 px).
   Leave empty to show the "đang cập nhật" placeholder. */
window.RT_ZALO = {
  phone: '',
  qr: ''
};
