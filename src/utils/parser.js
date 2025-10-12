// bot/src/utils/parser.js
function parseHighlightMessage(args) {
    const gameMatch = args.find(arg => arg.startsWith('game:'));
    const tagsMatch = args.find(arg => arg.startsWith('tags:') || arg.startsWith('tag:')); // แก้ไขตรงนี้
    // สำหรับ content จะให้มันจับทุกอย่างที่ไม่ใช่ game: หรือ tags:
    // หรือถ้าต้องการให้ content ต้องมี "content:" นำหน้า ก็จะเปลี่ยน logic ตรงนี้

    let game = null;
    let tags = [];
    let content = null;
    let contentArgs = []; // สำหรับเก็บส่วนที่อาจจะเป็น content

    for (const arg of args) {
        if (arg.startsWith('game:')) {
            game = arg.substring(5);
        } else if (arg.startsWith('tags:')) {
            tags = arg.substring(5).split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (arg.startsWith('tag:')) { // เพิ่มเงื่อนไขสำหรับ 'tag:'
            tags = arg.substring(4).split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else {
            contentArgs.push(arg); // ส่วนที่เหลือที่ไม่ได้เป็น game หรือ tags ถือเป็น content
        }
    }

    if (contentArgs.length > 0) {
        content = contentArgs.join(' ');
    }


    return { game, tags, content };
}

module.exports = {
    parseHighlightMessage,
};