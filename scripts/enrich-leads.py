#!/usr/bin/env python3
"""
OUTBILI — Enriquecer leads pendentes no Airtable
Uso: python3 scripts/enrich-leads.py

Lê leads com enrichmentStatus vazio ou 'pending', calcula SPICED,
identifica travas, gera discovery questions e atualiza no Airtable.
"""

import json, urllib.request, ssl, time, re, sys

import os
PAT = os.environ.get('AIRTABLE_PAT', '')
BASE = os.environ.get('AIRTABLE_BASE_ID', 'appKh4qQ5JN94dQHv')

if not PAT:
    # Try reading from .env.local
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith('VITE_AIRTABLE_PAT='):
                    PAT = line.split('=', 1)[1].strip()
                elif line.startswith('VITE_AIRTABLE_BASE_ID='):
                    BASE = line.split('=', 1)[1].strip()
    if not PAT:
        print("Erro: AIRTABLE_PAT não configurado. Defina via env ou .env.local")
        sys.exit(1)
TABLE = "Leads"
ctx = ssl.create_default_context()

def api_get(path):
    req = urllib.request.Request(
        f"https://api.airtable.com/v0/{BASE}/{path}",
        headers={"Authorization": f"Bearer {PAT}"}
    )
    return json.loads(urllib.request.urlopen(req, context=ctx).read())

def api_patch(records):
    data = json.dumps({"records": records}).encode()
    req = urllib.request.Request(
        f"https://api.airtable.com/v0/{BASE}/{TABLE}",
        data=data, method='PATCH',
        headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"}
    )
    return json.loads(urllib.request.urlopen(req, context=ctx).read())

def get_pending_leads():
    # Get leads without enrichmentStatus = "complete"
    result = api_get(f"{TABLE}?filterByFormula=OR({{enrichmentStatus}}='pending',{{enrichmentStatus}}='',{{enrichmentStatus}}='none')")
    return result.get('records', [])

def enrich(lead):
    f = lead['fields']
    name = f.get('companyName', '')
    segment = f.get('segment', 'Estética')
    city = f.get('city', 'SP')
    summary = f.get('businessSummary', '')
    website = f.get('website', '')

    has_website = bool(website)
    has_ads = '0 anúncios' not in summary if summary else False

    rating = float(m.group(1)) if (m := re.search(r'(\d+\.?\d*)\★', summary)) else 0
    reviews = int(m.group(1)) if (m := re.search(r'(\d+) avaliações', summary)) else 0
    presence = int(m.group(1)) if (m := re.search(r'(\d+)/10', summary)) else 0

    # SPICED
    spicedS = min(1 + has_website + (rating >= 4.0) + (reviews >= 20) + (presence >= 5), 5)
    spicedP = max(5 - has_ads - has_website - (presence >= 5) - (reviews >= 50), 1)
    spicedI = 5 if presence <= 3 else (4 if presence <= 5 else (3 if presence <= 7 else 2))
    spicedC = 4 if presence <= 3 else 3
    spicedD = min(3 + bool(website), 5)

    score = round(spicedS * 0.25 + spicedP * 0.25 + spicedI * 0.20 + spicedC * 0.15 + spicedD * 0.15, 1)
    temp = 'HOT' if score >= 4.0 else ('WARM' if score >= 3.0 else 'COLD')

    trap = "T1 - Aquisição de clientes" if not has_ads and presence <= 3 else \
           "T6 - Posicionamento de marca" if has_website and presence <= 5 else \
           "T2 - Conversão de vendas" if reviews < 20 else \
           "T8 - Dependência de canal"

    notes = json.dumps({
        "S": f"{'Website ativo' if has_website else 'Sem website'}. Nota {rating}/5 com {reviews} reviews. Presença {presence}/10.",
        "P": f"{'Sem ads pagos' if not has_ads else 'Ads detectados'}. Presença {presence}/10 — gaps de marketing.",
        "I": f"Presença {presence}/10 = potencial de 25-40% crescimento com estratégia digital.",
        "C": f"Segmento {segment} em {city} competitivo. Concorrentes com digital superior.",
        "D": f"{'Website + ' if has_website else ''}Telefone via Google Maps."
    }, ensure_ascii=False)

    discovery = json.dumps([
        f"Como está a captação de clientes da {name} hoje?",
        f"Quantos clientes novos/mês? Indicação vs busca ativa?",
        f"Ticket médio e recorrência no segmento de {segment}?",
        f"O que já tentaram em marketing digital?",
        f"Se dobrasse o faturamento em 12 meses, qual o gargalo?"
    ], ensure_ascii=False)

    return {
        "spicedS": spicedS, "spicedP": spicedP, "spicedI": spicedI,
        "spicedC": spicedC, "spicedD": spicedD,
        "spicedNotes": notes, "score": score, "temperature": temp,
        "hypotheticalTrap": trap, "discoveryQuestions": discovery,
        "enrichmentStatus": "complete"
    }

def main():
    leads = get_pending_leads()
    if not leads:
        # Try all leads without complete status
        all_leads = api_get(f"{TABLE}")
        leads = [r for r in all_leads.get('records', []) if r['fields'].get('enrichmentStatus') != 'complete']

    if not leads:
        print("Nenhum lead pendente para enriquecer.")
        return

    print(f"Enriquecendo {len(leads)} leads...\n")
    done = 0
    batch = []

    for lead in leads:
        try:
            fields = enrich(lead)
            batch.append({"id": lead['id'], "fields": fields})
            name = lead['fields'].get('companyName', '?')
            print(f"  ✅ {name} → Score {fields['score']} ({fields['temperature']}) | {fields['hypotheticalTrap']}")
            done += 1

            # Batch of 10 (Airtable limit)
            if len(batch) >= 10:
                api_patch(batch)
                batch = []
                time.sleep(0.5)
        except Exception as e:
            print(f"  ❌ {lead['fields'].get('companyName', '?')}: {e}")

    # Final batch
    if batch:
        api_patch(batch)

    print(f"\n{'='*40}")
    print(f"{done}/{len(leads)} leads enriquecidos com sucesso!")

if __name__ == '__main__':
    main()
