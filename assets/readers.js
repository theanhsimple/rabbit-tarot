/* Rabbit Tarot — readers.
   One object per reader; the reader section, the Zalo contact block and the booking flow all read from here.
   id      short latin id, no spaces (also used for bookings — keep it stable once booking is open)
   card    id of the reader's card in assets/deck-data.js, e.g. 'major-11' = Justice
   photo   portrait, 3:4, about 720×960 px, in assets/readers/
   qr      square crop of the Zalo QR code, in assets/readers/
   zalo    the link inside that QR code (opens the reader's Zalo on phones)
   off     weekly days off for online booking: 0 = Chủ nhật … 6 = Thứ 7 */
window.RT_READERS = [
  {
    id: 'theanh',
    name: 'Thế Anh',
    alias: 'Rabbit',
    card: 'major-11',
    title: 'Thấu hiểu bản thân, cân bằng lựa chọn, truyền cảm hứng sống.',
    bio: 'Mang năng lượng của lá bài Justice, Thế Anh đại diện cho sự công tâm, thấu hiểu và khả năng nhìn nhận mọi vấn đề từ nhiều góc độ. Với mong muốn trở thành người truyền cảm hứng, Thế Anh tin rằng mỗi trải nghiệm đều mang đến một bài học, mỗi lựa chọn đều mở ra một hướng đi mới. Thông qua Tarot, Thế Anh mong muốn giúp mọi người hiểu rõ bản thân, tìm thấy sự cân bằng và tự tin hơn trên hành trình của chính mình.',
    photo: 'assets/readers/theanh.jpg',
    qr: 'assets/readers/theanh-zalo-qr.jpg',
    zalo: 'https://zaloapp.com/qr/p/1n4zt5cdb2j30',
    off: []
  }
];
