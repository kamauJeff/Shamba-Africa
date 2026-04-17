import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { authApi } from '@/api/endpoints'
import { useAuthStore } from '@/store/auth.store'
import { colors, spacing, radius, shadow } from '@/lib/theme'

export default function LoginScreen() {
  const [phone, setPhone]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()

  async function handleLogin() {
    if (!phone || !password) return Alert.alert('Error', 'Please fill in all fields')
    setLoading(true)
    try {
      const { data } = await authApi.login({ phone, password })
      const { user, tokens } = data.data
      await setAuth(user, tokens.accessToken, '')
      router.replace('/(tabs)/dashboard')
    } catch (err: any) {
      Alert.alert('Login failed', err.response?.data?.error ?? 'Please check your credentials')
    } finally { setLoading(false) }
  }

  return (
    <LinearGradient colors={['#13522e', '#138544', '#15a552']} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={s.brand}>
          <View style={s.logoCircle}>
            <Ionicons name="leaf" size={36} color={colors.white} />
          </View>
          <Text style={s.logoText}>Shamba</Text>
          <Text style={s.tagline}>From seed to sale</Text>
        </View>

        {/* Card */}
        <View style={[s.card, shadow.lg]}>
          <Text style={s.heading}>Welcome back</Text>
          <Text style={s.sub}>Sign in to your farm account</Text>

          <View style={s.field}>
            <Text style={s.label}>Phone number</Text>
            <View style={s.inputRow}>
              <Ionicons name="call-outline" size={18} color={colors.gray[400]} style={{ marginRight:8 }} />
              <TextInput style={s.input} placeholder="+254712345678" placeholderTextColor={colors.gray[400]}
                value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={s.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.gray[400]} style={{ marginRight:8 }} />
              <TextInput style={[s.input,{flex:1}]} placeholder="••••••••" placeholderTextColor={colors.gray[400]}
                value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.gray[400]} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnText}>Sign in</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.registerLink} onPress={() => router.push('/(auth)/register')}>
            <Text style={s.registerText}>Don't have an account? <Text style={s.registerBold}>Register</Text></Text>
          </TouchableOpacity>

          <View style={s.demo}>
            <Text style={s.demoTitle}>Demo · Farmer account</Text>
            <Text style={s.demoText}>+254712345678  /  Farmer@1234</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  gradient: { flex:1 },
  scroll: { flexGrow:1, justifyContent:'center', padding:spacing.xl },
  brand: { alignItems:'center', marginBottom:spacing['3xl'] },
  logoCircle: { width:80, height:80, borderRadius:40, backgroundColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center', marginBottom:spacing.lg },
  logoText: { fontSize:36, fontWeight:'800', color:colors.white, letterSpacing:1 },
  tagline: { fontSize:14, color:'rgba(255,255,255,0.7)', marginTop:4 },
  card: { backgroundColor:colors.white, borderRadius:radius['2xl'], padding:spacing['2xl'] },
  heading: { fontSize:24, fontWeight:'700', color:colors.gray[900] },
  sub: { fontSize:14, color:colors.gray[500], marginTop:4, marginBottom:spacing.xl },
  field: { marginBottom:spacing.lg },
  label: { fontSize:12, fontWeight:'600', color:colors.gray[700], marginBottom:6 },
  inputRow: { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:colors.gray[200], borderRadius:radius.lg, paddingHorizontal:spacing.md, height:50, backgroundColor:colors.gray[50] },
  input: { flex:1, fontSize:15, color:colors.gray[900] },
  btn: { backgroundColor:colors.shamba[600], borderRadius:radius.lg, height:52, alignItems:'center', justifyContent:'center', marginTop:spacing.md },
  btnText: { fontSize:16, fontWeight:'700', color:colors.white },
  registerLink: { alignItems:'center', marginTop:spacing.lg },
  registerText: { fontSize:14, color:colors.gray[500] },
  registerBold: { color:colors.shamba[600], fontWeight:'700' },
  demo: { marginTop:spacing.lg, padding:spacing.md, borderWidth:1, borderColor:colors.gray[200], borderRadius:radius.md, borderStyle:'dashed' },
  demoTitle: { fontSize:11, fontWeight:'600', color:colors.gray[500], marginBottom:2 },
  demoText: { fontSize:11, color:colors.gray[400], fontFamily:'monospace' },
})
