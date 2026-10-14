// Cloud Functions do sistema de gestão de obras.
// - enviarAviso: a cada aviso criado em `notifications`, manda push (FCM) e, conforme a preferência, e-mail.
// - resumoSemanal: domingo 18h (horário de Brasília), e-mail com o resumo de cada obra para os administradores.
// E-mails saem pela extensão "Trigger Email" (coleção `mail`) configurada com o SMTP da empresa.

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { montarResumoSemanal, resumoHtml } from './resumoSemanal.js';

initializeApp();
const db = getFirestore();

const REGIAO = 'southamerica-east1';
const APP_URL = 'https://henri-rodrigues.github.io/Kanban-El-trica/';
// Tipos de aviso que também vão por e-mail (chat comum fica só no push, para não lotar a caixa).
const TIPOS_EMAIL = new Set(['task_assigned', 'travel_schedule', 'mention']);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todos = async (colecao) => (await db.collection(colecao).get()).docs.map((d) => ({ id: d.id, ...d.data() }));

export const enviarAviso = onDocumentCreated({ document: 'notifications/{id}', region: REGIAO }, async (event) => {
  const aviso = event.data?.data();
  if (!aviso?.recipientUserId) return;

  const [prefsSnap, userSnap] = await Promise.all([
    db.doc(`push_tokens/${aviso.recipientUserId}`).get(),
    db.doc(`users/${aviso.recipientUserId}`).get()
  ]);
  const prefs = prefsSnap.exists ? prefsSnap.data() : {};
  const usuario = userSnap.exists ? userSnap.data() : null;
  if (usuario && usuario.status && usuario.status !== 'approved') return;

  // Push em todos os aparelhos registrados da pessoa
  const tokens = prefs.push === false ? [] : prefs.tokens || [];
  if (tokens.length) {
    const resposta = await getMessaging().sendEachForMulticast({
      tokens,
      data: {
        title: String(aviso.title || 'Gestão Elétrica'),
        body: String(aviso.message || ''),
        link: APP_URL,
        tag: String(aviso.type || 'aviso')
      },
      webpush: { headers: { Urgency: 'high' } }
    });
    // Remove tokens de aparelhos que não existem mais
    const invalidos = resposta.responses
      .map((r, i) => (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-argument'].includes(r.error?.code) ? tokens[i] : null))
      .filter(Boolean);
    if (invalidos.length) await db.doc(`push_tokens/${aviso.recipientUserId}`).update({ tokens: FieldValue.arrayRemove(...invalidos) });
  }

  // E-mail (tarefa atribuída, viagem e menção), se a pessoa não desligou
  if (usuario?.email && prefs.email !== false && TIPOS_EMAIL.has(aviso.type)) {
    await db.collection('mail').add({
      to: usuario.email,
      message: {
        subject: `[Gestão Elétrica] ${aviso.title || 'Novo aviso'}`,
        html: `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#1f2733">
          <h2 style="font-size:17px;margin:0 0 8px">${esc(aviso.title)}</h2>
          <p>${esc(aviso.message)}</p>
          <p><a href="${APP_URL}" style="background:#4f7cf0;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none">Abrir o sistema</a></p>
          <p style="color:#98a2b3;font-size:11px">Você recebe este e-mail porque os avisos por e-mail estão ligados na sua Minha agenda.</p>
        </div>`
      }
    });
  }
  logger.info('Aviso enviado', { tipo: aviso.type, push: tokens.length, destinatario: aviso.recipientUserId });
});

export const resumoSemanal = onSchedule(
  { schedule: '0 18 * * 0', timeZone: 'America/Sao_Paulo', region: REGIAO },
  async () => {
    const [obras, cards, pedidos, laudos, usuarios] = await Promise.all([
      todos('obras'), todos('cards'), todos('purchase_orders'), todos('laudos_checklist'), todos('users')
    ]);
    const resumos = montarResumoSemanal({ obras, cards, pedidos, laudos }, new Date());
    const admins = usuarios.filter((u) => u.role === 'administrador' && u.status === 'approved' && u.email);
    if (!admins.length) return;

    await db.collection('mail').add({
      to: admins.map((u) => u.email),
      message: {
        subject: `[Gestão Elétrica] Resumo semanal das obras — ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
        html: resumoHtml(resumos, { appUrl: APP_URL })
      }
    });
    logger.info('Resumo semanal enviado', { obras: resumos.length, destinatarios: admins.length });
  }
);
