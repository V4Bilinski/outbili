# Meta Official Utility Template Portfolio

> **Source:** Meta's WhatsApp Business Platform — Official Template Library (pt-BR locale)
> **API Version:** Cloud API v24.0
> **Category:** Utility (all templates)
> **Last Updated:** 2026-03-20
>
> This document is the **gold standard reference** for utility template creation on the WhatsApp Business Platform.
> Every template listed here was extracted from Meta's official template library and represents a pre-approved
> utility template pattern. Use these as the canonical source when designing, validating, or auditing
> utility templates for WhatsApp Business accounts.

---

## Summary

| Category | Count | Templates |
|----------|------:|-----------|
| Account | 1 | account_creation_confirmation_3 |
| Address | 1 | address_update |
| Appointment | 9 | appointment_cancelled, appointment_confirmation_1, appointment_confirmed, appointment_reminder, appointment_reminder_2, appointment_reschedule_1, appointment_rescheduled, appointment_scheduling, appointment_scheduling_address |
| Auto Pay | 3 | auto_pay_reminder_1, auto_pay_reminder_2, auto_pay_reminder_3 |
| Call | 1 | call_permission_request_1 |
| Card Transaction | 2 | card_transaction_alert_1, card_transaction_alert_2 |
| Crisis | 2 | crisis_response_1, crisis_response_2 |
| Delivery | 12 | delivery_confirmation_1..5, delivery_failed_1..2, delivery_failed_form_1, delivery_update_1..4 |
| Device | 1 | device_recovery |
| Disbursement | 2 | disbursement_balance_1, disbursement_voucher_1 |
| Event | 4 | event_details_reminder_1..2, event_rsvp_confirmation_1..2 |
| Feedback | 5 | feedback_collection, feedback_survey_1..2, feedback_survey_form_1..2 |
| Followup | 1 | followup_missed_calls |
| Fraud | 6 | fraud_alert_1..4, fraud_awareness_1 |
| Group | 3 | group_invite_link, group_invite_link_concise, group_invite_link_detailed |
| Health | 3 | health_awareness_1, health_emergency_1..2 |
| Identity | 2 | identity_compliance_1..2 |
| Installation | 1 | installation_complete |
| Low Balance | 3 | low_balance_warning_1..3 |
| Missed Appointment | 1 | missed_appointment |
| Network | 1 | network_troubleshooting |
| Operation | 2 | operation_disruption_1..2 |
| Order Action | 2 | order_action_required_1..2 |
| Order Canceled | 4 | order_canceled_1..4 |
| Order Confirm | 3 | order_confirm_auto_schedule, order_confirm_manual_schedule, order_confirmed |
| Order Delay | 2 | order_delay_1..2 |
| Order Delivered | 1 | order_delivered |
| Order Management | 7 | order_management_1..6, order_management_no_cta_5 |
| Order Pick Up | 4 | order_pick_up_1, order_pick_up_3..4, order_pick_up_no_cta_4 |
| Order Shipped | 1 | order_shipped |
| Order Update | 2 | order_update_1, order_update_no_cta_1 |
| Payment Action Required | 3 | payment_action_required_1..3 |
| Payment Confirmation | 4 | payment_confirmation_1..4 |
| Payment Due | 3 | payment_due_reminder, payment_due_reminder_1..2 |
| Payment Failed | 5 | payment_failed_1..5 |
| Payment Notice | 3 | payment_notice_1..3 |
| Payment Overdue | 7 | payment_overdue_1..3, payment_overdue_5..8 |
| Payment Recharge | 1 | payment_recharge_reminder_01 |
| Payment Reminder | 8 | payment_reminder_1..8 |
| Payment Scheduled | 3 | payment_scheduled_1..3 |
| Payment Successful | 1 | payment_successful |
| Phone Deactivation | 1 | phone_deactivation_reminder_01 |
| Privacy | 1 | privacy_disclosure_1 |
| Product Recall | 1 | product_recall_1 |
| Purchase Receipt | 3 | purchase_receipt_1..3 |
| Purchase Transaction | 1 | purchase_transaction_alert |
| Recharge | 4 | recharge_failure, recharge_reminder, recharge_reminder_02, recharge_successful |
| Refund | 1 | refund_confirmation_1 |
| Renewal | 2 | renewal_reminder, renewal_successful |
| Rescheduling | 1 | rescheduling_request |
| Return | 2 | return_confirmation_1..2 |
| Roaming | 1 | roaming_reminder |
| Service | 1 | service_disruption |
| Severe Weather | 2 | severe_weather_alert_1..2 |
| Shifting | 1 | shifting_journey |
| Shipment | 5 | shipment_confirmation_1..5 |
| Statement | 2 | statement_available_1..2 |
| Support | 1 | support_ticket_acknowledgement |
| System | 2 | system_outage_1..2 |
| Technician | 1 | technician_visit |
| Speed | 1 | speed_upgrade_notice |
| Voting | 1 | voting_registration_1 |
| Warranty | 1 | warranty_alert_1 |
| **TOTAL** | **165** | |

---

## Account

### account_creation_confirmation_3

- **ID:** `account_creation_confirmation_3`
- **Header:** TEXT — "Finalize a configuracao da conta"
- **Body:** "Oi, {{texto}}, Sua nova conta foi criada com sucesso. Verifique {{texto}} para concluir seu perfil."
- **Footer:** —
- **Buttons:**
  - URL — "Verificar a conta"
- **Variables:** texto (x2)
- **Use case:** Confirm new account creation and prompt user to complete profile verification.

---

## Address

### address_update

- **ID:** `address_update`
- **Header:** TEXT — "Atualizacao de endereco"
- **Body:** "Ola, {{texto}}, seu endereco de entrega foi atualizado com sucesso para {{texto}}. Contacte {{texto}} para quaisquer duvidas."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x3)
- **Use case:** Confirm that a delivery address has been successfully updated.

---

## Appointment

### appointment_cancelled

- **ID:** `appointment_cancelled`
- **Header:** TEXT — "Compromisso cancelado"
- **Body:** "Ola, {{texto}}. Sua consulta em {{texto}} foi cancelada. Esperamos ve-lo noutra altura."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2)
- **Use case:** Notify customer that their appointment has been cancelled.

### appointment_confirmation_1

- **ID:** `appointment_confirmation_1`
- **Header:** TEXT — "Sua consulta esta marcada"
- **Body:** "Ola, {{texto}}. Obrigado por reservar com {{nome comercial}}. Sua consulta para {{texto}} em {{data}} as {{texto}} esta confirmada."
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes"
- **Variables:** texto (x3), nome_comercial, data
- **Use case:** Confirm a booked appointment with date, time, and service details.

### appointment_confirmed

- **ID:** `appointment_confirmed`
- **Header:** TEXT — "Compromisso confirmado"
- **Body:** "Ola, {{texto}}. Sua consulta esta agendada para {{texto}}. Servico: {{texto}} Numero de confirmacao: {{texto}} Estamos ansiosos pela sua visita."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x4)
- **Use case:** Confirm appointment with service name and confirmation number.

### appointment_reminder

- **ID:** `appointment_reminder`
- **Header:** —
- **Body:** "Lembrete: o nosso tecnico ira visitar a sua localizacao no dia {{data}} as {{texto}} para a sua instalacao de banda larga. Por favor, esteja disponivel."
- **Footer:** —
- **Buttons:** —
- **Variables:** data, texto
- **Use case:** Remind customer about upcoming technician visit for broadband installation.

### appointment_reminder_2

- **ID:** `appointment_reminder_2`
- **Header:** TEXT — "Voce tem um compromisso proximo"
- **Body:** "Ola, John. Este e um lembrete sobre o seu proximo compromisso com a Fashion Styles em 31 de dezembro de 2025 as 1:00 PM. Estamos ansiosos por te ver!"
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes"
- **Variables:** (hardcoded sample — name, business, date, time)
- **Use case:** Remind customer about an upcoming appointment.

### appointment_reschedule_1

- **ID:** `appointment_reschedule_1`
- **Header:** TEXT — "Sua consulta foi reagendada"
- **Body:** "Ola, {{texto}}. Seu proximo compromisso com {{nome comercial}} foi reagendado para {{data}} as {{texto}}. Estamos ansiosos por te ver!"
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes"
- **Variables:** texto (x2), nome_comercial, data
- **Use case:** Notify customer that their appointment has been rescheduled.

### appointment_rescheduled

- **ID:** `appointment_rescheduled`
- **Header:** TEXT — "Compromisso reagendado"
- **Body:** "Ola, {{texto}}, O teu compromisso foi reagendado para {{texto}}. Servico: {{texto}} Numero de confirmacao: {{texto}} Estamos ansiosos pela sua visita."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x4)
- **Use case:** Confirm rescheduled appointment with updated details.

### appointment_scheduling

- **ID:** `appointment_scheduling`
- **Header:** TEXT — "Visita do tecnico"
- **Body:** "Ola, {{texto}}, estamos agendando uma visita de tecnico para sua {{texto}} em {{data}} entre {{texto}} e {{texto}}. Por favor confirme se este horario funciona para voce."
- **Footer:** —
- **Buttons:**
  - QR — "Confirmar"
  - QR — "Reagendar"
- **Variables:** texto (x4), data
- **Use case:** Schedule technician visit and request customer confirmation.

### appointment_scheduling_address

- **ID:** `appointment_scheduling_address`
- **Header:** TEXT — "Visita do tecnico"
- **Body:** "Ola, {{texto}}, estamos agendando uma visita de tecnico para a {{endereco}} em {{data}} entre {{texto}} e {{texto}}. Por favor confirme se este horario funciona para voce."
- **Footer:** —
- **Buttons:**
  - QR — "Confirmar"
  - QR — "Reagendar"
- **Variables:** texto (x3), endereco, data
- **Use case:** Schedule technician visit at a specific address and request confirmation.

---

## Auto Pay

### auto_pay_reminder_1

- **ID:** `auto_pay_reminder_1`
- **Header:** TEXT — "Proximo pagamento automatico"
- **Body:** "Oi, {{texto}}, Seu pagamento automatico para a {{texto}} esta programado para o dia {{data}} no valor de {{valor}}. Confira se o seu saldo e suficiente para evitar cobrancas {{texto}}."
- **Footer:** —
- **Buttons:**
  - URL — "Ver conta"
- **Variables:** texto (x3), data, valor
- **Use case:** Remind customer about upcoming auto-pay deduction.

### auto_pay_reminder_2

- **ID:** `auto_pay_reminder_2`
- **Header:** TEXT — "Proximo pagamento automatico"
- **Body:** "Oi, John, Este e um lembrete de que seu pagamento automatico esta chegando: Data: 1 de janeiro de 2024 Conta: Market Credit Plus Valor: US$ 12,34 Tenha um otimo dia. Atenciosamente,"
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes"
- **Variables:** (hardcoded sample — name, date, account, amount)
- **Use case:** Remind customer about upcoming auto-pay with detailed breakdown.

### auto_pay_reminder_3

- **ID:** `auto_pay_reminder_3`
- **Header:** —
- **Body:** "Lembrete: Seu pagamento programado para o cartao {{texto}} com final {{numero}} esta previsto para {{data}}. Atenciosamente,"
- **Footer:** —
- **Buttons:** —
- **Variables:** texto, numero, data
- **Use case:** Brief reminder for scheduled card payment.

---

## Call

### call_permission_request_1

- **ID:** `call_permission_request_1`
- **Header:** —
- **Body:** "Gostaria de receber uma ligacao de um dos nossos representantes?"
- **Card:** "Can {BIZ_NAME} call you? Voce pode atualizar suas preferencias quando quiser no perfil empresarial."
- **Footer:** —
- **Buttons:**
  - LIST — "Escolher preferencias"
- **Variables:** —
- **Use case:** Request customer permission for outbound call from representative.

---

## Card Transaction

### card_transaction_alert_1

- **ID:** `card_transaction_alert_1`
- **Header:** —
- **Body:** "Uma cobranca de {{texto}} da {{numero}} foi feita no seu cartao de {{valor}} com final {{texto}}."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2), numero, valor
- **Use case:** Alert customer about a card transaction charge.

### card_transaction_alert_2

- **ID:** `card_transaction_alert_2`
- **Header:** —
- **Body:** "Agradecemos por usar seu cartao de {{texto}}. Esta e uma confirmacao da compra de {{data}}, no valor de {{valor}}, na {{texto}}."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2), data, valor
- **Use case:** Confirm a purchase transaction on customer's card.

---

## Crisis

### crisis_response_1

- **ID:** `crisis_response_1`
- **Header:** —
- **Body:** "Ativamos os servicos de apoio para o {{texto}} na area {{texto}}. Por favor, tome as seguintes precaucoes se mora em {{texto}} ou nas areas circundantes: {{texto}}, {{texto}}, {{texto}}."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x6)
- **Use case:** Emergency notification with precautionary instructions for affected areas.

### crisis_response_2

- **ID:** `crisis_response_2`
- **Header:** —
- **Body:** "Existe um fogo selvagem ativo na area 90210. Para atualizacoes ao vivo sobre o alerta de emergencia de incendio na area 10001, visite o nosso website www.example.gov/updates."
- **Footer:** —
- **Buttons:** —
- **Variables:** (hardcoded sample — area codes, URL)
- **Use case:** Wildfire emergency alert with link for live updates.

---

## Delivery

### delivery_confirmation_1

- **ID:** `delivery_confirmation_1`
- **Header:** —
- **Body:** "Ola, {{texto}}, seu pedido {{texto}} foi entregue com sucesso. Podes gerir a tua encomenda abaixo."
- **Footer:** —
- **Buttons:**
  - URL — "Gerir encomenda"
- **Variables:** texto (x2)
- **Use case:** Confirm successful delivery with order management link.

### delivery_confirmation_2

- **ID:** `delivery_confirmation_2`
- **Header:** TEXT — "Encomenda entregue"
- **Body:** "Ola, {{texto}}, seu pedido {{texto}} foi entregue. Precisa devolver ou substituir um item? Clique para gerenciar seu pedido."
- **Footer:** —
- **Buttons:**
  - URL — "Gerir encomenda"
- **Variables:** texto (x2)
- **Use case:** Confirm delivery with return/replacement option.

### delivery_confirmation_3

- **ID:** `delivery_confirmation_3`
- **Header:** —
- **Body:** "{{texto}}, seu pedido {{texto}} foi entregue em {{data}}. Clique abaixo se voce precisa devolver ou substituir algum item."
- **Footer:** —
- **Buttons:**
  - URL — "Iniciar devolucao"
- **Variables:** texto (x2), data
- **Use case:** Confirm delivery with date and return initiation option.

### delivery_confirmation_4

- **ID:** `delivery_confirmation_4`
- **Header:** —
- **Body:** "{{texto}}, seu pedido foi entregue com sucesso em {{data}}. Obrigada pela compra."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto, data
- **Use case:** Simple delivery confirmation with date, no CTA.

### delivery_confirmation_5

- **ID:** `delivery_confirmation_5`
- **Header:** TEXT — "Encomenda entregue"
- **Body:** "Ola, {{texto}}, Otimas noticias! Seu pedido {{texto}} foi entregue."
- **Footer:** —
- **Buttons:**
  - URL — "Ver pedido"
- **Variables:** texto (x2)
- **Use case:** Brief delivery confirmation with order view link.

### delivery_failed_1

- **ID:** `delivery_failed_1`
- **Header:** TEXT — "Nao foi possivel entregar seu pedido"
- **Body:** "Oi, John, Tentamos entregar seu pedido em 1 de janeiro de 2024, mas nao tivemos sucesso. Fale conosco pelo telefone 1800-555-1234 para agendarmos a entrega. Atenciosamente,"
- **Footer:** —
- **Buttons:**
  - URL — "Gerenciar entrega"
  - PHONE — "Ligue para nos"
- **Variables:** (hardcoded sample — name, date, phone)
- **Use case:** Notify failed delivery attempt with rescheduling options.

### delivery_failed_2

- **ID:** `delivery_failed_2`
- **Header:** —
- **Body:** "Nao foi possivel entregar o pedido {{texto}} hoje. {{texto}} para agendar outra tentativa de entrega."
- **Footer:** —
- **Buttons:**
  - URL — "Agendar entrega"
- **Variables:** texto (x2)
- **Use case:** Failed delivery notification with rescheduling link.

### delivery_failed_form_1

- **ID:** `delivery_failed_form_1`
- **Header:** —
- **Body:** "Nao foi possivel entregar o pedido {{texto}} hoje. {{texto}} para agendar outra tentativa de entrega."
- **Footer:** —
- **Buttons:**
  - FLOW — "Reagendar"
- **Variables:** texto (x2)
- **Use case:** Failed delivery with WhatsApp Flow for rescheduling.

### delivery_update_1

- **ID:** `delivery_update_1`
- **Header:** —
- **Body:** "Ola, {{texto}}, seu pedido {{texto}} esta a caminho e deve chegar em breve. Entrega estimada: {{texto}} Vamos fornecer uma atualizacao quando a tua encomenda for entregue. Um adulto deve estar em casa para aceitar este pacote."
- **Footer:** Present
- **Buttons:**
  - URL — "Rastrear pedido"
- **Variables:** texto (x3)
- **Use case:** In-transit delivery update with tracking link and adult signature requirement.

### delivery_update_2

- **ID:** `delivery_update_2`
- **Header:** —
- **Body:** "Ola, {{texto}}, nosso pedido {{texto}} saiu para entrega! Deve ser entregue {{texto}} entre {{texto}} e {{texto}}."
- **Footer:** —
- **Buttons:**
  - URL — "Rastrear pedido"
- **Variables:** texto (x5)
- **Use case:** Out-for-delivery notification with estimated time window.

### delivery_update_3

- **ID:** `delivery_update_3`
- **Header:** —
- **Body:** "Seu pedido {{texto}} esta pronto para entrega! Deve chegar ate {{data}}. Obrigado pelo seu negocio."
- **Footer:** —
- **Buttons:**
  - URL — "Rastrear pedido"
- **Variables:** texto, data
- **Use case:** Ready-for-delivery notification with estimated date.

### delivery_update_4

- **ID:** `delivery_update_4`
- **Header:** —
- **Body:** "Seu pedido {{texto}} saiu para entrega e tem previsao de chegar ate {{data}}. Obrigada pela compra."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto, data
- **Use case:** Out-for-delivery update without CTA.

---

## Device

### device_recovery

- **ID:** `device_recovery`
- **Header:** TEXT — "Devolucao do dispositivo"
- **Body:** "Ola, {{texto}}, a tua ligacao de banda larga foi desligada. Para devolveres o teu dispositivo, segue estes passos: {{texto}} Voce tambem pode entrar em contato conosco em {{texto}} para obter ajuda."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x3)
- **Use case:** Instruct customer to return broadband device after service disconnection.

---

## Disbursement

### disbursement_balance_1

- **ID:** `disbursement_balance_1`
- **Header:** —
- **Body:** "Seu saldo de desembolso de {{texto}} e de {{valor}}. Observe que expirara em {{data}}. Novos desembolsos de {{texto}} serao anunciados mensalmente. Use a URL abaixo para rever o calendario de desembolso e para se registrar ou alterar o seu status de inscricao."
- **Footer:** —
- **Buttons:**
  - URL — "Ver horario"
- **Variables:** texto (x2), valor, data
- **Use case:** Notify disbursement balance and expiration with schedule link.

### disbursement_voucher_1

- **ID:** `disbursement_voucher_1`
- **Header:** —
- **Body:** "{{texto}} Os vales estao aqui! Voce esta qualificado para reivindicar o seu voucher na {{texto}} ou online atraves do nosso site {{url}}. Os vouchers sao validos ate {{data}}. Vouchers podem ser usados em muitos locais. Consulte o nosso site {{url}} para uma lista completa de todas as localizacoes que aceitam vouchers."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2), url (x2), data
- **Use case:** Notify voucher availability with redemption instructions.

---

## Event

### event_details_reminder_1

- **ID:** `event_details_reminder_1`
- **Header:** TEXT — "Voce tem um evento futuro"
- **Body:** "Voce tem um evento futuro Lembrete: voce respondeu a {{texto}}. O evento comeca em {{texto}} em {{data}} em {{texto}} localizacao."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x3), data
- **Use case:** Remind about upcoming event with date and location.

### event_details_reminder_2

- **ID:** `event_details_reminder_2`
- **Header:** —
- **Body:** "Lembrete: {{texto}} esta chegando e voce confirmou presenca neste evento por {{texto}}. Vejo-te em {{texto}} em {{texto}} hora local."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x4)
- **Use case:** Event reminder with RSVP confirmation details.

### event_rsvp_confirmation_1

- **ID:** `event_rsvp_confirmation_1`
- **Header:** —
- **Body:** "Obrigado por responder a {{texto}} por {{texto}}. Vejo-te em {{data}} em {{texto}} hora local."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x3), data
- **Use case:** Confirm RSVP for an event.

### event_rsvp_confirmation_2

- **ID:** `event_rsvp_confirmation_2`
- **Header:** —
- **Body:** "Sua presenca no evento {{texto}} de {{texto}} esta confirmada. Obrigado."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2)
- **Use case:** Simple event RSVP confirmation.

---

## Feedback

### feedback_collection

- **ID:** `feedback_collection`
- **Header:** —
- **Body:** "Ola, {{texto}}, o pedido de servico que concluimos em {{data}} esta encerrado. Classifique sua experiencia de 1-5 e compartilhe qualquer feedback para nos ajudar a melhorar."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto, data
- **Use case:** Request service rating after ticket closure.

### feedback_survey_1

- **ID:** `feedback_survey_1`
- **Header:** —
- **Body:** "Ola, {{texto}}. Obrigado por sua recente {{texto}} em {{data}}. Nos valorizamos o seu feedback e gostariamos que compartilhasse mais sobre a sua experiencia conosco no link abaixo. Isto deve demorar apenas {{numero}} minutos. Agradecemos o seu tempo."
- **Footer:** —
- **Buttons:**
  - URL — "Deixe feedback"
- **Variables:** texto (x2), data, numero
- **Use case:** Post-interaction survey request with estimated duration.

### feedback_survey_2

- **ID:** `feedback_survey_2`
- **Header:** TEXT — "Como foi a sua experiencia?"
- **Body:** "Agradecemos por nos visitar em {{endereco}} no dia {{data}}. Seu feedback e importante para nos. Responda a esta pesquisa breve para nos informar como podemos melhorar."
- **Footer:** —
- **Buttons:**
  - URL — "Preencher pesquisa"
- **Variables:** endereco, data
- **Use case:** Location-specific feedback survey after in-store visit.

### feedback_survey_form_1

- **ID:** `feedback_survey_form_1`
- **Header:** TEXT — "Classifique sua experiencia"
- **Body:** "Seu feedback e importante para nos. Responda a uma pesquisa rapida sobre sua experiencia recente com a {{texto}}."
- **Footer:** —
- **Buttons:**
  - FLOW — "Responder a pesquisa"
- **Variables:** texto
- **Use case:** In-WhatsApp survey via Flows for experience rating.

### feedback_survey_form_2

- **ID:** `feedback_survey_form_2`
- **Header:** —
- **Body:** "O feedback dos clientes e importante para o {{texto}}. Ele e usado para melhorarmos nossos {{texto}} de forma continua. Preencha uma {{texto}} breve (link abaixo) para nos contar como foi a {{texto}} recente que fez conosco. Desde ja agradecemos."
- **Footer:** —
- **Buttons:**
  - FLOW — "Responder a pesquisa"
- **Variables:** texto (x4)
- **Use case:** Detailed feedback request via WhatsApp Flow.

---

## Followup

### followup_missed_calls

- **ID:** `followup_missed_calls`
- **Header:** TEXT — "Ligacao perdida"
- **Body:** "Ola, {{texto}}, perdemos a tua chamada. Avise-nos se estiver disponivel para reagendar."
- **Footer:** —
- **Buttons:**
  - QR — "Reagendar ligacao"
- **Variables:** texto
- **Use case:** Follow up on missed inbound call with reschedule option.

---

## Fraud

### fraud_alert_1

- **ID:** `fraud_alert_1`
- **Header:** —
- **Body:** "Ola, {{texto}}, Detectamos uma transacao {{texto}} de {{texto}} no seu {{texto}}, no valor de {{valor}}. Caso nao tenha feito essa transacao, entre em contato {{texto}} pelo numero {{telefone}}. Voce tambem pode clicar abaixo para bloquear seu {{texto}}. Atenciosamente,"
- **Footer:** —
- **Buttons:**
  - PHONE — "Ligue para nos"
  - URL — "Bloquear cartao"
- **Variables:** texto (x5), valor, telefone
- **Use case:** Fraud alert with card blocking and phone contact options.

### fraud_alert_2

- **ID:** `fraud_alert_2`
- **Header:** —
- **Body:** "Oi, {{texto}}, Aqui e a {{texto}}. Identificamos uma transacao {{texto}} no seu cartao {{texto}} com final {{numero}}: Data: {{data}} Estabelecimento: {{texto}} Valor: {{valor}} Voce fez essa compra?"
- **Footer:** —
- **Buttons:**
  - QR — "Sim"
  - QR — "Nao"
- **Variables:** texto (x5), numero, data, valor
- **Use case:** Fraud verification with quick yes/no response buttons.

### fraud_alert_3

- **ID:** `fraud_alert_3`
- **Header:** —
- **Body:** "Oi, {{texto}}, Detectamos uma cobranca {{texto}} na conta do seu {{texto}}. Verifique os detalhes dessa transacao."
- **Footer:** —
- **Buttons:**
  - URL — "Verificar transacao"
- **Variables:** texto (x3)
- **Use case:** Suspicious charge alert with transaction verification link.

### fraud_alert_4

- **ID:** `fraud_alert_4`
- **Header:** TEXT — "Transacao suspeita"
- **Body:** "Ola, {{texto}}, Detectamos uma transacao suspeita no seu cartao da {{texto}} com final {{numero}}. Verifique se foi voce."
- **Footer:** —
- **Buttons:**
  - URL — "Verificar transacao"
- **Variables:** texto (x2), numero
- **Use case:** Suspicious transaction notification with verification link.

### fraud_awareness_1

- **ID:** `fraud_awareness_1`
- **Header:** —
- **Body:** "Detetamos um aumento na fraude ATM. Para proteger seu cartao que termina em 1234, considere atualizar seu PIN. Clique abaixo para ver o passo a passo. Nao clique em links nao oficiais. Entity name nunca lhe enviara mensagens SMS a pedir informacoes pessoais ou dados bancarios."
- **Footer:** —
- **Buttons:**
  - URL — "Guia de Seguranca"
- **Variables:** (hardcoded sample — card last digits, entity name)
- **Use case:** Proactive fraud awareness with security guidance link.

---

## Group

### group_invite_link

- **ID:** `group_invite_link`
- **Header:** —
- **Body:** "Ola, {{texto}}, o teu pedido para servico de {{texto}} da {{texto}} foi recebido com sucesso! Voce pode comecar o servico clicando e juntando-se ao grupo abaixo. {{group_id}} Obrigado!"
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x3), group_id
- **Use case:** Service onboarding via WhatsApp group invitation.

### group_invite_link_concise

- **ID:** `group_invite_link_concise`
- **Header:** —
- **Body:** "Sua solicitacao {{texto}} com {{texto}} esta confirmada. Por favor, entre no grupo do WhatsApp para comecar: {{group_id}} Obrigado!"
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2), group_id
- **Use case:** Concise group invite after service request confirmation.

### group_invite_link_detailed

- **ID:** `group_invite_link_detailed`
- **Header:** —
- **Body:** "Hi {{texto}}, Temos o prazer de informar que o seu pedido para {{texto}} da {{texto}} foi recebido com sucesso. Para facilitar a sua sessao, criamos um grupo dedicado no WhatsApp. Por favor, junte-se ao grupo usando o link abaixo para prosseguir com o seu pedido: {{group_id}} Obrigado por utilizar o nosso servico!"
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x3), group_id
- **Use case:** Detailed group invitation with service context.

---

## Health

### health_awareness_1

- **ID:** `health_awareness_1`
- **Header:** —
- **Body:** "Mantenha-se atualizado com a sua saude. Passe por {{texto}} ate {{data}} para obter a sua {{texto}}. Traga seu {{texto}} e {{texto}}."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x4), data
- **Use case:** Health check/vaccination reminder with required documents.

### health_emergency_1

- **ID:** `health_emergency_1`
- **Header:** —
- **Body:** "A {{texto}} acaba de declarar uma emergencia sanitaria devido a {{texto}}. Para saber mais sobre {{texto}} e precaucoes a tomar, use a URL abaixo. Vamos dar seguimento a mais detalhes assim que estiver disponivel."
- **Footer:** —
- **Buttons:**
  - URL — "Saiba mais"
- **Variables:** texto (x3)
- **Use case:** Health emergency declaration with precaution information link.

### health_emergency_2

- **ID:** `health_emergency_2`
- **Header:** —
- **Body:** "Uma emergencia sanitaria devido a problema foi declarada na area codigo postal. Atualizacoes ao vivo disponiveis no nosso site link."
- **Footer:** —
- **Buttons:** —
- **Variables:** (hardcoded sample — problem, postal code, link)
- **Use case:** Brief health emergency notification with live updates reference.

---

## Identity

### identity_compliance_1

- **ID:** `identity_compliance_1`
- **Header:** —
- **Body:** "Isto e para notificar-te de que precisas de atualizar para um {{texto}} ate {{data}}. Para evitar quaisquer inconvenientes durante a viagem, por favor, certifique-se de marcar uma consulta no seu {{texto}}. Para encontrar o escritorio mais proximo de si, use o nosso site {{url}}."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2), data, url
- **Use case:** Identity document compliance deadline notification.

### identity_compliance_2

- **ID:** `identity_compliance_2`
- **Header:** —
- **Body:** "Atualizado {{texto}} agora sao obrigatorios quando se viaja em aeroportos. Para mais informacoes sobre como atualizar, use o link abaixo."
- **Footer:** —
- **Buttons:**
  - URL — "Saiba mais"
- **Variables:** texto
- **Use case:** Updated identity requirements notification for travelers.

---

## Installation

### installation_complete

- **ID:** `installation_complete`
- **Header:** TEXT — "Instalacao concluida"
- **Body:** "Ola, {{texto}}, a sua instalacao {{texto}} esta concluida! O nosso tecnico configurou a tua ligacao, e agora estas pronto para entrar online. Se tiver algum problema, nao hesite em responder ou contactar {{texto}} para obter ajuda."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x3)
- **Use case:** Confirm service installation completion with support contact.

---

## Low Balance

### low_balance_warning_1

- **ID:** `low_balance_warning_1`
- **Header:** TEXT — "O saldo da conta esta baixo"
- **Body:** "Oi, {{texto}}, O {{texto}} na sua conta {{texto}} com final {{numero}} esta abaixo do {{texto}} predefinido de {{valor}}. Clique abaixo para adicionar fundos ou ligue para nos."
- **Footer:** —
- **Buttons:**
  - URL — "Fazer um deposito"
  - PHONE — "Ligue para nos"
- **Variables:** texto (x3), numero, valor
- **Use case:** Low balance alert with deposit and phone support options.

### low_balance_warning_2

- **ID:** `low_balance_warning_2`
- **Header:** —
- **Body:** "Oi, {{texto}}, O saldo disponivel na sua conta {{texto}} com final {{numero}} estao abaixo do limite predefinido de {{valor}}."
- **Footer:** —
- **Buttons:**
  - URL — "Fazer um deposito"
  - PHONE — "Ligue para nos"
- **Variables:** texto (x2), numero, valor
- **Use case:** Low balance notification with funding options.

### low_balance_warning_3

- **ID:** `low_balance_warning_3`
- **Header:** TEXT — "Notificacao de saldo baixo"
- **Body:** "Ola, {{texto}}, o teu saldo movel e de {{valor}}. Por favor, recarregue para evitar interrupcoes."
- **Footer:** —
- **Buttons:**
  - URL — "Recarregar"
- **Variables:** texto, valor
- **Use case:** Mobile balance low warning with recharge link.

---

## Missed Appointment

### missed_appointment

- **ID:** `missed_appointment`
- **Header:** TEXT — "Visita perdida"
- **Body:** "Ola, {{texto}}, sentimos a tua falta na tua consulta agendada {{texto}} para {{data}}. Responda para reagendar ou entre em contato com {{texto}} para marcar um novo horario."
- **Footer:** —
- **Buttons:**
  - QR — "Reagendar"
- **Variables:** texto (x3), data
- **Use case:** Missed appointment notification with reschedule option.

---

## Network

### network_troubleshooting

- **ID:** `network_troubleshooting`
- **Header:** TEXT — "Passos de solucao de problemas de rede"
- **Body:** "Ola, entendemos que voce pode estar enfrentando problemas de rede em {{texto}}. Podes experimentar estes passos simples: Passo 1: {{texto}}, Passo 2: {{texto}} Passo 3: {{texto}}. Precisa de mais ajuda? Contacte: {{texto}} ou veja detalhes."
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes"
- **Variables:** texto (x5)
- **Use case:** Network troubleshooting steps with escalation support link.

---

## Operation

### operation_disruption_1

- **ID:** `operation_disruption_1`
- **Header:** —
- **Body:** "Isto e para notifica-lo de que os {{texto}} na nossa estacao {{texto}} estao interrompidos devido a {{texto}}. Por favor, evitem a area enquanto trabalhamos para corrigir. Clique no URL abaixo para ver {{texto}} alternativos e/ou {{texto}} onde o servico esta disponivel e em funcionamento. Atualizacoes ao vivo no nosso site, disponiveis abaixo."
- **Footer:** —
- **Buttons:**
  - URL — "Ver atualizacoes"
- **Variables:** texto (x5)
- **Use case:** Service disruption notification with alternatives and live updates.

### operation_disruption_2

- **ID:** `operation_disruption_2`
- **Header:** —
- **Body:** "A manutencao regular de {{texto}} esta agendada para {{data}} e a estacao na area {{texto}} estara fechada ate {{data}}. Por favor, planeje usar uma estacao alternativa se planeja viajar. Clique no URL abaixo para ver {{texto}} alternativos e/ou {{texto}} onde o servico estara disponivel e em funcionamento."
- **Footer:** —
- **Buttons:**
  - URL — "Ver alternativas"
- **Variables:** texto (x4), data (x2)
- **Use case:** Scheduled maintenance notification with alternative service locations.

---

## Order Action

### order_action_required_1

- **ID:** `order_action_required_1`
- **Header:** —
- **Body:** "Ola, {{texto}}, antes de podermos processar a tua encomenda {{texto}}, precisamos de verificar algumas informacoes. Por favor contacte-nos assim que possivel. Obrigado. Obrigado."
- **Footer:** —
- **Buttons:**
  - PHONE — "Ligue-nos"
- **Variables:** texto (x2)
- **Use case:** Order processing blocked — request customer verification call.

### order_action_required_2

- **ID:** `order_action_required_2`
- **Header:** —
- **Body:** "Nao foi possivel processar seu pedido {{texto}}. Entre em contato pelo numero {{telefone}} para saber as proximas etapas."
- **Footer:** —
- **Buttons:**
  - PHONE — "Ligue para nos"
- **Variables:** texto, telefone
- **Use case:** Order processing failure with phone support.

---

## Order Canceled

### order_canceled_1

- **ID:** `order_canceled_1`
- **Header:** TEXT — "Pedido cancelado"
- **Body:** "{{texto}}, seu pedido {{texto}} foi cancelado com sucesso. O reembolso sera processado em {{numero}} dias uteis. Atenciosamente,"
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes do pedido"
- **Variables:** texto (x2), numero
- **Use case:** Order cancellation confirmation with refund timeline.

### order_canceled_2

- **ID:** `order_canceled_2`
- **Header:** —
- **Body:** "{{texto}}, cancelamos o pedido {{texto}}, conforme sua solicitacao. Seu {{texto}} sera processado em {{numero}} dias uteis. Voce pode acompanhar abaixo."
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes do pedido"
- **Variables:** texto (x3), numero
- **Use case:** Order cancellation with refund tracking.

### order_canceled_3

- **ID:** `order_canceled_3`
- **Header:** —
- **Body:** "Oi! Esta e uma confirmacao de que seu pedido recente {{texto}} foi cancelado com sucesso. Atenciosamente,"
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes do pedido"
- **Variables:** texto
- **Use case:** Simple order cancellation confirmation.

### order_canceled_4

- **ID:** `order_canceled_4`
- **Header:** TEXT — "Pedido cancelado"
- **Body:** "Ola John, Seu pedido n 12345 foi cancelado. Um reembolso sera emitido para o seu metodo de pagamento original em breve."
- **Footer:** —
- **Buttons:**
  - URL — "Detalhes do pedido"
- **Variables:** (hardcoded sample — name, order number)
- **Use case:** Order cancellation with refund notice.

---

## Order Confirm

### order_confirm_auto_schedule

- **ID:** `order_confirm_auto_schedule`
- **Header:** —
- **Body:** "Ola, {{texto}}, seu pedido {{texto}} foi feito com sucesso! Agendamos um compromisso para {{data}} na sua localizacao preferida. Por favor confirme se este horario funciona para voce."
- **Footer:** —
- **Buttons:**
  - QR — "Confirmar"
  - QR — "Reagendar"
- **Variables:** texto (x2), data
- **Use case:** Order confirmation with auto-scheduled appointment requiring confirmation.

### order_confirm_manual_schedule

- **ID:** `order_confirm_manual_schedule`
- **Header:** —
- **Body:** "Ola, {{texto}}, seu pedido {{texto}} foi feito! Responda *Agenda* para escolher um horario para a sua consulta."
- **Footer:** —
- **Buttons:**
  - QR — "Agendar"
- **Variables:** texto (x2)
- **Use case:** Order confirmation prompting manual appointment scheduling.

### order_confirmed

- **ID:** `order_confirmed`
- **Header:** TEXT — "Encomenda confirmada"
- **Body:** "Ola, {{texto}}, Estamos a preparar a tua encomenda {{texto}} e vamos avisar-te quando estiver a caminho."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2)
- **Use case:** Simple order confirmation, preparation in progress.

---

## Order Delay

### order_delay_1

- **ID:** `order_delay_1`
- **Header:** —
- **Body:** "{{texto}}, ha um {{texto}} na {{texto}} do pedido {{texto}}. Estamos trabalhando para resolve-lo o quanto antes. Voce recebera uma atualizacao em breve. Pedimos desculpas pela inconveniencia. O status da entrega sera atualizado quando possivel."
- **Footer:** —
- **Buttons:**
  - URL — "Rastrear meu pedido"
  - URL — "Ver detalhes do pedido"
- **Variables:** texto (x4)
- **Use case:** Order delay notification with tracking and details links.

### order_delay_2

- **ID:** `order_delay_2`
- **Header:** TEXT — "Item(ns) fora de estoque"
- **Body:** "Oi, {{texto}}, O(s) item(ns) do seu pedido recente {{texto}} estao indisponiveis. Voce recebera um aviso quando for(em) enviado(s). Se nao quiser esperar, clique abaixo para {{texto}} seu pedido. Pedimos desculpas pela inconveniencia."
- **Footer:** —
- **Buttons:**
  - URL — "Gerenciar pedido"
- **Variables:** texto (x3)
- **Use case:** Out-of-stock notification with order management option.

---

## Order Delivered

### order_delivered

- **ID:** `order_delivered`
- **Header:** TEXT — "Encomenda entregue"
- **Body:** "Ola, John, Seu ORD-12345 foi entregue. Obrigado por comprar conosco."
- **Footer:** —
- **Buttons:** —
- **Variables:** (hardcoded sample — name, order ID)
- **Use case:** Simple delivery confirmation.

---

## Order Management

### order_management_1

- **ID:** `order_management_1`
- **Header:** TEXT — "Pedido confirmado"
- **Body:** "Oi, {{texto}}, Agradecemos sua {{texto}}! O numero do seu pedido e {{texto}}. Vamos comecar a preparar os {{texto}} para o envio. Entrega estimada: {{data}} Avisaremos voce quando o pedido for enviado."
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes do pedido"
- **Variables:** texto (x4), data
- **Use case:** Order confirmation with estimated delivery date and tracking link.

### order_management_2

- **ID:** `order_management_2`
- **Header:** TEXT — "Encomenda confirmada"
- **Body:** "Ola, {{texto}}, a tua encomenda esta confirmada e o numero da tua {{texto}} e {{texto}}. Entrega estimada: {{data}}. Vamos dar seguimento a mais detalhes a medida que preparamos a sua encomenda para envio."
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes da encomenda"
- **Variables:** texto (x3), data
- **Use case:** Order confirmation with tracking number and estimated delivery.

### order_management_3

- **ID:** `order_management_3`
- **Header:** TEXT — "Encomenda confirmada"
- **Body:** "Ola, {{texto}}, recebemos o seu pedido. O numero do seu pedido e {{texto}}. Entrega estimada: {{data}}. Clique abaixo para gerenciar seu pedido."
- **Footer:** —
- **Buttons:**
  - URL — "Gerir encomenda"
- **Variables:** texto (x2), data
- **Use case:** Order received confirmation with management link.

### order_management_4

- **ID:** `order_management_4`
- **Header:** TEXT — "Encomenda confirmada!"
- **Body:** "Ola, {{texto}}, A tua encomenda foi feita com sucesso e esta a ser processada. O numero do seu pedido e {{texto}}. Podes ver os detalhes da encomenda abaixo."
- **Footer:** —
- **Buttons:**
  - URL — "Ver pedido"
- **Variables:** texto (x2)
- **Use case:** Order placed successfully with details view.

### order_management_5

- **ID:** `order_management_5`
- **Header:** TEXT — "Pedido recebido"
- **Body:** "Ola {{texto}}, Recebemos seu pedido {{texto}}. Enviaremos uma atualizacao de status assim que seu pagamento for aprovado. Obrigado por comprar conosco!"
- **Footer:** —
- **Buttons:**
  - URL — "Detalhes do pedido"
- **Variables:** texto (x2)
- **Use case:** Order received, pending payment approval.

### order_management_6

- **ID:** `order_management_6`
- **Header:** TEXT — "Encomenda confirmada"
- **Body:** "Ola, John. A tua encomenda #12345 foi feita com sucesso com a Amazon e esta a ser processada."
- **Footer:** —
- **Buttons:**
  - URL — "Ver pedido"
- **Variables:** (hardcoded sample — name, order number, merchant)
- **Use case:** Order confirmation with merchant name.

### order_management_no_cta_5

- **ID:** `order_management_no_cta_5`
- **Header:** TEXT — "Pedido recebido"
- **Body:** "Ola {{texto}}, Recebemos seu pedido {{texto}}. Enviaremos uma atualizacao de status assim que seu pagamento for aprovado. Obrigado por comprar conosco!"
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2)
- **Use case:** Order received without CTA, pending payment.

---

## Order Pick Up

### order_pick_up_1

- **ID:** `order_pick_up_1`
- **Header:** TEXT — "Pronto para recolha!"
- **Body:** "Ola, {{texto}}, seu pedido {{texto}} esta pronto para retirada em {{endereco}}. Quando chegar, toque no botao abaixo e nos levamos seu pedido ate voce. Vejo-te em breve!"
- **Footer:** —
- **Buttons:**
  - QR — "Cheguei"
- **Variables:** texto (x2), endereco
- **Use case:** Order ready for pickup with arrival notification button.

### order_pick_up_3

- **ID:** `order_pick_up_3`
- **Header:** —
- **Body:** "Temos uma otima noticia! Seu pedido {{texto}} esta pronto para ser retirado em {{endereco}}. Clique em 'Estou aqui' quando chegar e vamos levar seus produtos ate voce. Ate breve!"
- **Footer:** —
- **Buttons:**
  - QR — "Estou aqui"
- **Variables:** texto, endereco
- **Use case:** Pickup ready notification with curbside arrival button.

### order_pick_up_4

- **ID:** `order_pick_up_4`
- **Header:** TEXT — "E hora de retirar seu pedido"
- **Body:** "Ola {{texto}}, Seu pedido {{texto}} esta agora pronto para retirada em {{endereco}}. Por favor, lembre-se de trazer um documento de identidade com foto. Ate breve!"
- **Footer:** —
- **Buttons:**
  - URL — "Detalhes do pedido"
- **Variables:** texto (x2), endereco
- **Use case:** Pickup ready with ID requirement reminder.

### order_pick_up_no_cta_4

- **ID:** `order_pick_up_no_cta_4`
- **Header:** TEXT — "E hora de retirar seu pedido"
- **Body:** "Ola John, Seu pedido n 12345 esta agora pronto para retirada em Rua dos Jardins, 01, Bela Vista, Sao Paulo. Por favor, lembre-se de trazer um documento de identidade com foto. Ate breve!"
- **Footer:** —
- **Buttons:** —
- **Variables:** (hardcoded sample — name, order, address)
- **Use case:** Pickup ready notification without CTA.

---

## Order Shipped

### order_shipped

- **ID:** `order_shipped`
- **Header:** TEXT — "Pedido enviado"
- **Body:** "Ola, {{texto}}, Seu pedido {{texto}} foi enviado e esta a caminho."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2)
- **Use case:** Simple order shipped notification.

---

## Order Update

### order_update_1

- **ID:** `order_update_1`
- **Header:** TEXT — "Seu pedido esta sendo preparado"
- **Body:** "Ola {{texto}}, Estamos preparando seu pedido {{texto}} e avisaremos quando estiver pronto."
- **Footer:** —
- **Buttons:**
  - URL — "Detalhes do pedido"
- **Variables:** texto (x2)
- **Use case:** Order preparation status update with details link.

### order_update_no_cta_1

- **ID:** `order_update_no_cta_1`
- **Header:** TEXT — "Seu pedido esta sendo preparado"
- **Body:** "Ola {{texto}}, Estamos preparando seu pedido {{texto}} e avisaremos quando estiver pronto."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2)
- **Use case:** Order preparation update without CTA.

---

## Payment Action Required

### payment_action_required_1

- **ID:** `payment_action_required_1`
- **Header:** TEXT — "Verifique suas informacoes de pagamento"
- **Body:** "Oi, {{texto}}, O pagamento do seu cartao {{texto}} com final {{numero}} esta chegando. Verifique suas informacoes para evitar cobrancas {{texto}}. Se voce ja pagou, ignore esta mensagem."
- **Footer:** Present
- **Buttons:**
  - URL — "Verificar"
- **Variables:** texto (x3), numero
- **Use case:** Payment information verification request before upcoming charge.

### payment_action_required_2

- **ID:** `payment_action_required_2`
- **Header:** TEXT — "Analise uma transacao recente"
- **Body:** "Oi, {{texto}}, Encontramos um problema com sua transacao recente de {{valor}} em {{texto}}. Para assistencia, entre em contato pelo telefone {{telefone}}."
- **Footer:** —
- **Buttons:**
  - PHONE — "Ligue para nos"
- **Variables:** texto (x2), valor, telefone
- **Use case:** Transaction issue requiring customer phone contact.

### payment_action_required_3

- **ID:** `payment_action_required_3`
- **Header:** TEXT — "Nao foi possivel processar o pagamento"
- **Body:** "Nao foi possivel processar seu pagamento programado de {{valor}} para o {{texto}}. Para assistencia, entre em contato pelo telefone {{telefone}}."
- **Footer:** —
- **Buttons:**
  - PHONE — "Ligue para nos"
- **Variables:** valor, texto, telefone
- **Use case:** Failed scheduled payment with phone support.

---

## Payment Confirmation

### payment_confirmation_1

- **ID:** `payment_confirmation_1`
- **Header:** —
- **Body:** "Oi, John, Recebemos seu pagamento de US$ 12,34 para o cartao de debito CS Mutual. Agradecemos seu pagamento."
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes de pagamento"
- **Variables:** (hardcoded sample — name, amount, account)
- **Use case:** Payment received confirmation with details link.

### payment_confirmation_2

- **ID:** `payment_confirmation_2`
- **Header:** TEXT — "Pagamento concluido com sucesso"
- **Body:** "Seu pagamento no valor de {{valor}} para o {{texto}} foi processado com sucesso. Agradecemos por fazer negocios conosco."
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes"
- **Variables:** valor, texto
- **Use case:** Successful payment confirmation with details link.

### payment_confirmation_3

- **ID:** `payment_confirmation_3`
- **Header:** —
- **Body:** "Confirmacao de pagamento: Conta: {{texto}} Valor: {{valor}} Data: {{data}} Thank you and have a nice day."
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes"
- **Variables:** texto, valor, data
- **Use case:** Structured payment confirmation with account, amount, and date.

### payment_confirmation_4

- **ID:** `payment_confirmation_4`
- **Header:** TEXT — "Pedido aprovado"
- **Body:** "Ola {{texto}}, Seu pagamento de {{valor}} para pedido {{texto}} foi aprovado."
- **Footer:** —
- **Buttons:**
  - URL — "Detalhes do pedido"
- **Variables:** texto (x2), valor
- **Use case:** Order payment approval confirmation.

---

## Payment Due

### payment_due_reminder

- **ID:** `payment_due_reminder`
- **Header:** TEXT — "Pagamento devido"
- **Body:** "Ola, {{texto}}, a sua conta {{texto}} de {{valor}} deve ser vencida em {{data}}. Pague agora para evitar interrupcoes no servico. Ignore se ja tiver pago."
- **Footer:** Present
- **Buttons:**
  - URL — "Pagar agora"
- **Variables:** texto (x2), valor, data
- **Use case:** Service payment due reminder with pay-now CTA.

### payment_due_reminder_1

- **ID:** `payment_due_reminder_1`
- **Header:** ORDER — "Pagamento proximo do vencimento"
- **Body:** "Ola, {{texto}}. Voce tem um pagamento no valor de {{valor}} cuja data de vencimento e {{data}}. Para sua comodidade, anexamos uma copia da sua fatura."
- **Footer:** —
- **Buttons:**
  - URL — "Review and Pay"
- **Variables:** texto, valor, data
- **Use case:** Payment due with attached invoice via order header.

### payment_due_reminder_2

- **ID:** `payment_due_reminder_2`
- **Header:** ORDER — "O pagamento vence hoje"
- **Body:** "Ola, John. Voce tem um pagamento no valor de R$ 10.00 que vence hoje. Efetue o pagamento tocando no botao abaixo. Caso voce ja tenha pagado a fatura, por favor, desconsidere esta mensagem."
- **Footer:** —
- **Buttons:**
  - URL — "Review and Pay"
- **Variables:** (hardcoded sample — name, amount)
- **Use case:** Same-day payment due with order header.

---

## Payment Failed

### payment_failed_1

- **ID:** `payment_failed_1`
- **Header:** —
- **Body:** "Oi, {{texto}}. Ocorreu uma falha no seu pagamento recente de {{valor}} para a conta {{texto}}. Verifique sua conta e tente novamente."
- **Footer:** —
- **Buttons:**
  - URL — "Ver conta"
- **Variables:** texto (x2), valor
- **Use case:** Payment failure notification with account review link.

### payment_failed_2

- **ID:** `payment_failed_2`
- **Header:** —
- **Body:** "Oi, {{texto}}, Nao foi possivel processar o pagamento de {{valor}} para o {{texto}}. Atualize sua forma de pagamento ou entre em contato conosco para receber assistencia."
- **Footer:** —
- **Buttons:**
  - URL — "Ver conta"
  - PHONE — "Ligue para nos"
- **Variables:** texto (x2), valor
- **Use case:** Payment failure with update payment and phone support options.

### payment_failed_3

- **ID:** `payment_failed_3`
- **Header:** —
- **Body:** "Seu pagamento foi rejeitado. Conta: {{texto}} Valor: {{valor}} Data: {{data}} Verifique sua conta e tente novamente."
- **Footer:** —
- **Buttons:**
  - URL — "Ver conta"
- **Variables:** texto, valor, data
- **Use case:** Rejected payment with structured details.

### payment_failed_4

- **ID:** `payment_failed_4`
- **Header:** TEXT — "Falha no pagamento"
- **Body:** "Ola, {{texto}}, nao foi possivel processar o pagamento da sua fatura {{texto}}. Tente novamente ou entre em contato com nossa equipe de suporte."
- **Footer:** —
- **Buttons:**
  - URL — "Pagar agora"
- **Variables:** texto (x2)
- **Use case:** Invoice payment failure with retry link.

### payment_failed_5

- **ID:** `payment_failed_5`
- **Header:** ORDER — "Compra recusada"
- **Body:** "Uma compra realizada com seu cartao xxxx 1234 foi recusada. Para voltar a fazer compras, efetue o pagamento da sua fatura. Apos o pagamento, o sistema levara ate tres dias uteis para restabelecer seu limite."
- **Footer:** —
- **Buttons:**
  - URL — "Review and Pay"
- **Variables:** (hardcoded sample — card last digits)
- **Use case:** Purchase declined due to outstanding balance with order header.

---

## Payment Notice

### payment_notice_1

- **ID:** `payment_notice_1`
- **Header:** —
- **Body:** "Seu pagamento no valor de {{valor}} sera processado no dia {{data}}. Obrigado."
- **Footer:** —
- **Buttons:** —
- **Variables:** valor, data
- **Use case:** Simple upcoming payment processing notice.

### payment_notice_2

- **ID:** `payment_notice_2`
- **Header:** —
- **Body:** "Agradecemos pelo pagamento no valor de {{valor}}. A {{texto}} sera feita no dia {{data}}."
- **Footer:** —
- **Buttons:** —
- **Variables:** valor, texto, data
- **Use case:** Payment acknowledgement with processing date.

### payment_notice_3

- **ID:** `payment_notice_3`
- **Header:** —
- **Body:** "Esta mensagem e para {{texto}} que seu pagamento no valor de {{valor}} feito via {{texto}} sera processado no dia {{data}}."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2), valor, data
- **Use case:** Payment processing notice with payment method details.

---

## Payment Overdue

### payment_overdue_1

- **ID:** `payment_overdue_1`
- **Header:** TEXT — "Pagamento atrasado"
- **Body:** "O pagamento do seu {{texto}} no valor de {{valor}} vence em {{numero}} dias. Pague agora para evitar {{texto}}. Entre em contato caso precise de assistencia"
- **Footer:** —
- **Buttons:**
  - URL — "Pagar agora"
  - PHONE — "Fale conosco"
- **Variables:** texto (x2), valor, numero
- **Use case:** Overdue payment with pay-now and phone contact options.

### payment_overdue_2

- **ID:** `payment_overdue_2`
- **Header:** —
- **Body:** "Ola, {{texto}}, voce tem um pagamento atrasado: Conta: {{texto}} Valor devido: {{valor}} Data prevista: {{data}} Use o botao abaixo para concluir o pagamento atraves do nosso site. Por favor ignore esta mensagem se voce ja pagou."
- **Footer:** Present
- **Buttons:**
  - URL — "Pagar agora"
- **Variables:** texto (x2), valor, data
- **Use case:** Overdue payment with structured details and pay link.

### payment_overdue_3

- **ID:** `payment_overdue_3`
- **Header:** —
- **Body:** "O pagamento esta atrasado para o cartao {{texto}} com final {{numero}} no valor de {{valor}}. Clique para pagar agora e evite cobrancas {{texto}}."
- **Footer:** —
- **Buttons:**
  - URL — "Pagar agora"
- **Variables:** texto (x2), numero, valor
- **Use case:** Card-specific overdue payment with late fee warning.

### payment_overdue_5

- **ID:** `payment_overdue_5`
- **Header:** —
- **Body:** "Pagamento em atraso no {{texto}} com final {{numero}}. Clique aqui para pagar agora e evitar cobrancas por {{texto}}."
- **Footer:** —
- **Buttons:**
  - URL — "Revisar e pagar"
- **Variables:** texto (x2), numero
- **Use case:** Concise overdue payment with review-and-pay link.

### payment_overdue_6

- **ID:** `payment_overdue_6`
- **Header:** ORDER
- **Body:** "Oi, {{texto}}. Voce tem um pagamento atrasado: Conta: {{texto}} Data de vencimento: {{data}} {{texto}} em nosso site. Se voce ja pagou, ignore esta mensagem."
- **Footer:** Present
- **Buttons:**
  - URL — "Revisar e pagar"
- **Variables:** texto (x3), data
- **Use case:** Overdue payment with order header and structured details.

### payment_overdue_7

- **ID:** `payment_overdue_7`
- **Header:** ORDER — "Pagamento atrasado"
- **Body:** "O pagamento no seu cartao de credito venceu ha {{texto}} dias. Pague agora para evitar {{numero}}. Entre em contato conosco se precisar de ajuda."
- **Footer:** —
- **Buttons:**
  - URL — "Revisar e pagar"
- **Variables:** texto, numero
- **Use case:** Credit card overdue with order header.

### payment_overdue_8

- **ID:** `payment_overdue_8`
- **Header:** ORDER — "Pagamento em atraso"
- **Body:** "Voce tem um pagamento no valor de {{valor}} que esta atrasado. Efetue o pagamento tocando no botao abaixo. Caso voce ja tenha pagado a fatura nas ultimas 48 horas, por favor, desconsidere esta mensagem."
- **Footer:** —
- **Buttons:**
  - URL — "Review and Pay"
- **Variables:** valor
- **Use case:** Overdue payment with 48h grace period note.

---

## Payment Recharge

### payment_recharge_reminder_01

- **ID:** `payment_recharge_reminder_01`
- **Header:** —
- **Body:** "Ola! Seu {{texto}} expira em {{texto}}. Voce pode fazer uma recarga no seu numero {{texto}} - {{numero}} - com {{valor}} para evitar interrupcoes. Ou clique no link abaixo para recarregar com outra quantidade de sua escolha. Se voce ja fez uma recarga, por favor ignore essa mensagem. Obrigado!"
- **Footer:** —
- **Buttons:**
  - URL — "Rever e pagar"
- **Variables:** texto (x3), numero, valor
- **Use case:** Prepaid plan expiration recharge reminder.

---

## Payment Reminder

### payment_reminder_1

- **ID:** `payment_reminder_1`
- **Header:** TEXT — "Pagamento em breve"
- **Body:** "Ola, {{texto}}. Seu pagamento de {{valor}} deve ser vencido em {{data}}. Por favor ignore esta mensagem se voce ja pagou."
- **Footer:** —
- **Buttons:**
  - URL — "Pagar agora"
- **Variables:** texto, valor, data
- **Use case:** Upcoming payment reminder with pay-now link.

### payment_reminder_2

- **ID:** `payment_reminder_2`
- **Header:** —
- **Body:** "Seu pagamento de {{valor}} deve ser feito ate {{data}}. Pague agora para evitar a {{texto}}. Caso ja tenha pagado, ignore esta mensagem."
- **Footer:** —
- **Buttons:**
  - URL — "Pagar agora"
- **Variables:** valor, data, texto
- **Use case:** Payment due date reminder with late fee warning.

### payment_reminder_3

- **ID:** `payment_reminder_3`
- **Header:** TEXT — "E preciso fazer o pagamento"
- **Body:** "Lembrete de pagamento: Conta: {{texto}} Valor a pagar: {{valor}} Data de vencimento: {{data}} Pague agora para evitar {{texto}}. Se voce ja pagou, ignore esta mensagem."
- **Footer:** Present
- **Buttons:**
  - URL — "Pagar agora"
- **Variables:** texto (x2), valor, data
- **Use case:** Structured payment reminder with account details.

### payment_reminder_4

- **ID:** `payment_reminder_4`
- **Header:** TEXT — "Pagamento de {{valor}} devido"
- **Body:** "Ola, {{texto}}, O pagamento de {{valor}} para o seu cartao {{texto}} que termina em {{numero}} e vencido em {{data}}. Pague agora para evitar taxas atrasadas. Por favor ignore esta mensagem se voce ja pagou."
- **Footer:** Present
- **Buttons:**
  - URL — "Pagar agora"
- **Variables:** texto (x2), valor (x2 — header + body), numero, data
- **Use case:** Card-specific payment reminder with amount in header.

### payment_reminder_5

- **ID:** `payment_reminder_5`
- **Header:** ORDER — "E preciso fazer o pagamento"
- **Body:** "Oi, {{texto}}, O pagamento no seu cartao {{texto}} com final {{numero}} deve ser feito ate {{data}}. Pague agora para evitar {{texto}}. Se voce ja pagou, ignore esta mensagem."
- **Footer:** —
- **Buttons:**
  - URL — "Revisar e pagar"
- **Variables:** texto (x3), numero, data
- **Use case:** Card payment reminder with order header.

### payment_reminder_6

- **ID:** `payment_reminder_6`
- **Header:** ORDER — "E preciso fazer o pagamento"
- **Body:** "Lembrete de pagamento: Conta: {{texto}} Data de vencimento: {{data}} Pague agora para evitar {{texto}}. Se voce ja pagou, ignore esta mensagem."
- **Footer:** —
- **Buttons:**
  - URL — "Revisar e pagar"
- **Variables:** texto (x2), data
- **Use case:** Structured payment reminder with order header.

### payment_reminder_7

- **ID:** `payment_reminder_7`
- **Header:** ORDER
- **Body:** "Seu pagamento vence dia {{data}}. Pague agora para evitar {{texto}}. Caso ja tenha efetuado o pagamento, ignore essa mensagem."
- **Footer:** —
- **Buttons:**
  - URL — "Revisar e pagar"
- **Variables:** data, texto
- **Use case:** Concise payment due reminder with order header.

### payment_reminder_8

- **ID:** `payment_reminder_8`
- **Header:** ORDER — "O pagamento vence em breve"
- **Body:** "Oi, {{texto}}, Seu pagamento vence no dia {{data}}. Se voce ja pagou, ignore esta mensagem."
- **Footer:** —
- **Buttons:**
  - URL — "Revisar e pagar"
- **Variables:** texto, data
- **Use case:** Brief upcoming payment notice with order header.

---

## Payment Scheduled

### payment_scheduled_1

- **ID:** `payment_scheduled_1`
- **Header:** —
- **Body:** "Seu pagamento de {{valor}} para a conta {{texto}} esta programado para {{data}}. Confira se voce tem saldo suficiente para evitar qualquer cobranca {{texto}}."
- **Footer:** —
- **Buttons:**
  - URL — "Gerenciar pagamento"
- **Variables:** valor, texto (x2), data
- **Use case:** Scheduled payment confirmation with balance check reminder.

### payment_scheduled_2

- **ID:** `payment_scheduled_2`
- **Header:** TEXT — "Proximo pagamento programado"
- **Body:** "Oi, {{texto}}, Agradecemos por agendar seu pagamento de {{valor}} para a conta {{texto}} em {{data}}. Visite sua conta caso queira fazer alguma alteracao antes dessa data."
- **Footer:** —
- **Buttons:**
  - URL — "Gerenciar pagamento"
- **Variables:** texto (x2), valor, data
- **Use case:** Scheduled payment acknowledgement with modification option.

### payment_scheduled_3

- **ID:** `payment_scheduled_3`
- **Header:** —
- **Body:** "Oi, {{texto}}. Este e um lembrete de que seu proximo pagamento programado esta chegando: Data: {{data}} Conta: {{texto}} Valor: {{valor}} Tenha um otimo dia. Atenciosamente,"
- **Footer:** —
- **Buttons:**
  - URL — "Gerenciar pagamento"
- **Variables:** texto (x2), data, valor
- **Use case:** Structured scheduled payment reminder.

---

## Payment Successful

### payment_successful

- **ID:** `payment_successful`
- **Header:** TEXT — "Pagamento recebido"
- **Body:** "Ola, {{texto}}, o pagamento da sua fatura {{texto}} de {{valor}} foi recebido com sucesso. Sua data de pagamento foi {{data}}. Obrigado!"
- **Footer:** —
- **Buttons:**
  - URL — "Recibo"
- **Variables:** texto (x2), valor, data
- **Use case:** Successful payment confirmation with receipt link.

---

## Phone Deactivation

### phone_deactivation_reminder_01

- **ID:** `phone_deactivation_reminder_01`
- **Header:** —
- **Body:** "Ola! Seu numero {{texto}} - {{numero}} - podera ser cancelado em {{texto}} por falta de recarga. Voce pode fazer uma recarga para evitar o cancelamento. Se voce ja realizou a recarga, desconsidere esta mensagem. Obrigado!"
- **Footer:** —
- **Buttons:**
  - QR — "Fazer recarga"
  - QR — "Nao tenho interesse"
- **Variables:** texto (x2), numero
- **Use case:** Phone line deactivation warning with recharge option.

---

## Privacy

### privacy_disclosure_1

- **ID:** `privacy_disclosure_1`
- **Header:** —
- **Body:** "Atualizamos a nossa Politica de Privacidade em {{data}}. Por favor, clique no botao abaixo para saber mais."
- **Footer:** —
- **Buttons:**
  - URL — "Ver Politica"
- **Variables:** data
- **Use case:** Privacy policy update notification.

---

## Product Recall

### product_recall_1

- **ID:** `product_recall_1`
- **Header:** —
- **Body:** "O {{texto}} que encomendou em {{data}} foi retirado. Clique abaixo para nos dizer como gostaria de proceder."
- **Footer:** —
- **Buttons:**
  - URL — "Opcoes de visualizacao"
- **Variables:** texto, data
- **Use case:** Product recall notification with options link.

---

## Purchase Receipt

### purchase_receipt_1

- **ID:** `purchase_receipt_1`
- **Header:** DOCUMENT
- **Body:** "Agradecemos a compra no valor de {{valor}} em {{endereco}}. Seu {{texto}} em PDF esta em anexo."
- **Footer:** —
- **Buttons:** —
- **Variables:** valor, endereco, texto
- **Use case:** Purchase receipt with PDF document attachment.

### purchase_receipt_2

- **ID:** `purchase_receipt_2`
- **Header:** DOCUMENT
- **Body:** "Agradecemos por usar seu cartao de {{texto}} na {{texto}}. Seu {{texto}} esta em anexo no formato PDF."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x3)
- **Use case:** Card purchase receipt with PDF attachment.

### purchase_receipt_3

- **ID:** `purchase_receipt_3`
- **Header:** —
- **Body:** "Ola {{texto}}, Sua fatura para o pedido {{texto}} esta anexada. Obrigado por comprar conosco!"
- **Footer:** —
- **Buttons:**
  - URL — "Detalhes do pedido"
- **Variables:** texto (x2)
- **Use case:** Invoice notification with order details link.

---

## Purchase Transaction

### purchase_transaction_alert

- **ID:** `purchase_transaction_alert`
- **Header:** —
- **Body:** "Esta mensagem e para confirmar sua {{texto}} no valor de {{valor}}, da {{texto}}, em {{data}}."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2), valor, data
- **Use case:** Purchase transaction confirmation alert.

---

## Recharge

### recharge_failure

- **ID:** `recharge_failure`
- **Header:** TEXT — "Falha na recarga"
- **Body:** "Ola, {{texto}}, nao foi possivel processar a tua recarga movel. Tente novamente ou entre em contato com nossa equipe de suporte."
- **Footer:** —
- **Buttons:**
  - URL — "Recarregar"
- **Variables:** texto
- **Use case:** Mobile recharge failure with retry link.

### recharge_reminder

- **ID:** `recharge_reminder`
- **Header:** TEXT — "Lembrete de validade do pacote"
- **Body:** "Ola, {{texto}}, o seu {{texto}} vai terminar hoje a noite. Para continuar usando sem interrupcao, por favor recarregue."
- **Footer:** —
- **Buttons:**
  - URL — "Recarregar"
- **Variables:** texto (x2)
- **Use case:** Package expiration reminder with recharge link.

### recharge_reminder_02

- **ID:** `recharge_reminder_02`
- **Header:** —
- **Body:** "Ola! Seu {{texto}} expira em {{texto}}. Voce pode fazer uma recarga no seu numero {{texto}} - {{numero}} - para evitar interrupcoes. Se voce ja fez a recarga, desconsidere esta mensagem. Obrigado!"
- **Footer:** —
- **Buttons:**
  - QR — "Fazer recarga"
  - QR — "Nao tenho interesse"
- **Variables:** texto (x3), numero
- **Use case:** Plan expiration recharge reminder with quick reply options.

### recharge_successful

- **ID:** `recharge_successful`
- **Header:** TEXT — "Recarga com sucesso"
- **Body:** "Ola, {{texto}}, sua recarga movel de {{valor}} foi bem-sucedida! Seu novo saldo e de {{valor}}."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto, valor (x2)
- **Use case:** Successful mobile recharge confirmation with new balance.

---

## Refund

### refund_confirmation_1

- **ID:** `refund_confirmation_1`
- **Header:** TEXT — "Voce foi reembolsado por {{valor}}"
- **Body:** "Ola, {{texto}}, O teu reembolso de {{valor}} foi processado para a encomenda {{texto}}. Voce recebera um credito de volta na sua forma de pagamento original em 3-5 dias uteis."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2), valor (x2 — header + body)
- **Use case:** Refund confirmation with processing timeline.

---

## Renewal

### renewal_reminder

- **ID:** `renewal_reminder`
- **Header:** TEXT — "Lembrete de renovacao do servico"
- **Body:** "Seu plano {{texto}} esta programado para renovar em {{data}}. Por favor, mantenha o equilibrio suficiente para manter o servico ativo."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto, data
- **Use case:** Service renewal reminder with balance check.

### renewal_successful

- **ID:** `renewal_successful`
- **Header:** —
- **Body:** "Hi {{texto}}, Seu plano {{texto}} foi renovado com sucesso. Os detalhes do seu novo plano sao: Nome do plano: {{texto}} Limite de dados: {{texto}} Validade: {{texto}} Obrigado pela preferencia!"
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x5)
- **Use case:** Successful plan renewal with new plan details.

---

## Rescheduling

### rescheduling_request

- **ID:** `rescheduling_request`
- **Header:** —
- **Body:** "Ola, {{texto}}, precisamos de reagendar a sua {{texto}}. Responda a *Ragenda* para escolher um novo horario."
- **Footer:** —
- **Buttons:**
  - QR — "Reagendar"
- **Variables:** texto (x2)
- **Use case:** Business-initiated rescheduling request with quick reply.

---

## Return

### return_confirmation_1

- **ID:** `return_confirmation_1`
- **Header:** —
- **Body:** "Ola, {{texto}}, obrigado por devolveres os produtos da tua encomenda {{texto}}. Estamos atualmente a processar a tua devolucao e vamos notificar-te sobre o teu estado de {{texto}}."
- **Footer:** —
- **Buttons:**
  - URL — "Gerir encomenda"
- **Variables:** texto (x3)
- **Use case:** Return received confirmation with refund status tracking.

### return_confirmation_2

- **ID:** `return_confirmation_2`
- **Header:** TEXT — "Devolucao recebida"
- **Body:** "Recebemos um ou mais itens do seu pedido {{texto}}. Sua devolucao foi concluida e processamos o {{texto}} no valor de {{valor}}. Agradecemos por comprar conosco."
- **Footer:** —
- **Buttons:**
  - URL — "Gerenciar pedido"
- **Variables:** texto (x2), valor
- **Use case:** Return completed with refund processed confirmation.

---

## Roaming

### roaming_reminder

- **ID:** `roaming_reminder`
- **Header:** TEXT — "Aviso de custos de roaming"
- **Body:** "Ola, {{texto}}, o seu numero esta atualmente numa rede fora da {{texto}}. Para evitar cobrancas de pagamento alta pode ativar um pacote de roaming internacional."
- **Footer:** —
- **Buttons:**
  - URL — "Ativar"
- **Variables:** texto (x2)
- **Use case:** International roaming cost warning with activation link.

---

## Service

### service_disruption

- **ID:** `service_disruption`
- **Header:** —
- **Body:** "Caro cliente, temos atualizacoes de rede agendadas para {{data}} entre {{texto}} e {{texto}}. Voce pode sofrer interrupcao temporaria no servico. Obrigado pela compreensao."
- **Footer:** —
- **Buttons:** —
- **Variables:** data, texto (x2)
- **Use case:** Planned network maintenance notification.

---

## Severe Weather

### severe_weather_alert_1

- **ID:** `severe_weather_alert_1`
- **Header:** —
- **Body:** "Ha um alerta de {{texto}} na area {{texto}}. Recomendamos que voce permaneca dentro de casa ate {{data}}. Se estiver enfrentando problemas relacionados com {{texto}} ou {{texto}}, pode nos informar usando o botao abaixo e iremos dar seguimento para uma inspecao no local. Vamos seguir as atualizacoes principais e quaisquer precaucoes recomendadas. Para mais informacoes sobre a preparacao para {{texto}}, clique no URL abaixo."
- **Footer:** —
- **Buttons:**
  - URL — "Saiba mais"
- **Variables:** texto (x5), data
- **Use case:** Severe weather alert with safety instructions and inspection request.

### severe_weather_alert_2

- **ID:** `severe_weather_alert_2`
- **Header:** —
- **Body:** "Ha um alerta de {{texto}} na area {{texto}}. Para mais informacoes sobre precaucoes a tomar durante um {{texto}} clique no URL abaixo. Para atualizacoes ao vivo sobre o alerta de {{texto}} na area {{texto}}, visite o nosso site {{url}}."
- **Footer:** —
- **Buttons:**
  - URL — "Ver precaucoes"
- **Variables:** texto (x5), url
- **Use case:** Weather alert with precaution guide and live updates.

---

## Shifting

### shifting_journey

- **ID:** `shifting_journey`
- **Header:** —
- **Body:** "Ola, John, o teu pedido de mudanca de ligacao de banda larga esta a ser processado! Vamos mante-lo informado sobre o status."
- **Footer:** —
- **Buttons:**
  - URL — "Status da faixa"
- **Variables:** (hardcoded sample — name)
- **Use case:** Broadband service relocation status update.

---

## Shipment

### shipment_confirmation_1

- **ID:** `shipment_confirmation_1`
- **Header:** TEXT — "Pedido enviado"
- **Body:** "Ola, {{texto}}, seu pedido foi enviado! Seu numero de rastreamento e {{texto}}. A entrega estimada e {{data}}. Continuaremos a fornecer atualizacoes sobre este envio ate que seja entregue."
- **Footer:** —
- **Buttons:**
  - URL — "Monitorizar o envio"
- **Variables:** texto (x2), data
- **Use case:** Shipment confirmation with tracking number and estimated delivery.

### shipment_confirmation_2

- **ID:** `shipment_confirmation_2`
- **Header:** —
- **Body:** "Ola, {{texto}}, otimas noticias! Seu pedido {{texto}} foi enviado. Rastreamento #: {{texto}} Entrega estimada: {{data}} Vamos fornecer atualizacoes ate a entrega."
- **Footer:** —
- **Buttons:**
  - URL — "Monitorizar o envio"
- **Variables:** texto (x3), data
- **Use case:** Shipment notification with structured tracking details.

### shipment_confirmation_3

- **ID:** `shipment_confirmation_3`
- **Header:** —
- **Body:** "Ola, {{texto}}, o seu pedido {{texto}} saiu da nossa {{texto}} e esta a caminho de voce! Sua identificacao de rastreamento e {{texto}}. Clique abaixo para rastrear seu pacote."
- **Footer:** —
- **Buttons:**
  - URL — "Rastrear meu pedido"
- **Variables:** texto (x4)
- **Use case:** Order shipped from warehouse with tracking link.

### shipment_confirmation_4

- **ID:** `shipment_confirmation_4`
- **Header:** TEXT — "Seu pedido esta a caminho!"
- **Body:** "Ola, {{texto}}, Temos o prazer de informar que a sua encomenda {{texto}} foi enviada! Clique em ver detalhes do pedido para ver o status do seu envio."
- **Footer:** —
- **Buttons:**
  - URL — "Ver detalhes da encomenda"
- **Variables:** texto (x2)
- **Use case:** Shipment confirmation with order details link.

### shipment_confirmation_5

- **ID:** `shipment_confirmation_5`
- **Header:** TEXT — "Pedido enviado"
- **Body:** "Ola, {{texto}}, Temos o prazer de informar que a sua encomenda {{texto}} foi enviada! Clique abaixo para ver o status do seu envio."
- **Footer:** —
- **Buttons:**
  - URL — "Ver pedido"
- **Variables:** texto (x2)
- **Use case:** Concise shipment confirmation with view link.

---

## Statement

### statement_available_1

- **ID:** `statement_available_1`
- **Header:** TEXT — "Extrato disponivel"
- **Body:** "Oi, {{texto}}, Seu extrato de {{texto}} para a conta com final {{numero}} ja esta disponivel. Clique abaixo para ver o extrato."
- **Footer:** —
- **Buttons:**
  - URL — "Ver extrato"
- **Variables:** texto (x2), numero
- **Use case:** Account statement availability notification.

### statement_available_2

- **ID:** `statement_available_2`
- **Header:** TEXT — "Declaracao disponivel"
- **Body:** "Isto e para notifica-lo de que o seu extrato mais recente para a sua conta {{texto}} ja esta disponivel. Entre na sua conta para ver seu extrato."
- **Footer:** —
- **Buttons:**
  - URL — "Ver declaracao"
- **Variables:** texto
- **Use case:** Account statement ready for review.

---

## Support

### support_ticket_acknowledgement

- **ID:** `support_ticket_acknowledgement`
- **Header:** —
- **Body:** "O seu pedido {{numero}} esta registado. Entraremos em contato com voce dentro de {{numero}} horas."
- **Footer:** —
- **Buttons:** —
- **Variables:** numero (x2)
- **Use case:** Support ticket creation acknowledgement with SLA.

---

## System

### system_outage_1

- **ID:** `system_outage_1`
- **Header:** —
- **Body:** "Detectamos uma interrupcao do sistema que afeta o codigo postal {{texto}}. Esperamos restaurar o servico ate {{data}}. Pedimos desculpas pelo inconveniente."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto, data
- **Use case:** System outage notification with estimated restoration time.

### system_outage_2

- **ID:** `system_outage_2`
- **Header:** —
- **Body:** "A interrupcao do sistema foi restaurada para o codigo postal {{texto}}. Se ainda estiver a ter uma interrupcao no codigo postal {{texto}}, clique no botao abaixo para nos alertar."
- **Footer:** —
- **Buttons:**
  - QR — "Denunciar interrupcao"
- **Variables:** texto (x2)
- **Use case:** Outage restoration confirmation with continued-issue reporting.

---

## Technician

### technician_visit

- **ID:** `technician_visit`
- **Header:** —
- **Body:** "Ola, {{texto}}, nosso tecnico chegara a sua localizacao nos proximos {{texto}}. Toque para rastrear a localizacao em tempo real."
- **Footer:** —
- **Buttons:**
  - URL — "Rastrear localizacao"
- **Variables:** texto (x2)
- **Use case:** Technician ETA notification with real-time tracking.

---

## Speed

### speed_upgrade_notice

- **ID:** `speed_upgrade_notice`
- **Header:** TEXT — "Aviso de aceleracao"
- **Body:** "Temos o prazer de informa-lo que a sua velocidade de internet foi atualizada para {{numero}} Mbps. Obrigado por escolher nossos servicos."
- **Footer:** —
- **Buttons:** —
- **Variables:** numero
- **Use case:** Internet speed upgrade confirmation.

---

## Voting

### voting_registration_1

- **ID:** `voting_registration_1`
- **Header:** —
- **Body:** "Para votar em {{data}}, certifica-te de que o teu eleitor {{texto}} esta ativo. Clique no URL abaixo para entender os passos necessarios para renovar, se necessario."
- **Footer:** —
- **Buttons:**
  - URL — "Verificar registro"
- **Variables:** data, texto
- **Use case:** Voter registration status check reminder.

---

## Warranty

### warranty_alert_1

- **ID:** `warranty_alert_1`
- **Header:** —
- **Body:** "Obrigado por sua compra de {{texto}}. Sua garantia esta ativa a partir de {{data}}. Nossos {{texto}} estao abaixo, para sua referencia."
- **Footer:** —
- **Buttons:** —
- **Variables:** texto (x2), data
- **Use case:** Warranty activation confirmation after purchase.

---

## Variable Types Reference

| Variable | Syntax | Description | Example |
|----------|--------|-------------|---------|
| `texto` | `{{texto}}` | Free-text string | Name, service type, instructions |
| `data` | `{{data}}` | Date value | 01/01/2024, 31 de dezembro |
| `valor` | `{{valor}}` | Currency amount | R$ 10,00, US$ 12,34 |
| `numero` | `{{numero}}` | Numeric value | Card last digits, ticket number, days |
| `endereco` | `{{endereco}}` | Physical address | Rua dos Jardins, 01, Sao Paulo |
| `telefone` | `{{telefone}}` | Phone number (E.164) | 5511999999999 |
| `url` | `{{url}}` | Web URL | www.example.com |
| `nome_comercial` | `{{nome comercial}}` | Business name (auto-filled) | Meta-managed variable |
| `group_id` | `{{group_id}}` | WhatsApp group invite link | chat.whatsapp.com/... |

## Button Types Reference

| Type | Max Count | Label Limit | Description |
|------|-----------|-------------|-------------|
| URL | 2 | 25 chars | Opens external URL (supports dynamic suffix) |
| QR (Quick Reply) | 10 | 25 chars | Returns button text as user reply |
| PHONE | 1 | 25 chars | Initiates phone call |
| LIST | 1 | 25 chars | Opens list picker menu |
| FLOW | 1 | 25 chars | Launches WhatsApp Flow (in-app form) |

---

*Meta Official Utility Template Portfolio v1.0 — 165 templates across 57 categories*
*Source: Meta WhatsApp Business Platform Template Library (pt-BR)*
