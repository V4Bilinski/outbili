import { useState, useCallback } from 'react'
import { getLeads, updateLead } from '../services/leadService'
import { calculateSpicedDimensions } from '../services/enrichmentService'
import { calculateSpicedScore, getTemperatureFromScore } from '../lib/utils'

export interface RecalcProgress {
  total: number
  processed: number
  updated: number
  skipped: number
  currentLead: string
  isRunning: boolean
  isDone: boolean
  changes: Array<{
    id: string
    name: string
    oldScore: number
    newScore: number
    oldTemp: string
    newTemp: string
  }>
}

export function useSpicedRecalc() {
  const [progress, setProgress] = useState<RecalcProgress>({
    total: 0, processed: 0, updated: 0, skipped: 0,
    currentLead: '', isRunning: false, isDone: false, changes: [],
  })

  const recalcAll = useCallback(async () => {
    setProgress(p => ({ ...p, isRunning: true, isDone: false, processed: 0, updated: 0, skipped: 0, changes: [] }))

    try {
      const leads = await getLeads()
      setProgress(p => ({ ...p, total: leads.length }))

      const batchSize = 5
      const allChanges: RecalcProgress['changes'] = []

      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize)

        await Promise.allSettled(
          batch.map(async (lead) => {
            try {
              setProgress(p => ({ ...p, currentLead: lead.companyName || lead.cnpj || '...' }))

              // Recalcular SPICED v2 com dados atuais do lead
              const spiced = calculateSpicedDimensions(lead)
              const newScore = calculateSpicedScore(spiced.spicedS, spiced.spicedP, spiced.spicedI, spiced.spicedC, spiced.spicedD)
              const newTemp = getTemperatureFromScore(newScore)

              const oldScore = lead.score || 0
              const oldTemp = lead.temperature || 'Frio'

              // Só atualiza se mudou
              if (newScore !== oldScore || newTemp !== oldTemp || lead.spicedS !== spiced.spicedS || lead.spicedP !== spiced.spicedP) {
                await updateLead(lead.id, {
                  spicedS: spiced.spicedS,
                  spicedP: spiced.spicedP,
                  spicedI: spiced.spicedI,
                  spicedC: spiced.spicedC,
                  spicedD: spiced.spicedD,
                  score: newScore,
                  temperature: newTemp,
                })

                if (newScore !== oldScore || newTemp !== oldTemp) {
                  allChanges.push({
                    id: lead.id,
                    name: lead.companyName || 'Sem nome',
                    oldScore,
                    newScore,
                    oldTemp,
                    newTemp,
                  })
                }

                setProgress(p => ({ ...p, updated: p.updated + 1, changes: [...allChanges] }))
              } else {
                setProgress(p => ({ ...p, skipped: p.skipped + 1 }))
              }

              setProgress(p => ({ ...p, processed: p.processed + 1 }))
            } catch (err) {
              console.warn(`Recalc falhou para ${lead.companyName}:`, err)
              setProgress(p => ({ ...p, processed: p.processed + 1, skipped: p.skipped + 1 }))
            }
          })
        )

        // Throttle defensivo entre batches (protege o backend Supabase/Edge sob carga)
        if (i + batchSize < leads.length) {
          await new Promise(r => setTimeout(r, 1200))
        }
      }

      setProgress(p => ({ ...p, isRunning: false, isDone: true, currentLead: '' }))
    } catch (err) {
      console.error('Recalc em massa falhou:', err)
      setProgress(p => ({ ...p, isRunning: false, currentLead: 'Erro ao carregar leads' }))
    }
  }, [])

  return { progress, recalcAll }
}
