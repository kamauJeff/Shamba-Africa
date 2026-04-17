import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl, Switch,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLoans, useApplyLoan, useCredit, usePolicies, useCreatePolicy, useThresholds } from '@/hooks/useApi'
import { colors, spacing, radius, shadow } from '@/lib/theme'
import { formatKes, formatDate } from '@/lib/utils'
import { REVENUE_CONFIG } from '@shamba/shared'

type Tab = 'loans' | 'insurance'

const PURPOSES = ['SEEDS','FERTILIZER','PESTICIDES','EQUIPMENT','IRRIGATION','LABOR','STORAGE','OTHER']

function LoanCard({ loan }: { loan: any }) {
  const [exp, setExp] = useState(false)
  const paid = loan.repayments?.filter((r: any) => r.status === 'PAID').length ?? 0
  const total = loan.repayments?.length ?? 0
  const statusColors: Record<string, string> = { PENDING: colors.amber[600], APPROVED: '#2563eb', ACTIVE: colors.shamba[600], CLOSED: colors.gray[500], DEFAULTED: colors.red[600], REJECTED: colors.red[600] }
  const sColor = statusColors[loan.status] ?? colors.gray[500]

  return (
    <View style={[c.card, shadow.sm]}>
      <TouchableOpacity style={c.header} onPress={() => setExp(!exp)} activeOpacity={0.8}>
        <View style={[c.icon, { backgroundColor: sColor + '18' }]}>
          <Ionicons name="cash" size={20} color={sColor} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={c.amount}>{formatKes(loan.principalKes)}</Text>
            <View style={[c.badge, { backgroundColor: sColor + '18' }]}>
              <Text style={[c.badgeText, { color: sColor }]}>{loan.status}</Text>
            </View>
          </View>
          <Text style={c.detail}>{loan.purpose.replace('_', ' ')} · {loan.interestRatePct}% · {loan.termMonths}m</Text>
          {total > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <View style={c.progressTrack}><View style={[c.progressFill, { width: `${(paid / total) * 100}%` as any }]} /></View>
              <Text style={{ fontSize: 11, color: colors.gray[400] }}>{paid}/{total}</Text>
            </View>
          )}
        </View>
        <Ionicons name={exp ? 'chevron-up' : 'chevron-down'} size={16} color={colors.gray[400]} />
      </TouchableOpacity>

      {exp && loan.vouchers?.length > 0 && (
        <View style={c.voucher}>
          <Ionicons name="ticket-outline" size={14} color={colors.shamba[600]} />
          <Text style={c.voucherCode}>{loan.vouchers[0].code}</Text>
          <View style={[c.badge, { backgroundColor: loan.vouchers[0].status === 'ISSUED' ? colors.shamba[100] : colors.gray[100] }]}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: loan.vouchers[0].status === 'ISSUED' ? colors.shamba[800] : colors.gray[600] }}>{loan.vouchers[0].status}</Text>
          </View>
        </View>
      )}

      {exp && loan.repayments?.slice(0, 4).map((r: any, i: number) => (
        <View key={r.id} style={c.schRow}>
          <Ionicons name={r.status === 'PAID' ? 'checkmark-circle' : r.status === 'LATE' ? 'alert-circle' : 'time-outline'}
            size={16} color={r.status === 'PAID' ? colors.shamba[600] : r.status === 'LATE' ? colors.red[600] : colors.gray[400]} />
          <Text style={c.schLabel}>Instalment {i + 1}  {formatDate(r.dueDate)}</Text>
          <Text style={[c.schAmt, r.status === 'PAID' && { color: colors.gray[400] }]}>{formatKes(r.amountDueKes)}</Text>
        </View>
      ))}
    </View>
  )
}
const c = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' as const },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
  amount: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' as const },
  detail: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  progressTrack: { flex: 1, height: 4, backgroundColor: colors.gray[100], borderRadius: radius.full },
  progressFill: { height: '100%' as const, backgroundColor: colors.shamba[500], borderRadius: radius.full },
  voucher: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray[50], paddingTop: spacing.sm },
  voucherCode: { flex: 1, fontFamily: 'monospace', fontSize: 14, fontWeight: '700', color: colors.shamba[700] },
  schRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.gray[50] },
  schLabel: { flex: 1, fontSize: 12, color: colors.gray[600] },
  schAmt: { fontSize: 13, fontWeight: '700', color: colors.shamba[700] },
})

function PolicyCard({ policy }: { policy: any }) {
  const isActive = policy.status === 'ACTIVE'
  return (
    <View style={[pc.card, shadow.sm]}>
      <LinearGradient colors={isActive ? ['#1e3a5f','#2563eb'] : ['#92400e','#d97706']} style={pc.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={pc.crop}>{policy.cropType} Insurance</Text>
            <Text style={pc.county}>{policy.county} · {policy.insurerName}</Text>
          </View>
          <View style={[pc.badge, { backgroundColor: isActive ? '#dcfce7' : '#fef3c7' }]}>
            <Text style={[pc.badgeText, { color: isActive ? colors.shamba[800] : '#92400e' }]}>{policy.status}</Text>
          </View>
        </View>
        <View style={pc.metrics}>
          <View style={pc.metric}><Text style={pc.mv}>{formatKes(policy.coverageAmountKes)}</Text><Text style={pc.ml}>Coverage</Text></View>
          <View style={pc.div} />
          <View style={pc.metric}><Text style={pc.mv}>{formatKes(policy.premiumKes)}</Text><Text style={pc.ml}>Premium</Text></View>
          <View style={pc.div} />
          <View style={pc.metric}><Text style={pc.mv}>{formatDate(policy.endDate)}</Text><Text style={pc.ml}>Expires</Text></View>
        </View>
      </LinearGradient>
      {policy.status === 'TRIGGERED' && policy.payoutAmountKes && (
        <View style={pc.payout}>
          <Ionicons name="checkmark-circle" size={16} color={colors.shamba[600]} />
          <Text style={pc.payoutText}>Auto-payout of {formatKes(policy.payoutAmountKes)} credited to your wallet</Text>
        </View>
      )}
    </View>
  )
}
const pc = StyleSheet.create({
  card: { borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' as const },
  header: { padding: spacing.xl },
  crop: { fontSize: 16, fontWeight: '700', color: colors.white },
  county: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  badge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' as const },
  metrics: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  metric: { flex: 1, alignItems: 'center' as const },
  mv: { fontSize: 13, fontWeight: '700', color: colors.white },
  ml: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  div: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  payout: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.shamba[50], padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.shamba[600] },
  payoutText: { flex: 1, fontSize: 12, color: colors.shamba[800] },
})

export default function LoansScreen() {
  const [tab, setTab] = useState<Tab>('loans')
  const [showApply, setShowApply] = useState(false)
  const [showInsure, setShowInsure] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { data: loans, isLoading: loansLoading, refetch: refetchLoans } = useLoans()
  const { data: credit } = useCredit()
  const { data: policies, refetch: refetchPolicies } = usePolicies()
  const { data: thresholds } = useThresholds()
  const applyLoan = useApplyLoan()
  const createPolicy = useCreatePolicy()

  const [lForm, setLForm] = useState({ principalKes: '', termMonths: '6', purpose: 'SEEDS', purposeDetails: '' })
  const [iForm, setIForm] = useState({ cropType: '', county: '', region: '', coverageAmountKes: '' })

  const hasActive = loans?.some((l: any) => ['PENDING', 'APPROVED', 'ACTIVE'].includes(l.status))
  const mr = (credit?.interestRatePct ?? 14) / 100 / 12
  const p = Number(lForm.principalKes) || 0
  const m = Number(lForm.termMonths) || 6
  const emi = mr === 0 ? p / m : (p * mr * Math.pow(1 + mr, m)) / (Math.pow(1 + mr, m) - 1)
  const coverage = Number(iForm.coverageAmountKes) || 0
  const premium = coverage * (REVENUE_CONFIG.insurance.premiumRatePct / 100)

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([refetchLoans(), refetchPolicies()])
    setRefreshing(false)
  }

  return (
    <View style={s.container}>
      <LinearGradient colors={['#13522e', '#138544']} style={s.header}>
        <Text style={s.title}>Finance</Text>
        <Text style={s.sub}>Loans, insurance and input financing</Text>
        <View style={s.tabs}>
          {(['loans', 'insurance'] as Tab[]).map(t => (
            <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.shamba[600]} />}>
        {tab === 'loans' && (
          <>
            {credit?.eligible && !hasActive && !showApply && (
              <TouchableOpacity style={[s.applyBtn, shadow.sm]} onPress={() => setShowApply(true)} activeOpacity={0.85}>
                <Ionicons name="add-circle" size={20} color={colors.white} />
                <Text style={s.applyBtnText}>Apply for input loan · Max {formatKes(credit.maxLoanKes)}</Text>
              </TouchableOpacity>
            )}
            {!credit?.eligible && <View style={s.infoBox}><Ionicons name="information-circle" size={16} color={colors.amber[700]} /><Text style={s.infoText}>Complete your farmer profile to unlock loans (score ≥ 500 required)</Text></View>}
            {hasActive && <View style={s.infoBox}><Ionicons name="lock-closed" size={16} color={colors.amber[700]} /><Text style={s.infoText}>Repay your current loan before applying for a new one</Text></View>}

            {showApply && (
              <View style={[s.formCard, shadow.sm]}>
                <Text style={s.formTitle}>Loan application</Text>
                <Text style={s.label}>Amount (KES)</Text>
                <TextInput style={s.input} keyboardType="numeric" value={lForm.principalKes} onChangeText={v => setLForm(f => ({ ...f, principalKes: v }))} placeholder={`Max ${formatKes(credit?.maxLoanKes ?? 0)}`} placeholderTextColor={colors.gray[400]} />
                <Text style={s.label}>Term (months)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[3, 6, 9, 12, 18, 24].map(mo => (
                      <TouchableOpacity key={mo} style={[s.chip, lForm.termMonths === String(mo) && s.chipActive]} onPress={() => setLForm(f => ({ ...f, termMonths: String(mo) }))}>
                        <Text style={[s.chipText, lForm.termMonths === String(mo) && { color: colors.shamba[700], fontWeight: '700' }]}>{mo}m</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <Text style={s.label}>Purpose</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {PURPOSES.map(pu => (
                      <TouchableOpacity key={pu} style={[s.chip, lForm.purpose === pu && s.chipActive]} onPress={() => setLForm(f => ({ ...f, purpose: pu }))}>
                        <Text style={[s.chipText, lForm.purpose === pu && { color: colors.shamba[700], fontWeight: '700' }]}>{pu.replace('_', ' ')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {p > 0 && (
                  <View style={s.preview}>
                    <View style={s.previewRow}><Text style={s.pl}>Monthly EMI</Text><Text style={s.pv}>{formatKes(Math.round(emi))}</Text></View>
                    <View style={s.previewRow}><Text style={s.pl}>Total repay</Text><Text style={s.pv}>{formatKes(Math.round(emi * m))}</Text></View>
                    <View style={s.previewRow}><Text style={s.pl}>Interest rate</Text><Text style={s.pv}>{credit?.interestRatePct ?? 14}% p.a.</Text></View>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setShowApply(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.submitBtn, applyLoan.isPending && { opacity: 0.6 }]} disabled={applyLoan.isPending}
                    onPress={async () => {
                      try { await applyLoan.mutateAsync({ principalKes: Number(lForm.principalKes), termMonths: Number(lForm.termMonths), purpose: lForm.purpose }); setShowApply(false); Alert.alert('Applied!', 'Your loan application has been submitted.') }
                      catch (e: any) { Alert.alert('Error', e.response?.data?.error ?? 'Application failed') }
                    }}>
                    {applyLoan.isPending ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={s.submitText}>Submit</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {loansLoading && <ActivityIndicator color={colors.shamba[600]} />}
            {loans?.map((l: any) => <LoanCard key={l.id} loan={l} />)}
            {!loansLoading && loans?.length === 0 && <View style={s.empty}><Ionicons name="cash-outline" size={48} color={colors.gray[300]} /><Text style={s.emptyText}>No loans yet</Text></View>}
          </>
        )}

        {tab === 'insurance' && (
          <>
            {!showInsure && (
              <TouchableOpacity style={[s.applyBtn, { backgroundColor: '#2563eb' }, shadow.sm]} onPress={() => setShowInsure(true)} activeOpacity={0.85}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.white} />
                <Text style={s.applyBtnText}>Get crop insurance · 4% premium</Text>
              </TouchableOpacity>
            )}

            {showInsure && (
              <View style={[s.formCard, shadow.sm]}>
                <Text style={s.formTitle}>New insurance policy</Text>
                {[['cropType','Crop type','e.g. Maize'],['county','County','e.g. Nakuru'],['region','Region','e.g. Rift Valley'],['coverageAmountKes','Coverage amount (KES)','e.g. 100000']].map(([k,l,p]) => (
                  <View key={k} style={{ marginBottom: spacing.lg }}>
                    <Text style={s.label}>{l}</Text>
                    <TextInput style={s.input} value={(iForm as any)[k]} onChangeText={v => setIForm(f => ({ ...f, [k]: v }))}
                      placeholder={p} placeholderTextColor={colors.gray[400]} keyboardType={k === 'coverageAmountKes' ? 'numeric' : 'default'} />
                  </View>
                ))}
                {coverage > 0 && (
                  <View style={s.preview}>
                    <View style={s.previewRow}><Text style={s.pl}>Annual premium (4%)</Text><Text style={[s.pv, { color: '#2563eb' }]}>{formatKes(Math.round(premium))}</Text></View>
                    <View style={s.previewRow}><Text style={s.pl}>Auto-payout on trigger</Text><Text style={[s.pv, { color: '#2563eb' }]}>{formatKes(coverage * 0.5)}</Text></View>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setShowInsure(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.submitBtn, { backgroundColor: '#2563eb' }, createPolicy.isPending && { opacity: 0.6 }]} disabled={createPolicy.isPending}
                    onPress={async () => {
                      const start = new Date().toISOString()
                      const end = new Date(Date.now() + 180 * 86400000).toISOString()
                      try { await createPolicy.mutateAsync({ ...iForm, coverageAmountKes: Number(iForm.coverageAmountKes), startDate: start, endDate: end }); setShowInsure(false); Alert.alert('Insured!', 'Your policy is now active.') }
                      catch (e: any) { Alert.alert('Error', e.response?.data?.error ?? 'Failed') }
                    }}>
                    {createPolicy.isPending ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={s.submitText}>Get insured</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {policies?.map((p: any) => <PolicyCard key={p.id} policy={p} />)}
            {!policies?.length && <View style={s.empty}><Ionicons name="shield-outline" size={48} color={colors.gray[300]} /><Text style={s.emptyText}>No policies yet</Text></View>}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.white },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: spacing.lg },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.lg, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' as const, borderRadius: radius.md },
  tabBtnActive: { backgroundColor: colors.white },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: colors.shamba[700] },
  body: { padding: spacing.xl, paddingBottom: 40 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.shamba[600], borderRadius: radius.lg, paddingVertical: 16, marginBottom: spacing.xl },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  infoBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.amber[100], borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.xl },
  infoText: { flex: 1, fontSize: 13, color: colors.amber[800], lineHeight: 18 },
  formCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.xl },
  formTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.lg, height: 48, paddingHorizontal: spacing.md, fontSize: 14, color: colors.gray[900], marginBottom: spacing.lg },
  chip: { borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 7 },
  chipActive: { borderColor: colors.shamba[600], backgroundColor: colors.shamba[50] },
  chipText: { fontSize: 12, color: colors.gray[600], fontWeight: '500' },
  preview: { backgroundColor: colors.shamba[50], borderRadius: radius.md, padding: spacing.md, gap: 6 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pl: { fontSize: 13, color: colors.gray[600] },
  pv: { fontSize: 13, fontWeight: '700', color: colors.shamba[700] },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.lg, paddingVertical: 13, alignItems: 'center' as const },
  cancelText: { fontSize: 13, fontWeight: '600', color: colors.gray[600] },
  submitBtn: { flex: 2, backgroundColor: colors.shamba[600], borderRadius: radius.lg, paddingVertical: 13, alignItems: 'center' as const, justifyContent: 'center' as const },
  submitText: { fontSize: 13, fontWeight: '700', color: colors.white },
  empty: { alignItems: 'center' as const, paddingVertical: 40, gap: spacing.md },
  emptyText: { fontSize: 14, color: colors.gray[400] },
})
