import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl, Switch,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { useQueryClient } from '@tanstack/react-query'
import { useProfile, useCredit, useWallet, useFarmerWeather, useSupply, useUpsertProfile, useRefreshCredit, useWithdraw, usePredict } from '@/hooks/useApi'
import { useAuthStore } from '@/store/auth.store'
import { colors, spacing, radius, shadow } from '@/lib/theme'
import { formatKes, formatNum, formatDate, creditColor, scorePercent } from '@/lib/utils'
import { CROPS, getCurrentSeason } from '@shamba/shared'

// ─── Credit score ring ────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const SIZE = 140, SW = 11, R = (SIZE - SW) / 2
  const CIRC = 2 * Math.PI * R
  const pct  = Math.max(0, Math.min(1, scorePercent(score) / 100))
  const col  = creditColor({ POOR:'#ef4444',FAIR:'#d97706',GOOD:'#ca8a04',VERY_GOOD:colors.shamba[600],EXCELLENT:colors.shamba[700] }[
    score<500?'POOR':score<600?'FAIR':score<700?'GOOD':score<750?'VERY_GOOD':'EXCELLENT'
  ] as any)

  return (
    <View style={{ width:SIZE, height:SIZE, alignItems:'center', justifyContent:'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position:'absolute' }}>
        <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke={colors.gray[100]} strokeWidth={SW} fill="none" />
        <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke={col} strokeWidth={SW} fill="none"
          strokeDasharray={CIRC} strokeDashoffset={CIRC*(1-pct)}
          strokeLinecap="round" rotation="-90" origin={`${SIZE/2},${SIZE/2}`} />
      </Svg>
      <Text style={{ fontSize:28, fontWeight:'800', color:colors.gray[900] }}>{score}</Text>
      <Text style={{ fontSize:11, color:colors.gray[400] }}>/ 850</Text>
    </View>
  )
}

// ─── Section header ──────────────────────────────────────────
function Section({ title, icon, children, collapsible = false }: any) {
  const [open, setOpen] = useState(true)
  return (
    <View style={[sec.wrap, shadow.sm]}>
      <TouchableOpacity style={sec.header} onPress={() => collapsible && setOpen(!open)} activeOpacity={collapsible ? 0.7 : 1}>
        <View style={sec.iconWrap}><Ionicons name={icon} size={16} color={colors.shamba[600]} /></View>
        <Text style={sec.title}>{title}</Text>
        {collapsible && <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.gray[400]} />}
      </TouchableOpacity>
      {(!collapsible || open) && <View style={sec.body}>{children}</View>}
    </View>
  )
}
const sec = StyleSheet.create({
  wrap: { backgroundColor:colors.white, borderRadius:radius.lg, marginBottom:spacing.lg, overflow:'hidden' },
  header: { flexDirection:'row', alignItems:'center', gap:spacing.md, padding:spacing.lg, borderBottomWidth:1, borderBottomColor:colors.gray[50] },
  iconWrap: { width:30, height:30, borderRadius:9, backgroundColor:colors.shamba[50], alignItems:'center', justifyContent:'center' },
  title: { flex:1, fontSize:14, fontWeight:'700', color:colors.gray[900] },
  body: { padding:spacing.lg },
})

// ─── Main screen ─────────────────────────────────────────────
export default function ProfileScreen() {
  const qc = useQueryClient()
  const { user, logout } = useAuthStore()
  const { data: profileData, refetch } = useProfile()
  const { data: creditData } = useCredit()
  const { data: walletData } = useWallet()
  const { data: weatherData } = useFarmerWeather()
  const { data: supplyData } = useSupply({ pageSize:6 })

  const upsert  = useUpsertProfile()
  const refresh = useRefreshCredit()
  const withdraw = useWithdraw()
  const predict  = usePredict()

  const [refreshing, setRefreshing] = useState(false)
  const [editProfile, setEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<any>({})
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [predictForm, setPredictForm] = useState({
    crop: 'Maize', soilType:'LOAM', areaAcres:'', rainfallMm:'', tempAvgC:'',
    fertilizerUsed:false, irrigated:false, season:getCurrentSeason(),
  })
  const [predictResult, setPredictResult] = useState<any>(null)

  const profile = profileData?.profile
  const credit  = creditData
  const wallet  = walletData?.wallet
  const txs     = walletData?.transactions ?? []
  const weather = weatherData

  async function onRefresh() {
    setRefreshing(true)
    await qc.invalidateQueries()
    setRefreshing(false)
  }

  async function saveProfile() {
    try {
      await upsert.mutateAsync(profileForm)
      setEditProfile(false)
      Alert.alert('Saved', 'Profile updated successfully')
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Save failed')
    }
  }

  async function doWithdraw() {
    if (!withdrawAmount) return
    try {
      await withdraw.mutateAsync({ amountKes: Number(withdrawAmount) })
      setWithdrawAmount('')
      Alert.alert('Success', `KES ${formatNum(Number(withdrawAmount))} sent to your M-Pesa`)
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Withdrawal failed')
    }
  }

  async function runPredict() {
    if (!predictForm.areaAcres || !predictForm.rainfallMm || !predictForm.tempAvgC) {
      return Alert.alert('Error', 'Please fill in area, rainfall and temperature')
    }
    try {
      const result = await predict.mutateAsync({
        ...predictForm,
        areaAcres: Number(predictForm.areaAcres),
        rainfallMm: Number(predictForm.rainfallMm),
        tempAvgC: Number(predictForm.tempAvgC),
      })
      setPredictResult(result)
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Prediction failed')
    }
  }

  const ratingColor = creditColor(credit?.rating ?? 'POOR')

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.shamba[600]} />}
    >
      {/* Header */}
      <LinearGradient colors={['#13522e','#138544']} style={s.header}>
        <View style={s.avatarRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'F'}</Text>
          </View>
          <View style={{ flex:1 }}>
            <Text style={s.userName}>{user?.name}</Text>
            <Text style={s.userPhone}>{user?.phone}</Text>
            <Text style={s.userRole}>{user?.role} · {user?.county ?? 'Kenya'}</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={s.body}>

        {/* ── Credit Score ── */}
        <Section title="Credit score" icon="card-outline">
          {credit ? (
            <View style={s.creditWrap}>
              <ScoreRing score={credit.score} />
              <View style={s.creditRight}>
                <View style={[s.ratingBadge, { backgroundColor: ratingColor + '18' }]}>
                  <Text style={[s.ratingText, { color: ratingColor }]}>{credit.rating.replace('_',' ')}</Text>
                </View>
                <Text style={s.maxLoanLabel}>Max loan</Text>
                <Text style={[s.maxLoanVal, { color: ratingColor }]}>{formatKes(credit.maxLoanKes)}</Text>
                <TouchableOpacity
                  style={[s.refreshBtn, refresh.isPending && { opacity:0.5 }]}
                  disabled={refresh.isPending}
                  onPress={() => refresh.mutate()}
                >
                  {refresh.isPending
                    ? <ActivityIndicator size="small" color={colors.shamba[600]} />
                    : <><Ionicons name="refresh" size={13} color={colors.shamba[600]} /><Text style={s.refreshText}>Refresh</Text></>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={s.empty}>Complete your profile to get a credit score</Text>
          )}
          {credit?.rating && (
            <Text style={[s.creditTip, { color: ratingColor }]}>
              {credit.rating === 'EXCELLENT' ? '🏆 Outstanding! You qualify for our largest loans.'
                : credit.rating === 'VERY_GOOD' ? '✅ Great standing. Full access to all products.'
                : credit.rating === 'GOOD' ? '👍 Eligible for medium loans and insurance.'
                : credit.rating === 'FAIR' ? '📈 Build history by repaying on time to unlock more.'
                : '⚠ Complete your profile and start with a small loan to build credit.'}
            </Text>
          )}
        </Section>

        {/* ── Farmer Profile ── */}
        <Section title="Farm profile" icon="leaf-outline" collapsible>
          {!editProfile ? (
            <>
              <View style={s.profileGrid}>
                {[
                  { label:'Farm size',   val: profile?.farmSizeAcres ? `${formatNum(profile.farmSizeAcres,1)} acres` : '—' },
                  { label:'Primary crop',val: profile?.primaryCrop ?? '—' },
                  { label:'County',      val: profile?.county ?? '—' },
                  { label:'Sub-county',  val: profile?.subCounty ?? '—' },
                  { label:'Soil type',   val: (profile?.soilType ?? '—').replace('_',' ') },
                  { label:'Irrigation',  val: (profile?.irrigationType ?? 'NONE').replace('_',' ') },
                  { label:'Years farming',val:String(profile?.yearsFarming ?? '—') },
                  { label:'Last yield',  val: profile?.previousYieldKg ? `${formatNum(profile.previousYieldKg)} kg` : '—' },
                ].map(({ label, val }) => (
                  <View key={label} style={s.profileField}>
                    <Text style={s.profileFieldLabel}>{label}</Text>
                    <Text style={s.profileFieldVal}>{val}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={s.editBtn} onPress={() => { setProfileForm(profile ?? {}); setEditProfile(true) }}>
                <Ionicons name="pencil-outline" size={15} color={colors.shamba[600]} />
                <Text style={s.editBtnText}>Edit profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.editForm}>
              {[
                { k:'farmSizeAcres', label:'Farm size (acres)', numeric:true },
                { k:'primaryCrop',  label:'Primary crop' },
                { k:'county',       label:'County' },
                { k:'subCounty',    label:'Sub-county' },
                { k:'yearsFarming', label:'Years farming', numeric:true },
                { k:'previousYieldKg', label:'Last yield (kg)', numeric:true },
                { k:'nationalId',   label:'National ID' },
              ].map(({ k, label, numeric }) => (
                <View key={k} style={{ marginBottom:spacing.md }}>
                  <Text style={s.editLabel}>{label}</Text>
                  <TextInput
                    style={s.editInput}
                    value={String(profileForm[k] ?? '')}
                    onChangeText={v => setProfileForm((p: any) => ({ ...p, [k]: numeric ? Number(v) : v }))}
                    keyboardType={numeric ? 'numeric' : 'default'}
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              ))}
              <View style={{ flexDirection:'row', gap:spacing.md }}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setEditProfile(false)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, upsert.isPending && { opacity:0.5 }]} onPress={saveProfile} disabled={upsert.isPending}>
                  {upsert.isPending ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={s.saveBtnText}>Save changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Section>

        {/* ── Wallet ── */}
        <Section title="Shamba Wallet" icon="wallet-outline" collapsible>
          <View style={s.walletRow}>
            {[
              { label:'Available', amount: wallet?.balanceKes ?? 0, tint:colors.shamba[600] },
              { label:'Escrow',    amount: wallet?.escrowKes ?? 0,  tint:'#2563eb' },
              { label:'Earned',    amount: wallet?.totalEarnedKes ?? 0, tint:'#d97706' },
            ].map(({ label, amount, tint }) => (
              <View key={label} style={[s.walletStat, { borderLeftColor: tint }]}>
                <Text style={s.walletStatLabel}>{label}</Text>
                <Text style={[s.walletStatVal, { color:tint }]}>{formatKes(amount)}</Text>
              </View>
            ))}
          </View>

          <View style={s.withdrawRow}>
            <TextInput
              style={[s.editInput, { flex:1, marginBottom:0 }]}
              placeholder="Amount to withdraw (KES)"
              placeholderTextColor={colors.gray[400]}
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />
            <TouchableOpacity
              style={[s.saveBtn, { paddingHorizontal:spacing.lg }, (!withdrawAmount || withdraw.isPending) && { opacity:0.5 }]}
              onPress={doWithdraw} disabled={!withdrawAmount || withdraw.isPending}
            >
              {withdraw.isPending ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={s.saveBtnText}>To M-Pesa</Text>}
            </TouchableOpacity>
          </View>

          {txs.slice(0,5).map((tx: any, i: number) => {
            const pos = ['INSURANCE_PAYOUT','MARKET_SALE','WALLET_TOPUP','REFERRAL_BONUS','LOAN_DISBURSEMENT'].includes(tx.type)
            return (
              <View key={tx.id} style={[s.txRow, i > 0 && { borderTopWidth:1, borderTopColor:colors.gray[50] }]}>
                <View style={[s.txIcon, { backgroundColor: pos ? colors.shamba[50] : '#fee2e2' }]}>
                  <Ionicons name={pos ? 'arrow-down-circle' : 'arrow-up-circle'} size={16} color={pos ? colors.shamba[600] : '#dc2626'} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.txDesc} numberOfLines={1}>{tx.description ?? tx.type.replace(/_/g,' ')}</Text>
                  <Text style={s.txDate}>{formatDate(tx.createdAt)}</Text>
                </View>
                <Text style={[s.txAmount, { color: pos ? colors.shamba[700] : '#dc2626' }]}>
                  {pos ? '+' : '-'}{formatKes(tx.amountKes)}
                </Text>
              </View>
            )
          })}
        </Section>

        {/* ── Weather ── */}
        <Section title="Farm weather" icon="cloud-outline" collapsible>
          {weather?.current ? (
            <>
              <LinearGradient colors={['#1e3a5f','#1d4ed8']} style={s.weatherCard}>
                <View style={s.weatherTop}>
                  <View>
                    <Text style={s.weatherTemp}>{weather.current.temp}°C</Text>
                    <Text style={s.weatherDesc}>{weather.current.description}</Text>
                    <Text style={s.weatherFeels}>Feels like {weather.current.feelsLike}°C</Text>
                  </View>
                  <View style={s.weatherStats}>
                    <View style={s.weatherStat}><Ionicons name="water-outline" size={13} color="rgba(255,255,255,0.7)" /><Text style={s.weatherStatText}>{weather.current.humidity}%</Text></View>
                    <View style={s.weatherStat}><Ionicons name="speedometer-outline" size={13} color="rgba(255,255,255,0.7)" /><Text style={s.weatherStatText}>{weather.current.windSpeed}m/s</Text></View>
                  </View>
                </View>
              </LinearGradient>
              {weather.forecast && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop:spacing.md }}>
                  <View style={{ flexDirection:'row', gap:spacing.sm }}>
                    {weather.forecast.slice(0,7).map((day: any) => {
                      const d = new Date(day.date)
                      const days = ['Su','Mo','Tu','We','Th','Fr','Sa']
                      return (
                        <View key={day.date} style={s.dayCard}>
                          <Text style={s.dayLabel}>{days[d.getDay()]}</Text>
                          <Text style={s.dayMax}>{day.tempMax}°</Text>
                          <Text style={s.dayMin}>{day.tempMin}°</Text>
                          {day.rainfallMm > 0 && <Text style={s.dayRain}>{day.rainfallMm}mm</Text>}
                        </View>
                      )
                    })}
                  </View>
                </ScrollView>
              )}
            </>
          ) : (
            <Text style={s.empty}>Add your farm location in your profile to see weather</Text>
          )}
        </Section>

        {/* ── AI Yield Predict ── */}
        <Section title="AI yield prediction" icon="flash-outline" collapsible>
          <View style={s.predictForm}>
            <View style={s.predictRow}>
              <View style={{ flex:1 }}>
                <Text style={s.editLabel}>Crop</Text>
                <View style={s.pickerWrap}>
                  <Text style={s.pickerVal}>{predictForm.crop}</Text>
                </View>
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.editLabel}>Season</Text>
                <View style={s.pickerWrap}>
                  <Text style={s.pickerVal}>{predictForm.season.replace('_',' ')}</Text>
                </View>
              </View>
            </View>
            {[
              { k:'areaAcres',   label:'Area (acres) *' },
              { k:'rainfallMm',  label:'Rainfall (mm) *' },
              { k:'tempAvgC',    label:'Avg temp (°C) *' },
            ].map(({ k, label }) => (
              <View key={k} style={{ marginBottom:spacing.md }}>
                <Text style={s.editLabel}>{label}</Text>
                <TextInput
                  style={s.editInput}
                  placeholder="e.g. 5" placeholderTextColor={colors.gray[400]}
                  keyboardType="numeric"
                  value={(predictForm as any)[k]}
                  onChangeText={v => setPredictForm((p: any) => ({ ...p, [k]:v }))}
                />
              </View>
            ))}
            <View style={s.togglesRow}>
              {[
                { k:'fertilizerUsed', label:'Using fertilizer' },
                { k:'irrigated',      label:'Irrigated' },
              ].map(({ k, label }) => (
                <View key={k} style={s.toggleItem}>
                  <Text style={s.toggleLabel}>{label}</Text>
                  <Switch
                    value={(predictForm as any)[k]}
                    onValueChange={v => setPredictForm((p: any) => ({ ...p, [k]:v }))}
                    trackColor={{ false:colors.gray[200], true:colors.shamba[400] }}
                    thumbColor={(predictForm as any)[k] ? colors.shamba[600] : colors.gray[400]}
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[s.saveBtn, { marginTop:spacing.md }, predict.isPending && { opacity:0.6 }]}
              onPress={runPredict} disabled={predict.isPending}
            >
              {predict.isPending
                ? <ActivityIndicator color={colors.white} size="small" />
                : <><Ionicons name="flash" size={16} color={colors.white} /><Text style={s.saveBtnText}>  Predict yield</Text></>}
            </TouchableOpacity>
          </View>

          {predictResult && (
            <View style={s.predictResult}>
              <Text style={s.predictCrop}>{predictResult.cropName}</Text>
              <View style={s.predictMetrics}>
                {[
                  { label:'Total yield',    val:`${formatNum(predictResult.predictedYieldKg)} kg` },
                  { label:'Per acre',       val:`${formatNum(predictResult.predictedYieldPerAcre)} kg` },
                  { label:'Est. revenue',   val: formatKes(predictResult.estimatedRevenueKes) },
                  { label:'Confidence',     val:`${predictResult.confidencePct}%` },
                ].map(({ label, val }) => (
                  <View key={label} style={s.predictMetric}>
                    <Text style={s.predictMetricVal}>{val}</Text>
                    <Text style={s.predictMetricLabel}>{label}</Text>
                  </View>
                ))}
              </View>
              {predictResult.recommendations.slice(0,2).map((r: string, i: number) => (
                <Text key={i} style={s.predictRec}>→ {r}</Text>
              ))}
            </View>
          )}
        </Section>

        {/* ── Supply chain ── */}
        <Section title="Supply chain directory" icon="storefront-outline" collapsible>
          {supplyData?.items?.map((s2: any) => (
            <View key={s2.id} style={sv.row}>
              <View style={[sv.icon, { backgroundColor: s2.verified ? colors.shamba[50] : colors.gray[50] }]}>
                <Ionicons name="business-outline" size={16} color={s2.verified ? colors.shamba[600] : colors.gray[400]} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={sv.name}>{s2.name}</Text>
                <Text style={sv.sub}>{s2.type.replace('_',' ')} · {s2.county}</Text>
                <Text style={sv.phone}>{s2.phone}</Text>
              </View>
              {s2.verified && <Ionicons name="checkmark-circle" size={16} color={colors.shamba[600]} />}
            </View>
          ))}
          {!supplyData && <ActivityIndicator color={colors.shamba[600]} />}
        </Section>

      </View>
    </ScrollView>
  )
}

const sv = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'flex-start', gap:spacing.md, paddingVertical:spacing.md, borderTopWidth:1, borderTopColor:colors.gray[50] },
  icon: { width:34, height:34, borderRadius:10, alignItems:'center', justifyContent:'center' },
  name: { fontSize:13, fontWeight:'600', color:colors.gray[900] },
  sub: { fontSize:11, color:colors.gray[500], marginTop:1 },
  phone: { fontSize:11, color:colors.shamba[600], marginTop:1 },
})

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:colors.gray[50] },
  header: { paddingTop:56, paddingHorizontal:spacing.xl, paddingBottom:spacing['2xl'] },
  avatarRow: { flexDirection:'row', alignItems:'center', gap:spacing.lg },
  avatar: { width:60, height:60, borderRadius:30, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center' },
  avatarText: { fontSize:24, fontWeight:'800', color:colors.white },
  userName: { fontSize:20, fontWeight:'800', color:colors.white },
  userPhone: { fontSize:13, color:'rgba(255,255,255,0.7)', marginTop:2 },
  userRole: { fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2, textTransform:'capitalize' },
  logoutBtn: { padding:8, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:radius.md },
  body: { padding:spacing.xl },
  creditWrap: { flexDirection:'row', alignItems:'center', gap:spacing.xl, marginBottom:spacing.md },
  creditRight: { flex:1, gap:spacing.sm },
  ratingBadge: { alignSelf:'flex-start', borderRadius:radius.full, paddingHorizontal:12, paddingVertical:4 },
  ratingText: { fontSize:11, fontWeight:'800', textTransform:'uppercase', letterSpacing:0.5 },
  maxLoanLabel: { fontSize:11, color:colors.gray[500] },
  maxLoanVal: { fontSize:20, fontWeight:'800' },
  refreshBtn: { flexDirection:'row', alignItems:'center', gap:4, alignSelf:'flex-start', borderWidth:1, borderColor:colors.shamba[200], borderRadius:radius.md, paddingHorizontal:10, paddingVertical:5 },
  refreshText: { fontSize:11, color:colors.shamba[600], fontWeight:'600' },
  creditTip: { fontSize:12, fontStyle:'italic', lineHeight:17, paddingTop:spacing.sm, borderTopWidth:1, borderTopColor:colors.gray[50] },
  empty: { fontSize:13, color:colors.gray[400], textAlign:'center', paddingVertical:spacing.xl },
  profileGrid: { flexDirection:'row', flexWrap:'wrap', gap:spacing.sm, marginBottom:spacing.lg },
  profileField: { width:'48%', backgroundColor:colors.gray[50], borderRadius:radius.md, padding:spacing.md },
  profileFieldLabel: { fontSize:10, color:colors.gray[400], textTransform:'uppercase', letterSpacing:0.3 },
  profileFieldVal: { fontSize:13, fontWeight:'600', color:colors.gray[900], marginTop:2 },
  editBtn: { flexDirection:'row', alignItems:'center', gap:6, alignSelf:'flex-start', borderWidth:1.5, borderColor:colors.shamba[200], borderRadius:radius.md, paddingHorizontal:spacing.md, paddingVertical:7 },
  editBtnText: { fontSize:12, fontWeight:'600', color:colors.shamba[600] },
  editForm: {},
  editLabel: { fontSize:11, fontWeight:'600', color:colors.gray[600], marginBottom:5 },
  editInput: { borderWidth:1.5, borderColor:colors.gray[200], borderRadius:radius.md, height:46, paddingHorizontal:spacing.md, fontSize:14, color:colors.gray[900], backgroundColor:colors.gray[50], marginBottom:spacing.md },
  cancelBtn: { flex:1, borderWidth:1.5, borderColor:colors.gray[200], borderRadius:radius.md, paddingVertical:12, alignItems:'center' },
  cancelText: { fontSize:13, fontWeight:'600', color:colors.gray[600] },
  saveBtn: { flex:2, flexDirection:'row', backgroundColor:colors.shamba[600], borderRadius:radius.md, paddingVertical:12, alignItems:'center', justifyContent:'center' },
  saveBtnText: { fontSize:13, fontWeight:'700', color:colors.white },
  walletRow: { flexDirection:'row', gap:spacing.md, marginBottom:spacing.lg },
  walletStat: { flex:1, borderLeftWidth:3, paddingLeft:spacing.md },
  walletStatLabel: { fontSize:10, color:colors.gray[500] },
  walletStatVal: { fontSize:15, fontWeight:'800', marginTop:2 },
  withdrawRow: { flexDirection:'row', gap:spacing.md, marginBottom:spacing.lg },
  txRow: { flexDirection:'row', alignItems:'center', gap:spacing.md, paddingVertical:spacing.md },
  txIcon: { width:34, height:34, borderRadius:10, alignItems:'center', justifyContent:'center' },
  txDesc: { fontSize:12, fontWeight:'500', color:colors.gray[800] },
  txDate: { fontSize:10, color:colors.gray[400], marginTop:1 },
  txAmount: { fontSize:13, fontWeight:'700' },
  weatherCard: { borderRadius:radius.lg, padding:spacing.lg },
  weatherTop: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  weatherTemp: { fontSize:40, fontWeight:'800', color:colors.white },
  weatherDesc: { fontSize:13, color:'rgba(255,255,255,0.8)', textTransform:'capitalize', marginTop:2 },
  weatherFeels: { fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 },
  weatherStats: { alignItems:'flex-end', gap:spacing.sm },
  weatherStat: { flexDirection:'row', alignItems:'center', gap:4 },
  weatherStatText: { fontSize:12, color:'rgba(255,255,255,0.7)' },
  dayCard: { alignItems:'center', backgroundColor:colors.gray[50], borderRadius:radius.md, padding:spacing.md, minWidth:52, gap:2 },
  dayLabel: { fontSize:10, fontWeight:'700', color:colors.gray[500] },
  dayMax: { fontSize:13, fontWeight:'800', color:colors.gray[900] },
  dayMin: { fontSize:11, color:colors.gray[400] },
  dayRain: { fontSize:9, color:'#2563eb', fontWeight:'600' },
  predictForm: {},
  predictRow: { flexDirection:'row', gap:spacing.md, marginBottom:spacing.md },
  pickerWrap: { borderWidth:1.5, borderColor:colors.gray[200], borderRadius:radius.md, height:46, paddingHorizontal:spacing.md, justifyContent:'center', backgroundColor:colors.gray[50] },
  pickerVal: { fontSize:14, color:colors.gray[900] },
  togglesRow: { flexDirection:'row', gap:spacing.xl },
  toggleItem: { flexDirection:'row', alignItems:'center', gap:spacing.md },
  toggleLabel: { fontSize:13, color:colors.gray[700] },
  predictResult: { marginTop:spacing.lg, backgroundColor:colors.shamba[50], borderRadius:radius.lg, padding:spacing.lg, borderLeftWidth:3, borderLeftColor:colors.shamba[600] },
  predictCrop: { fontSize:15, fontWeight:'800', color:colors.shamba[800], marginBottom:spacing.md },
  predictMetrics: { flexDirection:'row', flexWrap:'wrap', gap:spacing.sm, marginBottom:spacing.md },
  predictMetric: { backgroundColor:colors.white, borderRadius:radius.md, padding:spacing.md, alignItems:'center', minWidth:80 },
  predictMetricVal: { fontSize:14, fontWeight:'800', color:colors.shamba[700] },
  predictMetricLabel: { fontSize:9, color:colors.gray[500], marginTop:2 },
  predictRec: { fontSize:12, color:colors.shamba[800], lineHeight:17, marginTop:2 },
})
