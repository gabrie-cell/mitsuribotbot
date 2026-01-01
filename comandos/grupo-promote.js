import { jidNormalizedUser } from '@whiskeysockets/baileys';

let handler = async (m, { conn, isGroup, participants }) => {
    const from = m.key.remoteJid;

    if (!isGroup) {
        return await conn.sendMessage(from, {
            text: '「✦」Este comando solo funciona en *grupos*.'
        }, { quoted: m });
    }

    const ctx = m.message?.extendedTextMessage?.contextInfo;
    const user = ctx?.mentionedJid?.[0] || ctx?.participant;

    if (!user) {
        return await conn.sendMessage(from, {
            text: '「✦」Etiqueta o responde a alguien.\n> ✐ Uso » *.promote @usuario*'
        }, { quoted: m });
    }

    const targetId = jidNormalizedUser(user);
    const targetData = participants?.find(p => jidNormalizedUser(p.id) === targetId);

    if (targetData?.admin) {
        return await conn.sendMessage(from, {
            text: '「✦」Ese usuario ya es *administrador*.\n> ✐ Acción cancelada.'
        }, { quoted: m });
    }

    try {
        await conn.groupParticipantsUpdate(from, [user], 'promote');
        await conn.sendMessage(from, {
            text: '「✦」Usuario promovido.\n> ✐ Rol » *administrador*'
        }, { quoted: m });
    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, {
            text: '「✦」No pude promover al usuario.\n> ✐ ¿Soy admin?'
        }, { quoted: m });
    }
};

handler.help = ['promote @usuario'];
handler.tags = ['group'];
handler.command = ['promote'];
handler.useradm = true;
handler.botadm = true;

export default handler;
