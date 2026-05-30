import { Card, CardTitle } from '../components/ui/Card'
import { AnimateIn } from '../components/ui/AnimateIn'
import { SectionDivider } from '../components/ui/SectionLabel'
import { createPortal } from 'react-dom'
import { Search, X, CheckCircle, Loader2, AlertCircle, UserPlus, Sparkles, Hash, Shield, ArrowRight, Upload, FileUp, Trash2, ShieldCheck, FileSearch } from 'lucide-react'
import { PescaPanel } from '../components/search/PescaPanel'
import { Button } from '../components/ui/Button'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/cn'
import { SEGMENTS } from '../lib/constants'
import { useLeadEnrichment } from '../hooks/useLeadEnrichment'
import { useMassEnrichment, loadPendingQueue, clearPendingQueue } from '../hooks/useMassEnrichment'
import { createLead, getLeads } from '../services/leadService'
import { requestEnrichment } from '../services/socioService'
import { createContact } from '../services/contactService'
import { createActivity } from '../services/activityService'
import { buildStageChangeDescription } from '../components/pipeline/stageConfig'
import { calculateSpicedDimensions } from '../services/enrichmentService'
import { calculateSpicedScore, getTemperatureFromScore } from '../lib/utils'
import { toast } from 'sonner'
import { parseFile, ACCEPTED_FORMATS, type ParseResult } from '../lib/file-parser'

// --- Constants (derived from single source of truth) ---
const RECOMMENDED_SEGMENTS = SEGMENTS.map((s) => s.name)

// === MAIN PAGE ===
export function SearchPage() {
  const [searchMode, setSearchMode] = useState<'specific' | 'pesca'>('pesca')

  // Specific lead fields
  const [specificName, setSpecificName] = useState('')
  const [specificCnpj, setSpecificCnpj] = useState('')
  const [specificPhone, setSpecificPhone] = useState('')
  const [specificEmail, setSpecificEmail] = useState('')
  const [specificWebsite, setSpecificWebsite] = useState('')
  const [specificInstagram, setSpecificInstagram] = useState('')
  const [specificLinkedin, setSpecificLinkedin] = useState('')
  const [specificFacebook, setSpecificFacebook] = useState('')
  const [specificSegment, setSpecificSegment] = useState('')
  const [specificCity, setSpecificCity] = useState('')
  const [specificState, setSpecificState] = useState('')
  const [specificAddress, setSpecificAddress] = useState('')
  const [specificRevenue, setSpecificRevenue] = useState('')
  const [specificContact, setSpecificContact] = useState('')
  const [specificContactRole, setSpecificContactRole] = useState('')
  const [isCreatingSpecific, setIsCreatingSpecific] = useState(false)
  const [dupWarning, setDupWarning] = useState<string | null>(null)
  const [dupOverride, setDupOverride] = useState(false)
  const [lastCreatedLead, setLastCreatedLead] = useState<{ id: string; data: Record<string, any> } | null>(null)

  // File upload states
  const [fileParseResult, setFileParseResult] = useState<ParseResult | null>(null)
  const [fileSelected, setFileSelected] = useState<Set<number>>(new Set())
  const [fileReadingStep, setFileReadingStep] = useState<'idle' | 'reading' | 'preview'>('idle')
  const [fileDragging, setFileDragging] = useState(false)
  const [fileImporting, setFileImporting] = useState(false)
  const [fileImportProgress, setFileImportProgress] = useState(0)
  const [fileConfirmOpen, setFileConfirmOpen] = useState(false)
  const fileInputRef2 = useRef<HTMLInputElement>(null)

  const enrichmentProgressRef = useRef<HTMLDivElement>(null)

  const enrichment = useLeadEnrichment()
  const massEnrichment = useMassEnrichment()
  const massEnrichmentRef = useRef<HTMLDivElement>(null)

  // Check for pending enrichment queue on mount (resume after refresh)
  const [pendingResume, setPendingResume] = useState<Array<{ leadId: string; companyName: string }> | null>(null)
  useEffect(() => {
    const pending = loadPendingQueue()
    if (pending && !massEnrichment.isRunning) {
      setPendingResume(pending)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Mask formatters ---
  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  // --- File upload handlers ---
  const handleFileUpload = async (file: File) => {
    setFileReadingStep('reading')
    try {
      const result = await parseFile(file)
      if (result.companies.length === 0) {
        toast.error('Nenhuma empresa encontrada no arquivo. Verifique o formato.')
        setFileReadingStep('idle')
        return
      }
      setFileParseResult(result)
      setFileSelected(new Set(result.companies.map((_, i) => i)))
      setTimeout(() => setFileReadingStep('preview'), 1500)
    } catch {
      toast.error('Não foi possível processar o arquivo. Verifique o formato e tente novamente.')
      setFileReadingStep('idle')
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setFileDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const resetFileUpload = () => {
    setFileParseResult(null)
    setFileSelected(new Set())
    setFileReadingStep('idle')
    setFileImporting(false)
    setFileImportProgress(0)
    setFileConfirmOpen(false)
  }

  const handleFileImportAndEnrich = async () => {
    if (!fileParseResult || fileSelected.size === 0) return
    setFileConfirmOpen(false)
    setFileImporting(true)
    setFileImportProgress(0)
    const companies = fileParseResult.companies.filter((_, i) => fileSelected.has(i))

    // Lazy-load enrichment services (alinhado com handleSpecificSearch)
    const { searchOffice, mapCnpjaToLead, extractPartners } = await import('../services/cnpjaService')
    const { lookupCnpj } = await import('../services/assertivaService')

    const createdLeads: Array<{ id: string; data: Record<string, any> }> = []
    let done = 0
    let duplicates = 0
    let errors = 0

    for (const company of companies) {
      try {
        const cnpjClean = company.cnpj?.replace(/\D/g, '') || ''
        const hasCnpj = cnpjClean.length === 14

        // P0 — Dedupe por CNPJ antes de criar (alinhado com handleSpecificSearch)
        if (hasCnpj) {
          try {
            const existing = await getLeads(`{cnpj} = "${cnpjClean}"`)
            if (existing.length > 0) {
              duplicates++
              done++
              setFileImportProgress(Math.round((done / companies.length) * 100))
              continue
            }
          } catch { /* se a query falhar, segue com tentativa de criar */ }
        }

        // P0 — Enriquecer CNPJá + Assertiva ANTES de gravar (alinhado com handleSpecificSearch)
        let cnpjaData: any = null
        let assertivaData: any = null
        let decisorName = company.contactName || ''
        let decisorRole = company.contactRole || ''
        let bestWhatsapp = ''
        let bestPhone = ''

        if (hasCnpj) {
          try {
            const office = await searchOffice(cnpjClean)
            cnpjaData = mapCnpjaToLead(office)

            if (!decisorName) {
              const partners = extractPartners(office)
              const decisor = partners.find(p =>
                p.qualification.toLowerCase().includes('administrador') ||
                p.qualification.toLowerCase().includes('diretor') ||
                p.qualification.toLowerCase().includes('presidente')
              ) || partners[0]
              if (decisor) { decisorName = decisor.name; decisorRole = decisor.qualification }
            }

            const mobile = office.phones?.find((p: any) => p.type === 'MOBILE')
            const anyPhone = office.phones?.[0]
            if (mobile) bestWhatsapp = `55${mobile.area}${mobile.number}`
            if (anyPhone) bestPhone = `55${anyPhone.area}${anyPhone.number}`
          } catch { /* CNPJá opcional — enrichment pós-gravação cobre */ }

          try {
            assertivaData = await lookupCnpj(cnpjClean)
            const moveis = assertivaData?.telefones?.filter((t: any) => t.tipo === 'celular') || []
            for (const t of moveis) {
              if (t.whatsapp && t.numero) { bestWhatsapp = t.numero.startsWith('55') ? t.numero : `55${t.numero}`; break }
            }
            if (!bestWhatsapp) {
              for (const t of moveis) {
                if (t.numero) { bestWhatsapp = t.numero.startsWith('55') ? t.numero : `55${t.numero}`; break }
              }
            }
            if (!decisorName && assertivaData?.socios?.length) {
              const s = assertivaData.socios.find((s: any) =>
                (s.qualificacao || '').toLowerCase().includes('administrador') ||
                (s.qualificacao || '').toLowerCase().includes('diretor')
              ) || assertivaData.socios[0]
              if (s?.nome) { decisorName = s.nome; decisorRole = s.qualificacao || 'Sócio' }
            }
          } catch { /* Assertiva opcional */ }
        }

        // WhatsApp fallback: telefone do arquivo
        if (!bestWhatsapp && company.phone) {
          const digits = company.phone.replace(/\D/g, '').replace(/^0+/, '')
          bestWhatsapp = digits.length >= 10 ? (digits.startsWith('55') ? digits : '55' + digits) : ''
        }

        // P1 — Tier dinâmico (alinhado com handleSpecificSearch)
        const tier = cnpjaData?.tier || 'Small'

        // Nome real do CNPJá tem PRIORIDADE sobre nome do arquivo
        const realCompanyName = cnpjaData?.companyName || company.companyName
        const tradeName = cnpjaData?.tradeName || ''

        // SPICED com TODOS os dados (arquivo + CNPJá + Assertiva)
        const spicedInput: Record<string, any> = {
          cnpj: cnpjClean,
          capitalSocial: cnpjaData?.capitalSocial,
          foundingDate: cnpjaData?.foundingDate,
          city: company.city || cnpjaData?.city,
          state: company.state || cnpjaData?.state,
          rfEmail: cnpjaData?.rfEmail || company.email,
          rfPhone: cnpjaData?.rfPhone,
          website: company.website || cnpjaData?.website,
          instagram: company.instagram,
          linkedin: company.linkedin,
          employees: cnpjaData?.employees,
          partners: decisorName ? JSON.stringify([{ nome_socio: decisorName }]) : undefined,
          assertivaWhatsappFlag: assertivaData?.assertivaWhatsappFlag,
          assertivaIncomeEstimate: assertivaData?.assertivaIncomeEstimate,
          registrationStatus: cnpjaData?.registrationStatus,
          isHeadquarters: cnpjaData?.isHeadquarters,
          simplesOptant: cnpjaData?.simplesOptant,
          taxRegime: cnpjaData?.taxRegime,
        }
        const spiced = calculateSpicedDimensions(spicedInput)
        const spicedScore = calculateSpicedScore(spiced.spicedS, spiced.spicedP, spiced.spicedI, spiced.spicedC, spiced.spicedD)

        // P2 — Status alinhado com handleSpecificSearch:
        // tem CNPJ valido = cadastro assistido = Contactado
        // sem CNPJ = lead parcial = Novo
        const initialStatus = hasCnpj ? 'Contactado' : 'Novo'

        const leadData: Record<string, any> = {
          companyName: realCompanyName,
          ...(tradeName && { tradeName }),
          cnpj: cnpjClean,
          segment: company.segment || cnpjaData?.segment || specificSegment || '',
          tier,
          ...(cnpjaData?.capitalSocial && { capitalSocial: cnpjaData.capitalSocial }),
          ...(cnpjaData?.employees && { employees: cnpjaData.employees }),
          ...(cnpjaData?.yearsInMarket && { yearsInMarket: cnpjaData.yearsInMarket }),
          status: initialStatus,
          sourceHtmlReport: 'upload_manual',
          score: spicedScore,
          temperature: getTemperatureFromScore(spicedScore),
          spicedS: spiced.spicedS,
          spicedP: spiced.spicedP,
          spicedI: spiced.spicedI,
          spicedC: spiced.spicedC,
          spicedD: spiced.spicedD,
          ...(company.website || cnpjaData?.website ? { website: company.website || cnpjaData?.website } : {}),
          ...(company.instagram && { instagram: company.instagram }),
          ...(company.linkedin && { linkedin: company.linkedin }),
          ...(company.address || cnpjaData?.address ? { address: company.address || cnpjaData?.address } : {}),
          ...(company.city || cnpjaData?.city ? { city: company.city || cnpjaData?.city } : {}),
          ...(company.state || cnpjaData?.state ? { state: company.state || cnpjaData?.state } : {}),
          ...(cnpjaData?.zipCode && { zipCode: cnpjaData.zipCode }),
          ...(cnpjaData?.district && { district: cnpjaData.district }),
          ...(cnpjaData?.legalNature && { legalNature: cnpjaData.legalNature }),
          ...(cnpjaData?.registrationStatus && { registrationStatus: cnpjaData.registrationStatus }),
          ...(cnpjaData?.foundingDate && { foundingDate: cnpjaData.foundingDate }),
          ...(cnpjaData?.cnaePrimary && { cnaePrimary: cnpjaData.cnaePrimary }),
          ...(cnpjaData?.rfPhone && { rfPhone: cnpjaData.rfPhone }),
          ...(cnpjaData?.rfEmail && { rfEmail: cnpjaData.rfEmail }),
          ...(decisorName && { partners: JSON.stringify([{ nome_socio: decisorName, qualificacao_socio: decisorRole }]) }),
          enrichmentStatus: assertivaData ? 'assertiva' : cnpjaData ? 'cnpja' : 'none',
        }

        // P1 — Fallback minimalData (alinhado com handleSpecificSearch)
        let lead: any
        try {
          lead = await createLead(leadData as any)
        } catch {
          const minimalData = {
            companyName: realCompanyName,
            cnpj: cnpjClean,
            score: spicedScore,
            temperature: getTemperatureFromScore(spicedScore),
            spicedS: spiced.spicedS,
            spicedP: spiced.spicedP,
            spicedI: spiced.spicedI,
            spicedC: spiced.spicedC,
            spicedD: spiced.spicedD,
          }
          lead = await createLead(minimalData as any)
        }
        createdLeads.push({ id: lead.id, data: leadData })

        // P1+P2 — Activity inicial (criada sempre que CNPJ foi tentado; marca enrichment status)
        if (lead.id && initialStatus === 'Contactado') {
          const enrichmentTag = assertivaData
            ? 'CNPJá + Assertiva'
            : cnpjaData
              ? 'CNPJá'
              : 'enrichment pendente'
          const notes = `Upload de lista com enriquecimento automático (${enrichmentTag}). Lead criado diretamente na fase Contactado.`
          const description = buildStageChangeDescription('Novo', 'Contactado', notes, 'upload-manual')
          createActivity({
            leadId: lead.id,
            type: 'status_change',
            description,
            createdBy: 'Upload de Lista',
          }).catch(() => {})
        }

        // P1 — Contact com source + whatsappConfirmed (alinhado com handleSpecificSearch)
        if (lead.id && decisorName) {
          createContact({
            name: decisorName,
            role: decisorRole || 'Decisor',
            contactType: 'decisor',
            whatsapp: bestWhatsapp || '',
            phone: bestPhone || '',
            email: company.email || cnpjaData?.rfEmail || '',
            leadId: lead.id,
            ...(assertivaData ? { source: 'assertiva', whatsappConfirmed: !!bestWhatsapp } : cnpjaData ? { source: 'cnpja' } : { source: 'upload_manual' }),
          } as any).catch(() => {})
        }
      } catch {
        errors++
      }
      done++
      setFileImportProgress(Math.round((done / companies.length) * 100))
    }

    // Feedback consolidado: criados + duplicados pulados + erros
    const summaryParts: string[] = []
    if (createdLeads.length > 0) summaryParts.push(`${createdLeads.length} criado${createdLeads.length !== 1 ? 's' : ''}`)
    if (duplicates > 0) summaryParts.push(`${duplicates} duplicado${duplicates !== 1 ? 's' : ''} ignorado${duplicates !== 1 ? 's' : ''}`)
    if (errors > 0) summaryParts.push(`${errors} erro${errors !== 1 ? 's' : ''}`)
    const summary = summaryParts.join(' · ') || 'Nenhum lead processado'

    if (createdLeads.length > 0) {
      toast.success(`${summary}. Enriquecimento complementar em andamento.`)
      massEnrichment.enrichAll(createdLeads.map(l => ({ id: l.id, companyName: (l.data as any).companyName } as any)))
      setTimeout(() => massEnrichmentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500)
    } else if (duplicates > 0) {
      toast.info(summary)
    } else {
      toast.error(summary)
    }

    setFileImporting(false)
    resetFileUpload()
  }

  // --- Reset form ---
  const resetSpecificForm = () => {
    setSpecificName(''); setSpecificCnpj(''); setSpecificPhone(''); setSpecificEmail('')
    setSpecificWebsite(''); setSpecificInstagram(''); setSpecificLinkedin(''); setSpecificFacebook('')
    setSpecificSegment(''); setSpecificCity(''); setSpecificState(''); setSpecificAddress('')
    setSpecificRevenue(''); setSpecificContact(''); setSpecificContactRole('')
    enrichment.reset()
  }

  const inputClass = 'h-11 w-full rounded-xl bg-elevated-1 border border-border text-sm text-text-primary px-4 placeholder:text-text-muted focus:border-red/30 focus:outline-none focus:ring-1 focus:ring-red/20 transition-colors'

  const handleSpecificSearch = async () => {
    if (!specificName) { toast.error('Nome da empresa é obrigatório'); return }
    const cnpjClean = specificCnpj.replace(/\D/g, '')
    if (cnpjClean.length !== 14) { toast.error('CNPJ obrigatório. Preencha os 14 dígitos para ativar o enriquecimento CNPJá e Assertiva.'); return }
    setIsCreatingSpecific(true)
    try {

      // === FASE 1: Se tem CNPJ, enriquecer via CNPJa + Assertiva PRIMEIRO ===
      let cnpjaData: any = null
      let assertivaData: any = null
      let decisorName = specificContact || ''
      let decisorRole = specificContactRole || ''
      let bestWhatsapp = ''
      let bestPhone = ''

      if (cnpjClean.length === 14) {
        toast.info('Buscando dados via CNPJa...')

        // CNPJa: dados cadastrais + sócios + telefones
        try {
          const { searchOffice } = await import('../services/cnpjaService')
          const { mapCnpjaToLead, extractPartners } = await import('../services/cnpjaService')
          const office = await searchOffice(cnpjClean)
          cnpjaData = mapCnpjaToLead(office)

          // Extrair decisor do QSA se não informado manualmente
          if (!decisorName) {
            const partners = extractPartners(office)
            const decisor = partners.find(p =>
              p.qualification.toLowerCase().includes('administrador') ||
              p.qualification.toLowerCase().includes('diretor') ||
              p.qualification.toLowerCase().includes('presidente')
            ) || partners[0]
            if (decisor) {
              decisorName = decisor.name
              decisorRole = decisor.qualification
            }
          }

          // Telefones do CNPJa
          const mobile = office.phones?.find((p: any) => p.type === 'MOBILE')
          const anyPhone = office.phones?.[0]
          if (mobile) bestWhatsapp = `55${mobile.area}${mobile.number}`
          if (anyPhone) bestPhone = `55${anyPhone.area}${anyPhone.number}`

          toast.success('CNPJa: dados cadastrais obtidos')
        } catch (cnpjaErr) {
          console.warn('CNPJa falhou para cadastro manual:', cnpjaErr)
        }

        // Assertiva: WhatsApp validado do decisor
        try {
          const { lookupCnpj } = await import('../services/assertivaService')
          assertivaData = await lookupCnpj(cnpjClean)

          // WhatsApp da Assertiva tem PRIORIDADE
          const moveis = assertivaData?.telefones?.filter((t: any) => t.tipo === 'celular') || []
          for (const t of moveis) {
            if (t.whatsapp && t.numero) { bestWhatsapp = t.numero.startsWith('55') ? t.numero : `55${t.numero}`; break }
          }
          if (!bestWhatsapp) {
            for (const t of moveis) {
              if (t.numero) { bestWhatsapp = t.numero.startsWith('55') ? t.numero : `55${t.numero}`; break }
            }
          }

          // Decisor da Assertiva se ainda não tem
          if (!decisorName && assertivaData?.socios?.length) {
            const s = assertivaData.socios.find((s: any) =>
              (s.qualificacao || '').toLowerCase().includes('administrador') ||
              (s.qualificacao || '').toLowerCase().includes('diretor')
            ) || assertivaData.socios[0]
            if (s?.nome) { decisorName = s.nome; decisorRole = s.qualificacao || 'Sócio' }
          }

          toast.success('Assertiva: telefones validados')
        } catch (assertivaErr) {
          console.warn('Assertiva falhou para cadastro manual:', assertivaErr)
        }
      }

      // Format WhatsApp from manual input (se não veio do CNPJa/Assertiva)
      if (!bestWhatsapp && specificPhone) {
        const digits = specificPhone.replace(/\D/g, '').replace(/^0+/, '')
        bestWhatsapp = digits.length >= 10 ? (digits.startsWith('55') ? digits : '55' + digits) : ''
      }

      // Estimate revenue
      const revenue = specificRevenue ? parseInt(specificRevenue) : undefined
      const tier = !revenue ? (cnpjaData?.tier || 'Small') : revenue >= 830000 ? 'Medium=' : revenue >= 200000 ? 'Medium-' : revenue >= 100000 ? 'Small' : 'Micro+'

      // Build lead data — merge manual + CNPJa + Assertiva
      // Nome real do CNPJa tem PRIORIDADE sobre nome digitado manualmente
      const realCompanyName = cnpjaData?.companyName || specificName
      const tradeName = cnpjaData?.tradeName || ''

      // Calcular SPICED com todos os dados disponiveis (manual + CNPJa + Assertiva)
      const spicedInput: Record<string, any> = {
        cnpj: cnpjClean,
        capitalSocial: cnpjaData?.capitalSocial,
        foundingDate: cnpjaData?.foundingDate,
        city: specificCity || cnpjaData?.city,
        state: specificState || cnpjaData?.state,
        rfEmail: cnpjaData?.rfEmail,
        rfPhone: cnpjaData?.rfPhone,
        website: specificWebsite || cnpjaData?.website,
        instagram: specificInstagram,
        linkedin: specificLinkedin,
        employees: cnpjaData?.employees || (revenue && revenue >= 120000 ? 8 : 5),
        monthlyRevenue: revenue,
        partners: decisorName ? JSON.stringify([{ nome_socio: decisorName }]) : undefined,
        assertivaWhatsappFlag: assertivaData?.assertivaWhatsappFlag,
        assertivaIncomeEstimate: assertivaData?.assertivaIncomeEstimate,
        registrationStatus: cnpjaData?.registrationStatus,
        isHeadquarters: cnpjaData?.isHeadquarters,
        simplesOptant: cnpjaData?.simplesOptant,
        taxRegime: cnpjaData?.taxRegime,
      }
      const spiced = calculateSpicedDimensions(spicedInput)
      const spicedScore = calculateSpicedScore(spiced.spicedS, spiced.spicedP, spiced.spicedI, spiced.spicedC, spiced.spicedD)

      const leadData: Record<string, any> = {
        companyName: realCompanyName,
        ...(tradeName && { tradeName }),
        cnpj: cnpjClean,
        segment: specificSegment || cnpjaData?.segment || 'Varejo',
        tier,
        ...(revenue && { monthlyRevenue: revenue }),
        ...(cnpjaData?.capitalSocial && { capitalSocial: cnpjaData.capitalSocial }),
        employees: cnpjaData?.employees || (revenue && revenue >= 120000 ? 8 : 5),
        yearsInMarket: cnpjaData?.yearsInMarket || (revenue && revenue >= 120000 ? 7 : 5),
        status: 'Contactado',
        sourceHtmlReport: 'cadastro_manual',
        score: spicedScore,
        temperature: getTemperatureFromScore(spicedScore),
        spicedS: spiced.spicedS,
        spicedP: spiced.spicedP,
        spicedI: spiced.spicedI,
        spicedC: spiced.spicedC,
        spicedD: spiced.spicedD,
        ...(specificWebsite || cnpjaData?.website ? { website: specificWebsite || cnpjaData?.website } : {}),
        ...(specificInstagram && { instagram: specificInstagram }),
        ...(specificLinkedin && { linkedin: specificLinkedin }),
        ...(specificFacebook && { facebook: specificFacebook }),
        ...(specificAddress || cnpjaData?.address ? { address: specificAddress || cnpjaData?.address } : {}),
        ...(specificCity || cnpjaData?.city ? { city: specificCity || cnpjaData?.city } : {}),
        ...(specificState || cnpjaData?.state ? { state: specificState || cnpjaData?.state } : {}),
        ...(cnpjaData?.zipCode && { zipCode: cnpjaData.zipCode }),
        ...(cnpjaData?.district && { district: cnpjaData.district }),
        ...(cnpjaData?.legalNature && { legalNature: cnpjaData.legalNature }),
        ...(cnpjaData?.registrationStatus && { registrationStatus: cnpjaData.registrationStatus }),
        ...(cnpjaData?.foundingDate && { foundingDate: cnpjaData.foundingDate }),
        ...(cnpjaData?.cnaePrimary && { cnaePrimary: cnpjaData.cnaePrimary }),
        ...(cnpjaData?.rfPhone && { rfPhone: cnpjaData.rfPhone }),
        ...(cnpjaData?.rfEmail && { rfEmail: cnpjaData.rfEmail }),
        ...(decisorName && { partners: JSON.stringify([{ nome_socio: decisorName, qualificacao_socio: decisorRole }]) }),
        enrichmentStatus: assertivaData ? 'assertiva' : cnpjaData ? 'cnpja' : 'none',
      }

      // 1. Verificar duplicados
      if (cnpjClean) {
        const existingByCnpj = await getLeads(`{cnpj} = "${cnpjClean}"`)
        if (existingByCnpj.length > 0 && !dupOverride) {
          setDupWarning(`Já existe um lead com este CNPJ: "${existingByCnpj[0].companyName}". Clique novamente para criar mesmo assim.`)
          setDupOverride(true)
          setIsCreatingSpecific(false)
          return
        }
      }
      {
        const existingByName = await getLeads(`{companyName} = "${specificName.replace(/"/g, '\\"')}"`)
        if (existingByName.length > 0 && !dupOverride) {
          setDupWarning(`Já existe um lead "${existingByName[0].companyName}". Clique novamente para criar mesmo assim.`)
          setDupOverride(true)
          setIsCreatingSpecific(false)
          return
        }
      }
      setDupOverride(false)
      setDupWarning(null)

      // 2. Salvar lead no Supabase
      let lead: any
      try {
        lead = await createLead(leadData as any)
      } catch {
        const minimalData = { companyName: realCompanyName, cnpj: cnpjClean, score: spicedScore, temperature: getTemperatureFromScore(spicedScore), spicedS: spiced.spicedS, spicedP: spiced.spicedP, spicedI: spiced.spicedI, spicedC: spiced.spicedC, spicedD: spiced.spicedD }
        lead = await createLead(minimalData as any)
        toast.warning('Salvo com dados básicos. Alguns campos extras não foram aceitos.')
      }
      setLastCreatedLead({ id: lead.id, data: leadData })

      // 2.05. Dispara o deep-enrichment (sócios/decisores) em realtime. O worker (W3-08)
      // processa em segundo plano (~30s) e, ao final, ENCADEIA automaticamente o
      // social-enrich (Google Meu Negócio + Instagram + LinkedIn). Tudo na mesma cadeia.
      if (lead.id) {
        requestEnrichment(lead.id, 'realtime')
          .then((r) => {
            if (r.ok) {
              toast.info('Enriquecimento iniciado. Sócios e presença digital aparecem na ficha em instantes.')
            } else {
              console.warn('Falha ao enfileirar enriquecimento:', r.error)
            }
          })
          .catch(() => {})
      }

      // 2.1. Registrar transição inicial no Histórico das Fases (Novo → Contactado)
      if (lead.id) {
        const enrichmentTag = assertivaData
          ? 'CNPJá + Assertiva'
          : cnpjaData
            ? 'CNPJá'
            : 'parcial'
        const notes = `Cadastro manual com enriquecimento automático (${enrichmentTag}). Lead criado diretamente na fase Contactado.`
        const description = buildStageChangeDescription('Novo', 'Contactado', notes, 'cadastro-manual')
        createActivity({
          leadId: lead.id,
          type: 'status_change',
          description,
          createdBy: 'Cadastro Manual',
        }).catch(() => {})
      }

      // 3. Criar Contact vinculado OBRIGATORIAMENTE (decisor + telefone)
      // P2 — source preciso conforme origem do decisor (simetria com upload-manual)
      if (lead.id && decisorName) {
        createContact({
          name: decisorName,
          role: decisorRole || 'Decisor',
          contactType: 'decisor',
          whatsapp: bestWhatsapp || '',
          phone: bestPhone || '',
          email: specificEmail || cnpjaData?.rfEmail || '',
          leadId: lead.id,
          ...(assertivaData
            ? { source: 'assertiva', whatsappConfirmed: !!bestWhatsapp }
            : cnpjaData
              ? { source: 'cnpja' }
              : { source: 'cadastro_manual' }),
        } as any).catch(() => {})
      }

      const hasWa = !!bestWhatsapp
      toast.success(
        decisorName && hasWa
          ? `${realCompanyName} salvo com decisor + WhatsApp!`
          : decisorName
            ? `${realCompanyName} salvo com decisor (sem WhatsApp celular)`
            : `${realCompanyName} salvo. Adicione o decisor manualmente.`
      )

      // 4. Trigger enrichment adicional se NÃO teve CNPJa
      if (!cnpjaData) {
        enrichment.enrich(lead.id, leadData)
        setTimeout(() => {
          enrichmentProgressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 300)
      }
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível salvar o lead. Tente novamente.')
    } finally {
      setIsCreatingSpecific(false)
    }
  }

  return (
    <div className="space-y-6">
      <AnimateIn>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading gradient-text">Prospecção</h1>
          <p className="text-xs text-text-muted mt-0.5">Busca por segmento ou cadastro manual de um prospect específico. Cada lead chega enriquecido com telefone e decisor automaticamente.</p>
        </div>
        {/* Mode toggle — 2 opcoes: Pesquisa em Massa (CNPJa) + Cadastro Manual */}
        <div className="flex rounded-xl p-1 bg-elevated-1 border border-border gap-1">
          <button
            onClick={() => setSearchMode('pesca')}
            className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer', searchMode === 'pesca' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary hover:bg-elevated-1')}
          >
            <Search className="h-3.5 w-3.5" />
            <div className="text-left">
              <span className="block leading-tight">Pesquisa em massa</span>
              <span className={cn('block text-caption font-normal leading-tight', searchMode === 'pesca' ? 'text-white/70' : 'text-text-muted')}>Busca por segmento</span>
            </div>
          </button>
          <button
            onClick={() => setSearchMode('specific')}
            className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer', searchMode === 'specific' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-muted hover:text-text-secondary hover:bg-elevated-1')}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <div className="text-left">
              <span className="block leading-tight">Cadastro manual</span>
              <span className={cn('block text-caption font-normal leading-tight', searchMode === 'specific' ? 'text-white/70' : 'text-text-muted')}>Lead especifico</span>
            </div>
          </button>
        </div>
      </div>
      </AnimateIn>

      <SectionDivider />

      {/* PESCA panel */}
      {searchMode === 'pesca' && <AnimateIn delay={80}><PescaPanel /></AnimateIn>}

      {/* Specific lead form */}
      {searchMode === 'specific' && (
        <Card>
          {/* ===== HERO SECTION ===== */}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-red/10 border border-red/20">
              <UserPlus className="h-5 w-5 text-red" />
            </div>
            <div>
              <CardTitle>Cadastrar prospect</CardTitle>
              <p className="text-xs text-text-muted mt-0.5">CNPJ e nome são obrigatórios. O enriquecimento de dados e contato roda automaticamente.</p>
            </div>
          </div>

          {/* Disclaimer explicativo — cadastro manual com enriquecimento automático */}
          <div className="mt-4 p-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.04]">
            <div className="flex items-start gap-3">
              <div className="shrink-0 p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-200 uppercase tracking-wide mb-1.5">Cadastro manual com enriquecimento completo</p>
                <p className="text-[13px] leading-relaxed text-text-secondary">
                  Ao cadastrar, o lead é <strong className="text-text-primary">enriquecido automaticamente via CNPJá + Assertiva</strong> (dados cadastrais, sócios, telefones, emails, redes sociais, SPICED). Em seguida, cai direto na fase <strong className="text-red">Contactado</strong> do pipeline, com a marcação <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-200 text-[10px] uppercase font-semibold tracking-wide">Manual</span> na ficha para manter auditoria da origem.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-5">
            {/* Name field — large, prominent */}
            <div>
              <label htmlFor="specific-name" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Nome da empresa *</label>
              <input id="specific-name" type="text" value={specificName} onChange={(e) => setSpecificName(e.target.value)} placeholder="Ex: Clinica Odonto Premium" className={cn(inputClass, 'h-12 bg-elevated-2 border-red/30 text-base')} />
            </div>

            {/* CNPJ field — optional when file is uploaded */}
            <div>
              <label htmlFor="specific-cnpj" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 flex items-center gap-1.5">
                <Hash className="h-3 w-3" /> CNPJ *
                <span className="ml-1 text-[10px] normal-case font-normal tracking-normal text-text-muted">(obrigatório para enriquecimento)</span>
              </label>
              <input id="specific-cnpj" type="text" value={specificCnpj} onChange={(e) => setSpecificCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" className={cn(inputClass, 'h-12 bg-elevated-2 border-red/30 text-base font-mono')} />
            </div>

            {/* Dynamic enrichment preview pills */}
            {specificName && (specificCnpj.replace(/\D/g, '').length >= 2 || specificName.length >= 3) && (
              <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/10">
                <p className="text-label text-amber-300 font-medium flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="h-3 w-3" /> {specificCnpj ? 'Com nome + CNPJ buscamos automaticamente:' : 'Com o nome buscamos automaticamente:'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Razão social', 'Sócios', 'Endereço', 'Porte', 'Capital social', 'Regime tributário', 'CNAE', 'Geolocalização', 'Google Maps', 'Website', 'Redes sociais', 'Instagram', 'LinkedIn', 'Decisores', 'Emails', 'Telefones'].map((pill) => (
                    <span key={pill} className="inline-flex items-center gap-1 text-caption text-amber-300/80 bg-amber-400/5 border border-amber-400/15 rounded-lg px-2 py-0.5">
                      <Sparkles className="h-2.5 w-2.5 text-amber-400/60" />
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Segment field (optional, standalone) */}
            <div>
              <label htmlFor="specific-segment" className="text-xs uppercase tracking-[0.1em] text-text-muted font-medium mb-2 block">Segmento <span className="text-text-muted font-normal">(opcional)</span></label>
              <input id="specific-segment" type="text" value={specificSegment} onChange={(e) => setSpecificSegment(e.target.value)} placeholder="Ex: Odontologia, Pet Shop, Estética" className={inputClass} list="segments-list" />
              <datalist id="segments-list">
                {RECOMMENDED_SEGMENTS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          {/* ===== FILE UPLOAD ZONE ===== */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-caption uppercase tracking-[0.15em] text-text-muted font-medium px-2">ou importe uma lista</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {fileReadingStep === 'idle' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setFileDragging(true) }}
                onDragLeave={() => setFileDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef2.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300',
                  fileDragging
                    ? 'border-red bg-red/5 scale-[1.01]'
                    : 'border-border/60 hover:border-red/30 hover:bg-elevated-1',
                )}
              >
                <Upload className={cn('h-6 w-6 mb-2 transition-colors', fileDragging ? 'text-red' : 'text-text-muted')} />
                <p className="text-sm font-medium text-text-primary">
                  {fileDragging ? 'Solte o arquivo aqui' : 'Enviar documento'}
                </p>
                <p className="text-label text-text-muted mt-0.5">
                  CSV, Excel, Word, PDF, TXT, MD. Sem limite de leads por envio
                </p>
                <input
                  ref={fileInputRef2}
                  type="file"
                  accept={ACCEPTED_FORMATS}
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
                />
              </div>
            )}

            {/* Reading animation */}
            {fileReadingStep === 'reading' && (
              <div className="p-6 rounded-2xl bg-elevated-1 border border-border text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-red/10 animate-pulse">
                    <FileUp className="h-5 w-5 text-red" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">{fileParseResult?.fileName || 'Processando...'}</p>
                    <p className="text-label text-amber-300 animate-pulse">Analisando estrutura e identificando leads...</p>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-elevated-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red to-amber-400 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                </div>
              </div>
            )}

            {/* Preview parsed leads */}
            {fileReadingStep === 'preview' && fileParseResult && (
              <div className="rounded-2xl bg-elevated-1 border border-border overflow-hidden animate-[fade-in_0.3s_ease-out]">
                {/* File info header */}
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{fileParseResult.fileName}</p>
                    <p className="text-label text-success">
                      {fileParseResult.fileType} · {fileParseResult.companies.length} leads identificados
                    </p>
                  </div>
                  <button onClick={resetFileUpload} className="p-2 rounded-xl hover:bg-elevated-2 text-text-muted hover:text-error transition-colors cursor-pointer" title="Remover arquivo">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Detected fields badges */}
                <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                  {['companyName', 'cnpj', 'phone', 'email', 'website', 'city', 'segment', 'contactName'].map((key) => {
                    const found = fileParseResult.companies.some((c: any) => c[key])
                    const labels: Record<string, string> = { companyName: 'Empresa', cnpj: 'CNPJ', phone: 'Telefone', email: 'E-mail', website: 'Website', city: 'Cidade', segment: 'Segmento', contactName: 'Contato' }
                    return (
                      <span key={key} className={cn(
                        'text-caption px-2 py-0.5 rounded-lg border',
                        found ? 'text-success bg-success/8 border-success/15 font-medium' : 'text-text-muted bg-elevated-1 border-border/50 opacity-40',
                      )}>
                        {found ? '✓' : '·'} {labels[key]}
                      </span>
                    )
                  })}
                </div>

                {/* Lead list with checkboxes */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-label text-text-muted">{fileSelected.size} de {fileParseResult.companies.length} selecionados</span>
                    <div className="flex gap-2">
                      <button onClick={() => setFileSelected(new Set(fileParseResult.companies.map((_, i) => i)))} className="text-label text-red cursor-pointer hover:underline">Todos</button>
                      <button onClick={() => setFileSelected(new Set())} className="text-label text-text-muted cursor-pointer hover:underline">Nenhum</button>
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-1 rounded-xl">
                    {fileParseResult.companies.map((company, i) => (
                      <label
                        key={i}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200',
                          fileSelected.has(i) ? 'bg-red/5 border border-red/15' : 'hover:bg-elevated-1 border border-transparent',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={fileSelected.has(i)}
                          onChange={() => { const next = new Set(fileSelected); next.has(i) ? next.delete(i) : next.add(i); setFileSelected(next) }}
                          className="accent-red w-3.5 h-3.5 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-text-primary truncate">{company.companyName}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {company.cnpj && <span className="text-micro text-text-muted bg-elevated-2 px-1.5 py-0.5 rounded font-mono">{company.cnpj}</span>}
                            {company.phone && <span className="text-micro text-text-muted bg-elevated-2 px-1.5 py-0.5 rounded">{company.phone}</span>}
                            {company.email && <span className="text-micro text-text-muted bg-elevated-2 px-1.5 py-0.5 rounded truncate max-w-[120px]">{company.email}</span>}
                            {company.city && <span className="text-micro text-text-muted bg-elevated-2 px-1.5 py-0.5 rounded">{company.city}</span>}
                            {company.segment && <span className="text-micro text-text-muted bg-elevated-2 px-1.5 py-0.5 rounded">{company.segment}</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Import CTA */}
                <div className="px-4 pb-4">
                  {fileImporting ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 text-red animate-spin" />
                        <span className="text-text-primary font-medium">Importando e enriquecendo...</span>
                        <span className="text-label text-text-muted ml-auto font-mono">{fileImportProgress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-elevated-2 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-dark to-red transition-all duration-300" style={{ width: `${fileImportProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full"
                      icon={<Sparkles className="h-4 w-4" />}
                      onClick={() => setFileConfirmOpen(true)}
                      disabled={fileSelected.size === 0}
                    >
                      Revisar {fileSelected.size} lead{fileSelected.size !== 1 ? 's' : ''} e enriquecer com IA
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ===== CTA SECTION ===== */}
          <div className="mt-6">
            {dupWarning && (
              <div className="mb-4 p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-label text-amber-300 font-medium">{dupWarning}</p>
                  <button onClick={() => { setDupWarning(null); setDupOverride(false) }} className="text-label text-text-muted hover:text-text-secondary mt-1 cursor-pointer">Cancelar</button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button size="lg" icon={<Sparkles className="h-4 w-4" />} onClick={handleSpecificSearch} loading={isCreatingSpecific} disabled={!specificName || specificCnpj.replace(/\D/g, '').length !== 14 || isCreatingSpecific || enrichment.isEnriching}>
                Salvar e enriquecer com IA
              </Button>
              {enrichment.isEnriching && <span className="text-label text-amber-400 animate-pulse">Enriquecendo...</span>}
            </div>
            {/* CNPJ validation indicator */}
            <div className="mt-2">
              {specificCnpj && specificCnpj.replace(/\D/g, '').length < 14 && (
                <p className="text-label text-text-muted">CNPJ incompleto ({specificCnpj.replace(/\D/g, '').length}/14 dígitos)</p>
              )}
              {specificCnpj.replace(/\D/g, '').length === 14 && (
                <p className="text-label text-success flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> CNPJ válido. Pronto para enriquecer
                </p>
              )}
            </div>
          </div>

          {/* ===== ENRICHMENT PROGRESS — TWO-PHASE VISUAL ===== */}
          {enrichment.progress && enrichment.progress.steps.length > 0 && (
            <div ref={enrichmentProgressRef} className="mt-6 p-4 rounded-xl bg-elevated-1 border border-border">
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-elevated-2 overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-red to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${(enrichment.progress.currentStep / enrichment.progress.totalSteps) * 100}%` }}
                />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-label uppercase tracking-[0.12em] text-amber-300 font-semibold">
                  Enriquecimento {enrichment.progress.isDone ? 'concluído' : 'em andamento'}
                </p>
                <span className="text-caption text-text-muted ml-auto font-mono">
                  {enrichment.progress.currentStep}/{enrichment.progress.totalSteps}
                </span>
              </div>

              {/* FASE 1: APIs Públicas */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-3 w-3 text-text-muted" />
                  <p className="text-caption uppercase tracking-[0.12em] text-text-muted font-semibold">Fase 1: APIs Públicas (gratuitas)</p>
                </div>
                <div className="space-y-1 pl-1">
                  {enrichment.progress.steps.slice(0, 4).map((step) => (
                    <div key={step.source} className="flex items-center gap-2 text-label">
                      {step.status === 'running' && <Loader2 className="h-3 w-3 text-amber-400 animate-spin shrink-0" />}
                      {step.status === 'done' && <CheckCircle className="h-3 w-3 text-success shrink-0" />}
                      {step.status === 'error' && <AlertCircle className="h-3 w-3 text-error shrink-0" />}
                      {step.status === 'skipped' && <X className="h-3 w-3 text-text-muted shrink-0" />}
                      {step.status === 'pending' && <div className="h-3 w-3 rounded-full border border-border shrink-0" />}
                      <span className={cn(
                        step.status === 'running' && 'text-amber-300',
                        step.status === 'done' && 'text-text-primary',
                        step.status === 'error' && 'text-error',
                        step.status === 'skipped' && 'text-text-muted line-through',
                        step.status === 'pending' && 'text-text-muted',
                      )}>
                        {step.label}
                      </span>
                      {(step.status === 'pending' || step.status === 'running') && step.estimatedMs && (
                        <span className="text-micro text-text-muted ml-auto">~{Math.round(step.estimatedMs / 1000)}s</span>
                      )}
                      {step.status === 'done' && step.detail && (
                        <span className="text-micro text-amber-300/70 bg-amber-400/5 border border-amber-400/10 rounded px-1.5 py-0.5 ml-auto">{step.detail}</span>
                      )}
                      {step.status === 'skipped' && <span className="text-micro text-text-muted">(sem dados)</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-3" />

              {/* FASE 2: Inteligência de Mercado */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3 w-3 text-text-muted" />
                  <p className="text-caption uppercase tracking-[0.12em] text-text-muted font-semibold">Fase 2: Inteligência de Mercado (APIs externas)</p>
                </div>
                <div className="space-y-1 pl-1">
                  {enrichment.progress.steps.slice(4).map((step) => (
                    <div key={step.source} className="flex items-center gap-2 text-label">
                      {step.status === 'running' && <Loader2 className="h-3 w-3 text-amber-400 animate-spin shrink-0" />}
                      {step.status === 'done' && <CheckCircle className="h-3 w-3 text-success shrink-0" />}
                      {step.status === 'error' && <AlertCircle className="h-3 w-3 text-error shrink-0" />}
                      {step.status === 'skipped' && <X className="h-3 w-3 text-text-muted shrink-0" />}
                      {step.status === 'pending' && <div className="h-3 w-3 rounded-full border border-border shrink-0" />}
                      <span className={cn(
                        step.status === 'running' && 'text-amber-300',
                        step.status === 'done' && 'text-text-primary',
                        step.status === 'error' && 'text-error',
                        step.status === 'skipped' && 'text-text-muted line-through',
                        step.status === 'pending' && 'text-text-muted',
                      )}>
                        {step.label}
                      </span>
                      {(step.status === 'pending' || step.status === 'running') && step.estimatedMs && (
                        <span className="text-micro text-text-muted ml-auto">~{Math.round(step.estimatedMs / 1000)}s</span>
                      )}
                      {step.status === 'done' && step.detail && (
                        <span className="text-micro text-amber-300/70 bg-amber-400/5 border border-amber-400/10 rounded px-1.5 py-0.5 ml-auto">{step.detail}</span>
                      )}
                      {step.status === 'skipped' && <span className="text-micro text-text-muted">(sem dados)</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== COMPLETION STATE ===== */}
              {enrichment.progress.isDone && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-[12px] text-success font-semibold">Lead enriquecido com sucesso!</span>
                    </div>
                    <div className="space-y-1 text-label text-text-secondary">
                      <p>Dados encontrados: <strong className="text-text-primary">{enrichment.progress.steps.filter(s => s.status === 'done').length} de {enrichment.progress.totalSteps} fontes</strong></p>
                      <p>Contatos descobertos: <strong className="text-text-primary">{enrichment.progress.steps.filter(s => s.status === 'done' && s.detail?.toLowerCase().includes('contato')).length > 0 ? 'Sim' : 'Verificar no lead'}</strong></p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="ghost" size="sm" onClick={resetSpecificForm}>
                        Novo lead
                      </Button>
                      {lastCreatedLead && (
                        <Button variant="ghost" size="sm" onClick={() => {
                          enrichment.reset()
                          enrichment.enrich(lastCreatedLead.id, lastCreatedLead.data)
                          setTimeout(() => enrichmentProgressRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
                        }}>
                          Re-enriquecer
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => { enrichment.reset(); window.location.hash = lastCreatedLead ? `#/leads/${lastCreatedLead.id}` : '#/leads' }}>
                        Ver lead completo <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Resume pending enrichment banner */}
      {pendingResume && !massEnrichment.isRunning && massEnrichment.totalLeads === 0 && (
        <Card className="animate-[fade-in_0.3s_ease-out]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">Enriquecimento pendente</p>
              <p className="text-xs text-text-muted">{pendingResume.length} lead{pendingResume.length > 1 ? 's' : ''} aguardando enriquecimento ({pendingResume.map(p => p.companyName).slice(0, 3).join(', ')}{pendingResume.length > 3 ? '...' : ''})</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { clearPendingQueue(); setPendingResume(null) }}>
                Descartar
              </Button>
              <Button size="sm" onClick={() => { setPendingResume(null); massEnrichment.resumeFromStorage() }}>
                Retomar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Mass enrichment progress */}
      {massEnrichment.totalLeads > 0 && (
        <Card className="animate-[fade-in_0.4s_ease-out]">
          <div ref={massEnrichmentRef}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20">
                <Sparkles className="h-5 w-5 text-amber-400" />
                {massEnrichment.isRunning && <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 animate-pulse" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {massEnrichment.isRunning ? 'Enriquecendo leads com IA...' : 'Enriquecimento concluído'}
                </p>
                <p className="text-xs text-text-muted">
                  {massEnrichment.completedLeads} de {massEnrichment.totalLeads} leads processados
                  {massEnrichment.failedLeads > 0 && ` (${massEnrichment.failedLeads} com erro)`}
                  {massEnrichment.isRunning && (
                    <span className="text-amber-300 ml-1">
                      {massEnrichment.etaSeconds > 0
                        ? `· ~${massEnrichment.etaSeconds >= 60 ? `${Math.round(massEnrichment.etaSeconds / 60)} min` : `${massEnrichment.etaSeconds}s`} restantes`
                        : `· ~${Math.round((massEnrichment.totalLeads * 90) / 2 / 60)} min estimados`
                      }
                    </span>
                  )}
                </p>
              </div>
              {massEnrichment.isRunning && (
                <Button variant="ghost" size="sm" onClick={massEnrichment.abort} className="ml-auto">
                  Parar
                </Button>
              )}
              {!massEnrichment.isRunning && (
                <Button variant="ghost" size="sm" onClick={() => massEnrichment.reset()} className="ml-auto">
                  Nova pesquisa
                </Button>
              )}
            </div>

            {/* Global progress bar */}
            <div className="h-1.5 w-full rounded-full bg-elevated-2 overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-success rounded-full transition-all duration-500"
                style={{ width: `${(massEnrichment.completedLeads / massEnrichment.totalLeads) * 100}%` }}
              />
            </div>

            {/* Lead-by-lead progress (smart collapse) */}
            {(() => {
              const active = massEnrichment.queue.filter((q) => q.status === 'enriching')
              const done = massEnrichment.queue.filter((q) => q.status === 'done')
              const errored = massEnrichment.queue.filter((q) => q.status === 'error')
              const queued = massEnrichment.queue.filter((q) => q.status === 'queued')
              return (
                <div className="space-y-2">
                  {/* Completed summary (collapsed) */}
                  {done.length > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success/5 border border-success/20">
                      <CheckCircle className="h-4 w-4 text-success shrink-0" />
                      <span className="text-xs text-success font-medium">{done.length} lead{done.length > 1 ? 's' : ''} enriquecido{done.length > 1 ? 's' : ''}</span>
                      <span className="text-caption text-success/60 ml-auto">{done.reduce((a, q) => a + q.sourcesFound, 0)} fontes</span>
                    </div>
                  )}

                  {/* Error summary (collapsed) */}
                  {errored.length > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-error/5 border border-error/20">
                      <AlertCircle className="h-4 w-4 text-error shrink-0" />
                      <span className="text-xs text-error font-medium">{errored.length} com erro</span>
                      <span className="text-caption text-error/60 ml-auto truncate max-w-[200px]">{errored[0]?.error}</span>
                    </div>
                  )}

                  {/* Active leads (expanded with full detail) */}
                  {active.map((lead) => (
                    <div key={lead.leadId} className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 animate-[fade-in_0.3s_ease-out]">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-4 w-4 text-amber-400 animate-spin shrink-0" />
                        <p className="text-xs font-medium text-amber-300 truncate flex-1">{lead.companyName}</p>
                        <span className="text-caption text-text-muted font-mono">{massEnrichment.completedLeads + active.indexOf(lead) + 1}/{massEnrichment.totalLeads}</span>
                      </div>
                      {lead.progress && (
                        <>
                          <div className="flex items-center gap-1 mb-1.5">
                            {lead.progress.steps.map((step) => (
                              <div
                                key={step.source}
                                title={step.label}
                                className={cn(
                                  'h-2 flex-1 rounded-full transition-all duration-300',
                                  step.status === 'done' && 'bg-success',
                                  step.status === 'running' && 'bg-amber-400 animate-pulse',
                                  step.status === 'error' && 'bg-error',
                                  step.status === 'skipped' && 'bg-elevated-3',
                                  step.status === 'pending' && 'bg-elevated-2',
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-caption text-text-muted">
                            {lead.progress.steps.find((s) => s.status === 'running')?.label || 'Processando...'}
                          </p>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Queued summary (collapsed) */}
                  {queued.length > 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-elevated-1 border border-border">
                      <div className="h-4 w-4 rounded-full border border-border shrink-0 flex items-center justify-center">
                        <span className="text-[8px] text-text-muted font-mono">{queued.length}</span>
                      </div>
                      <span className="text-xs text-text-muted">{queued.length} na fila</span>
                      <span className="text-caption text-text-muted ml-auto truncate max-w-[200px]">
                        {queued.slice(0, 3).map((q) => q.companyName).join(', ')}{queued.length > 3 ? '...' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Completion summary */}
            {!massEnrichment.isRunning && massEnrichment.completedLeads > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-center">
                    <p className="text-lg font-bold font-mono text-success">{massEnrichment.completedLeads}</p>
                    <p className="text-caption text-text-muted uppercase tracking-wider">Enriquecidos</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 text-center">
                    <p className="text-lg font-bold font-mono text-amber-400">
                      {massEnrichment.queue.reduce((acc, q) => acc + q.sourcesFound, 0)}
                    </p>
                    <p className="text-caption text-text-muted uppercase tracking-wider">Fontes coletadas</p>
                  </div>
                  <div className="p-3 rounded-xl bg-elevated-1 border border-border text-center">
                    <p className="text-lg font-bold font-mono text-red">
                      {massEnrichment.queue.filter((q) => q.sourcesFound >= 3).length}
                    </p>
                    <p className="text-caption text-text-muted uppercase tracking-wider">Score completo</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-center mt-4">
                  <Button variant="ghost" onClick={() => massEnrichment.reset()}>Nova pesquisa</Button>
                  <Button onClick={() => window.location.hash = '#/leads'}>
                    Ver leads enriquecidos <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ===== FILE IMPORT CONFIRMATION MODAL ===== */}
      {fileConfirmOpen && fileParseResult && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-[fade-in_0.18s_ease-out]"
          onClick={() => setFileConfirmOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-[#0e0e10] border border-border shadow-2xl overflow-hidden animate-[slide-up_0.22s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-2.5 p-4 border-b border-border">
              <div className="p-1.5 rounded-lg bg-red/10 shrink-0">
                <ShieldCheck className="h-4 w-4 text-red" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[13px] font-bold text-text-primary leading-tight">Confirmar dados antes de enriquecer</h2>
                <p className="text-micro text-text-muted mt-1 leading-snug">
                  Revise CNPJ e nome de cada empresa. Ao confirmar, o enriquecimento será disparado em CNPJá + Assertiva.
                </p>
              </div>
              <button
                onClick={() => setFileConfirmOpen(false)}
                className="p-1 rounded-md hover:bg-elevated-2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Stats */}
            {(() => {
              const toConfirm = fileParseResult.companies.filter((_, i) => fileSelected.has(i))
              const withCnpj = toConfirm.filter(c => (c.cnpj || '').replace(/\D/g, '').length === 14).length
              const withoutCnpj = toConfirm.length - withCnpj
              return (
                <>
                  <div className="grid grid-cols-3 gap-2 p-4 border-b border-border">
                    <div className="py-2 px-2.5 rounded-lg bg-elevated-1 border border-border text-center">
                      <p className="text-[15px] font-bold font-mono tabular-nums text-text-primary leading-none">{toConfirm.length}</p>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted mt-1">Para enriquecer</p>
                    </div>
                    <div className="py-2 px-2.5 rounded-lg bg-success/5 border border-success/20 text-center">
                      <p className="text-[15px] font-bold font-mono tabular-nums text-success leading-none">{withCnpj}</p>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted mt-1">Com CNPJ válido</p>
                    </div>
                    <div className={cn(
                      'py-2 px-2.5 rounded-lg border text-center',
                      withoutCnpj > 0 ? 'bg-amber-400/5 border-amber-400/20' : 'bg-elevated-1 border-border',
                    )}>
                      <p className={cn('text-[15px] font-bold font-mono tabular-nums leading-none', withoutCnpj > 0 ? 'text-amber-400' : 'text-text-muted')}>{withoutCnpj}</p>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted mt-1">Sem CNPJ</p>
                    </div>
                  </div>

                  {/* CNPJ + Name list */}
                  <div className="px-4 pt-3 pb-4 border-b border-border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileSearch className="h-3 w-3 text-text-muted" />
                      <span className="text-[9px] uppercase tracking-wider text-text-muted font-medium">CNPJ e Nome da Empresa</span>
                    </div>
                    <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1">
                      {toConfirm.map((c, idx) => {
                        const cnpjDigits = (c.cnpj || '').replace(/\D/g, '')
                        const cnpjValid = cnpjDigits.length === 14
                        const cnpjFmt = cnpjValid
                          ? cnpjDigits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
                          : c.cnpj || '-'
                        return (
                          <div key={idx} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-elevated-1 border border-border/60">
                            <span className="text-[10px] font-mono tabular-nums text-text-muted w-5 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-text-primary truncate leading-tight">{c.companyName}</p>
                              <p className={cn(
                                'text-[10px] mt-0.5 leading-tight',
                                cnpjValid ? 'text-text-muted font-mono tabular-nums truncate' : 'text-amber-400',
                              )}>
                                {cnpjValid ? cnpjFmt : 'Sem CNPJ · busca por razão social'}
                              </p>
                            </div>
                            <span className={cn(
                              'text-[9px] font-semibold px-1.5 py-0.5 rounded leading-none shrink-0',
                              cnpjValid ? 'bg-success/10 text-success' : 'bg-amber-400/10 text-amber-400',
                            )}>
                              {cnpjValid ? 'OK' : 'Sem CNPJ'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="text-[10px] text-text-muted leading-snug flex-1 min-w-0">
                      {withoutCnpj > 0
                        ? `${withoutCnpj} lead${withoutCnpj !== 1 ? 's' : ''} sem CNPJ serão processados pela razão social.`
                        : `Todos os ${withCnpj} leads têm CNPJ válido.`}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => setFileConfirmOpen(false)}>Cancelar</Button>
                      <Button size="sm" icon={<Sparkles className="h-3.5 w-3.5" />} onClick={handleFileImportAndEnrich}>
                        Confirmar e iniciar
                      </Button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
