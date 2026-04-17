import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useDashboard, useWallet, usePrices } from '@/hooks/useApi'
import { useAuthStore } from '@/store/auth.store'
import { colors, spacing, radius, shadow } from '@/lib/theme'
import { formatKes, formatDate } from '@/lib/utils'

type IName = keyof typeof Ionicons.glyphMap

function StatCard({ icon, label, value, sub, color }: { icon: IName; label: string; value: string; sub?: string; color: string }) {
  return (
    <View style={[sc.card, shadow.sm]}>
      <View style={[sc.icon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
      {sub ? <Text style={sc.sub}>{sub}</Text> : null}
    </View>
  )
}
const sc = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: 4 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontSize: 20, fontWeight: '800', color: colors.gray[900] },
  label: { fontSize: 11, color: colors.gray[500], marginTop: 2 },
  sub: { fontSize: 10, color: colors.gray[400], marginTop: 1 },
})

export default function DashboardScreen() {
  const { user, logout } = useAuthStore()
  const qc = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const { data, isLoading } = useDashboard()
  const { data: wallet } = useWallet()
  const { data: pricesData } = usePrices({ pageSize: 6 })

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  })()

  async function onRefresh() {
    setRefreshing(true)
    await qc.invalidateQueries()
    setRefreshing(false)
  }

  const d = data

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.shamba[600]} />}
    >
      {/* Header */}
      <LinearGradient colors={['#13522e', '#15a552']} style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.userName}>{user?.name?.split(' ')[0] ?? 'Farmer'}</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={async () => { await logout(); router.replace('/(auth)/login') }}>
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
        {/* Wallet balance */}
        <View style={s.walletBox}>
          <Text style={s.walletLabel}>Wallet balance</Text>
          <Text style={s.walletBalance}>{formatKes(wallet?.wallet?.balanceKes ?? 0)}</Text>
          {(wallet?.wallet?.escrowKes ?? 0) > 0 && (
            <Text style={s.escrow}>+ {formatKes(wallet.wallet.escrowKes)} in escrow</Text>
          )}
        </View>
      </LinearGradient>

      <View style={s.body}>
        {isLoading ? (
          <ActivityIndicator color={colors.shamba[600]} style={{ marginTop: 20 }} />
        ) : (
          <>
            {/* Stats */}
            <View style={s.statsRow}>
              <StatCard icon="leaf"       label="Active loans"    value={String(d?.loans?.active ?? 0)}            sub={d?.loans?.total ? `of ${d.loans.total} total` : undefined}           color={colors.shamba[600]} />
              <StatCard icon="shield"     label="Policies"        value={String(d?.insurance?.active ?? 0)}         sub={d?.insurance?.totalCoverage ? formatKes(d.insurance.totalCoverage) : undefined} color="#2563eb" />
              <StatCard icon="storefront" label="Sales"           value={String(d?.marketplace?.completedSales ?? 0)} sub={d?.marketplace?.totalRevenue ? formatKes(d.marketplace.totalRevenue) : undefined} color={colors.amber[600]} />
            </View>

            {/* Credit score strip */}
            {d?.creditScore && (
              <TouchableOpacity style={[s.creditStrip, shadow.sm]} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.85}>
                <View>
                  <Text style={s.creditLabel}>Credit score</Text>
                  <Text style={s.creditScore}>{d.creditScore.score} <Text style={s.creditOf}>/850</Text></Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[s.ratingBadge, { backgroundColor: d.creditScore.eligible ? colors.shamba[100] : colors.red[100] }]}>
                    <Text style={[s.ratingText, { color: d.creditScore.eligible ? colors.shamba[800] : colors.red[800] }]}>
                      {d.creditScore.rating?.replace('_', ' ')}
                    </Text>
                  </View>
                  {d.creditScore.eligible && (
                    <Text style={s.maxLoan}>Max: {formatKes(d.creditScore.maxLoanKes)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Quick actions */}
        <Text style={s.sectionTitle}>Quick actions</Text>
        <View style={s.actionsGrid}>
          {[
            { label: 'Apply loan',    icon: 'cash-outline' as IName,       tab: '/(tabs)/loans',   color: colors.shamba[600] },
            { label: 'Sell produce',  icon: 'storefront-outline' as IName, tab: '/(tabs)/market',  color: colors.amber[600] },
            { label: 'Get insured',   icon: 'shield-outline' as IName,     tab: '/(tabs)/loans',   color: '#2563eb' },
            { label: 'Join a group',  icon: 'people-outline' as IName,     tab: '/(tabs)/groups',  color: '#7c3aed' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={[s.actionBtn, shadow.sm]} onPress={() => router.push(a.tab as any)} activeOpacity={0.85}>
              <View style={[s.actionIcon, { backgroundColor: a.color + '15' }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Market snapshot */}
        {pricesData?.items?.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Today's prices</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/market')}>
                <Text style={s.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.priceCard, shadow.sm]}>
              {pricesData.items.slice(0, 5).map((p: any, i: number) => (
                <View key={p.id} style={[s.priceRow, i > 0 && s.priceBorder]}>
                  <View>
                    <Text style={s.priceCrop}>{p.crop}</Text>
                    <Text style={s.priceCounty}>{p.county}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.priceValue}>{formatKes(p.priceKes)}</Text>
                    <Text style={s.priceUnit}>per {p.unit === 'KG' ? 'kg' : p.unit}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing['2xl'] },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.xl },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 26, fontWeight: '800', color: colors.white, marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.md },
  walletBox: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.xl, padding: spacing.lg },
  walletLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  walletBalance: { fontSize: 30, fontWeight: '800', color: colors.white, marginTop: 2 },
  escrow: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  body: { padding: spacing.xl, marginTop: -spacing.md },
  statsRow: { flexDirection: 'row', marginBottom: spacing.xl },
  creditStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl },
  creditLabel: { fontSize: 12, color: colors.gray[500] },
  creditScore: { fontSize: 28, fontWeight: '800', color: colors.gray[900], marginTop: 2 },
  creditOf: { fontSize: 14, fontWeight: '400', color: colors.gray[400] },
  ratingBadge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  ratingText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' as const },
  maxLoan: { fontSize: 11, color: colors.shamba[600], marginTop: 4, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  seeAll: { fontSize: 13, color: colors.shamba[600], fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: spacing.md, marginBottom: spacing.xl },
  actionBtn: { width: '47%', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600', color: colors.gray[800] },
  priceCard: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' as const },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  priceBorder: { borderTopWidth: 1, borderTopColor: colors.gray[50] },
  priceCrop: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  priceCounty: { fontSize: 11, color: colors.gray[500], marginTop: 1 },
  priceValue: { fontSize: 15, fontWeight: '800', color: colors.shamba[700] },
  priceUnit: { fontSize: 10, color: colors.gray[400] },
})
