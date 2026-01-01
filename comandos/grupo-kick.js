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
            text: '「✦」Etiqueta o responde a alguien.\n> ✐ Uso » *.kick @usuario*'
        }, { quoted: m });
    }

    const targetId = jidNormalizedUser(user);
    const botId = jidNormalizedUser(conn.user?.id);
    const targetData = participants?.find(p => jidNormalizedUser(p.id) === targetId);

    if (targetId === botId) {
        return await conn.sendMessage(from, {
            text: '「✦」No puedo expulsarme a mí mismo.'
        }, { quoted: m });
    }

    if (targetData?.admin) {
        return await conn.sendMessage(from, {
            text: '「✦」No puedo expulsar a un *administrador*.\n> ✐ Acción cancelada.'
        }, { quoted: m });
    }

    try {
        await conn.groupParticipantsUpdate(from, [user], 'remove');
        await conn.sendMessage(from, {
            text: '「✦」Usuario eliminado.\n> ✐ Acción » *kick*'
        }, { quoted: m });
    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, {
            text: '「✦」No pude eliminar al usuario.\n> ✐ ¿Soy admin?'
        }, { quoted: m });
    }
};

handler.help = ['kick @usuario'];
handler.tags = ['group'];
handler.command = ['kick'];
handler.useradm = true;
handler.botadm = true;

export default handler;
