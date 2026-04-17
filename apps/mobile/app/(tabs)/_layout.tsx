import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/theme'

type Icon = keyof typeof Ionicons.glyphMap
const TABS: { name:string; title:string; icon:Icon; active:Icon }[] = [
  { name:'dashboard', title:'Home',    icon:'home-outline',       active:'home' },
  { name:'market',    title:'Market',  icon:'storefront-outline', active:'storefront' },
  { name:'loans',     title:'Finance', icon:'cash-outline',       active:'cash' },
  { name:'groups',    title:'Groups',  icon:'people-outline',     active:'people' },
  { name:'profile',   title:'Profile', icon:'person-outline',     active:'person' },
]

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.shamba[600],
      tabBarInactiveTintColor: colors.gray[400],
      tabBarStyle: { backgroundColor:colors.white, borderTopColor:colors.gray[100], borderTopWidth:1, height:64, paddingBottom:8, paddingTop:6 },
      tabBarLabelStyle: { fontSize:10, fontWeight:'600' },
    }}>
      {TABS.map(({ name, title, icon, active }) => (
        <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ focused, color }) => <Ionicons name={focused?active:icon} size={22} color={color} /> }} />
      ))}
    </Tabs>
  )
}
