import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Modal, ActivityIndicator, Alert, RefreshControl, ScrollView,
} from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useListings, usePrices, usePlaceOrder, useOrders, useConfirmDelivery } from '@/hooks/useApi'
import { colors, spacing, radius, shadow } from '@/lib/theme'
import { formatKes, formatDate } from '@/lib/utils'

type Tab = 'listings' | 'prices' | 'orders'

function ListingCard({ item, onOrder }: { item: any; onOrder: () => void }) {
  const days = Math.ceil((new Date(item.availableUntil).getTime() - Date.now()) / 86400000)
  return (
    <View style={[lc.card, shadow.sm]}>
      <View style={lc.top}>
        <View style={{ flex: 1 }}>
          <Text style={lc.crop}>{item.cropName}{item.variety ? ` · ${item.variety}` : ''}</Text>
          <View style={lc.chips}>
            <View style={lc.chip}><Ionicons name="location-outline" size={10} color={colors.gray[500]} /><Text style={lc.chipText}>{item.county}</Text></View>
            <View style={lc.chip}><Text style={lc.chipText}>{item.quantityKg.toLocaleString()} kg</Text></View>
            <View style={[lc.chip, { backgroundColor: item.grade === 'EXPORT' ? '#dcfce7' : colors.gray[100] }]}>
              <Text style={[lc.chipText, { color: item.grade === 'EXPORT' ? colors.shamba[700] : colors.gray[600] }]}>{item.grade}</Text>
            </View>
          </View>
          {item.description ? <Text style={lc.desc} numberOfLines={2}>{item.description}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={lc.price}>{formatKes(item.pricePerKgKes)}</Text>
          <Text style={lc.unit}>/kg</Text>
          <Text style={[lc.days, { color: days < 7 ? colors.red[600] : colors.gray[400] }]}>{days}d left</Text>
        </View>
      </View>
      <View style={lc.footer}>
        <Text style={lc.seller}>{item.seller?.name}</Text>
        <View style={lc.footerRight}>
          <Text style={lc.views}>{item.views} views</Text>
          <TouchableOpacity style={lc.orderBtn} onPress={onOrder} activeOpacity={0.85}>
            <Text style={lc.orderBtnText}>Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
const lc = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden' as const },
  top: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md },
  crop: { fontSize: 15, fontWeight: '700', color: colors.gray[900], marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 6, marginBottom: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.gray[100], borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 10, color: colors.gray[600] },
  desc: { fontSize: 12, color: colors.gray[500], lineHeight: 16 },
  price: { fontSize: 18, fontWeight: '800', color: colors.shamba[700] },
  unit: { fontSize: 10, color: colors.gray[400] },
  days: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  seller: { fontSize: 12, color: colors.gray[500] },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  views: { fontSize: 11, color: colors.gray[400] },
  orderBtn: { backgroundColor: colors.shamba[600], borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 7 },
  orderBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
})

function OrderModal({ listing, onClose }: { listing: any; onClose: () => void }) {
  const [qty, setQty] = useState('')
  const [addr, setAddr] = useState('')
  const placeOrder = usePlaceOrder()
  const quantity = Number(qty) || 0
  const total = quantity * listing.pricePerKgKes
  const commission = total * 0.07

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={om.overlay}>
        <View style={om.sheet}>
          <View style={om.handle} />
          <Text style={om.title}>Order {listing.cropName}</Text>
          <Text style={om.avail}>{listing.quantityKg.toLocaleString()} kg at {formatKes(listing.pricePerKgKes)}/kg · Min {listing.minimumOrderKg}kg</Text>
          <Text style={om.label}>Quantity (kg)</Text>
          <TextInput style={om.input} keyboardType="numeric" value={qty} onChangeText={setQty}
            placeholder={`${listing.minimumOrderKg}–${listing.quantityKg}`} placeholderTextColor={colors.gray[400]} />
          <Text style={om.label}>Delivery address</Text>
          <TextInput style={om.input} value={addr} onChangeText={setAddr} placeholder="Where to deliver?" placeholderTextColor={colors.gray[400]} />
          {quantity > 0 && (
            <View style={om.summary}>
              <View style={om.row}><Text style={om.rl}>Subtotal</Text><Text style={om.rv}>{formatKes(total)}</Text></View>
              <View style={om.row}><Text style={om.rl}>Platform fee (7%)</Text><Text style={om.rv}>{formatKes(Math.round(commission))}</Text></View>
              <View style={[om.row, om.totalRow]}><Text style={om.tl}>Total</Text><Text style={om.tv}>{formatKes(Math.round(total + commission))}</Text></View>
            </View>
          )}
          <View style={om.btns}>
            <TouchableOpacity style={om.cancelBtn} onPress={onClose}><Text style={om.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[om.placeBtn, (!qty || placeOrder.isPending) && { opacity: 0.5 }]}
              disabled={!qty || placeOrder.isPending}
              onPress={async () => {
                try { await placeOrder.mutateAsync({ listingId: listing.id, quantityKg: quantity, deliveryAddress: addr }); onClose(); Alert.alert('Order placed!', 'The seller will be notified.') }
                catch (e: any) { Alert.alert('Error', e.response?.data?.error ?? 'Order failed') }
              }}>
              {placeOrder.isPending ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={om.placeText}>Place order</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
const om = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: colors.gray[200], borderRadius: 2, alignSelf: 'center' as const, marginBottom: spacing.xl },
  title: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  avail: { fontSize: 13, color: colors.gray[500], marginBottom: spacing.xl },
  label: { fontSize: 12, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.lg, height: 46, paddingHorizontal: spacing.md, fontSize: 14, color: colors.gray[900], marginBottom: spacing.lg },
  summary: { backgroundColor: colors.gray[50], borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  rl: { fontSize: 13, color: colors.gray[600] }, rv: { fontSize: 13, fontWeight: '500', color: colors.gray[900] },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.gray[200], marginTop: 4, paddingTop: 8 },
  tl: { fontSize: 14, fontWeight: '700', color: colors.gray[900] }, tv: { fontSize: 14, fontWeight: '800', color: colors.shamba[700] },
  btns: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' as const },
  cancelText: { fontSize: 14, fontWeight: '600', color: colors.gray[600] },
  placeBtn: { flex: 2, backgroundColor: colors.shamba[600], borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' as const, justifyContent: 'center' as const },
  placeText: { fontSize: 14, fontWeight: '700', color: colors.white },
})

export default function MarketScreen() {
  const [tab, setTab] = useState<Tab>('listings')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { data: listData, isLoading: listLoading, refetch: refetchList } = useListings({ crop: search || undefined, pageSize: 20 })
  const { data: priceData, isLoading: priceLoading } = usePrices({ pageSize: 40 })
  const { data: orders, refetch: refetchOrders } = useOrders('buyer')
  const confirmDelivery = useConfirmDelivery()

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([refetchList(), refetchOrders()])
    setRefreshing(false)
  }

  return (
    <View style={s.container}>
      <LinearGradient colors={['#138544', '#15a552']} style={s.header}>
        <Text style={s.title}>Shamba Market</Text>
        <Text style={s.sub}>Buy, sell and track produce orders</Text>
        <View style={s.tabs}>
          {(['listings', 'prices', 'orders'] as Tab[]).map(t => (
            <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {tab === 'listings' && (
        <>
          <View style={s.searchRow}>
            <Ionicons name="search" size={16} color={colors.gray[400]} />
            <TextInput style={s.searchInput} placeholder="Search crop…" placeholderTextColor={colors.gray[400]}
              value={search} onChangeText={setSearch} />
            {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={colors.gray[400]} /></TouchableOpacity> : null}
          </View>
          <FlatList
            data={listData?.items ?? []}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ListingCard item={item} onOrder={() => setSelected(item)} />}
            contentContainerStyle={s.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.shamba[600]} />}
            ListEmptyComponent={listLoading ? <ActivityIndicator color={colors.shamba[600]} style={{ marginTop: 40 }} /> : <View style={s.empty}><Ionicons name="storefront-outline" size={48} color={colors.gray[300]} /><Text style={s.emptyText}>No listings found</Text></View>}
          />
        </>
      )}

      {tab === 'prices' && (
        <FlatList
          data={priceData?.items ?? []}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[s.priceRow, shadow.sm]}>
              <View style={{ flex: 1 }}>
                <Text style={s.pCrop}>{item.crop}</Text>
                <Text style={s.pCounty}>{item.county} · {formatDate(item.recordedAt)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.pPrice}>{formatKes(item.priceKes)}</Text>
                <Text style={s.pUnit}>per {item.unit === 'KG' ? 'kg' : item.unit}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={s.list}
          ListEmptyComponent={priceLoading ? <ActivityIndicator color={colors.shamba[600]} style={{ marginTop: 40 }} /> : null}
        />
      )}

      {tab === 'orders' && (
        <FlatList
          data={orders ?? []}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[s.orderCard, shadow.sm]}>
              <View style={s.orderTop}>
                <Text style={s.orderCrop}>{item.listing?.cropName ?? 'Order'}</Text>
                <View style={[s.orderBadge, { backgroundColor: item.status === 'COMPLETED' ? '#dcfce7' : item.status === 'IN_ESCROW' ? '#dbeafe' : '#fef3c7' }]}>
                  <Text style={[s.orderBadgeText, { color: item.status === 'COMPLETED' ? colors.shamba[800] : item.status === 'IN_ESCROW' ? '#1e40af' : '#92400e' }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={s.orderDetail}>{item.quantityKg} kg · {formatKes(item.totalAmountKes)} · {formatDate(item.createdAt)}</Text>
              {item.status === 'IN_ESCROW' && (
                <TouchableOpacity style={s.confirmBtn} onPress={async () => {
                  try { await confirmDelivery.mutateAsync(item.id); Alert.alert('Confirmed!', 'Funds released to seller.') }
                  catch (e: any) { Alert.alert('Error', e.response?.data?.error ?? 'Failed') }
                }} activeOpacity={0.85}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
                  <Text style={s.confirmBtnText}>Confirm delivery</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={s.list}
          ListEmptyComponent={<View style={s.empty}><Ionicons name="receipt-outline" size={48} color={colors.gray[300]} /><Text style={s.emptyText}>No orders yet</Text></View>}
        />
      )}

      {selected && <OrderModal listing={selected} onClose={() => setSelected(null)} />}
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
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, margin: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.lg, paddingHorizontal: spacing.md, height: 44, borderWidth: 1.5, borderColor: colors.gray[200] },
  searchInput: { flex: 1, fontSize: 14, color: colors.gray[900] },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  empty: { alignItems: 'center' as const, paddingVertical: 60, gap: spacing.md },
  emptyText: { fontSize: 14, color: colors.gray[400] },
  priceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm },
  pCrop: { fontSize: 14, fontWeight: '700', color: colors.gray[900] },
  pCounty: { fontSize: 11, color: colors.gray[500], marginTop: 2 },
  pPrice: { fontSize: 15, fontWeight: '800', color: colors.shamba[700] },
  pUnit: { fontSize: 10, color: colors.gray[400] },
  orderCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  orderCrop: { fontSize: 14, fontWeight: '700', color: colors.gray[900] },
  orderBadge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  orderBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as const },
  orderDetail: { fontSize: 12, color: colors.gray[500] },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.shamba[600], borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: spacing.lg, marginTop: spacing.md, alignSelf: 'flex-start' as const },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
})
