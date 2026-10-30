/* Rabbit Tarot — readers.
   One object per reader; the reader section, the Zalo contact block and the booking flow all read from here.
   id      short latin id, no spaces (also used for bookings — keep it stable once booking is open,
           and keep integrations/firestore.rules + Code.gs in sync)
   card    id of the reader's card in assets/deck-data.js, e.g. 'major-11' = Justice, 'major-18' = The Moon
   photo   portrait, 3:4, about 720×960 px, in assets/readers/
   qr      square crop of the Zalo QR code, in assets/readers/
   zalo    the link inside that QR code (opens the reader's Zalo on phones)
   bio     a string, or a list of blocks: 'paragraph text', {list: ['…', '…']}, {quote: '…'}
   off     weekly days off for online booking: 0 = Chủ nhật … 6 = Thứ 7 */
window.RT_READERS = [
  {
    id: 'rabbit',
    name: 'Rabbit',
    card: 'major-11',
    title: 'Thấu hiểu bản thân, cân bằng lựa chọn, truyền cảm hứng sống.',
    bio: 'Mang năng lượng của lá bài Justice, Thế Anh đại diện cho sự công tâm, thấu hiểu và khả năng nhìn nhận mọi vấn đề từ nhiều góc độ. Với mong muốn trở thành người truyền cảm hứng, Thế Anh tin rằng mỗi trải nghiệm đều mang đến một bài học, mỗi lựa chọn đều mở ra một hướng đi mới. Thông qua Tarot, Thế Anh mong muốn giúp mọi người hiểu rõ bản thân, tìm thấy sự cân bằng và tự tin hơn trên hành trình của chính mình.',
    photo: 'assets/readers/rabbit.jpg',
    qr: 'assets/readers/rabbit-zalo-qr.jpg',
    zalo: 'https://zaloapp.com/qr/p/1n4zt5cdb2j30',
    off: []
  },
  {
    id: 'moon',
    name: 'Moon',
    card: 'major-18',
    title: 'Lắng nghe tiếng vọng bên trong bằng Trực Giác.',
    bio: [
      'Với hơn 300+ khách hàng đã đồng hành, Ms.Moon xem Tarot không đơn thuần là “bói bài”, mà là một công cụ khai mở nhận thức và chữa lành. Sở hữu trực giác nhạy bén cùng tư duy phân tích chặt chẽ, Moon kết hợp Tarot với nền tảng tâm lý học ứng dụng để giúp mỗi người:',
      {list: [
        'Nhìn rõ vấn đề cốt lõi phía sau cảm xúc',
        'Dự báo xu hướng trong công việc, tình cảm, gia đình, học tập, đầu tư',
        'Đưa ra lựa chọn tỉnh táo và phù hợp với chính mình'
      ]},
      'Cô tin rằng:',
      {quote: 'Tarot không quyết định số phận, mà giúp bạn hiểu mình đủ sâu để tự quyết định số phận.'},
      'Trong hành trình làm nghề, chưa có một câu hỏi nào làm khó được cô – bởi mỗi trải bài đều mở ra một lối đi, khi ta sẵn sàng đối diện và thấu hiểu.',
      'Bên cạnh việc trực tiếp xem bài, Ms.Moon cũng là một tarot coaching. Trên hành trình thực hiện sứ mệnh tâm linh, cô đã giảng dạy và đào tạo ra các reader với sự tâm huyết và trách nhiệm, truyền cảm hứng về việc sử dụng tarot như công cụ khai mở và khám phá tiềm năng, thấu hiểu sâu sắc bản thân.'
    ],
    photo: 'assets/readers/moon.jpg',
    qr: 'assets/readers/moon-zalo-qr.jpg',
    zalo: 'https://zaloapp.com/qr/p/4yefgnajzotr',
    off: []
  }
];
