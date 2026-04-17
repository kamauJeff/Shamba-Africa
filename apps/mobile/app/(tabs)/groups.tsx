import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Alert, RefreshControl, ScrollView,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useGroups, useMyGroups, useJoinGroup, useContribute } from '@/hooks/useApi'
import { colors, spacing, radius, shadow } from '@/lib/theme'
import { formatKes, formatDate } from '@/lib/utils'

const TYPE_COLOR: Record<string, { bg: string; text: string }> = {
  SACCO:           { bg:'#dcfce7', text:'#166534' },
  COOPERATIVE:     { bg:'#dbeafe', text:'#1e40af' },
  BUYING_GROUP:    { bg:'#fef3c7', text:'#92400e' },
  IRRIGATION_SCHEME:{ bg:'#f3f4f6', text:'#374151' },
}

function ContributeModal({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const [amount, setAmount]   = useState('')
  const [mpesaRef, setRef]    = useState('')
  const [notes, setNotes]     = useState('')
  const contribute            = useContribute()

  async function submit() {
    if (!amount || !mpesaRef) return Alert.alert('Error', 'Amount and M-Pesa reference are required')
    try {
      await contribute.mutateAsync({ id: groupId, amountKes: Number(amount), mpesaRef, notes })
      Alert.alert('✅ Success', 'Contribution recorded successfully!')
      onClose()
    } catch (err: any) {
      Alert.alert('Failed', err.response?.data?.error ?? 'Could not record contribution')
    }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={cm.overlay}>
        <View style={cm.sheet}>
          <View style={cm.handle} />
          <Text style={cm.title}>Record contribution</Text>
          <Text style={cm.sub}>Enter the amount you paid via M-Pesa</Text>

          <Text style={cm.label}>Amount (KES) *</Text>
          <TextInput style={cm.input} keyboardType="numeric" value={amount} onChangeText={setAmount}
            placeholder="e.g. 5000" placeholderTextColor={colors.gray[400]} />

          <Text style={cm.label}>M-Pesa reference *</Text>
          <TextInput style={cm.input} value={mpesaRef} onChangeText={setRef}
            placeholder="e.g. RKA7XBCDEF" placeholderTextColor={colors.gray[400]} autoCapitalize="characters" />

          <Text style={cm.label}>Notes (optional)</Text>
          <TextInput style={[cm.input, { height:80, textAlignVertical:'top', paddingTop:12 }]}
            value={notes} onChangeText={setNotes} placeholder="March contribution…"
            placeholderTextColor={colors.gray[400]} multiline />

          <View style={{ flexDirection:'row', gap:spacing.md, marginTop:spacing.xl }}>
            <TouchableOpacity style={cm.cancelBtn} onPress={onClose}>
              <Text style={cm.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cm.submitBtn, (!amount || !mpesaRef || contribute.isPending) && { opacity:0.5 }]}
              disabled={!amount || !mpesaRef || contribute.isPending}
              onPress={submit}
            >
              {contribute.isPending
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={cm.submitText}>Record KES {Number(amount) ? formatKes(Number(amount)) : '—'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const cm = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet: { backgroundColor:colors.white, borderTopLeftRadius:24, borderTopRightRadius:24, padding:spacing.xl, paddingBottom:40 },
  handle: { width:40, height:4, backgroundColor:colors.gray[200], borderRadius:2, alignSelf:'center', marginBottom:spacing.xl },
  title: { fontSize:18, fontWeight:'700', color:colors.gray[900] },
  sub: { fontSize:13, color:colors.gray[500], marginTop:4, marginBottom:spacing.xl },
  label: { fontSize:12, fontWeight:'600', color:colors.gray[700], marginBottom:6 },
  input: { borderWidth:1.5, borderColor:colors.gray[200], borderRadius:radius.lg, height:48, paddingHorizontal:spacing.md, fontSize:14, color:colors.gray[900], backgroundColor:colors.gray[50], marginBottom:spacing.lg },
  cancelBtn: { flex:1, borderWidth:1.5, borderColor:colors.gray[200], borderRadius:radius.lg, paddingVertical:13, alignItems:'center' },
  cancelText: { fontSize:14, fontWeight:'600', color:colors.gray[600] },
  submitBtn: { flex:2, backgroundColor:colors.shamba[600], borderRadius:radius.lg, paddingVertical:13, alignItems:'center', justifyContent:'center' },
  submitText: { fontSize:14, fontWeight:'700', color:colors.white },
})

function GroupCard({ group, isMember, onJoin, onContribute }: any) {
  const tc = TYPE_COLOR[group.type] ?? { bg:colors.gray[100], text:colors.gray[700] }

  return (
    <View style={[gc.card, shadow.sm]}>
      <View style={gc.top}>
        <View style={gc.iconWrap}>
          <Ionicons name="people" size={20} color={colors.shamba[600]} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={gc.name}>{group.name}</Text>
          <View style={gc.meta}>
            <Ionicons name="location-outline" size={11} color={colors.gray[400]} />
            <Text style={gc.metaText}>{group.county}</Text>
          </View>
        </View>
        <View style={[gc.typeBadge, { backgroundColor:tc.bg }]}>
          <Text style={[gc.typeText, { color:tc.text }]}>{group.type.replace(/_/g,' ')}</Text>
        </View>
      </View>

      {group.description && (
        <Text style={gc.desc} numberOfLines={2}>{group.description}</Text>
      )}

      <View style={gc.stats}>
        <View style={gc.stat}>
          <Ionicons name="people-outline" size={13} color={colors.gray[400]} />
          <Text style={gc.statText}>{group._count?.members ?? 0} members</Text>
        </View>
        <View style={gc.stat}>
          <Ionicons name="wallet-outline" size={13} color={colors.gray[400]} />
          <Text style={gc.statText}>{formatKes(group.totalSavingsKes)} saved</Text>
        </View>
        {group.isVerified && (
          <View style={gc.stat}>
            <Ionicons name="checkmark-circle" size={13} color={colors.shamba[600]} />
            <Text style={[gc.statText, { color:colors.shamba[700] }]}>Verified</Text>
          </View>
        )}
      </View>

      <View style={gc.actions}>
        {isMember ? (
          <>
            <View style={gc.memberBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.shamba[600]} />
              <Text style={gc.memberText}>Member</Text>
            </View>
            <TouchableOpacity style={gc.contributeBtn} onPress={onContribute} activeOpacity={0.85}>
              <Ionicons name="add-circle-outline" size={16} color={colors.white} />
              <Text style={gc.contributeBtnText}>Contribute</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={gc.joinBtn} onPress={onJoin} activeOpacity={0.85}>
            <Ionicons name="person-add-outline" size={16} color={colors.shamba[700]} />
            <Text style={gc.joinBtnText}>Join group</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const gc = StyleSheet.create({
  card: { backgroundColor:colors.white, borderRadius:radius.lg, padding:spacing.lg, marginBottom:spacing.md },
  top: { flexDirection:'row', alignItems:'flex-start', gap:spacing.md, marginBottom:spacing.md },
  iconWrap: { width:40, height:40, borderRadius:12, backgroundColor:colors.shamba[50], alignItems:'center', justifyContent:'center', marginTop:2 },
  name: { fontSize:15, fontWeight:'700', color:colors.gray[900] },
  meta: { flexDirection:'row', alignItems:'center', gap:3, marginTop:2 },
  metaText: { fontSize:11, color:colors.gray[500] },
  typeBadge: { borderRadius:radius.full, paddingHorizontal:8, paddingVertical:3, alignSelf:'flex-start' },
  typeText: { fontSize:9, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5 },
  desc: { fontSize:12, color:colors.gray[500], lineHeight:17, marginBottom:spacing.md },
  stats: { flexDirection:'row', gap:spacing.lg, marginBottom:spacing.md, flexWrap:'wrap' },
  stat: { flexDirection:'row', alignItems:'center', gap:4 },
  statText: { fontSize:12, color:colors.gray[500] },
  actions: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingTop:spacing.md, borderTopWidth:1, borderTopColor:colors.gray[50] },
  memberBadge: { flexDirection:'row', alignItems:'center', gap:4 },
  memberText: { fontSize:12, fontWeight:'600', color:colors.shamba[700] },
  contributeBtn: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:colors.shamba[600], borderRadius:radius.md, paddingHorizontal:spacing.lg, paddingVertical:8 },
  contributeBtnText: { fontSize:12, fontWeight:'700', color:colors.white },
  joinBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, borderWidth:1.5, borderColor:colors.shamba[300], borderRadius:radius.md, paddingVertical:10 },
  joinBtnText: { fontSize:13, fontWeight:'700', color:colors.shamba[700] },
})

export default function GroupsScreen() {
  const { data: groups, isLoading, refetch } = useGroups()
  const { data: myGroups } = useMyGroups()
  const joinGroup  = useJoinGroup()
  const [refreshing, setRefreshing] = useState(false)
  const [county, setCounty]         = useState('')
  const [type, setType]             = useState('')
  const [contributeGroupId, setContributeGroupId] = useState<string | null>(null)

  const myGroupIds = new Set(myGroups?.map((m: any) => m.groupId) ?? [])

  async function onRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const filtered = groups?.filter((g: any) => {
    if (county && !g.county.toLowerCase().includes(county.toLowerCase())) return false
    if (type && g.type !== type) return false
    return true
  }) ?? []

  return (
    <View style={s.container}>
      {/* Header */}
      <LinearGradient colors={['#1e3a5f','#1d4ed8']} style={s.header}>
        <Text style={s.title}>Farmer Groups</Text>
        <Text style={s.sub}>SACCOs, cooperatives & buying groups near you</Text>

        {/* My groups summary */}
        {myGroups && myGroups.length > 0 && (
          <View style={s.myGroupsRow}>
            {myGroups.slice(0,3).map((m: any) => (
              <View key={m.groupId} style={s.myGroupPill}>
                <Ionicons name="people" size={12} color={colors.shamba[300]} />
                <Text style={s.myGroupText} numberOfLines={1}>{m.group?.name}</Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>

      {/* Filters */}
      <View style={s.filters}>
        <View style={s.searchWrap}>
          <Ionicons name="location-outline" size={15} color={colors.gray[400]} />
          <TextInput
            style={s.searchInput}
            placeholder="County…"
            placeholderTextColor={colors.gray[400]}
            value={county}
            onChangeText={setCounty}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeScroll}>
          <View style={s.typeRow}>
            {['','SACCO','COOPERATIVE','BUYING_GROUP','IRRIGATION_SCHEME'].map(t => (
              <TouchableOpacity
                key={t}
                style={[s.typeChip, type === t && s.typeChipActive]}
                onPress={() => setType(t)}
              >
                <Text style={[s.typeChipText, type === t && s.typeChipTextActive]}>
                  {t === '' ? 'All' : t.replace(/_/g,' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            isMember={myGroupIds.has(item.id)}
            onJoin={() => {
              joinGroup.mutateAsync({ id: item.id })
                .then(() => Alert.alert('Joined!', `You are now a member of ${item.name}`))
                .catch((err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Could not join'))
            }}
            onContribute={() => setContributeGroupId(item.id)}
          />
        )}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.shamba[600]} />}
        ListEmptyComponent={
          isLoading
            ? <ActivityIndicator color={colors.shamba[600]} style={{ marginTop:40 }} />
            : <View style={s.empty}><Ionicons name="people-outline" size={48} color={colors.gray[300]} /><Text style={s.emptyText}>No groups found</Text></View>
        }
      />

      {contributeGroupId && (
        <ContributeModal
          groupId={contributeGroupId}
          onClose={() => setContributeGroupId(null)}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:colors.gray[50] },
  header: { paddingTop:56, paddingHorizontal:spacing.xl, paddingBottom:spacing.xl },
  title: { fontSize:22, fontWeight:'800', color:colors.white },
  sub: { fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:2, marginBottom:spacing.lg },
  myGroupsRow: { flexDirection:'row', gap:8, flexWrap:'wrap' },
  myGroupPill: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'rgba(255,255,255,0.12)', borderRadius:radius.full, paddingHorizontal:10, paddingVertical:4 },
  myGroupText: { fontSize:11, color:colors.white, maxWidth:100 },
  filters: { backgroundColor:colors.white, paddingHorizontal:spacing.lg, paddingTop:spacing.md, paddingBottom:spacing.sm, borderBottomWidth:1, borderBottomColor:colors.gray[100] },
  searchWrap: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:colors.gray[50], borderRadius:radius.md, paddingHorizontal:spacing.md, height:38, marginBottom:spacing.sm },
  searchInput: { flex:1, fontSize:14, color:colors.gray[900] },
  typeScroll: { marginBottom:4 },
  typeRow: { flexDirection:'row', gap:8 },
  typeChip: { borderWidth:1, borderColor:colors.gray[200], borderRadius:radius.full, paddingHorizontal:12, paddingVertical:5 },
  typeChipActive: { borderColor:colors.shamba[600], backgroundColor:colors.shamba[50] },
  typeChipText: { fontSize:11, color:colors.gray[600], fontWeight:'500' },
  typeChipTextActive: { color:colors.shamba[700], fontWeight:'700' },
  list: { padding:spacing.lg, paddingBottom:40 },
  empty: { alignItems:'center', paddingVertical:60, gap:spacing.md },
  emptyText: { fontSize:14, color:colors.gray[400] },
})
